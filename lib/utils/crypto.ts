/**
 * Cryptographic Utilities
 * Secure random generation for security-critical operations
 */

import { randomBytes, randomUUID } from 'crypto'

/**
 * Generate a cryptographically secure nonce for SIWE authentication
 * Returns a 32-character hexadecimal string
 */
export function generateSecureNonce(): string {
  return randomBytes(16).toString('hex')
}

/**
 * Generate a cryptographically secure token for CSRF protection
 * Returns a UUID v4 string
 */
export function generateSecureToken(): string {
  return randomUUID()
}

/**
 * Verify that a nonce matches the expected value
 * Uses constant-time comparison to prevent timing attacks
 */
export function verifyNonceMatch(
  messageNonce: string,
  storedNonce: string
): boolean {
  if (!messageNonce || !storedNonce) {
    return false
  }

  if (messageNonce.length !== storedNonce.length) {
    return false
  }

  // Constant-time comparison
  let result = 0
  for (let i = 0; i < messageNonce.length; i++) {
    result |= messageNonce.charCodeAt(i) ^ storedNonce.charCodeAt(i)
  }

  return result === 0
}
