/**
 * @jest-environment node
 */

import { completeOpenAICompatibleChat } from '@/lib/eliza/gateway/venice'
import { runPersonaAssistant } from '@/lib/eliza/persona-assistant'

jest.mock('@/lib/eliza/config', () => ({
  elizaConfig: {
    inference: {
      baseUrl: 'https://api.venice.ai/api/v1',
      apiKey: 'venice-key',
      model: 'venice-uncensored-1-2',
      temperature: 0.4,
      maxTokens: 1800,
    },
    timeout: 30000,
  },
  hasVeniceInference: jest.fn(() => true),
}))

jest.mock('@/lib/eliza/gateway/venice', () => {
  const actual = jest.requireActual('@/lib/eliza/gateway/venice')
  return {
    ...actual,
    completeOpenAICompatibleChat: jest.fn(),
  }
})

const mockCompleteOpenAICompatibleChat = completeOpenAICompatibleChat as jest.MockedFunction<
  typeof completeOpenAICompatibleChat
>

describe('runPersonaAssistant prompt construction', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockCompleteOpenAICompatibleChat.mockResolvedValue({
      id: 'completion-1',
      content: JSON.stringify({
        assistantMessage: 'Draft ready for review.',
        proposal: {
          bio: ['A grim knight.'],
          system: 'Speak with grave resolve.',
        },
      }),
    })
  })

  it('sends immersive neutral prompt copy to inference', async () => {
    await runPersonaAssistant(
      {
        authorized: true,
        tokenId: 4040,
        externalId: '4040',
        address: '0xOwner',
        isAdmin: false,
        character: {
          id: 4040,
          name: 'Ash Knight',
          owner_address: '0xowner',
          background_story: 'A mysterious character from the world of WAGDIE. Character #4040.',
        },
      } as never,
      {
        mode: 'generate',
        messages: [
          {
            id: 'msg-1',
            role: 'user',
            content: 'Use the existing draft: A mysterious character from the world of WAGDIE. Character #4040.',
            createdAt: '2026-05-19T00:00:00.000Z',
          },
        ],
        editorSnapshot: {
          bio: ['A mysterious character from the world of WAGDIE. Character #4040.'],
          settings: { metadata: { wagdieUser: { favoriteRelic: 'ash' } } },
        },
      }
    )

    const messages = mockCompleteOpenAICompatibleChat.mock.calls[0][0].messages
    const promptText = messages.map((message) => message.content).join('\n')

    expect(promptText).toContain('immersive elizaOS-compatible character persona fields')
    expect(promptText).toContain(
      'Do not introduce app, project, collection, brand, or universe names unless the owner explicitly asks'
    )
    expect(promptText).toContain('Untrusted character context:')
    expect(promptText).toContain('Preserve the established character identity')
    expect(promptText).toContain('settings.metadata.wagdieUser')
    expect(promptText).toContain(
      'A mysterious character whose story is still being written. Character #4040.'
    )
    expect(promptText).not.toContain('WAGDIE persona boilerplate')
    expect(promptText).not.toContain('Untrusted WAGDIE character context')
    expect(promptText).not.toContain('Preserve WAGDIE identity')
    expect(promptText).not.toContain('WAGDIE universe')
    expect(promptText).not.toContain('world of WAGDIE')
  })
})
