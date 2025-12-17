'use client'

/**
 * LocationForm Component
 * Form for creating or editing locations
 */

import { useState, useEffect, useCallback } from 'react'
import { Select } from '@/components/ui'
import type { Location } from '@/lib/types/map'
import {
  validateLocationForm,
  buildLocationFormSubmit,
  isValidForm,
  CREATE_NEW_VALUE,
  type LocationFormSubmit,
  type LocationFormErrors,
} from './locationFormModel'

// Re-export for external consumers
export type { LocationFormSubmit } from './locationFormModel'

interface LocationFormProps {
  mode: 'create' | 'edit'
  location?: Location
  locations?: Location[]
  coordinates: { x: number; y: number }
  onSave: (data: LocationFormSubmit) => Promise<void>
  onCancel: () => void
  onDelete?: () => void
  isSubmitting: boolean
}

export function LocationForm({
  mode,
  location,
  locations = [],
  coordinates,
  onSave,
  onCancel,
  onDelete,
  isSubmitting,
}: LocationFormProps) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [selectedLocationId, setSelectedLocationId] = useState<string>(CREATE_NEW_VALUE)
  const [errors, setErrors] = useState<LocationFormErrors>({})

  const isCreateNew = mode === 'create' && selectedLocationId === CREATE_NEW_VALUE
  const isMoveExisting = mode === 'create' && selectedLocationId !== CREATE_NEW_VALUE

  const selectedLocation = isMoveExisting
    ? locations.find((loc) => loc.id === selectedLocationId)
    : undefined

  // Initialize form with location data in edit mode
  useEffect(() => {
    if (mode === 'edit' && location) {
      setName(location.name)
      setDescription(location.description || '')
      setSelectedLocationId(CREATE_NEW_VALUE)
    } else {
      setName('')
      setDescription('')
      setSelectedLocationId(CREATE_NEW_VALUE)
    }
    setErrors({})
  }, [mode, location])

  const validate = useCallback(() => {
    const formState = { name, description, selectedLocationId, coordinates }
    const newErrors = validateLocationForm(mode, formState, locations)
    setErrors(newErrors)
    return isValidForm(newErrors)
  }, [mode, selectedLocationId, name, description, coordinates, locations])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validate()) return

    try {
      const formState = { name, description, selectedLocationId, coordinates }
      const payload = buildLocationFormSubmit(mode, formState, location)

      if (payload) {
        await onSave(payload)
      } else {
        // No changes in edit mode
        onCancel()
      }
    } catch {
      // Error handled by parent
    }
  }

  const handleCancelClick = () => {
    setSelectedLocationId(CREATE_NEW_VALUE)
    setErrors({})
    onCancel()
  }

  const createModeOptions = [
    { value: CREATE_NEW_VALUE, label: 'Create new location' },
    ...locations.map((loc) => ({ value: loc.id, label: loc.name })),
  ]

  return (
    <form onSubmit={handleSubmit} className="p-4 bg-soul-shadow border-l border-soul-accent/30">
      <h2 className="font-display text-xl text-soul-accent mb-4">
        {mode === 'create' ? 'New Location' : 'Edit Location'}
      </h2>

      {/* Coordinates display */}
      <div className="mb-4 p-3 bg-abyss rounded border border-soul-accent/20">
        <label className="block text-sm text-soul-mist mb-1">Coordinates</label>
        <div className="font-mono text-soul-bone">
          X: {Math.round(coordinates.x)}, Y: {Math.round(coordinates.y)}
        </div>
      </div>

      {/* Create mode: choose create new vs move existing */}
      {mode === 'create' && (
        <div className="mb-4">
          <Select
            label="Action"
            value={selectedLocationId}
            onChange={(e) => {
              setSelectedLocationId(e.target.value)
              setErrors((prev) => ({ ...prev, locationId: undefined }))
            }}
            disabled={isSubmitting}
            options={createModeOptions}
          />
          {errors.locationId && (
            <p className="mt-1 text-sm text-soul-ember">
              {errors.locationId}
            </p>
          )}

          {isMoveExisting && (
                <div className="mt-3 p-3 bg-abyss rounded border border-soul-accent/20">
                  <p className="text-sm text-soul-mist">
                    {selectedLocation
                      ? `Moving "${selectedLocation.name}" to the coordinates above.`
                      : 'Moving selected location to the coordinates above.'
                    }
                  </p>
                </div>
          )}
        </div>
      )}

      {/* Name + Description (create_new + edit only) */}
      {(mode === 'edit' || isCreateNew) && (
        <>
          {/* Name field */}
          <div className="mb-4">
            <label htmlFor="location-name" className="block text-sm text-soul-mist mb-1">
              Name <span className="text-soul-ember">*</span>
            </label>
            <input
              id="location-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={isSubmitting}
              className={`
                w-full px-3 py-2 bg-abyss border rounded font-display
                text-soul-bone placeholder-soul-mist/50
                focus:outline-none focus:border-soul-accent
                disabled:opacity-50 disabled:cursor-not-allowed
                ${errors.name ? 'border-soul-ember' : 'border-soul-accent/40'}
              `}
              placeholder="Enter location name"
              aria-describedby={errors.name ? 'name-error' : undefined}
              aria-invalid={!!errors.name}
            />
            {errors.name && (
              <p id="name-error" className="mt-1 text-sm text-soul-ember">
                {errors.name}
              </p>
            )}
          </div>

          {/* Description field */}
          <div className="mb-4">
            <label htmlFor="location-description" className="block text-sm text-soul-mist mb-1">
              Description
            </label>
            <textarea
              id="location-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={isSubmitting}
              rows={4}
              className={`
                w-full px-3 py-2 bg-abyss border rounded
                text-soul-bone placeholder-soul-mist/50
                focus:outline-none focus:border-soul-accent
                disabled:opacity-50 disabled:cursor-not-allowed resize-none
                ${errors.description ? 'border-soul-ember' : 'border-soul-accent/40'}
              `}
              placeholder="Enter location description (optional)"
              aria-describedby={errors.description ? 'description-error' : undefined}
              aria-invalid={!!errors.description}
            />
            {errors.description && (
              <p id="description-error" className="mt-1 text-sm text-soul-ember">
                {errors.description}
              </p>
            )}
            <p className="mt-1 text-xs text-soul-mist/60">
              {description.length}/2000 characters
            </p>
          </div>
        </>
      )}

      {/* Actions */}
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={isSubmitting}
          className="
            flex-1 px-4 py-2 bg-soul-accent text-abyss font-display rounded
            hover:bg-soul-accent/80 transition-colors
            disabled:opacity-50 disabled:cursor-not-allowed
          "
        >
          {isSubmitting ? 'Saving...' : (mode === 'create' && isMoveExisting ? 'Move' : 'Save')}
        </button>
        <button
          type="button"
          onClick={handleCancelClick}
          disabled={isSubmitting}
          className="
            px-4 py-2 bg-abyss text-soul-bone font-display rounded
            border border-soul-accent/60 hover:bg-soul-accent/20 transition-colors
            disabled:opacity-50 disabled:cursor-not-allowed
          "
        >
          Cancel
        </button>
      </div>

      {/* Delete button (edit mode only) */}
      {mode === 'edit' && onDelete && (
        <button
          type="button"
          onClick={onDelete}
          disabled={isSubmitting}
          className="
            w-full mt-3 px-4 py-2 bg-transparent text-soul-ember font-display rounded
            border border-soul-ember/60 hover:bg-soul-ember/20 transition-colors
            disabled:opacity-50 disabled:cursor-not-allowed
          "
        >
          Delete Location
        </button>
      )}
    </form>
  )
}
