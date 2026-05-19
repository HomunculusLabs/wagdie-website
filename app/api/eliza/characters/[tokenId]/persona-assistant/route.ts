import { NextRequest, NextResponse } from 'next/server'
import { authorizeElizaCharacterMutation } from '@/lib/eliza/routeAuth'
import {
  PersonaAssistantInvalidOutputError,
  PersonaAssistantUnavailableError,
  runPersonaAssistant,
} from '@/lib/eliza/persona-assistant'
import { isWagdieElizaError } from '@/lib/eliza/gateway/errors'
import { personaAssistantRequestSchema } from '@/lib/eliza/validation'
import type { ErrorResponse, PersonaAssistantResponse } from '@/types/eliza'

export const runtime = 'nodejs'

interface RouteParams {
  params: Promise<{ tokenId: string }>
}

function authErrorResponse(reason: 'missing_token' | 'invalid_token' | 'unauthenticated' | 'not_found' | 'forbidden') {
  if (reason === 'missing_token' || reason === 'invalid_token') {
    return NextResponse.json(
      { error: 'INVALID_TOKEN_ID', message: 'Invalid token ID' },
      { status: 400 }
    )
  }

  if (reason === 'unauthenticated') {
    return NextResponse.json(
      { error: 'UNAUTHORIZED', message: 'Wallet not connected' },
      { status: 401 }
    )
  }

  if (reason === 'not_found') {
    return NextResponse.json(
      { error: 'NOT_FOUND', message: 'WAGDIE character not found' },
      { status: 404 }
    )
  }

  return NextResponse.json(
    { error: 'FORBIDDEN', message: 'Not character owner' },
    { status: 403 }
  )
}

export async function POST(
  request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse<PersonaAssistantResponse | ErrorResponse>> {
  try {
    const { tokenId } = await params
    const authorization = await authorizeElizaCharacterMutation(tokenId)

    if (!authorization.authorized) {
      return authErrorResponse(authorization.reason)
    }

    let rawBody: unknown
    try {
      rawBody = await request.json()
    } catch {
      return NextResponse.json(
        { error: 'VALIDATION_ERROR', message: 'Invalid JSON in request body' },
        { status: 400 }
      )
    }

    const parsed = personaAssistantRequestSchema.safeParse(rawBody)
    if (!parsed.success) {
      return NextResponse.json(
        {
          error: 'VALIDATION_ERROR',
          message: 'Invalid persona assistant payload',
          details: {
            issues: parsed.error.errors.map((issue) => ({
              path: issue.path.join('.'),
              message: issue.message,
            })),
          },
        },
        { status: 422 }
      )
    }

    const response = await runPersonaAssistant(authorization, parsed.data)
    return NextResponse.json(response)
  } catch (error) {
    console.error('[Persona Assistant] POST failed:', error)

    if (error instanceof PersonaAssistantUnavailableError) {
      return NextResponse.json(
        { error: 'ASSISTANT_UNAVAILABLE', message: error.message },
        { status: 503 }
      )
    }

    if (error instanceof PersonaAssistantInvalidOutputError) {
      return NextResponse.json(
        {
          error: 'ASSISTANT_INVALID_OUTPUT',
          message: error.message,
          details: { issues: error.issues },
        },
        { status: 422 }
      )
    }

    if (isWagdieElizaError(error)) {
      return NextResponse.json(
        {
          error: 'ASSISTANT_GATEWAY_ERROR',
          message: error.message,
          details: { code: error.code, statusCode: error.statusCode },
        },
        { status: error.statusCode === 429 ? 429 : 503 }
      )
    }

    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Persona assistant request failed' },
      { status: 500 }
    )
  }
}
