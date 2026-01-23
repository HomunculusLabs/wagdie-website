/**
 * SIWE (Sign-In with Ethereum) Authentication Helpers
 *
 * This module provides helper functions for creating and verifying
 * EIP-4361 compliant SIWE messages for wallet-based authentication.
 *
 * @see https://eips.ethereum.org/EIPS/eip-4361
 */

/**
 * Parameters for creating a SIWE message
 */
export interface SIWEMessageParams {
  /** Ethereum domain requesting the sign-in */
  domain: string;
  /** Ethereum address performing the sign-in */
  address: string;
  /** Human-readable ASCII assertion */
  statement?: string;
  /** RFC 3986 URI of the resource */
  uri: string;
  /** EIP-155 chain ID */
  chainId: number;
  /** Random string for replay protection */
  nonce: string;
  /** ISO 8601 timestamp when message was issued */
  issuedAt?: string;
  /** ISO 8601 timestamp when message expires */
  expirationTime?: string;
  /** ISO 8601 timestamp when message becomes valid */
  notBefore?: string;
  /** System-specific request ID */
  requestId?: string;
  /** List of resources authorized for use */
  resources?: string[];
}

/**
 * Verification result for a SIWE message
 */
export interface SIWEVerificationResult {
  success: boolean;
  address?: string;
  error?: string;
  fields?: SIWEMessageParams;
}

const ETH_ADDRESS_REGEX = /^0x[a-fA-F0-9]{40}$/;
const SIWE_HEADER_REGEX = /^(.+) wants you to sign in with your Ethereum account:$/;

const SIWE_VERSION_LINE = 'Version: 1';

const SIWE_FIELD_PREFIX = {
  uri: 'URI: ',
  chainId: 'Chain ID: ',
  nonce: 'Nonce: ',
  issuedAt: 'Issued At: ',
  expirationTime: 'Expiration Time: ',
  notBefore: 'Not Before: ',
  requestId: 'Request ID: ',
} as const;

const SIWE_RESOURCES_HEADER = 'Resources:';
const SIWE_RESOURCE_BULLET_PREFIX = '- ';

function assertRequired(condition: unknown, message: string): void {
  if (!condition) {
    throw new Error(message);
  }
}

function assertEthereumAddressFormat(address: string, message: string): void {
  if (!ETH_ADDRESS_REGEX.test(address)) {
    throw new Error(message);
  }
}

function buildDomainMismatchError(expected: string, got: string): string {
  return `Domain mismatch: expected ${expected}, got ${got}`;
}

function isExpired(expirationTime: string): boolean {
  const expirationDate = new Date(expirationTime);
  return expirationDate < new Date();
}

function isNotYetValid(notBefore: string): boolean {
  const notBeforeDate = new Date(notBefore);
  return notBeforeDate > new Date();
}

/**
 * Create a SIWE (Sign-In with Ethereum) message string
 *
 * The message follows EIP-4361 format and can be signed by any
 * Ethereum wallet (MetaMask, WalletConnect, etc.)
 *
 * @example
 * ```typescript
 * const message = createSIWEMessage({
 *   domain: 'example.com',
 *   address: '0x1234...abcd',
 *   statement: 'Sign in to access Eliza chat',
 *   uri: 'https://example.com',
 *   chainId: 1,
 *   nonce: 'abc123xyz',
 * });
 *
 * // Sign with wallet
 * const signature = await wallet.signMessage(message);
 *
 * // Verify with SDK
 * const tokens = await client.auth.verify(message, signature, sessionId);
 * ```
 */
