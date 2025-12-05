'use client'

/**
 * useCharacterEditor Hook
 * Consolidated character editing state management.
 * Replaces 6 separate useState calls in character detail page.
 */

import { useReducer, useCallback, useEffect, useMemo } from 'react'
import type { Character } from '@/types/character'

// ============================================================================
// Type Definitions (T007)
// ============================================================================

export interface CoreStats {
  str: number | null
  dex: number | null
  con: number | null
  int: number | null
  wis: number | null
  cha: number | null
}

export interface DerivedStats {
  hp: number | null
  max_hp: number | null
  ac: number | null
  speed: number | null
}

export interface LevelExperience {
  level: number | null
  experience: number | null
}

export interface CharacterEditorState {
  name: string
  story: string
  coreStats: CoreStats
  derivedStats: DerivedStats
  levelExp: LevelExperience
}

// ============================================================================
// Reducer Actions
// ============================================================================

type CharacterEditorAction =
  | { type: 'SET_NAME'; payload: string }
  | { type: 'SET_STORY'; payload: string }
  | { type: 'SET_CORE_STATS'; payload: Partial<CoreStats> }
  | { type: 'SET_DERIVED_STATS'; payload: Partial<DerivedStats> }
  | { type: 'SET_LEVEL_EXP'; payload: Partial<LevelExperience> }
  | { type: 'RESET'; payload: CharacterEditorState }
  | { type: 'INIT'; payload: CharacterEditorState }

// ============================================================================
// Reducer Implementation (T010)
// ============================================================================

function characterEditorReducer(
  state: CharacterEditorState,
  action: CharacterEditorAction
): CharacterEditorState {
  switch (action.type) {
    case 'SET_NAME':
      return { ...state, name: action.payload }
    case 'SET_STORY':
      return { ...state, story: action.payload }
    case 'SET_CORE_STATS':
      return { ...state, coreStats: { ...state.coreStats, ...action.payload } }
    case 'SET_DERIVED_STATS':
      return { ...state, derivedStats: { ...state.derivedStats, ...action.payload } }
    case 'SET_LEVEL_EXP':
      return { ...state, levelExp: { ...state.levelExp, ...action.payload } }
    case 'RESET':
    case 'INIT':
      return action.payload
    default:
      return state
  }
}

// ============================================================================
// Helper Functions
// ============================================================================

const DEFAULT_STATE: CharacterEditorState = {
  name: '',
  story: '',
  coreStats: { str: null, dex: null, con: null, int: null, wis: null, cha: null },
  derivedStats: { hp: null, max_hp: null, ac: null, speed: null },
  levelExp: { level: null, experience: null },
}

function initializeFromCharacter(character: Character | null): CharacterEditorState {
  if (!character) return DEFAULT_STATE

  return {
    name: character.name || character.metadata?.name || '',
    story: character.metadata?.background_story || character.background_story || '',
    coreStats: {
      str: character.str ?? null,
      dex: character.dex ?? null,
      con: character.con ?? null,
      int: character.int ?? null,
      wis: character.wis ?? null,
      cha: character.cha ?? null,
    },
    derivedStats: {
      hp: character.hp ?? null,
      max_hp: character.max_hp ?? null,
      ac: character.ac ?? null,
      speed: character.speed ?? null,
    },
    levelExp: {
      level: character.level ?? null,
      experience: character.experience ?? null,
    },
  }
}

// ============================================================================
// Hook Input/Output Types
// ============================================================================

interface UseCharacterEditorInput {
  character: Character | null
  isLoading: boolean
}

export interface UseCharacterEditorReturn {
  // State
  state: CharacterEditorState
  hasUnsavedChanges: boolean

  // Setters (consolidated)
  setName: (name: string) => void
  setStory: (story: string) => void
  setCoreStats: (stats: Partial<CoreStats>) => void
  setDerivedStats: (stats: Partial<DerivedStats>) => void
  setLevelExp: (data: Partial<LevelExperience>) => void

  // Actions
  reset: () => void
  markSaved: () => void

  // Utility for assigning default stats
  assignDefaultStats: () => void
}

// ============================================================================
// Hook Implementation (T011)
// ============================================================================

export function useCharacterEditor({
  character,
  isLoading,
}: UseCharacterEditorInput): UseCharacterEditorReturn {
  const [state, dispatch] = useReducer(characterEditorReducer, DEFAULT_STATE)

  // Track original state for change detection
  const originalState = useMemo(
    () => initializeFromCharacter(character),
    [character]
  )

  // Initialize state when character loads
  useEffect(() => {
    if (!isLoading && character) {
      dispatch({ type: 'INIT', payload: initializeFromCharacter(character) })
    }
  }, [character, isLoading])

  // Calculate if there are unsaved changes
  const hasUnsavedChanges = useMemo(() => {
    if (!character) return false

    // Compare name
    if (state.name !== originalState.name) return true

    // Compare story
    if (state.story !== originalState.story) return true

    // Compare core stats
    const coreKeys: (keyof CoreStats)[] = ['str', 'dex', 'con', 'int', 'wis', 'cha']
    for (const key of coreKeys) {
      if (state.coreStats[key] !== originalState.coreStats[key]) return true
    }

    // Compare derived stats
    const derivedKeys: (keyof DerivedStats)[] = ['hp', 'max_hp', 'ac', 'speed']
    for (const key of derivedKeys) {
      if (state.derivedStats[key] !== originalState.derivedStats[key]) return true
    }

    // Compare level/experience
    if (state.levelExp.level !== originalState.levelExp.level) return true
    if (state.levelExp.experience !== originalState.levelExp.experience) return true

    return false
  }, [state, originalState, character])

  // Setters with useCallback for stable references
  const setName = useCallback((name: string) => {
    dispatch({ type: 'SET_NAME', payload: name })
  }, [])

  const setStory = useCallback((story: string) => {
    dispatch({ type: 'SET_STORY', payload: story })
  }, [])

  const setCoreStats = useCallback((stats: Partial<CoreStats>) => {
    dispatch({ type: 'SET_CORE_STATS', payload: stats })
  }, [])

  const setDerivedStats = useCallback((stats: Partial<DerivedStats>) => {
    dispatch({ type: 'SET_DERIVED_STATS', payload: stats })
  }, [])

  const setLevelExp = useCallback((data: Partial<LevelExperience>) => {
    dispatch({ type: 'SET_LEVEL_EXP', payload: data })
  }, [])

  // Reset to original character state
  const reset = useCallback(() => {
    dispatch({ type: 'RESET', payload: originalState })
  }, [originalState])

  // After save, re-sync with new character data (called externally after API success)
  const markSaved = useCallback(() => {
    // After successful save, the character prop will update and trigger re-init
    // This is a no-op placeholder for explicit API compatibility
  }, [])

  // Assign default stats (for empty stats prompt)
  const assignDefaultStats = useCallback(() => {
    dispatch({
      type: 'SET_CORE_STATS',
      payload: { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 },
    })
    dispatch({
      type: 'SET_DERIVED_STATS',
      payload: { hp: 10, max_hp: 10, ac: 10, speed: 30 },
    })
    dispatch({
      type: 'SET_LEVEL_EXP',
      payload: { level: 1, experience: 0 },
    })
  }, [])

  return {
    state,
    hasUnsavedChanges,
    setName,
    setStory,
    setCoreStats,
    setDerivedStats,
    setLevelExp,
    reset,
    markSaved,
    assignDefaultStats,
  }
}
