/**
 * Audit Logger
 * Security event logging for authentication, rate limiting, and CSRF events
 */

export type SecurityEventType =
  | 'auth.nonce.generated'
  | 'auth.verify.success'
  | 'auth.verify.failed'
  | 'auth.ratelimit.exceeded'
  | 'csrf.validation.failed'
  | 'sync.operation.started'
  | 'sync.operation.completed'
  | 'sync.operation.failed'
  | 'session.validation.failed'

export interface SecurityEvent {
  timestamp: string
  event: SecurityEventType
  ip?: string
  path?: string
  result: 'success' | 'failure' | 'blocked'
  details?: Record<string, unknown>
}

/**
 * Log a security event to the console/server logs
 * In production, these logs are captured by log aggregation services
 */
export function logSecurityEvent(event: SecurityEvent): void {
  const logEntry = {
    ...event,
    timestamp: event.timestamp || new Date().toISOString(),
  }

  // Use appropriate log level based on result
  if (event.result === 'failure' || event.result === 'blocked') {
    console.warn('[Security Event]', JSON.stringify(logEntry))
  } else {
    console.log('[Security Event]', JSON.stringify(logEntry))
  }
}

/**
 * Log an authentication event
 */
export function logAuthEvent(
  eventType: 'auth.nonce.generated' | 'auth.verify.success' | 'auth.verify.failed',
  ip: string | undefined,
  path: string,
  details?: Record<string, unknown>
): void {
  logSecurityEvent({
    timestamp: new Date().toISOString(),
    event: eventType,
    ip,
    path,
    result: eventType === 'auth.verify.failed' ? 'failure' : 'success',
    details,
  })
}

/**
 * Log a rate limit event
 */
export function logRateLimitEvent(
  ip: string | undefined,
  path: string,
  details?: Record<string, unknown>
): void {
  logSecurityEvent({
    timestamp: new Date().toISOString(),
    event: 'auth.ratelimit.exceeded',
    ip,
    path,
    result: 'blocked',
    details,
  })
}

/**
 * Log a CSRF validation failure
 */
export function logCsrfFailure(
  ip: string | undefined,
  path: string,
  details?: Record<string, unknown>
): void {
  logSecurityEvent({
    timestamp: new Date().toISOString(),
    event: 'csrf.validation.failed',
    ip,
    path,
    result: 'blocked',
    details,
  })
}

/**
 * Log a sync operation event
 */
export function logSyncEvent(
  eventType: 'sync.operation.started' | 'sync.operation.completed' | 'sync.operation.failed',
  details?: Record<string, unknown>
): void {
  logSecurityEvent({
    timestamp: new Date().toISOString(),
    event: eventType,
    result: eventType === 'sync.operation.failed' ? 'failure' : 'success',
    details,
  })
}

/**
 * Get client IP from request headers
 * Handles proxied requests (Vercel, Cloudflare, etc.)
 */
export function getClientIp(headers: Headers): string | undefined {
  return (
    headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    headers.get('x-real-ip') ||
    headers.get('cf-connecting-ip') ||
    undefined
  )
}
