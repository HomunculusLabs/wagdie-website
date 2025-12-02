/**
 * Eliza Auth Token Proxy
 * POST /api/eliza/auth/token
 *
 * Exchanges WAGDIE session for Eliza access token.
 * Backend manages SIWE flow with Eliza API on behalf of user.
 */

import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth/session'
import { getElizaClient } from '@/lib/eliza/client'
import { createSIWEMessage } from '@eliza/sdk'
import type { TokenResponse, ErrorResponse } from '@/types/eliza'

// In-memory token cache (in production, use Redis)
const tokenCache = new Map<string, { token: string; expiresAt: number }>()

export async function POST(request: NextRequest): Promise<NextResponse<TokenResponse | ErrorResponse>> {
  try {
    // Get user session
    const session = await getSession()

    if (!session.address) {
      return NextResponse.json(
        { error: 'UNAUTHORIZED', message: 'Wallet not connected' },
        { status: 401 }
      )
    }

    const userAddress = session.address.toLowerCase()

    // Check cache for valid token
    const cached = tokenCache.get(userAddress)
    if (cached && cached.expiresAt > Date.now() + 60000) {
      // Token still valid with 1 minute buffer
      return NextResponse.json({
        accessToken: cached.token,
        expiresAt: new Date(cached.expiresAt).toISOString(),
      })
    }

    // Get Eliza client
    const elizaClient = getElizaClient()

    // Get nonce from Eliza
    const { nonce, sessionId } = await elizaClient.auth.getNonce()

    // Create SIWE message for Eliza
    const message = createSIWEMessage({
      domain: new URL(request.url).host,
      address: session.address,
      statement: 'Sign in to WAGDIE Chat with Eliza',
      uri: request.url,
      chainId: 1, // Mainnet
      nonce,
    })

    // Use existing SIWE signature from session to verify with Eliza
    // In production, you might want to re-sign specifically for Eliza
    const tokens = await elizaClient.auth.verify(
      message,
      session.siwe.signature,
      sessionId
    )

    // Cache the token
    const expiresAt = tokens.expiresAt || Date.now() + 3600000 // Default 1 hour
    tokenCache.set(userAddress, {
      token: tokens.accessToken,
      expiresAt,
    })

    return NextResponse.json({
      accessToken: tokens.accessToken,
      expiresAt: new Date(expiresAt).toISOString(),
    })
  } catch (error) {
    console.error('[Eliza Auth] Token exchange failed:', error)

    if (error instanceof Error) {
      if (error.message.includes('401') || error.message.includes('unauthorized')) {
        return NextResponse.json(
          { error: 'AUTH_FAILED', message: 'Authentication with Eliza failed' },
          { status: 401 }
        )
      }
    }

    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to get access token' },
      { status: 500 }
    )
  }
}
