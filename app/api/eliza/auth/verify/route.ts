/**
 * Eliza Auth (User-Scoped SIWE) - Verify Step
 * POST /api/eliza/auth/verify
 *
 * 1) Requires an authenticated Wagdie session (session.address)
 * 2) Requires session.eliza.siwe to exist (set by /api/eliza/auth/nonce)
 * 3) Accepts POST body with { signature }
 * 4) Calls elizaClient.auth.verify(message, signature, sessionId) with stored SIWE state
 * 5) Stores returned tokens in session.eliza.tokens
 * 6) Returns { accessToken, expiresAt } (TokenResponse)
 *
 * If verification fails, clears the stored Eliza SIWE state to avoid replay / stale sessions.
 */

import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth/session'
import { getElizaClient } from '@/lib/eliza/client'
import type { TokenResponse, ErrorResponse } from '@/types/eliza'

type VerifyRequestBody = {
  signature: string
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0
}

export async function POST(
  request: NextRequest
): Promise<NextResponse<TokenResponse | ErrorResponse>> {
  let session: Awaited<ReturnType<typeof getSession>> | null = null
  let attemptedVerify = false

  try {
    session = await getSession()

    if (!session.address) {
      return NextResponse.json(
        { error: 'UNAUTHORIZED', message: 'Wallet not connected' },
        { status: 401 }
      )
    }

    if (!session.eliza?.siwe) {
      return NextResponse.json(
        {
          error: 'MISSING_SIWE_STATE',
          message: 'Eliza SIWE state not found. Call /api/eliza/auth/nonce first.',
        },
        { status: 409 }
      )
    }

    const body: unknown = await request.json()
    const signature = (body as VerifyRequestBody | undefined)?.signature

    if (!isNonEmptyString(signature)) {
      return NextResponse.json(
        { error: 'VALIDATION_ERROR', message: 'signature is required' },
        { status: 400 }
      )
    }

    const { message, sessionId } = session.eliza.siwe

    const elizaClient = getElizaClient()

    attemptedVerify = true
    const tokens = await elizaClient.auth.verify(message, signature, sessionId)

    const expiresAt = tokens.expiresAt || Date.now() + 3600000 // Default 1 hour if API omits
    session.eliza = {
      ...(session.eliza || {}),
      siwe: session.eliza.siwe,
      tokens: {
        accessToken: tokens.accessToken,
        expiresAt,
      },
    }

    await session.save()

    return NextResponse.json({
      accessToken: tokens.accessToken,
      expiresAt: new Date(expiresAt).toISOString(),
    })
  } catch (error) {
    console.error('[Eliza Auth] Verify step failed:', error)

    // IMPORTANT: Clear SIWE state if verification failed (avoid replay/stale state)
    if (session && attemptedVerify && session.eliza?.siwe) {
      try {
        session.eliza = undefined
        await session.save()
      } catch (saveError) {
        console.error('[Eliza Auth] Failed to clear SIWE state after verify error:', saveError)
      }
    }

    if (error instanceof Error) {
      if (error.message.includes('401') || error.message.toLowerCase().includes('unauthorized')) {
        return NextResponse.json(
          { error: 'AUTH_FAILED', message: 'Authentication with Eliza failed' },
          { status: 401 }
        )
      }
    }

    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to verify Eliza SIWE signature' },
      { status: 500 }
    )
  }
}