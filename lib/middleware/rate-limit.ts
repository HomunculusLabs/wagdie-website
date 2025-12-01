/**
 * Rate Limiting Middleware
 * Implements sliding window rate limiting for auth endpoints
 *
 * T024-T029: Rate limiting implementation for US3
 */

import { NextRequest, NextResponse } from 'next/server'
import { logRateLimitEvent, getClientIp } from '@/lib/utils/audit-logger'

export interface RateLimitConfig {
  /** Maximum number of requests allowed in the window */
  maxRequests: number
  /** Time window in milliseconds */
  windowMs: number
  /** If true, allow requests when storage is unavailable (fail-open) */
  failOpen?: boolean
}

export interface RateLimitResult {
  /** Whether the request is allowed */
  allowed: boolean
  /** Number of requests remaining in the window */
  remaining: number
  /** Timestamp when the window resets */
  resetTime: number
  /** Current request count */
  count: number
  /** Maximum requests allowed */
  limit: number
}

interface RateLimitEntry {
  count: number
  startTime: number
}

/**
 * T024: RateLimiter class using in-memory Map
 * T025: Implements sliding window algorithm
 */
export class RateLimiter {
  private store: Map<string, RateLimitEntry> = new Map()
  private config: RateLimitConfig
  private cleanupInterval: NodeJS.Timeout | null = null

  constructor(config: RateLimitConfig) {
    this.config = {
      failOpen: true, // T028: Default to fail-open
      ...config,
    }

    // T027: Start cleanup mechanism (every 5 minutes)
    if (typeof setInterval !== 'undefined') {
      this.cleanupInterval = setInterval(() => {
        this.cleanup()
      }, 5 * 60 * 1000) // 5 minutes

      // Prevent the interval from keeping the process alive
      if (this.cleanupInterval.unref) {
        this.cleanupInterval.unref()
      }
    }
  }

  /**
   * Check if a request should be allowed
   * T025: Sliding window algorithm (10 requests per 60 seconds)
   */
  check(ip: string): RateLimitResult {
    const now = Date.now()
    const windowStart = now - this.config.windowMs

    try {
      let entry = this.store.get(ip)

      // Clean up if window has expired
      if (entry && entry.startTime < windowStart) {
        entry = undefined
        this.store.delete(ip)
      }

      if (!entry) {
        // First request in window
        entry = {
          count: 1,
          startTime: now,
        }
        this.store.set(ip, entry)

        return {
          allowed: true,
          remaining: this.config.maxRequests - 1,
          resetTime: now + this.config.windowMs,
          count: 1,
          limit: this.config.maxRequests,
        }
      }

      // Increment count
      entry.count++
      this.store.set(ip, entry)

      const allowed = entry.count <= this.config.maxRequests
      const remaining = Math.max(0, this.config.maxRequests - entry.count)
      const resetTime = entry.startTime + this.config.windowMs

      return {
        allowed,
        remaining,
        resetTime,
        count: entry.count,
        limit: this.config.maxRequests,
      }
    } catch (error) {
      // T028: Fail-open behavior
      if (this.config.failOpen) {
        console.error('Rate limiter error (failing open):', error)
        return {
          allowed: true,
          remaining: this.config.maxRequests,
          resetTime: now + this.config.windowMs,
          count: 0,
          limit: this.config.maxRequests,
        }
      }
      throw error
    }
  }

  /**
   * T027: Cleanup expired entries
   */
  cleanup(): void {
    const now = Date.now()
    const windowStart = now - this.config.windowMs

    for (const [ip, entry] of this.store.entries()) {
      if (entry.startTime < windowStart) {
        this.store.delete(ip)
      }
    }
  }

  /**
   * Stop the cleanup interval (for testing)
   */
  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval)
      this.cleanupInterval = null
    }
  }
}

/**
 * T026: Generate rate limit headers
 */
export function getRateLimitHeaders(result: RateLimitResult): Record<string, string> {
  return {
    'X-RateLimit-Limit': result.limit.toString(),
    'X-RateLimit-Remaining': result.remaining.toString(),
    'X-RateLimit-Reset': Math.floor(result.resetTime / 1000).toString(),
  }
}

/**
 * Shared rate limiter for auth endpoints
 * T025: 10 requests per 60 seconds per IP
 */
export const authRateLimiter = new RateLimiter({
  maxRequests: 10,
  windowMs: 60 * 1000, // 60 seconds
})

/**
 * T029: Wrapper function for route handlers
 * Applies rate limiting and adds headers to response
 */
export function withRateLimit(
  handler: (request: NextRequest) => Promise<NextResponse>,
  rateLimiter: RateLimiter = authRateLimiter
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    const ip = getClientIp(request.headers) || 'unknown'
    const result = rateLimiter.check(ip)
    const headers = getRateLimitHeaders(result)

    if (!result.allowed) {
      // T032: Audit logging for rate limit exceeded
      logRateLimitEvent(ip, request.nextUrl.pathname, {
        limit: result.limit,
        count: result.count,
      })

      return new NextResponse(
        JSON.stringify({ error: 'Too many requests. Please try again later.' }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'Retry-After': Math.ceil((result.resetTime - Date.now()) / 1000).toString(),
            ...headers,
          },
        }
      )
    }

    // Call the original handler
    const response = await handler(request)

    // Clone response to add headers
    const newResponse = new NextResponse(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: response.headers,
    })

    // Add rate limit headers
    for (const [key, value] of Object.entries(headers)) {
      newResponse.headers.set(key, value)
    }

    return newResponse
  }
}
