/**
 * LocationForm Model
 * Pure validation and payload building logic extracted from LocationForm component.
 * No React dependencies - fully testable.
 */

import type { Location, CreateLocationInput, UpdateLocationInput } from '@/lib/types/map'

// ============================================================================
// Types
// ============================================================================

export interface LocationFormErrors {
  name?: string
  description?: string
  locationId?: string
}

export interface LocationFormState {
  name: string
  description: string
  selectedLocationId: string
  coordinates: { x: number; y: number }
}

export type LocationFormSubmit =
  | { kind: 'create_new'; input: CreateLocationInput }
  | { kind: 'move_existing'; locationId: string; input: Pick<UpdateLocationInput, 'coordinates'> }
  | { kind: 'edit_existing'; locationId: string; input: UpdateLocationInput }

export const CREATE_NEW_VALUE = '__new__'

// ============================================================================
// Validation
// ============================================================================

const NAME_MAX_LENGTH = 200
const DESCRIPTION_MAX_LENGTH = 2000

/**
 * Validate name field
 */
function validateName(name: string): string | undefined {
  const trimmed = name.trim()
  if (!trimmed) {
    return 'Name is required'
  }
  if (trimmed.length > NAME_MAX_LENGTH) {
    return `Name cannot exceed ${NAME_MAX_LENGTH} characters`
  }
  return undefined
}

/**
 * Validate description field
 */
function validateDescription(description: string): string | undefined {
  if (description.length > DESCRIPTION_MAX_LENGTH) {
    return `Description cannot exceed ${DESCRIPTION_MAX_LENGTH} characters`
  }
  return undefined
}

/**
 * Validate location ID for move_existing flow
 */
function validateLocationId(
  selectedLocationId: string,
  locations: Location[]
): string | undefined {
  if (!selectedLocationId) {
    return 'Please choose a location to move'
  }
  if (!locations.some((loc) => loc.id === selectedLocationId)) {
    return 'Selected location not found'
  }
  return undefined
}

/**
 * Pure validation for create mode
 */
function validateCreateMode(
  state: LocationFormState,
  locations: Location[]
): LocationFormErrors {
  const errors: LocationFormErrors = {}

  if (state.selectedLocationId === CREATE_NEW_VALUE) {
    // Creating new location
    const nameError = validateName(state.name)
    if (nameError) errors.name = nameError

    const descError = validateDescription(state.description)
    if (descError) errors.description = descError
  } else {
    // Moving existing location
    const idError = validateLocationId(state.selectedLocationId, locations)
    if (idError) errors.locationId = idError
  }

  return errors
}

/**
 * Pure validation for edit mode
 */
function validateEditMode(state: LocationFormState): LocationFormErrors {
  const errors: LocationFormErrors = {}

  const nameError = validateName(state.name)
  if (nameError) errors.name = nameError

  const descError = validateDescription(state.description)
  if (descError) errors.description = descError

  return errors
}

/**
 * Validate location form based on mode
 * Returns empty object if valid, otherwise contains error messages
 */
export function validateLocationForm(
  mode: 'create' | 'edit',
  state: LocationFormState,
  locations: Location[]
): LocationFormErrors {
  return mode === 'create'
    ? validateCreateMode(state, locations)
    : validateEditMode(state)
}

/**
 * Check if validation passed (no errors)
 */
export function isValidForm(errors: LocationFormErrors): boolean {
  return Object.keys(errors).length === 0
}

// ============================================================================
// Payload Building
// ============================================================================

/**
 * Extract coordinates from location metadata (handles both formats)
 */
function getLocationCoordinates(
  location: Location
): { x: number; y: number } | undefined {
  const meta = location.metadata
  if (meta?.coordinates) {
    return meta.coordinates
  }
  if (meta?.center && meta.center.length === 2) {
    return { x: meta.center[0], y: meta.center[1] }
  }
  return undefined
}

/**
 * Build update payload for edit mode (only changed fields)
 */
function buildEditUpdates(
  state: LocationFormState,
  location: Location
): UpdateLocationInput {
  const updates: UpdateLocationInput = {}

  const trimmedName = state.name.trim()
  if (trimmedName !== location.name) {
    updates.name = trimmedName
  }

  const trimmedDesc = state.description.trim() || undefined
  const existingDesc = location.description || undefined
  if (trimmedDesc !== existingDesc) {
    updates.description = trimmedDesc
  }

  const existingCoords = getLocationCoordinates(location)
  if (
    existingCoords?.x !== state.coordinates.x ||
    existingCoords?.y !== state.coordinates.y
  ) {
    updates.coordinates = state.coordinates
  }

  return updates
}

/**
 * Build submit payload for create_new flow
 */
function buildCreateNewPayload(state: LocationFormState): LocationFormSubmit {
  return {
    kind: 'create_new',
    input: {
      name: state.name.trim(),
      description: state.description.trim() || undefined,
      coordinates: state.coordinates,
    },
  }
}

/**
 * Build submit payload for move_existing flow
 */
function buildMoveExistingPayload(state: LocationFormState): LocationFormSubmit {
  return {
    kind: 'move_existing',
    locationId: state.selectedLocationId,
    input: {
      coordinates: state.coordinates,
    },
  }
}

/**
 * Build the form submission payload based on mode
 * Returns null if no changes in edit mode
 */
export function buildLocationFormSubmit(
  mode: 'create' | 'edit',
  state: LocationFormState,
  location?: Location
): LocationFormSubmit | null {
  if (mode === 'create') {
    return state.selectedLocationId === CREATE_NEW_VALUE
      ? buildCreateNewPayload(state)
      : buildMoveExistingPayload(state)
  }

  // Edit mode - requires existing location
  if (!location) {
    return null
  }

  const updates = buildEditUpdates(state, location)

  // Return null if no changes
  if (Object.keys(updates).length === 0) {
    return null
  }

  return {
    kind: 'edit_existing',
    locationId: location.id,
    input: updates,
  }
}
