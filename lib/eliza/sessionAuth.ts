import type { IronSession } from 'iron-session'
import { NextResponse } from 'next/server'
import type { UserSession } from '@/types/wallet'
import type { ErrorResponse } from '@/types/eliza'

/**
 * Normalize expiresAt to a milliseconds epoch timestamp.
 * Handles:
 * - ISO strings (Date.parse)
 * - numeric strings
 * - seconds timestamps
 * - millisecond timestamps
 *
 * Falls back to 1 hour from now if missing/invalid.
 */
export function normalizeExpiresAt(expiresAt?: number | string): number {
  if (typeof expiresAt === 'string') {
    const parsed = Date.parse(expiresAt)
    if (!Number.isNaN(parsed)) return parsed

    const numeric = Number(expiresAt)
    if (!Number.isNaN(numeric)) {
      return numeric < 4102444800 ? numeric * 1000 : numeric
    }
  }

  if (typeof expiresAt === 'number') {
    return expiresAt < 4102444800 ? expiresAt * 1000 : expiresAt
  }

  return Date.now() + 3600000
}

/**
 * Require that the user has an authenticated wallet session.
 * Returns the normalized (lowercased) address on success, otherwise a 401 response.
 */
export function requireWalletSession(
  session: IronSession<UserSession>
): { address: string } | NextResponse<ErrorResponse> {
  const address = session.address

  if (typeof address !== 'string' || address.trim().length === 0) {
    return NextResponse.json(
      { error: 'UNAUTHORIZED', message: 'Wallet not connected' },
      { status: 401 }
    )
  }

  return { address: address.toLowerCase() }
}

/**
 * Require a valid user-scoped Eliza access token in the session.
 * Uses a buffer (default 60s) to avoid near-expiry races.
 */
export function requireElizaUserToken(
  session: IronSession<UserSession>,
  options?: { bufferMs?: number }
): { accessToken: string; expiresAtMs: number } | NextResponse<ErrorResponse> {
  const bufferMs = typeof options?.bufferMs === 'number' ? options.bufferMs : 60000

  const tokens = session.eliza?.tokens
  const accessToken = tokens?.accessToken

  if (typeof accessToken !== 'string' || accessToken.trim().length === 0) {
    return NextResponse.json(
      { error: 'NO_TOKEN', message: 'No Eliza token found. Please authenticate with Eliza.' },
      { status: 401 }
    )
  }

  const expiresAtMs = normalizeExpiresAt(tokens?.expiresAt)

  if (expiresAtMs <= Date.now() + bufferMs) {
    return NextResponse.json(
      { error: 'TOKEN_EXPIRED', message: 'Eliza token expired. Please re-authenticate.' },
      { status: 401 }
    )
  }

  return { accessToken, expiresAtMs }
}