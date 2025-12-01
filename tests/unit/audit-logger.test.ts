/**
 * Tests for audit logger
 * Verifies security event logging functions
 */

import {
  logSecurityEvent,
  logAuthEvent,
  logRateLimitEvent,
  logCsrfFailure,
  logSyncEvent,
  getClientIp,
  type SecurityEvent,
} from '@/lib/utils/audit-logger'

describe('logSecurityEvent', () => {
  let consoleSpy: jest.SpyInstance
  let consoleWarnSpy: jest.SpyInstance

  beforeEach(() => {
    consoleSpy = jest.spyOn(console, 'log').mockImplementation()
    consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation()
  })

  afterEach(() => {
    consoleSpy.mockRestore()
    consoleWarnSpy.mockRestore()
  })

  it('should log success events to console.log', () => {
    const event: SecurityEvent = {
      timestamp: '2025-01-01T00:00:00.000Z',
      event: 'auth.verify.success',
      ip: '127.0.0.1',
      path: '/api/auth/verify',
      result: 'success',
    }

    logSecurityEvent(event)

    expect(consoleSpy).toHaveBeenCalledWith(
      '[Security Event]',
      expect.stringContaining('auth.verify.success')
    )
  })

  it('should log failure events to console.warn', () => {
    const event: SecurityEvent = {
      timestamp: '2025-01-01T00:00:00.000Z',
      event: 'auth.verify.failed',
      ip: '127.0.0.1',
      path: '/api/auth/verify',
      result: 'failure',
    }

    logSecurityEvent(event)

    expect(consoleWarnSpy).toHaveBeenCalledWith(
      '[Security Event]',
      expect.stringContaining('auth.verify.failed')
    )
  })

  it('should log blocked events to console.warn', () => {
    const event: SecurityEvent = {
      timestamp: '2025-01-01T00:00:00.000Z',
      event: 'auth.ratelimit.exceeded',
      ip: '127.0.0.1',
      path: '/api/auth/nonce',
      result: 'blocked',
    }

    logSecurityEvent(event)

    expect(consoleWarnSpy).toHaveBeenCalledWith(
      '[Security Event]',
      expect.stringContaining('auth.ratelimit.exceeded')
    )
  })

  it('should include all event details in log', () => {
    const event: SecurityEvent = {
      timestamp: '2025-01-01T00:00:00.000Z',
      event: 'auth.verify.success',
      ip: '192.168.1.1',
      path: '/api/auth/verify',
      result: 'success',
      details: { address: '0x1234' },
    }

    logSecurityEvent(event)

    const loggedMessage = consoleSpy.mock.calls[0][1]
    expect(loggedMessage).toContain('192.168.1.1')
    expect(loggedMessage).toContain('/api/auth/verify')
    expect(loggedMessage).toContain('0x1234')
  })
})

describe('logAuthEvent', () => {
  let consoleSpy: jest.SpyInstance

  beforeEach(() => {
    consoleSpy = jest.spyOn(console, 'log').mockImplementation()
    jest.spyOn(console, 'warn').mockImplementation()
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  it('should log auth.nonce.generated events', () => {
    logAuthEvent('auth.nonce.generated', '127.0.0.1', '/api/auth/nonce')

    expect(consoleSpy).toHaveBeenCalledWith(
      '[Security Event]',
      expect.stringContaining('auth.nonce.generated')
    )
  })

  it('should log auth.verify.success events', () => {
    logAuthEvent('auth.verify.success', '127.0.0.1', '/api/auth/verify', {
      address: '0x1234',
    })

    expect(consoleSpy).toHaveBeenCalledWith(
      '[Security Event]',
      expect.stringContaining('auth.verify.success')
    )
  })
})

describe('logRateLimitEvent', () => {
  let consoleWarnSpy: jest.SpyInstance

  beforeEach(() => {
    consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation()
  })

  afterEach(() => {
    consoleWarnSpy.mockRestore()
  })

  it('should log rate limit exceeded events', () => {
    logRateLimitEvent('127.0.0.1', '/api/auth/nonce', { limit: 10, count: 11 })

    expect(consoleWarnSpy).toHaveBeenCalledWith(
      '[Security Event]',
      expect.stringContaining('auth.ratelimit.exceeded')
    )
  })
})

describe('logCsrfFailure', () => {
  let consoleWarnSpy: jest.SpyInstance

  beforeEach(() => {
    consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation()
  })

  afterEach(() => {
    consoleWarnSpy.mockRestore()
  })

  it('should log CSRF validation failures', () => {
    logCsrfFailure('127.0.0.1', '/api/characters/123', { reason: 'token_mismatch' })

    expect(consoleWarnSpy).toHaveBeenCalledWith(
      '[Security Event]',
      expect.stringContaining('csrf.validation.failed')
    )
  })
})

describe('logSyncEvent', () => {
  let consoleSpy: jest.SpyInstance
  let consoleWarnSpy: jest.SpyInstance

  beforeEach(() => {
    consoleSpy = jest.spyOn(console, 'log').mockImplementation()
    consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation()
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  it('should log sync.operation.started events', () => {
    logSyncEvent('sync.operation.started')

    expect(consoleSpy).toHaveBeenCalledWith(
      '[Security Event]',
      expect.stringContaining('sync.operation.started')
    )
  })

  it('should log sync.operation.completed events', () => {
    logSyncEvent('sync.operation.completed', { tokensProcessed: 100 })

    expect(consoleSpy).toHaveBeenCalledWith(
      '[Security Event]',
      expect.stringContaining('sync.operation.completed')
    )
  })

  it('should log sync.operation.failed events as warnings', () => {
    logSyncEvent('sync.operation.failed', { error: 'Connection timeout' })

    expect(consoleWarnSpy).toHaveBeenCalledWith(
      '[Security Event]',
      expect.stringContaining('sync.operation.failed')
    )
  })
})

describe('getClientIp', () => {
  it('should extract IP from x-forwarded-for header', () => {
    const headers = new Headers()
    headers.set('x-forwarded-for', '192.168.1.1, 10.0.0.1')

    expect(getClientIp(headers)).toBe('192.168.1.1')
  })

  it('should extract IP from x-real-ip header', () => {
    const headers = new Headers()
    headers.set('x-real-ip', '192.168.1.2')

    expect(getClientIp(headers)).toBe('192.168.1.2')
  })

  it('should extract IP from cf-connecting-ip header', () => {
    const headers = new Headers()
    headers.set('cf-connecting-ip', '192.168.1.3')

    expect(getClientIp(headers)).toBe('192.168.1.3')
  })

  it('should prefer x-forwarded-for over other headers', () => {
    const headers = new Headers()
    headers.set('x-forwarded-for', '192.168.1.1')
    headers.set('x-real-ip', '192.168.1.2')
    headers.set('cf-connecting-ip', '192.168.1.3')

    expect(getClientIp(headers)).toBe('192.168.1.1')
  })

  it('should return undefined if no IP headers present', () => {
    const headers = new Headers()

    expect(getClientIp(headers)).toBeUndefined()
  })
})
