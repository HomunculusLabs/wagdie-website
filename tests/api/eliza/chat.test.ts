/**
 * @jest-environment node
 */

import { NextRequest } from 'next/server'
import { POST as chatHandler } from '@/app/api/eliza/chat/route'
import { getSession } from '@/lib/auth/session'
import { getElizaClient, createUserClient } from '@/lib/eliza/client'
import { resolveCharacterByTokenId } from '@/lib/eliza/characterResolver'
import { getCharacter } from '@/lib/services/character-service'

jest.mock('@/lib/auth/session', () => ({ getSession: jest.fn() }))
jest.mock('@/lib/eliza/client', () => ({ getElizaClient: jest.fn(), createUserClient: jest.fn() }))
jest.mock('@/lib/eliza/characterResolver', () => ({ resolveCharacterByTokenId: jest.fn() }))
jest.mock('@/lib/services/character-service', () => ({ getCharacter: jest.fn() }))

function createNextRequest(body: unknown) {
  return new NextRequest('http://localhost/api/eliza/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

async function drainStream(body: ReadableStream<Uint8Array> | null): Promise<void> {
  if (!body) return
  const reader = body.getReader()
  while (true) {
    const { done } = await reader.read()
    if (done) break
  }
}

describe('Eliza Chat API Route', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should return 401 when wallet session is missing', async () => {
    ;(getSession as jest.Mock).mockResolvedValueOnce({
      address: undefined,
    })

    const response = await chatHandler(createNextRequest({ tokenId: '1', message: 'Hello' }))
    expect(response.status).toBe(401)

    const data = await (response as any).json()
    expect(data.error).toBe('UNAUTHORIZED')
  })

  it('should return 401 when Eliza token is missing', async () => {
    ;(getSession as jest.Mock).mockResolvedValueOnce({
      address: '0xabc',
      eliza: { tokens: undefined },
    })

    const response = await chatHandler(createNextRequest({ tokenId: '1', message: 'Hello' }))
    expect(response.status).toBe(401)

    const data = await (response as any).json()
    expect(data.error).toBe('NO_TOKEN')
  })

  it('should return 401 when Eliza token is expired', async () => {
    ;(getSession as jest.Mock).mockResolvedValueOnce({
      address: '0xabc',
      eliza: {
        tokens: {
          accessToken: 'token',
          expiresAt: Date.now() - 1000,
        },
      },
    })

    const response = await chatHandler(createNextRequest({ tokenId: '1', message: 'Hello' }))
    expect(response.status).toBe(401)

    const data = await (response as any).json()
    expect(data.error).toBe('TOKEN_EXPIRED')
  })

  it('should return 400 when request body is missing tokenId or message', async () => {
    ;(getSession as jest.Mock).mockResolvedValueOnce({
      address: '0xabc',
      eliza: {
        tokens: {
          accessToken: 'token',
          expiresAt: Date.now() + 60 * 60 * 1000,
        },
      },
    })

    const response = await chatHandler(createNextRequest({ tokenId: '1' }))
    expect(response.status).toBe(400)

    const data = await (response as any).json()
    expect(data.error).toBe('VALIDATION_ERROR')
  })

  it('should return 404 when WAGDIE character is not found', async () => {
    ;(getSession as jest.Mock).mockResolvedValueOnce({
      address: '0xabc',
      eliza: {
        tokens: {
          accessToken: 'token',
          expiresAt: Date.now() + 60 * 60 * 1000,
        },
      },
    })

    ;(getCharacter as jest.Mock).mockResolvedValueOnce(null)

    const response = await chatHandler(createNextRequest({ tokenId: '999', message: 'Hello' }))
    expect(response.status).toBe(404)

    const data = await (response as any).json()
    expect(data.error).toBe('NOT_FOUND')
    expect(data.message).toContain('WAGDIE character not found')
  })

  it('should use server client for resolveCharacterByTokenId and user client for sendMessageStream', async () => {
    ;(getSession as jest.Mock).mockResolvedValueOnce({
      address: '0xabc',
      eliza: {
        tokens: {
          accessToken: 'user-access-token',
          expiresAt: Date.now() + 60 * 60 * 1000,
        },
      },
    })

    ;(getCharacter as jest.Mock).mockResolvedValueOnce({
      name: 'Test Character',
      background_story: 'Backstory',
    })

    const serverClient = { __type: 'server-client' }
    const sendMessageStream = jest.fn(async (_characterId: string, _payload: any, callbacks: any) => {
      callbacks.onChunk('H')
      callbacks.onChunk('i')
      callbacks.onComplete(
        { id: 'msg-1', content: 'Hi', createdAt: new Date().toISOString() },
        'conv-1'
      )
    })

    const userClient = {
      __type: 'user-client',
      chat: { sendMessageStream },
    }

    ;(getElizaClient as jest.Mock).mockReturnValue(serverClient)
    ;(createUserClient as jest.Mock).mockReturnValue(userClient)

    ;(resolveCharacterByTokenId as jest.Mock).mockResolvedValueOnce({
      id: 'record-1',
    })

    const response = await chatHandler(createNextRequest({ tokenId: '1', message: 'Hello' }))

    expect(getElizaClient).toHaveBeenCalledTimes(1)
    expect(createUserClient).toHaveBeenCalledWith('user-access-token')

    expect(resolveCharacterByTokenId).toHaveBeenCalledTimes(1)
    expect(resolveCharacterByTokenId).toHaveBeenCalledWith(
      expect.objectContaining({
        elizaClient: serverClient,
        tokenId: '1',
        wagdieDefaults: expect.any(Object),
      })
    )

    // Ensure stream is actually consumed so the ReadableStream start() runs
    await drainStream(response.body as any)

    expect(sendMessageStream).toHaveBeenCalledTimes(1)
    expect(sendMessageStream).toHaveBeenCalledWith(
      'record-1',
      expect.objectContaining({ message: 'Hello', conversationId: undefined }),
      expect.any(Object)
    )
  })
})