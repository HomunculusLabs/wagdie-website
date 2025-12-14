'use client'

import { useCallback, useEffect, useReducer, useRef } from 'react'
import type { Dispatch, MutableRefObject } from 'react'
import type { EditorMode, Location } from '@/lib/types/map'

export interface MapEditorState {
  mode: EditorMode
  locations: Location[]
  selectedLocationId: string | null
  pendingCoordinates: { x: number; y: number } | null
  isLoading: boolean
  isSaving: boolean
  error: string | null
}

type MapEditorAction =
  | { type: 'MODE_VIEW' }
  | { type: 'MODE_CREATE' }
  | { type: 'MODE_SET_INTERNAL'; mode: EditorMode }
  | { type: 'EXIT_EDIT_TO_VIEW_KEEP_PENDING' }
  | { type: 'SELECTION_CLEAR' }
  | { type: 'SELECTION_SET'; locationId: string | null }
  | { type: 'SELECTION_SET_FOR_EDIT'; locationId: string }
  | { type: 'PENDING_COORDINATES_SET'; coords: { x: number; y: number } | null }
  | { type: 'LOCATIONS_SET'; locations: Location[] }
  | { type: 'LOCATION_ADDED'; location: Location }
  | { type: 'LOCATION_UPDATED'; location: Location }
  | { type: 'LOCATION_DELETED'; id: string }
  | { type: 'IS_LOADING_SET'; value: boolean }
  | { type: 'IS_SAVING_SET'; value: boolean }
  | { type: 'ERROR_SET'; error: string | null }

const initialState: MapEditorState = {
  mode: 'view',
  locations: [],
  selectedLocationId: null,
  pendingCoordinates: null,
  isLoading: true,
  isSaving: false,
  error: null,
}

function mapEditorReducer(state: MapEditorState, action: MapEditorAction): MapEditorState {
  switch (action.type) {
    case 'MODE_VIEW':
      return {
        ...state,
        mode: 'view',
        selectedLocationId: null,
        pendingCoordinates: null,
      }

    case 'MODE_CREATE':
      return {
        ...state,
        mode: 'create',
        selectedLocationId: null,
      }

    case 'MODE_SET_INTERNAL':
      return {
        ...state,
        mode: action.mode,
      }

    case 'EXIT_EDIT_TO_VIEW_KEEP_PENDING':
      return {
        ...state,
        mode: 'view',
        selectedLocationId: null,
      }

    case 'SELECTION_CLEAR':
      return {
        ...state,
        selectedLocationId: null,
      }

    case 'SELECTION_SET':
      return {
        ...state,
        selectedLocationId: action.locationId,
      }

    case 'SELECTION_SET_FOR_EDIT':
      return {
        ...state,
        selectedLocationId: action.locationId,
        mode: 'edit',
        pendingCoordinates: null,
      }

    case 'PENDING_COORDINATES_SET':
      return {
        ...state,
        pendingCoordinates: action.coords,
      }

    case 'LOCATIONS_SET':
      return {
        ...state,
        locations: action.locations,
      }

    case 'LOCATION_ADDED':
      return {
        ...state,
        locations: [...state.locations, action.location],
      }

    case 'LOCATION_UPDATED':
      return {
        ...state,
        locations: state.locations.map((loc) =>
          loc.id === action.location.id ? action.location : loc
        ),
      }

    case 'LOCATION_DELETED': {
      const nextLocations = state.locations.filter((loc) => loc.id !== action.id)
      const nextSelectedId =
        state.selectedLocationId === action.id ? null : state.selectedLocationId

      return {
        ...state,
        locations: nextLocations,
        selectedLocationId: nextSelectedId,
      }
    }

    case 'IS_LOADING_SET':
      return {
        ...state,
        isLoading: action.value,
      }

    case 'IS_SAVING_SET':
      return {
        ...state,
        isSaving: action.value,
      }

    case 'ERROR_SET':
      return {
        ...state,
        error: action.error,
      }

    default:
      return state
  }
}

export interface MapEditorStateActions {
  setModeView: () => void
  setModeCreate: () => void
  setModeInternal: (mode: EditorMode) => void
  exitEditToViewKeepPending: () => void

  clearSelection: () => void
  setSelectedLocationId: (locationId: string | null) => void
  selectLocationForEdit: (locationId: string) => void

  setPendingCoordinates: (coords: { x: number; y: number } | null) => void

  setLocations: (locations: Location[]) => void
  addLocation: (location: Location) => void
  updateLocation: (location: Location) => void
  removeLocation: (id: string) => void

  setIsLoading: (value: boolean) => void
  setIsSaving: (value: boolean) => void
  setError: (error: string | null) => void
  clearError: () => void
}

export function useMapEditorState(): {
  state: MapEditorState
  stateRef: MutableRefObject<MapEditorState>
  actions: MapEditorStateActions
  dispatch: Dispatch<MapEditorAction>
} {
  const [state, dispatch] = useReducer(mapEditorReducer, initialState)

  const stateRef = useRef(state)
  useEffect(() => {
    stateRef.current = state
  }, [state])

  const setModeView = useCallback(() => dispatch({ type: 'MODE_VIEW' }), [])
  const setModeCreate = useCallback(() => dispatch({ type: 'MODE_CREATE' }), [])
  const setModeInternal = useCallback(
    (mode: EditorMode) => dispatch({ type: 'MODE_SET_INTERNAL', mode }),
    []
  )
  const exitEditToViewKeepPending = useCallback(
    () => dispatch({ type: 'EXIT_EDIT_TO_VIEW_KEEP_PENDING' }),
    []
  )

  const clearSelection = useCallback(() => dispatch({ type: 'SELECTION_CLEAR' }), [])
  const setSelectedLocationId = useCallback(
    (locationId: string | null) => dispatch({ type: 'SELECTION_SET', locationId }),
    []
  )
  const selectLocationForEdit = useCallback(
    (locationId: string) => dispatch({ type: 'SELECTION_SET_FOR_EDIT', locationId }),
    []
  )

  const setPendingCoordinates = useCallback(
    (coords: { x: number; y: number } | null) =>
      dispatch({ type: 'PENDING_COORDINATES_SET', coords }),
    []
  )

  const setLocations = useCallback(
    (locations: Location[]) => dispatch({ type: 'LOCATIONS_SET', locations }),
    []
  )
  const addLocation = useCallback(
    (location: Location) => dispatch({ type: 'LOCATION_ADDED', location }),
    []
  )
  const updateLocation = useCallback(
    (location: Location) => dispatch({ type: 'LOCATION_UPDATED', location }),
    []
  )
  const removeLocation = useCallback(
    (id: string) => dispatch({ type: 'LOCATION_DELETED', id }),
    []
  )

  const setIsLoading = useCallback(
    (value: boolean) => dispatch({ type: 'IS_LOADING_SET', value }),
    []
  )
  const setIsSaving = useCallback(
    (value: boolean) => dispatch({ type: 'IS_SAVING_SET', value }),
    []
  )

  const setError = useCallback(
    (error: string | null) => dispatch({ type: 'ERROR_SET', error }),
    []
  )
  const clearError = useCallback(() => dispatch({ type: 'ERROR_SET', error: null }), [])

  return {
    state,
    stateRef,
    actions: {
      setModeView,
      setModeCreate,
      setModeInternal,
      exitEditToViewKeepPending,

      clearSelection,
      setSelectedLocationId,
      selectLocationForEdit,

      setPendingCoordinates,

      setLocations,
      addLocation,
      updateLocation,
      removeLocation,

      setIsLoading,
      setIsSaving,
      setError,
      clearError,
    },
    dispatch,
  }
}