/**
 * @jest-environment node
 */

import { NextRequest } from 'next/server'
import { POST } from '@/app/api/eliza/characters/[tokenId]/persona-assistant/route'
import { authorizeElizaCharacterMutation } from '@/lib/eliza/routeAuth'
import {
  PersonaAssistantInvalidOutputError,
  PersonaAssistantUnavailableError,
  runPersonaAssistant,
} from '@/lib/eliza/persona-assistant'

jest.mock('@/lib/eliza/routeAuth', () => ({
  authorizeElizaCharacterMutation: jest.fn(),
}))

jest.mock('@/lib/eliza/persona-assistant', () => {
  const actual = jest.requireActual('@/lib/eliza/persona-assistant')
  return {
    ...actual,
    runPersonaAssistant: jest.fn(),
  }
})

function request(body: unknown) {
  return new NextRequest('http://localhost/api/eliza/characters/123/persona-assistant', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

function rawRequest(body: string) {
  return new NextRequest('http://localhost/api/eliza/characters/123/persona-assistant', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body,
  })
}

function params(tokenId = '123') {
  return { params: Promise.resolve({ tokenId }) }
}

const authorized = {
  authorized: true as const,
  tokenId: 123,
  externalId: '123',
  address: '0xOwner',
  isAdmin: false,
  character: {
    id: 123,
    name: 'Ash Knight',
    owner_address: '0xowner',
    background_story: 'Rose from ash.',
  },
}

const validPayload = {
  mode: 'generate',
  messages: [
    { id: 'msg-1', role: 'user', content: 'Draft a grim persona.', createdAt: '2026-05-18T00:00:00.000Z' },
  ],
  editorSnapshot: { bio: ['Existing bio'], system: 'Existing system' },
}

describe('persona assistant route', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(authorizeElizaCharacterMutation as jest.Mock).mockResolvedValue(authorized)
  })

  it('returns 401 for unauthenticated requests before calling the assistant', async () => {
    ;(authorizeElizaCharacterMutation as jest.Mock).mockResolvedValueOnce({
      authorized: false,
      reason: 'unauthenticated',
    })

    const response = await POST(request(validPayload), params())

    expect(response.status).toBe(401)
    expect(runPersonaAssistant).not.toHaveBeenCalled()
    await expect(response.json()).resolves.toMatchObject({ error: 'UNAUTHORIZED' })
  })

  it('returns 403 for non-owners before calling the assistant', async () => {
    ;(authorizeElizaCharacterMutation as jest.Mock).mockResolvedValueOnce({
      authorized: false,
      reason: 'forbidden',
    })

    const response = await POST(request(validPayload), params())

    expect(response.status).toBe(403)
    expect(runPersonaAssistant).not.toHaveBeenCalled()
    await expect(response.json()).resolves.toMatchObject({ error: 'FORBIDDEN' })
  })

  it('returns 404 for missing WAGDIE characters', async () => {
    ;(authorizeElizaCharacterMutation as jest.Mock).mockResolvedValueOnce({
      authorized: false,
      reason: 'not_found',
    })

    const response = await POST(request(validPayload), params())

    expect(response.status).toBe(404)
    expect(runPersonaAssistant).not.toHaveBeenCalled()
    await expect(response.json()).resolves.toMatchObject({ error: 'NOT_FOUND' })
  })

  it('returns 400 for malformed JSON', async () => {
    const response = await POST(rawRequest('{'), params())

    expect(response.status).toBe(400)
    expect(runPersonaAssistant).not.toHaveBeenCalled()
    await expect(response.json()).resolves.toMatchObject({ error: 'VALIDATION_ERROR' })
  })

  it('returns 422 for invalid assistant payloads', async () => {
    const response = await POST(request({ mode: 'generate', messages: [] }), params())

    expect(response.status).toBe(422)
    expect(runPersonaAssistant).not.toHaveBeenCalled()
    await expect(response.json()).resolves.toMatchObject({ error: 'VALIDATION_ERROR' })
  })

  it('returns 422 when the editor snapshot contains assistant-excluded fields', async () => {
    const response = await POST(request({
      ...validPayload,
      editorSnapshot: {
        systemPrompt: 'Alias is not accepted in assistant snapshots',
        knowledge: [{ id: 'doc-1' }],
        settings: { metadata: { arbitrary: 'not allowed' } },
      },
    }), params())

    expect(response.status).toBe(422)
    expect(runPersonaAssistant).not.toHaveBeenCalled()
    await expect(response.json()).resolves.toMatchObject({
      error: 'VALIDATION_ERROR',
      details: {
        issues: expect.arrayContaining([
          expect.objectContaining({ path: 'editorSnapshot' }),
          expect.objectContaining({ path: 'editorSnapshot.settings.metadata' }),
        ]),
      },
    })
  })

  it('returns 503 when inference is unavailable', async () => {
    ;(runPersonaAssistant as jest.Mock).mockRejectedValueOnce(new PersonaAssistantUnavailableError())

    const response = await POST(request(validPayload), params())

    expect(response.status).toBe(503)
    await expect(response.json()).resolves.toMatchObject({ error: 'ASSISTANT_UNAVAILABLE' })
  })

  it('returns 422 for invalid model output', async () => {
    ;(runPersonaAssistant as jest.Mock).mockRejectedValueOnce(new PersonaAssistantInvalidOutputError(
      'Assistant proposal failed policy validation',
      [{ path: 'plugins', reason: 'backend_owned', message: 'plugins is managed by the WAGDIE backend' }]
    ))

    const response = await POST(request(validPayload), params())

    expect(response.status).toBe(422)
    await expect(response.json()).resolves.toMatchObject({
      error: 'ASSISTANT_INVALID_OUTPUT',
      details: { issues: [expect.objectContaining({ path: 'plugins', reason: 'backend_owned' })] },
    })
  })

  it('returns a successful sanitized proposal response without mutating persona records', async () => {
    const assistantResponse = {
      assistantMessage: {
        id: 'assistant-1',
        role: 'assistant' as const,
        content: 'Draft ready for review.',
        createdAt: '2026-05-18T00:00:01.000Z',
      },
      proposal: {
        system: 'Speak with grave resolve.',
        bio: ['An undead knight.'],
      },
      warnings: ['systemPrompt was normalized to canonical system'],
    }
    ;(runPersonaAssistant as jest.Mock).mockResolvedValueOnce(assistantResponse)

    const response = await POST(request(validPayload), params())

    expect(response.status).toBe(200)
    expect(runPersonaAssistant).toHaveBeenCalledWith(authorized, expect.objectContaining({
      mode: 'generate',
      editorSnapshot: { bio: ['Existing bio'], system: 'Existing system' },
    }))
    await expect(response.json()).resolves.toEqual(assistantResponse)
  })
})