export function createSIWEMessage(params: SIWEMessageParams): string {
  const {
    domain,
    address,
    statement,
    uri,
    chainId,
    nonce,
    issuedAt = new Date().toISOString(),
    expirationTime,
    notBefore,
    requestId,
    resources,
  } = params;

  // Validate required fields (preserve exact order and error strings)
  assertRequired(domain, 'domain is required');
  assertRequired(address, 'address is required');
  assertRequired(uri, 'uri is required');
  assertRequired(chainId, 'chainId is required');
  assertRequired(nonce, 'nonce is required');

  // Validate address format (exact error string)
  assertEthereumAddressFormat(address, 'Invalid Ethereum address format');

  // Build message lines (preserve ordering and blank lines)
  const lines: string[] = [
    `${domain} wants you to sign in with your Ethereum account:`,
    address,
    '',
  ];

  if (statement) {
    lines.push(statement, '');
  }

  lines.push(`${SIWE_FIELD_PREFIX.uri}${uri}`);
  lines.push(SIWE_VERSION_LINE);
  lines.push(`${SIWE_FIELD_PREFIX.chainId}${chainId}`);
  lines.push(`${SIWE_FIELD_PREFIX.nonce}${nonce}`);
  lines.push(`${SIWE_FIELD_PREFIX.issuedAt}${issuedAt}`);

  if (expirationTime) {
    lines.push(`${SIWE_FIELD_PREFIX.expirationTime}${expirationTime}`);
  }

  if (notBefore) {
    lines.push(`${SIWE_FIELD_PREFIX.notBefore}${notBefore}`);
  }

  if (requestId) {
    lines.push(`${SIWE_FIELD_PREFIX.requestId}${requestId}`);
  }

  if (resources && resources.length > 0) {
    lines.push(SIWE_RESOURCES_HEADER);
    for (const resource of resources) {
      lines.push(`${SIWE_RESOURCE_BULLET_PREFIX}${resource}`);
    }
  }

  return lines.join('\n');
}

/**
 * Parse and verify a SIWE message string
 *
 * This function parses the message and validates its structure.
 * Note: This does NOT verify the cryptographic signature.
 * Signature verification should be done server-side.
 *
 * @example
 * ```typescript
 * const result = verifySIWEMessage(messageString, {
 *   domain: 'example.com',
 *   nonce: expectedNonce,
 * });
 *
 * if (result.success) {
 *   console.log('Message is valid for address:', result.address);
 * } else {
 *   console.error('Validation failed:', result.error);
 * }
 * ```
 */
export function verifySIWEMessage(
  message: string,
  options?: {
    domain?: string;
    nonce?: string;
    checkExpiration?: boolean;
  }
): SIWEVerificationResult {
  try {
    const parsed = parseSIWEMessage(message);

    // Validate domain if provided (preserve exact error string formatting)
    if (options?.domain && parsed.domain !== options.domain) {
      return {
        success: false,
        error: buildDomainMismatchError(options.domain, parsed.domain),
      };
    }

    // Validate nonce if provided
    if (options?.nonce && parsed.nonce !== options.nonce) {
      return {
        success: false,
        error: 'Nonce mismatch',
      };
    }

    // Check expiration if requested
    if (options?.checkExpiration && parsed.expirationTime) {
      if (isExpired(parsed.expirationTime)) {
        return {
          success: false,
          error: 'Message has expired',
        };
      }
    }

    // Check notBefore if present
    if (parsed.notBefore) {
      if (isNotYetValid(parsed.notBefore)) {
        return {
          success: false,
          error: 'Message is not yet valid',
        };
      }
    }

    return {
      success: true,
      address: parsed.address,
      fields: parsed,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to parse message',
    };
  }
}

/**
 * Parse a SIWE message string into its components
 */
function parseHeaderDomain(headerLine: string): string {
  const headerMatch = headerLine.match(SIWE_HEADER_REGEX);
  if (!headerMatch) {
    throw new Error('Invalid SIWE header');
  }
  return headerMatch[1];
}

function parseAddressLine(addressLine: string): string {
  if (!ETH_ADDRESS_REGEX.test(addressLine)) {
    throw new Error('Invalid Ethereum address');
  }
  return addressLine;
}

