/**
 * useAIPersonaEditor Hook
 * Manages local state for the full Eliza persona editor
 * Handles draft persistence, validation, and change tracking
 *
 * Refactored to use useReducer pattern (US4 - Code Complexity Refactor)
 */

'use client'

import { useReducer, useCallback, useEffect, useRef } from 'react'
import type {
  AICharacter,
  DraftAIPersona,
  ExampleMessage,
  StyleConfig,
  UpdateAICharacterInput,
} from '@/types/eliza'
import { migrateDraft } from '@/lib/eliza/migration'

/** Draft storage key prefix */
const DRAFT_KEY_PREFIX = 'wagdie-ai-draft-'

/** Get storage key for a token */
const getDraftKey = (tokenId: string) => `${DRAFT_KEY_PREFIX}${tokenId}`

// ============================================================================
// State & Action Types
// ============================================================================

export interface AIPersonaEditorState {
  // Identity
  bio: string[]
  lore: string[]
  // Behavior
  topics: string[]
  adjectives: string[]
  style: StyleConfig
  // Examples
  exampleMessages: ExampleMessage[]
  postExamples: string[]
  // Advanced
  systemPrompt: string
  knowledgeIds: string[]
  // Meta state
  hasUnsavedChanges: boolean
  initialized: boolean
}

export type AIPersonaEditorAction =
  | { type: 'SET_BIO'; payload: string[] }
  | { type: 'SET_LORE'; payload: string[] }
  | { type: 'SET_TOPICS'; payload: string[] }
  | { type: 'SET_ADJECTIVES'; payload: string[] }
  | { type: 'SET_STYLE'; payload: StyleConfig }
  | { type: 'SET_EXAMPLE_MESSAGES'; payload: ExampleMessage[] }
  | { type: 'SET_POST_EXAMPLES'; payload: string[] }
  | { type: 'SET_SYSTEM_PROMPT'; payload: string }
  | { type: 'SET_KNOWLEDGE_IDS'; payload: string[] }
  | { type: 'RESET'; payload?: AICharacter | null }
  | { type: 'LOAD_DRAFT'; payload: Partial<AIPersonaEditorState> }
  | { type: 'INIT_FROM_CHARACTER'; payload: AICharacter }
  | { type: 'MARK_SAVED' }

// ============================================================================
// Default State & Initializer
// ============================================================================

const DEFAULT_STATE: AIPersonaEditorState = {
  bio: [''],
  lore: [],
  topics: [],
  adjectives: [],
  style: {},
  exampleMessages: [],
  postExamples: [],
  systemPrompt: '',
  knowledgeIds: [],
  hasUnsavedChanges: false,
  initialized: false,
}

function initializeState(character?: AICharacter | null): AIPersonaEditorState {
  if (!character) return DEFAULT_STATE

  return {
    bio: character.bio?.length ? character.bio : [''],
    lore: character.lore || [],
    topics: character.topics || [],
    adjectives: character.adjectives || [],
    style: character.style || {},
    exampleMessages: character.exampleMessages || [],
    postExamples: character.postExamples || [],
    systemPrompt: character.systemPrompt || '',
    knowledgeIds: character.knowledge?.map((k) => k.id) || [],
    hasUnsavedChanges: false,
    initialized: true,
  }
}

// ============================================================================
// Reducer
// ============================================================================

