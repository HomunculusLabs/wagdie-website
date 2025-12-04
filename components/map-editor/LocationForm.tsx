'use client'

/**
 * LocationForm Component
 * Form for creating or editing locations
 */

import { useState, useEffect, useCallback } from 'react'
import type { Location, CreateLocationInput, UpdateLocationInput } from '@/lib/types/map'

interface LocationFormProps {
  mode: 'create' | 'edit'
  location?: Location
  coordinates: { x: number; y: number }
  onSave: (data: CreateLocationInput | UpdateLocationInput) => Promise<void>
  onCancel: () => void
  onDelete?: () => void
  isSubmitting: boolean
}

export function LocationForm({
  mode,
  location,
  coordinates,
  onSave,
  onCancel,
  onDelete,
  isSubmitting,
}: LocationFormProps) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [errors, setErrors] = useState<{ name?: string; description?: string }>({})

  // Initialize form with location data in edit mode
  useEffect(() => {
    if (mode === 'edit' && location) {
      setName(location.name)
      setDescription(location.description || '')
    } else {
      setName('')
      setDescription('')
    }
    setErrors({})
  }, [mode, location])

  const validate = useCallback(() => {
    const newErrors: { name?: string; description?: string } = {}

    if (!name.trim()) {
      newErrors.name = 'Name is required'
    } else if (name.trim().length > 200) {
      newErrors.name = 'Name cannot exceed 200 characters'
    }

    if (description.length > 2000) {
      newErrors.description = 'Description cannot exceed 2000 characters'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }, [name, description])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validate()) return

    try {
      if (mode === 'create') {
        await onSave({
          name: name.trim(),
          description: description.trim() || undefined,
          coordinates,
        } as CreateLocationInput)
      } else {
        // Only include changed fields for update
        const updates: UpdateLocationInput = {}

        if (name.trim() !== location?.name) {
          updates.name = name.trim()
        }

        if ((description.trim() || undefined) !== (location?.description || undefined)) {
          updates.description = description.trim() || undefined
        }

        // Check if coordinates changed
        const existingCoords = location?.metadata?.coordinates
        if (
          existingCoords?.x !== coordinates.x ||
          existingCoords?.y !== coordinates.y
        ) {
          updates.coordinates = coordinates
        }

        // Only submit if there are changes
        if (Object.keys(updates).length > 0) {
          await onSave(updates)
        } else {
          onCancel()
        }
      }
    } catch {
      // Error handled by parent
    }
  }

  return (
    <form onSubmit={handleSubmit} className="p-4 bg-soul-shadow border-l border-soul-accent/30">
      <h2 className="font-wagdie text-xl text-soul-accent mb-4">
        {mode === 'create' ? 'New Location' : 'Edit Location'}
      </h2>

      {/* Coordinates display */}
      <div className="mb-4 p-3 bg-abyss rounded border border-soul-accent/20">
        <label className="block text-sm text-soul-mist mb-1">Coordinates</label>
        <div className="font-mono text-soul-bone">
          X: {Math.round(coordinates.x)}, Y: {Math.round(coordinates.y)}
        </div>
      </div>

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
            w-full px-3 py-2 bg-abyss border rounded font-wagdie
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

      {/* Actions */}
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={isSubmitting}
          className="
            flex-1 px-4 py-2 bg-soul-accent text-abyss font-wagdie rounded
            hover:bg-soul-accent/80 transition-colors
            disabled:opacity-50 disabled:cursor-not-allowed
          "
        >
          {isSubmitting ? 'Saving...' : 'Save'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          disabled={isSubmitting}
          className="
            px-4 py-2 bg-abyss text-soul-bone font-wagdie rounded
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
            w-full mt-3 px-4 py-2 bg-transparent text-soul-ember font-wagdie rounded
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
