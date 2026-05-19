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
  CharacterTemplates,
  ExampleMessage,
  PersonaAssistantEditableDraft,
  SafeCharacterSettings,
  StyleConfig,
  UpdateAICharacterInput,
} from '@/types/eliza'
import { FIELD_LIMITS } from '@/types/eliza'
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
  username: string
  backstory: string
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
  templates: CharacterTemplates
  settings: SafeCharacterSettings
  knowledgeIds: string[]
  // Meta state
  hasUnsavedChanges: boolean
  initialized: boolean
}

export type AIPersonaEditorAction =
  | { type: 'SET_USERNAME'; payload: string }
  | { type: 'SET_BACKSTORY'; payload: string }
  | { type: 'SET_BIO'; payload: string[] }
  | { type: 'SET_LORE'; payload: string[] }
  | { type: 'SET_TOPICS'; payload: string[] }
  | { type: 'SET_ADJECTIVES'; payload: string[] }
  | { type: 'SET_STYLE'; payload: StyleConfig }
  | { type: 'SET_EXAMPLE_MESSAGES'; payload: ExampleMessage[] }
  | { type: 'SET_POST_EXAMPLES'; payload: string[] }
  | { type: 'SET_SYSTEM_PROMPT'; payload: string }
  | { type: 'SET_TEMPLATES'; payload: CharacterTemplates }
  | { type: 'SET_SETTINGS'; payload: SafeCharacterSettings }
  | { type: 'SET_KNOWLEDGE_IDS'; payload: string[] }
  | { type: 'APPLY_ASSISTANT_DRAFT'; payload: PersonaAssistantEditableDraft }
  | { type: 'RESET'; payload?: AICharacter | null }
  | { type: 'LOAD_DRAFT'; payload: Partial<AIPersonaEditorState> }
  | { type: 'INIT_FROM_CHARACTER'; payload: AICharacter }
  | { type: 'MARK_SAVED' }

// ============================================================================
// Default State & Initializer
// ============================================================================

const DEFAULT_STATE: AIPersonaEditorState = {
  username: '',
  backstory: '',
  bio: [''],
  lore: [],
  topics: [],
  adjectives: [],
  style: {},
  exampleMessages: [],
  postExamples: [],
  systemPrompt: '',
  templates: {},
  settings: {},
  knowledgeIds: [],
  hasUnsavedChanges: false,
  initialized: false,
}

function initializeState(character?: AICharacter | null): AIPersonaEditorState {
  if (!character) return DEFAULT_STATE

  return {
    username: character.username || '',
    backstory: character.backstory || '',
    bio: character.bio?.length ? character.bio : [''],
    lore: character.lore || [],
    topics: character.topics || [],
    adjectives: character.adjectives || [],
    style: character.style || {},
    exampleMessages: character.exampleMessages || [],
    postExamples: character.postExamples || [],
    systemPrompt: character.system || character.systemPrompt || '',
    templates: character.templates || {},
    settings: character.settings || {},
    knowledgeIds: character.knowledge?.map((k) => k.id) || [],
    hasUnsavedChanges: false,
    initialized: true,
  }
}

// ============================================================================
// Reducer
// ============================================================================

function hasOwn<T extends object, K extends PropertyKey>(value: T, key: K): value is T & Record<K, unknown> {
  return Object.prototype.hasOwnProperty.call(value, key)
}

const SAFE_KEY_REGEX = /^[A-Za-z0-9_.-]{1,64}$/

function truncate(value: string, max: number): string {
  return value.length > max ? value.slice(0, max) : value
}

function cleanStringList(values: string[], maxItems: number, maxLength: number): string[] {
  return values
    .filter((value): value is string => typeof value === 'string')
    .map((value) => truncate(value.trim(), maxLength))
    .filter(Boolean)
    .slice(0, maxItems)
}

function cleanStyle(style: StyleConfig): StyleConfig {
  return {
    ...(style.all !== undefined ? { all: cleanStringList(style.all, FIELD_LIMITS.maxStyleRules, FIELD_LIMITS.styleRule) } : {}),
    ...(style.chat !== undefined ? { chat: cleanStringList(style.chat, FIELD_LIMITS.maxStyleRules, FIELD_LIMITS.styleRule) } : {}),
    ...(style.post !== undefined ? { post: cleanStringList(style.post, FIELD_LIMITS.maxStyleRules, FIELD_LIMITS.styleRule) } : {}),
  }
}