function aiPersonaEditorReducer(
  state: AIPersonaEditorState,
  action: AIPersonaEditorAction
): AIPersonaEditorState {
  switch (action.type) {
    case 'SET_BIO':
      return { ...state, bio: action.payload, hasUnsavedChanges: true }
    case 'SET_LORE':
      return { ...state, lore: action.payload, hasUnsavedChanges: true }
    case 'SET_TOPICS':
      return { ...state, topics: action.payload, hasUnsavedChanges: true }
    case 'SET_ADJECTIVES':
      return { ...state, adjectives: action.payload, hasUnsavedChanges: true }
    case 'SET_STYLE':
      return { ...state, style: action.payload, hasUnsavedChanges: true }
    case 'SET_EXAMPLE_MESSAGES':
      return { ...state, exampleMessages: action.payload, hasUnsavedChanges: true }
    case 'SET_POST_EXAMPLES':
      return { ...state, postExamples: action.payload, hasUnsavedChanges: true }
    case 'SET_SYSTEM_PROMPT':
      return { ...state, systemPrompt: action.payload, hasUnsavedChanges: true }
    case 'SET_KNOWLEDGE_IDS':
      return { ...state, knowledgeIds: action.payload, hasUnsavedChanges: true }
    case 'RESET':
      return initializeState(action.payload)
    case 'LOAD_DRAFT':
      return { ...state, ...action.payload, hasUnsavedChanges: true, initialized: true }
    case 'INIT_FROM_CHARACTER':
      return initializeState(action.payload)
    case 'MARK_SAVED':
      return { ...state, hasUnsavedChanges: false }
    default:
      return state
  }
}

// ============================================================================
// Hook Return Type
// ============================================================================

export interface UseAIPersonaEditorReturn {
  /** Current editor state */
  state: Omit<AIPersonaEditorState, 'hasUnsavedChanges' | 'initialized'>
  /** Whether there are unsaved changes */
  hasUnsavedChanges: boolean
  /** Update bio array */
  setBio: (value: string[]) => void
  /** Update lore array */
  setLore: (value: string[]) => void
  /** Update topics array */
  setTopics: (value: string[]) => void
  /** Update adjectives array */
  setAdjectives: (value: string[]) => void
  /** Update style config */
  setStyle: (value: StyleConfig) => void
  /** Update example messages */
  setExampleMessages: (value: ExampleMessage[]) => void
  /** Update post examples */
  setPostExamples: (value: string[]) => void
  /** Update system prompt */
  setSystemPrompt: (value: string) => void
  /** Update knowledge IDs */
  setKnowledgeIds: (value: string[]) => void
  /** Reset state to match character or empty */
  resetState: (character?: AICharacter | null) => void
  /** Discard draft and reset to character state */
  discardDraft: () => void
  /** Get data formatted for API update */
  getUpdateInput: () => UpdateAICharacterInput
  /** Clear draft from storage */
  clearDraft: () => void
}

// ============================================================================
// Hook Implementation
// ============================================================================

