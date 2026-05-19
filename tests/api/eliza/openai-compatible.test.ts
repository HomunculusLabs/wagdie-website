/**
 * @jest-environment node
 */

import {
  buildMessagesForCharacter,
  streamOpenAICompatibleChat,
} from '@/lib/eliza/openai-compatible'

describe('OpenAI-compatible Eliza inference helpers', () => {
  beforeEach(() => {
    jest.restoreAllMocks()
  })

  it('builds a character prompt from Eliza character fields', () => {
    const messages = buildMessagesForCharacter(
      {
        name: 'The Herald',
        system: 'Speak in prophecy.',
        bio: ['Ominous and formal.'],
        lore: ['Born beneath a broken banner.'],
        topics: ['omens'],
        adjectives: ['grim'],
        style: { all: ['Be concise'], chat: ['Stay eerie'] },
        messageExamples: [
          [
            { name: '{{user1}}', content: { text: 'What comes next?' } },
            { name: '{{char}}', content: { text: 'Ash, then silence.' } },
          ],
        ],
      },
      'Who are you?'
    )

    expect(messages[0]).toEqual(
      expect.objectContaining({
        role: 'system',
        content: expect.stringContaining('The Herald'),
      })
    )
    expect(messages[0].content).toContain('Speak in prophecy.')
    expect(messages[0].content).toContain('Born beneath a broken banner.')
    expect(messages[0].content).not.toContain('WAGDIE universe')
    expect(messages[0].content).not.toContain('world of WAGDIE')
    expect(messages[0].content).not.toMatch(/\bWAGDIE\b/)
    expect(messages).toContainEqual({ role: 'assistant', content: 'Ash, then silence.' })
    expect(messages[messages.length - 1]).toEqual({ role: 'user', content: 'Who are you?' })
  })

  it('uses immersive generic prompt framing when character name is absent', () => {
    const messages = buildMessagesForCharacter(
      { name: '' },
      'Who are you?'
    )

    expect(messages[0].content).toContain('You are an unnamed character.')
    expect(messages[0].content).toContain('Stay in character and answer in a concise, immersive voice.')
    expect(messages[0].content).not.toContain('WAGDIE universe')
    expect(messages[0].content).not.toMatch(/\bWAGDIE\b/)
  })

  it('neutralizes exact legacy generated default persona seeds before building prompts', () => {
    const messages = buildMessagesForCharacter(
      {
        name: 'Seeded Character',
        bio: ['A mysterious character from the world of WAGDIE. Character #4040.'],
      },
      'Who are you?'
    )

    expect(messages[0].content).toContain(
      'A mysterious character whose story is still being written. Character #4040.'
    )
    expect(messages[0].content).not.toContain('world of WAGDIE')
  })

  it('falls back to legacy personality and backstory fields when canonical fields are absent', () => {
    const messages = buildMessagesForCharacter(
      {
        name: 'Legacy Character',
        personality: 'A haunted keeper of old paths.',
        backstory: 'They woke beneath a dead moon.',
      },
      'Tell me more.'
    )

    expect(messages[0].content).toContain('A haunted keeper of old paths.')
    expect(messages[0].content).toContain('They woke beneath a dead moon.')
  })

  it('streams OpenAI-compatible tokens and sends a completion callback', async () => {
    const encoder = new TextEncoder()
    const stream = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(
          encoder.encode(
            'data: {"id":"chatcmpl-1","choices":[{"delta":{"content":"Hel"}}]}\n\n'
          )
        )
        controller.enqueue(
          encoder.encode('data: {"choices":[{"delta":{"content":"lo"}}]}\n\n')
        )
        controller.enqueue(encoder.encode('data: [DONE]\n\n'))
        controller.close()
      },
    })

    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      body: stream,
      headers: new Headers({ 'content-type': 'text/event-stream' }),
    })
    global.fetch = fetchMock as typeof fetch

    const chunks: string[] = []
    const onComplete = jest.fn()
    const onError = jest.fn()

    await streamOpenAICompatibleChat(
      {
        baseUrl: 'https://api.venice.ai/api/v1',
        apiKey: 'venice-key',
        model: 'venice-uncensored-1-2',
        conversationId: 'conv-existing',
        messages: [{ role: 'user', content: 'Hello' }],
      },
      {
        onChunk: (chunk) => chunks.push(chunk),
        onComplete,
        onError,
      }
    )

    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.venice.ai/api/v1/chat/completions',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({ Authorization: 'Bearer venice-key' }),
      })
    )
    expect(JSON.parse((fetchMock.mock.calls[0][1] as RequestInit).body as string)).toEqual(
      expect.objectContaining({
        model: 'venice-uncensored-1-2',
        stream: true,
        messages: [{ role: 'user', content: 'Hello' }],
      })
    )
    expect(chunks).toEqual(['Hel', 'lo'])
    expect(onComplete).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'chatcmpl-1', role: 'assistant', content: 'Hello' }),
      'conv-existing'
    )
    expect(onError).not.toHaveBeenCalled()
  })
})
