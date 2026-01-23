/**
 * Eliza Auth Token Status
 * GET /api/eliza/auth
 *
 * Read-only endpoint that returns the current session token or 401 when missing/expired.
 * Removes insecure use of session.siwe.signature for Eliza auth - forces explicit Eliza SIWE flow.
 */

import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth/session'
import { normalizeExpiresAt } from '@/lib/eliza/sessionAuth'
import type { TokenResponse, ErrorResponse } from '@/types/eliza'

export async function GET(): Promise<NextResponse<TokenResponse | ErrorResponse>> {
  try {
    const session = await getSession()

    if (!session.address) {
      return NextResponse.json(
        { error: 'UNAUTHORIZED', message: 'Wallet not connected' },
        { status: 401 }
      )
    }

    const tokens = session.eliza?.tokens
    if (!tokens?.accessToken) {
      return NextResponse.json(
        { error: 'NO_TOKEN', message: 'No Eliza token found. Please authenticate with Eliza.' },
        { status: 401 }
      )
    }

    // Normalize expiry to ms and check if expired
    const expiresAtMs = normalizeExpiresAt(tokens.expiresAt)
    const bufferMs = 60000 // 1 minute buffer

    if (expiresAtMs <= Date.now() + bufferMs) {
      return NextResponse.json(
        { error: 'TOKEN_EXPIRED', message: 'Eliza token expired. Please re-authenticate.' },
        { status: 401 }
      )
    }

    return NextResponse.json({
      accessToken: tokens.accessToken,
      expiresAt: new Date(expiresAtMs).toISOString(),
    })
  } catch (error) {
    console.error('[Eliza Auth] Token status check failed:', error)

    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to check token status' },
      { status: 500 }
    )
  }
}
