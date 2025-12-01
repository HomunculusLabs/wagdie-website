/**
 * Tests for CSRF protection
 * Tests T033 [US4] - Token generation, validation, and bypass logic
 */

import {
  generateCsrfToken,
  validateCsrfToken,
  shouldBypassCsrf,
  CSRF_COOKIE_NAME,
  CSRF_HEADER_NAME,
} from '@/lib/middleware/csrf'
import { NextRequest } from 'next/server'

describe('CSRF Protection', () => {
  describe('generateCsrfToken', () => {
    it('should generate a valid UUID token', () => {
      const token = generateCsrfToken()

      // Should be a valid UUID v4
      expect(token).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
      )
    })

    it('should generate unique tokens', () => {
      const tokens = new Set<string>()
      for (let i = 0; i < 100; i++) {
        tokens.add(generateCsrfToken())
      }
      expect(tokens.size).toBe(100)
    })
  })

  describe('validateCsrfToken', () => {
    function createMockRequest(
      cookieToken?: string,
      headerToken?: string,
      authHeader?: string
    ): NextRequest {
      const headers = new Headers()
      if (headerToken) {
        headers.set(CSRF_HEADER_NAME, headerToken)
      }
      if (authHeader) {
        headers.set('Authorization', authHeader)
      }

      return {
        cookies: {
          get: (name: string) =>
            name === CSRF_COOKIE_NAME && cookieToken
              ? { value: cookieToken }
              : undefined,
        },
        headers,
      } as unknown as NextRequest
    }

    it('should return true when cookie and header tokens match', () => {
      const token = 'valid-csrf-token-123'
      const request = createMockRequest(token, token)

      expect(validateCsrfToken(request)).toBe(true)
    })

    it('should return false when tokens do not match', () => {
      const request = createMockRequest('cookie-token', 'different-header-token')

      expect(validateCsrfToken(request)).toBe(false)
    })

    it('should return false when cookie is missing', () => {
      const request = createMockRequest(undefined, 'header-token')

      expect(validateCsrfToken(request)).toBe(false)
    })

    it('should return false when header is missing', () => {
      const request = createMockRequest('cookie-token', undefined)

      expect(validateCsrfToken(request)).toBe(false)
    })

    it('should return false when both are missing', () => {
      const request = createMockRequest(undefined, undefined)

      expect(validateCsrfToken(request)).toBe(false)
    })

    it('should be case-sensitive', () => {
      const request = createMockRequest('Token123', 'token123')

      expect(validateCsrfToken(request)).toBe(false)
    })
  })

  describe('shouldBypassCsrf', () => {
    function createMockRequest(authHeader?: string): NextRequest {
      const headers = new Headers()
      if (authHeader) {
        headers.set('Authorization', authHeader)
      }

      return {
        headers,
      } as unknown as NextRequest
    }

    it('should return true when Authorization header is present with Bearer token', () => {
      const request = createMockRequest('Bearer some-api-token')

      expect(shouldBypassCsrf(request)).toBe(true)
    })

    it('should return false when Authorization header is missing', () => {
      const request = createMockRequest(undefined)

      expect(shouldBypassCsrf(request)).toBe(false)
    })

    it('should return true for any Authorization header format', () => {
      // API clients might use different auth schemes
      const request = createMockRequest('Basic base64credentials')

      expect(shouldBypassCsrf(request)).toBe(true)
    })

    it('should return false for empty Authorization header', () => {
      const request = createMockRequest('')

      expect(shouldBypassCsrf(request)).toBe(false)
    })
  })

  describe('Constants', () => {
    it('should export correct cookie name', () => {
      expect(CSRF_COOKIE_NAME).toBe('csrf-token')
    })

    it('should export correct header name', () => {
      expect(CSRF_HEADER_NAME).toBe('X-CSRF-Token')
    })
  })
})