function parseOptionalStatement(
  lines: string[],
  startIndex: number
): { statement?: string; nextIndex: number } {
  const statementLines: string[] = [];
  let i = startIndex;

  while (i < lines.length && !lines[i].startsWith(SIWE_FIELD_PREFIX.uri.trimEnd())) {
    if (lines[i]) {
      statementLines.push(lines[i]);
    }
    i++;
  }

  if (statementLines.length > 0) {
    return { statement: statementLines.join('\n'), nextIndex: i };
  }

  return { nextIndex: i };
}

function applyParsedLine(result: SIWEMessageParams, lines: string[], i: number): void {
  const line = lines[i];

  if (line.startsWith(SIWE_FIELD_PREFIX.uri)) {
    result.uri = line.slice(SIWE_FIELD_PREFIX.uri.length);
    return;
  }

  if (line.startsWith(SIWE_FIELD_PREFIX.chainId)) {
    result.chainId = parseInt(line.slice(SIWE_FIELD_PREFIX.chainId.length), 10);
    return;
  }

  if (line.startsWith(SIWE_FIELD_PREFIX.nonce)) {
    result.nonce = line.slice(SIWE_FIELD_PREFIX.nonce.length);
    return;
  }

  if (line.startsWith(SIWE_FIELD_PREFIX.issuedAt)) {
    result.issuedAt = line.slice(SIWE_FIELD_PREFIX.issuedAt.length);
    return;
  }

  if (line.startsWith(SIWE_FIELD_PREFIX.expirationTime)) {
    result.expirationTime = line.slice(SIWE_FIELD_PREFIX.expirationTime.length);
    return;
  }

  if (line.startsWith(SIWE_FIELD_PREFIX.notBefore)) {
    result.notBefore = line.slice(SIWE_FIELD_PREFIX.notBefore.length);
    return;
  }

  if (line.startsWith(SIWE_FIELD_PREFIX.requestId)) {
    result.requestId = line.slice(SIWE_FIELD_PREFIX.requestId.length);
    return;
  }

  if (line === SIWE_RESOURCES_HEADER) {
    result.resources = [];
    for (let j = i + 1; j < lines.length; j++) {
      if (lines[j].startsWith(SIWE_RESOURCE_BULLET_PREFIX)) {
        result.resources.push(lines[j].slice(SIWE_RESOURCE_BULLET_PREFIX.length));
      } else {
        break;
      }
    }
  }
}

function assertParsedRequiredFields(result: SIWEMessageParams): void {
  if (!result.uri) throw new Error('Missing URI field');
  if (!result.chainId) throw new Error('Missing Chain ID field');
  if (!result.nonce) throw new Error('Missing Nonce field');
}

function parseSIWEMessage(message: string): SIWEMessageParams {
  const lines = message.split('\n');

  if (lines.length < 7) {
    throw new Error('Invalid SIWE message format');
  }

  const domain = parseHeaderDomain(lines[0]);
  const address = parseAddressLine(lines[1]);

  // Find required fields
  const result: SIWEMessageParams = {
    domain,
    address,
    uri: '',
    chainId: 0,
    nonce: '',
  };

  // Check for statement (between address and URI)
  const statementParse = parseOptionalStatement(lines, 3); // Skip header, address, and empty line
  if (statementParse.statement) {
    result.statement = statementParse.statement;
  }

  // Parse key-value fields
  for (let i = statementParse.nextIndex; i < lines.length; i++) {
    applyParsedLine(result, lines, i);
  }

  // Validate required fields
  assertParsedRequiredFields(result);

  return result;
}

/**
 * Generate a random nonce for SIWE messages
 *
 * @param length - Length of the nonce (default: 16)
 * @returns Random alphanumeric string
 */
export function generateNonce(length: number = 16): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';

  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    const array = new Uint8Array(length);
    crypto.getRandomValues(array);
    for (let i = 0; i < length; i++) {
      result += chars[array[i] % chars.length];
    }
  } else {
    // Fallback for environments without crypto
    for (let i = 0; i < length; i++) {
      result += chars[Math.floor(Math.random() * chars.length)];
    }
  }

  return result;
}