function cleanExampleMessages(messages: ExampleMessage[]): ExampleMessage[] {
  return messages
    .map((message) => ({
      userMessage: truncate((message.userMessage || '').trim(), FIELD_LIMITS.userMessageExample),
      assistantMessage: truncate((message.assistantMessage || '').trim(), FIELD_LIMITS.assistantMessageExample),
    }))
    .filter((message) => message.userMessage && message.assistantMessage)
    .slice(0, FIELD_LIMITS.maxExampleMessages)
}

function cleanTemplates(templates: CharacterTemplates): CharacterTemplates {
  return Object.fromEntries(
    Object.entries(templates)
      .map(([key, value]) => [key.trim(), value] as const)
      .filter(([key, value]) => SAFE_KEY_REGEX.test(key) && typeof value === 'string')
      .map(([key, value]) => [key, truncate(value, FIELD_LIMITS.templateBody)])
      .slice(0, FIELD_LIMITS.maxTemplates)
  )
}

function cleanWagdieUserMetadata(
  metadata: SafeCharacterSettings['metadata']
): SafeCharacterSettings['metadata'] | undefined {
  if (!metadata || !hasOwn(metadata, 'wagdieUser')) return undefined
  if (metadata.wagdieUser === null) return { wagdieUser: null }

  const wagdieUser = metadata.wagdieUser
  if (!wagdieUser || typeof wagdieUser !== 'object' || Array.isArray(wagdieUser)) {
    return { wagdieUser: null }
  }

  const cleaned = Object.fromEntries(
    Object.entries(wagdieUser)
      .filter(([key, value]) => (
        SAFE_KEY_REGEX.test(key) &&
        (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean' || value === null)
      ))
      .map(([key, value]) => [
        key,
        typeof value === 'string' ? truncate(value, FIELD_LIMITS.metadataStringValue) : value,
      ])
      .slice(0, FIELD_LIMITS.maxMetadataKeys)
  )

  return { wagdieUser: Object.keys(cleaned).length > 0 ? cleaned : null }
}

function cloneStyle(style: StyleConfig): StyleConfig {
  return {
    ...(style.all !== undefined ? { all: [...style.all] } : {}),
    ...(style.chat !== undefined ? { chat: [...style.chat] } : {}),
    ...(style.post !== undefined ? { post: [...style.post] } : {}),
  }
}

function cloneSettings(settings: SafeCharacterSettings): SafeCharacterSettings {
  return {
    ...(hasOwn(settings, 'avatar') ? { avatar: settings.avatar } : {}),
    ...(settings.metadata
      ? {
          metadata: {
            ...(hasOwn(settings.metadata, 'wagdieUser')
              ? {
                  wagdieUser: settings.metadata.wagdieUser
                    ? { ...settings.metadata.wagdieUser }
                    : settings.metadata.wagdieUser,
                }
              : {}),
          },
        }
      : {}),
  }
}

function mergeAssistantSettings(
  current: SafeCharacterSettings,
  draftSettings: SafeCharacterSettings
): SafeCharacterSettings {
  const next: SafeCharacterSettings = cloneSettings(current)

  if (hasOwn(draftSettings, 'avatar')) {
    next.avatar = draftSettings.avatar
  }

  if (draftSettings.metadata && hasOwn(draftSettings.metadata, 'wagdieUser')) {
    next.metadata = {
      ...(next.metadata || {}),
      wagdieUser: draftSettings.metadata.wagdieUser
        ? { ...draftSettings.metadata.wagdieUser }
        : draftSettings.metadata.wagdieUser,
    }
  }

  return next
}

function applyAssistantDraftToState(
  state: AIPersonaEditorState,
  draft: PersonaAssistantEditableDraft
): AIPersonaEditorState {
  return {
    ...state,
    ...(hasOwn(draft, 'username') ? { username: draft.username || '' } : {}),
    ...(hasOwn(draft, 'backstory') ? { backstory: draft.backstory || '' } : {}),
    ...(hasOwn(draft, 'system') ? { systemPrompt: draft.system || '' } : {}),
    ...(hasOwn(draft, 'bio') && draft.bio !== undefined ? { bio: [...draft.bio] } : {}),
    ...(hasOwn(draft, 'lore') && draft.lore !== undefined ? { lore: [...draft.lore] } : {}),
    ...(hasOwn(draft, 'topics') && draft.topics !== undefined ? { topics: [...draft.topics] } : {}),
    ...(hasOwn(draft, 'adjectives') && draft.adjectives !== undefined ? { adjectives: [...draft.adjectives] } : {}),
    ...(hasOwn(draft, 'style') && draft.style !== undefined ? { style: cloneStyle(draft.style) } : {}),
    ...(hasOwn(draft, 'exampleMessages') && draft.exampleMessages !== undefined
      ? {
          exampleMessages: draft.exampleMessages.map((message) => ({ ...message })),
        }
      : {}),
    ...(hasOwn(draft, 'postExamples') && draft.postExamples !== undefined
      ? { postExamples: [...draft.postExamples] }
      : {}),
    ...(hasOwn(draft, 'templates') && draft.templates !== undefined
      ? { templates: { ...draft.templates } }
      : {}),
    ...(hasOwn(draft, 'settings') && draft.settings !== undefined
      ? { settings: mergeAssistantSettings(state.settings, draft.settings) }
      : {}),
    hasUnsavedChanges: true,
    initialized: true,
  }
}

function aiPersonaEditorReducer(
  state: AIPersonaEditorState,
  action: AIPersonaEditorAction
): AIPersonaEditorState {
  switch (action.type) {
    case 'SET_USERNAME':
      return { ...state, username: action.payload, hasUnsavedChanges: true }
    case 'SET_BACKSTORY':
      return { ...state, backstory: action.payload, hasUnsavedChanges: true }
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
    case 'SET_TEMPLATES':
      return { ...state, templates: action.payload, hasUnsavedChanges: true }
    case 'SET_SETTINGS':
      return { ...state, settings: action.payload, hasUnsavedChanges: true }
    case 'SET_KNOWLEDGE_IDS':
      return { ...state, knowledgeIds: action.payload, hasUnsavedChanges: true }
    case 'APPLY_ASSISTANT_DRAFT':
      return applyAssistantDraftToState(state, action.payload)
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
  /** Update username */
  setUsername: (value: string) => void
  /** Update backstory */
  setBackstory: (value: string) => void
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
  /** Update templates */
  setTemplates: (value: CharacterTemplates) => void
  /** Update safe settings */
  setSettings: (value: SafeCharacterSettings) => void
  /** Update knowledge IDs */
  setKnowledgeIds: (value: string[]) => void
  /** Reset state to match character or empty */
  resetState: (character?: AICharacter | null) => void
  /** Discard draft and reset to character state */
  discardDraft: () => void
  /** Get canonical assistant-safe editor snapshot */
  getAssistantSnapshot: () => PersonaAssistantEditableDraft
  /** Stage an approved assistant draft in local editor state only */
  applyAssistantDraft: (draft: PersonaAssistantEditableDraft) => void
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
            username: draft.username || '',
            backstory: draft.backstory || '',
            bio: draft.bio || [''],
            lore: draft.lore || [],
            topics: draft.topics || [],
            adjectives: draft.adjectives || [],
            style: draft.style || {},
            exampleMessages: draft.exampleMessages || [],
            postExamples: draft.postExamples || [],
            systemPrompt: draft.system || draft.systemPrompt || '',
            templates: draft.templates || {},
            settings: draft.settings || {},
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
      username: state.username,
      backstory: state.backstory,
      bio: state.bio,
      lore: state.lore,
      topics: state.topics,
      adjectives: state.adjectives,
      style: state.style,
      exampleMessages: state.exampleMessages,
      postExamples: state.postExamples,
      system: state.systemPrompt,
      systemPrompt: state.systemPrompt,
      templates: state.templates,
      settings: state.settings,
      knowledgeIds: state.knowledgeIds,
      savedAt: new Date().toISOString(),
    }

    localStorage.setItem(getDraftKey(tokenId), JSON.stringify(draft))
  }, [state, tokenId])

  // Dispatch-wrapped setters (stable references via useCallback)
  const setUsername = useCallback((value: string) => dispatch({ type: 'SET_USERNAME', payload: value }), [])
  const setBackstory = useCallback((value: string) => dispatch({ type: 'SET_BACKSTORY', payload: value }), [])
  const setBio = useCallback((value: string[]) => dispatch({ type: 'SET_BIO', payload: value }), [])
  const setLore = useCallback((value: string[]) => dispatch({ type: 'SET_LORE', payload: value }), [])
  const setTopics = useCallback((value: string[]) => dispatch({ type: 'SET_TOPICS', payload: value }), [])
  const setAdjectives = useCallback((value: string[]) => dispatch({ type: 'SET_ADJECTIVES', payload: value }), [])
  const setStyle = useCallback((value: StyleConfig) => dispatch({ type: 'SET_STYLE', payload: value }), [])
  const setExampleMessages = useCallback((value: ExampleMessage[]) => dispatch({ type: 'SET_EXAMPLE_MESSAGES', payload: value }), [])
  const setPostExamples = useCallback((value: string[]) => dispatch({ type: 'SET_POST_EXAMPLES', payload: value }), [])
  const setSystemPrompt = useCallback((value: string) => dispatch({ type: 'SET_SYSTEM_PROMPT', payload: value }), [])
  const setTemplates = useCallback((value: CharacterTemplates) => dispatch({ type: 'SET_TEMPLATES', payload: value }), [])
  const setSettings = useCallback((value: SafeCharacterSettings) => dispatch({ type: 'SET_SETTINGS', payload: value }), [])
  const setKnowledgeIds = useCallback((value: string[]) => dispatch({ type: 'SET_KNOWLEDGE_IDS', payload: value }), [])

  const getAssistantSnapshot = useCallback((): PersonaAssistantEditableDraft => ({
    username: state.username || null,
    backstory: state.backstory || null,
    system: state.systemPrompt || null,
    bio: [...state.bio],
    lore: [...state.lore],
    topics: [...state.topics],
    adjectives: [...state.adjectives],
    style: cloneStyle(state.style),
    exampleMessages: state.exampleMessages.map((message) => ({ ...message })),
    postExamples: [...state.postExamples],
    templates: { ...state.templates },
    settings: cloneSettings(state.settings),
  }), [state])

  const applyAssistantDraft = useCallback((draft: PersonaAssistantEditableDraft) => {
    dispatch({ type: 'APPLY_ASSISTANT_DRAFT', payload: draft })
  }, [])

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
    const current = aiCharacterRef.current
    const username = state.username.trim()
    const backstory = state.backstory.trim()
    const system = state.systemPrompt.trim()
    const avatar = state.settings.avatar?.trim()
    const metadata = cleanWagdieUserMetadata(state.settings.metadata)
    const templates = cleanTemplates(state.templates)

    const settings: SafeCharacterSettings | undefined =
      avatar || metadata || current?.settings?.avatar
        ? {
            ...(avatar || current?.settings?.avatar ? { avatar: avatar ? truncate(avatar, FIELD_LIMITS.settingsAvatar) : null } : {}),
            ...(metadata ? { metadata } : {}),
          }
        : undefined

    return {
      username: username ? truncate(username, FIELD_LIMITS.username) : (current?.username ? null : undefined),
      backstory: backstory ? truncate(backstory, FIELD_LIMITS.backstory) : (current?.backstory ? null : undefined),
      bio: cleanStringList(state.bio, FIELD_LIMITS.maxBioEntries, FIELD_LIMITS.bio),
      lore: cleanStringList(state.lore, FIELD_LIMITS.maxLoreEntries, FIELD_LIMITS.lore),
      topics: cleanStringList(state.topics, FIELD_LIMITS.maxTopics, FIELD_LIMITS.topic),
      adjectives: cleanStringList(state.adjectives, FIELD_LIMITS.maxAdjectives, FIELD_LIMITS.adjective),
      style: cleanStyle(state.style),
      exampleMessages: cleanExampleMessages(state.exampleMessages),
      postExamples: cleanStringList(state.postExamples, FIELD_LIMITS.maxPostExamples, FIELD_LIMITS.postExample),
      system: system ? truncate(system, FIELD_LIMITS.systemPrompt) : (current?.system || current?.systemPrompt ? null : undefined),
      systemPrompt: system ? truncate(system, FIELD_LIMITS.systemPrompt) : (current?.system || current?.systemPrompt ? null : undefined),
      templates: Object.keys(templates).length > 0 ? templates : current?.templates ? {} : undefined,
      settings,
    }
  }, [state])

  // Extract editor state (without meta fields)
  const editorState = {
    username: state.username,
    backstory: state.backstory,
    bio: state.bio,
    lore: state.lore,
    topics: state.topics,
    adjectives: state.adjectives,
    style: state.style,
    exampleMessages: state.exampleMessages,
    postExamples: state.postExamples,
    systemPrompt: state.systemPrompt,
    templates: state.templates,
    settings: state.settings,
    knowledgeIds: state.knowledgeIds,
  }

  return {
    state: editorState,
    hasUnsavedChanges: state.hasUnsavedChanges,
    setUsername,
    setBackstory,
    setBio,
    setLore,
    setTopics,
    setAdjectives,
    setStyle,
    setExampleMessages,
    setPostExamples,
    setSystemPrompt,
    setTemplates,
    setSettings,
    setKnowledgeIds,
    resetState,
    discardDraft,
    getAssistantSnapshot,
    applyAssistantDraft,
    getUpdateInput,
    clearDraft,
  }
}
