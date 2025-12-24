/**
 * Eliza Auth (User-Scoped SIWE) - Nonce Step
 * POST /api/eliza/auth/nonce
 *
 * 1) Requires an authenticated Wagdie session (session.address)
 * 2) Requests { nonce, sessionId } from Eliza
 * 3) Builds a SIWE message using @eliza/sdk createSIWEMessage()
 * 4) Stores SIWE state in session.eliza.siwe
 * 5) Returns { sessionId, nonce, message, issuedAt } for the client to sign
 */

import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth/session'
import { getElizaClient } from '@/lib/eliza/client'
import { elizaConfig } from '@/lib/eliza/config'
import { createSIWEMessage } from '@eliza/sdk'

type ElizaAuthNonceResponse = {
  sessionId: string
  nonce: string
  message: string
  issuedAt: string
}

type ErrorResponse = {
  error: string
  message: string
}

function getRequestHost(request: NextRequest): string {
  return (
    request.headers.get('x-forwarded-host') ||
    request.headers.get('host') ||
    new URL(request.url).host
  )
}

function getRequestOrigin(request: NextRequest): string {
  const origin = request.headers.get('origin')
  if (origin) return origin

  const host = getRequestHost(request)
  const proto = request.headers.get('x-forwarded-proto') || 'https'
  if (host) return `${proto}://${host}`

  return new URL(request.url).origin
}

export async function POST(
  request: NextRequest
): Promise<NextResponse<ElizaAuthNonceResponse | ErrorResponse>> {
  try {
    const session = await getSession()

    if (!session.address) {
      return NextResponse.json(
        { error: 'UNAUTHORIZED', message: 'Wallet not connected' },
        { status: 401 }
      )
    }

    const elizaClient = getElizaClient()

    // Step 1: get nonce/sessionId from Eliza
    const { nonce, sessionId } = await elizaClient.auth.getNonce()

    // Step 2: build the SIWE message for Eliza (client will sign this exact string)
    const issuedAt = new Date().toISOString()

    const domain = getRequestHost(request)
    const uri = getRequestOrigin(request)

    // Note: `elizaConfig.baseUrl` is the Eliza API URL, but SIWE domain/uri should represent
    // the requesting application. We derive from request headers for deployment correctness.
    // (If we later add a dedicated app URL config, we can switch this here.)
    void elizaConfig.baseUrl

    const message = createSIWEMessage({
      domain,
      address: session.address,
      statement: 'Sign in to Eliza AI',
      uri,
      chainId: 1,
      nonce,
      issuedAt,
    })

    // Step 3: persist SIWE state in the Wagdie session for the verify step
    session.eliza = {
      ...(session.eliza || {}),
      siwe: {
        nonce,
        sessionId,
        message,
        issuedAt,
      },
      tokens: session.eliza?.tokens,
    }

    await session.save()

    return NextResponse.json({
      sessionId,
      nonce,
      message,
      issuedAt,
    })
  } catch (error) {
    console.error('[Eliza Auth] Nonce step failed:', error)

    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to create Eliza SIWE nonce' },
      { status: 500 }
    )
  }
}