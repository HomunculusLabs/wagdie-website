/**
 * Ethereum Address Normalization Utility
 *
 * Provides address validation and EIP-55 checksumming using ethers.js.
 *
 * Source: specs/001-migration-plan/research.md (Address normalization decision)
 * Reference: specs/001-migration-plan/contracts/field-mappings.md
 */

import { getAddress, isAddress } from 'ethers';
import { logger } from './logger.js';

const log = logger.child({ component: 'AddressNormalizer' });

/**
 * Result of address normalization
 */
export interface NormalizeResult {
  success: boolean;
  normalized?: string; // Checksummed address (if valid)
  error?: string; // Error message (if invalid)
  original: string; // Original input address
}

/**
 * Validate and normalize an Ethereum address to EIP-55 checksummed format
 *
 * @param address - Ethereum address in any casing (e.g., "0xabc...", "0xAbC...")
 * @returns Checksummed address (e.g., "0xAbC...") following EIP-55 standard
 * @throws Error if address is invalid
 *
 * @example
 * normalizeAddress("0xabc123...") // Returns "0xAbC123..." (checksummed)
 * normalizeAddress("0xAbC123...") // Returns "0xAbC123..." (already checksummed)
 * normalizeAddress("invalid") // Throws Error
 */
export function normalizeAddress(address: string): string {
  if (!address || typeof address !== 'string') {
    throw new Error('Address must be a non-empty string');
  }

  // Trim whitespace
  const trimmed = address.trim();

  // Validate address format
  if (!isAddress(trimmed)) {
    throw new Error(`Invalid Ethereum address: ${trimmed}`);
  }

  // Normalize to checksummed format (EIP-55)
  try {
    const normalized = getAddress(trimmed.toLowerCase());
    return normalized;
  } catch (error) {
    throw new Error(
      `Failed to normalize address ${trimmed}: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

/**
 * Safely normalize address with detailed result (does not throw)
 *
 * @param address - Ethereum address to normalize
 * @returns NormalizeResult with success status and normalized address or error
 */
export function safeNormalizeAddress(address: string): NormalizeResult {
  try {
    const normalized = normalizeAddress(address);
    return {
      success: true,
      normalized,
      original: address,
    };
  } catch (error) {
    log.warn({ address, error }, 'Address normalization failed');
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
      original: address,
    };
  }
}

/**
 * Validate if a string is a valid Ethereum address (without normalizing)
 *
 * @param address - String to validate
 * @returns true if valid Ethereum address, false otherwise
 */
export function isValidAddress(address: string): boolean {
  if (!address || typeof address !== 'string') {
    return false;
  }
  return isAddress(address.trim());
}

/**
 * Batch normalize multiple addresses
 *
 * @param addresses - Array of addresses to normalize
 * @returns Array of NormalizeResult with results for each address
 */
export function batchNormalizeAddresses(addresses: string[]): NormalizeResult[] {
  return addresses.map(safeNormalizeAddress);
}

/**
 * Handle edge case: Normalize address with null check for burned NFTs
 *
 * If burned is true, returns null. Otherwise, normalizes the address.
 *
 * @param address - Ethereum address or null
 * @param burned - Whether the NFT is burned (burned NFTs have no owner)
 * @returns Normalized address or null
 *
 * Source: specs/001-migration-plan/data-model.md (Edge Case 5: Burned Character with Owner)
 */
export function normalizeOwnerAddress(address: string | null | undefined, burned: boolean): string | null {
  // If NFT is burned, owner should always be null
  if (burned) {
    if (address) {
      log.info({ address, burned }, 'Setting owner to null for burned NFT');
    }
    return null;
  }

  // If not burned but no address provided, return null
  if (!address) {
    return null;
  }

  // Normalize the address
  return normalizeAddress(address);
}

/**
 * Handle edge case: Detect and merge duplicate addresses with different casing
 *
 * Normalizes all addresses and returns a map of original → normalized addresses.
 * If multiple original addresses normalize to the same value, they are duplicates.
 *
 * @param addresses - Array of addresses that may have different casings
 * @returns Map of normalized address → array of original addresses
 *
 * Source: specs/001-migration-plan/data-model.md (Edge Case 2: Duplicate Addresses with Different Casing)
 */
export function detectDuplicateAddresses(addresses: string[]): Map<string, string[]> {
  const normalized = new Map<string, string[]>();

  for (const address of addresses) {
    const result = safeNormalizeAddress(address);

    if (result.success && result.normalized) {
      const existing = normalized.get(result.normalized) ?? [];
      existing.push(address);
      normalized.set(result.normalized, existing);
    }
  }

  // Return only addresses with duplicates
  const duplicates = new Map<string, string[]>();
  for (const [normalized, originals] of normalized.entries()) {
    if (originals.length > 1) {
      duplicates.set(normalized, originals);
      log.warn({ normalized, originals }, 'Detected duplicate addresses with different casing');
    }
  }

  return duplicates;
}
