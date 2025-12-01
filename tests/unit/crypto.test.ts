/**
 * Tests for cryptographic utilities
 * Verifies secure random generation for nonces and tokens
 */

import { generateSecureNonce, generateSecureToken, verifyNonceMatch } from '@/lib/utils/crypto'

describe('generateSecureNonce', () => {
  it('should generate a 32-character hex string', () => {
    const nonce = generateSecureNonce()
    expect(nonce).toHaveLength(32)
    expect(nonce).toMatch(/^[0-9a-f]{32}$/)
  })

  it('should generate unique nonces', () => {
    const nonces = new Set<string>()
    for (let i = 0; i < 1000; i++) {
      nonces.add(generateSecureNonce())
    }
    // All 1000 nonces should be unique
    expect(nonces.size).toBe(1000)
  })

  it('should have high entropy (randomness test)', () => {
    const nonces = Array.from({ length: 100 }, () => generateSecureNonce())

    // Check that characters are well-distributed
    const charCounts: Record<string, number> = {}
    for (const nonce of nonces) {
      for (const char of nonce) {
        charCounts[char] = (charCounts[char] || 0) + 1
      }
    }

    // Each hex character (0-9, a-f) should appear roughly equally
    // With 100 nonces * 32 chars = 3200 chars, expect ~200 per character on average
    const values = Object.values(charCounts)
    const mean = values.reduce((a, b) => a + b, 0) / values.length

    // Standard deviation should be reasonable (not too high)
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length
    const stdDev = Math.sqrt(variance)

    // Coefficient of variation should be less than 0.2 (20%) for good randomness
    const cv = stdDev / mean
    expect(cv).toBeLessThan(0.25)
  })
})

describe('generateSecureToken', () => {
  it('should generate a valid UUID v4 string', () => {
    const token = generateSecureToken()
    // UUID v4 format: xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx
    expect(token).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    )
  })

  it('should generate unique tokens', () => {
    const tokens = new Set<string>()
    for (let i = 0; i < 1000; i++) {
      tokens.add(generateSecureToken())
    }
    // All 1000 tokens should be unique
    expect(tokens.size).toBe(1000)
  })
})

describe('verifyNonceMatch', () => {
  it('should return true for matching nonces', () => {
    const nonce = generateSecureNonce()
    expect(verifyNonceMatch(nonce, nonce)).toBe(true)
  })

  it('should return false for non-matching nonces', () => {
    const nonce1 = generateSecureNonce()
    const nonce2 = generateSecureNonce()
    expect(verifyNonceMatch(nonce1, nonce2)).toBe(false)
  })

  it('should return false for empty nonces', () => {
    const nonce = generateSecureNonce()
    expect(verifyNonceMatch('', nonce)).toBe(false)
    expect(verifyNonceMatch(nonce, '')).toBe(false)
    expect(verifyNonceMatch('', '')).toBe(false)
  })

  it('should return false for nonces of different lengths', () => {
    expect(verifyNonceMatch('abc', 'abcd')).toBe(false)
    expect(verifyNonceMatch('abcd', 'abc')).toBe(false)
  })

  it('should be case-sensitive', () => {
    expect(verifyNonceMatch('abc123', 'ABC123')).toBe(false)
  })
})