export function useAIPersonaEditor(
  tokenId: string,
  aiCharacter: AICharacter | null | undefined,
  isLoading: boolean
): UseAIPersonaEditorReturn {
  const [state, dispatch] = useReducer(aiPersonaEditorReducer, DEFAULT_STATE)
  const aiCharacterRef = useRef(aiCharacter)
  aiCharacterRef.current = aiCharacter

  // Initialize state from draft or character
  useEffect(() => {
    if (isLoading || state.initialized) return

    const draftKey = getDraftKey(tokenId)
    const savedDraft = localStorage.getItem(draftKey)

    if (savedDraft) {
      try {
        const parsed = JSON.parse(savedDraft)
        const { data: draft } = migrateDraft(parsed)

        dispatch({
          type: 'LOAD_DRAFT',
          payload: {
            bio: draft.bio || [''],
            lore: draft.lore || [],
            topics: draft.topics || [],
            adjectives: draft.adjectives || [],
            style: draft.style || {},
            exampleMessages: draft.exampleMessages || [],
            postExamples: draft.postExamples || [],
            systemPrompt: draft.systemPrompt || '',
            knowledgeIds: draft.knowledgeIds || [],
          },
        })
        return
      } catch {
        localStorage.removeItem(draftKey)
      }
    }

    // Load from AI character or use defaults
    if (aiCharacter) {
      dispatch({ type: 'INIT_FROM_CHARACTER', payload: aiCharacter })
    }
  }, [tokenId, aiCharacter, isLoading, state.initialized])

  // Auto-save draft to localStorage
  useEffect(() => {
    if (!state.hasUnsavedChanges || !state.initialized) return

    const draft: DraftAIPersona = {
      tokenId,
      bio: state.bio,
      lore: state.lore,
      topics: state.topics,
      adjectives: state.adjectives,
      style: state.style,
      exampleMessages: state.exampleMessages,
      postExamples: state.postExamples,
      systemPrompt: state.systemPrompt,
      knowledgeIds: state.knowledgeIds,
      savedAt: new Date().toISOString(),
    }

    localStorage.setItem(getDraftKey(tokenId), JSON.stringify(draft))
  }, [state, tokenId])

  // Dispatch-wrapped setters (stable references via useCallback)
  const setBio = useCallback((value: string[]) => dispatch({ type: 'SET_BIO', payload: value }), [])
  const setLore = useCallback((value: string[]) => dispatch({ type: 'SET_LORE', payload: value }), [])
  const setTopics = useCallback((value: string[]) => dispatch({ type: 'SET_TOPICS', payload: value }), [])
  const setAdjectives = useCallback((value: string[]) => dispatch({ type: 'SET_ADJECTIVES', payload: value }), [])
  const setStyle = useCallback((value: StyleConfig) => dispatch({ type: 'SET_STYLE', payload: value }), [])
  const setExampleMessages = useCallback((value: ExampleMessage[]) => dispatch({ type: 'SET_EXAMPLE_MESSAGES', payload: value }), [])
  const setPostExamples = useCallback((value: string[]) => dispatch({ type: 'SET_POST_EXAMPLES', payload: value }), [])
  const setSystemPrompt = useCallback((value: string) => dispatch({ type: 'SET_SYSTEM_PROMPT', payload: value }), [])
  const setKnowledgeIds = useCallback((value: string[]) => dispatch({ type: 'SET_KNOWLEDGE_IDS', payload: value }), [])

  // Reset state to character or empty
  const resetState = useCallback((character?: AICharacter | null) => {
    dispatch({ type: 'RESET', payload: character ?? aiCharacterRef.current })
  }, [])

  // Discard draft and reset
  const discardDraft = useCallback(() => {
    localStorage.removeItem(getDraftKey(tokenId))
    resetState()
  }, [tokenId, resetState])

  // Clear draft from storage
  const clearDraft = useCallback(() => {
    localStorage.removeItem(getDraftKey(tokenId))
    dispatch({ type: 'MARK_SAVED' })
  }, [tokenId])

  // Get data formatted for API update
  const getUpdateInput = useCallback((): UpdateAICharacterInput => {
    return {
      bio: state.bio.filter((b) => b.trim() !== ''),
      lore: state.lore.filter((l) => l.trim() !== ''),
      topics: state.topics.filter((t) => t.trim() !== ''),
      adjectives: state.adjectives.filter((a) => a.trim() !== ''),
      style:
        Object.values(state.style).some((arr) => arr && arr.length > 0)
          ? state.style
          : undefined,
      exampleMessages: state.exampleMessages.length > 0 ? state.exampleMessages : undefined,
      postExamples: state.postExamples.filter((p) => p.trim() !== ''),
      systemPrompt: state.systemPrompt || undefined,
    }
  }, [state])

  // Extract editor state (without meta fields)
  const editorState = {
    bio: state.bio,
    lore: state.lore,
    topics: state.topics,
    adjectives: state.adjectives,
    style: state.style,
    exampleMessages: state.exampleMessages,
    postExamples: state.postExamples,
    systemPrompt: state.systemPrompt,
    knowledgeIds: state.knowledgeIds,
  }

  return {
    state: editorState,
    hasUnsavedChanges: state.hasUnsavedChanges,
    setBio,
    setLore,
    setTopics,
    setAdjectives,
    setStyle,
    setExampleMessages,
    setPostExamples,
    setSystemPrompt,
    setKnowledgeIds,
    resetState,
    discardDraft,
    getUpdateInput,
    clearDraft,
  }
}
