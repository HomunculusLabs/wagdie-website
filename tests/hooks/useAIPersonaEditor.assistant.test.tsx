import { act, renderHook, waitFor } from '@testing-library/react'
import { useAIPersonaEditor } from '@/hooks/useAIPersonaEditor'
import type { AICharacter } from '@/types/eliza'

const character: AICharacter = {
  id: 'record-123',
  externalId: '123',
  name: 'Ash Knight',
  username: 'ash_knight',
  backstory: 'Old backstory',
  system: 'Old system prompt',
  systemPrompt: null,
  bio: ['Old bio'],
  lore: ['Old lore'],
  topics: ['old-topic'],
  adjectives: ['old'],
  style: { all: ['Old all rule'], chat: ['Old chat rule'] },
  exampleMessages: [{ userMessage: 'Old user', assistantMessage: 'Old assistant' }],
  postExamples: ['Old post'],
  templates: { oldTemplate: 'Old template' },
  settings: {
    avatar: 'https://example.com/old.png',
    metadata: { wagdieUser: { existing: 'keep' } },
  },
  knowledge: [{
    id: 'doc-1',
    filename: 'lore.md',
    size: 12,
    mimeType: 'text/markdown',
    uploadedAt: '2026-05-18T00:00:00.000Z',
  }],
  createdAt: '2026-05-18T00:00:00.000Z',
  updatedAt: '2026-05-18T00:00:00.000Z',
}

describe('useAIPersonaEditor assistant support', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('returns a canonical assistant snapshot without editor-only or excluded fields', async () => {
    const { result } = renderHook(() => useAIPersonaEditor('123', character, false))

    await waitFor(() => expect(result.current.state.username).toBe('ash_knight'))

    const snapshot = result.current.getAssistantSnapshot() as Record<string, unknown>

    expect(snapshot).toMatchObject({
      username: 'ash_knight',
      backstory: 'Old backstory',
      system: 'Old system prompt',
      bio: ['Old bio'],
      lore: ['Old lore'],
      topics: ['old-topic'],
      adjectives: ['old'],
      style: { all: ['Old all rule'], chat: ['Old chat rule'] },
      exampleMessages: [{ userMessage: 'Old user', assistantMessage: 'Old assistant' }],
      postExamples: ['Old post'],
      templates: { oldTemplate: 'Old template' },
      settings: {
        avatar: 'https://example.com/old.png',
        metadata: { wagdieUser: { existing: 'keep' } },
      },
    })
    expect(snapshot).not.toHaveProperty('systemPrompt')
    expect(snapshot).not.toHaveProperty('knowledge')
    expect(snapshot).not.toHaveProperty('knowledgeIds')
    expect(snapshot).not.toHaveProperty('hasUnsavedChanges')
    expect(snapshot).not.toHaveProperty('initialized')
    expect(snapshot).not.toHaveProperty('name')
    expect(snapshot).not.toHaveProperty('personality')
  })

  it('stages approved assistant drafts locally while preserving omitted fields', async () => {
    const { result } = renderHook(() => useAIPersonaEditor('123', character, false))

    await waitFor(() => expect(result.current.state.username).toBe('ash_knight'))

    act(() => {
      result.current.applyAssistantDraft({
        username: null,
        system: 'New canonical system prompt',
        bio: [],
        topics: ['new-topic'],
        style: { all: ['New all rule'], post: [] },
        exampleMessages: [],
        settings: {
          avatar: null,
          metadata: { wagdieUser: { assistant: true } },
        },
      })
    })

    expect(result.current.state.username).toBe('')
    expect(result.current.state.systemPrompt).toBe('New canonical system prompt')
    expect(result.current.state.bio).toEqual([])
    expect(result.current.state.topics).toEqual(['new-topic'])
    expect(result.current.state.style).toEqual({ all: ['New all rule'], post: [] })
    expect(result.current.state.exampleMessages).toEqual([])
    expect(result.current.state.settings).toEqual({
      avatar: null,
      metadata: { wagdieUser: { assistant: true } },
    })

    // Omitted fields are preserved.
    expect(result.current.state.backstory).toBe('Old backstory')
    expect(result.current.state.lore).toEqual(['Old lore'])
    expect(result.current.state.adjectives).toEqual(['old'])
    expect(result.current.state.postExamples).toEqual(['Old post'])
    expect(result.current.state.templates).toEqual({ oldTemplate: 'Old template' })
    expect(result.current.state.knowledgeIds).toEqual(['doc-1'])
    expect(result.current.hasUnsavedChanges).toBe(true)

    // Applying only stages the normal editor draft; persistence remains the separate save flow.
    const updateInput = result.current.getUpdateInput()
    expect(updateInput).toMatchObject({
      username: null,
      system: 'New canonical system prompt',
      systemPrompt: 'New canonical system prompt',
      bio: [],
      topics: ['new-topic'],
      exampleMessages: [],
    })

    await waitFor(() => {
      const stored = localStorage.getItem('wagdie-ai-draft-123')
      expect(stored).toBeTruthy()
      expect(JSON.parse(stored || '{}')).toMatchObject({
        tokenId: '123',
        system: 'New canonical system prompt',
        bio: [],
        topics: ['new-topic'],
      })
    })
  })
})
