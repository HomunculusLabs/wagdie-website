/**
 * Tests for session secret validation
 * Tests T017 [US2] - Application startup security
 */

describe('Session Secret Validation', () => {
  const originalEnv = process.env

  beforeEach(() => {
    jest.resetModules()
    process.env = { ...originalEnv }
  })

  afterAll(() => {
    process.env = originalEnv
  })

  describe('validateSessionSecret', () => {
    it('should throw if SESSION_SECRET is not set', async () => {
      delete process.env.SESSION_SECRET

      await expect(async () => {
        await import('@/lib/auth/session')
      }).rejects.toThrow('SESSION_SECRET')
    })

    it('should throw if SESSION_SECRET is empty string', async () => {
      process.env.SESSION_SECRET = ''

      await expect(async () => {
        await import('@/lib/auth/session')
      }).rejects.toThrow('SESSION_SECRET')
    })

    it('should throw if SESSION_SECRET is less than 32 characters', async () => {
      process.env.SESSION_SECRET = 'short_secret_only_25_chars'

      await expect(async () => {
        await import('@/lib/auth/session')
      }).rejects.toThrow('32')
    })

    it('should not throw if SESSION_SECRET is exactly 32 characters', async () => {
      process.env.SESSION_SECRET = 'exactly_32_characters_here_ok!!'

      await expect(async () => {
        await import('@/lib/auth/session')
      }).resolves.not.toThrow()
    })

    it('should not throw if SESSION_SECRET is more than 32 characters', async () => {
      process.env.SESSION_SECRET = 'a_very_long_and_secure_session_secret_that_is_definitely_more_than_32_chars'

      await expect(async () => {
        await import('@/lib/auth/session')
      }).resolves.not.toThrow()
    })
  })

  describe('Error message clarity', () => {
    it('should provide clear error message for missing secret', async () => {
      delete process.env.SESSION_SECRET

      try {
        await import('@/lib/auth/session')
        fail('Should have thrown an error')
      } catch (error) {
        expect(error).toBeInstanceOf(Error)
        const message = (error as Error).message
        expect(message).toContain('SESSION_SECRET')
        expect(message).toMatch(/not set|missing|required/i)
      }
    })

    it('should provide clear error message for short secret', async () => {
      process.env.SESSION_SECRET = 'too_short'

      try {
        await import('@/lib/auth/session')
        fail('Should have thrown an error')
      } catch (error) {
        expect(error).toBeInstanceOf(Error)
        const message = (error as Error).message
        expect(message).toContain('32')
        expect(message).toMatch(/character|length/i)
      }
    })
  })
})
