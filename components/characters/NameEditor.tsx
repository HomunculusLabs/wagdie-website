'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { validateName } from '@/lib/utils/stat-validation'

interface NameEditorProps {
  name: string
  isOwner: boolean
  isEditMode: boolean
  onChange: (name: string) => void
  className?: string
}

/**
 * NameEditor Component
 * Inline name editor for character names with validation
 * Only shown when owner is in edit mode
 */
export function NameEditor({
  name,
  isOwner,
  isEditMode,
  onChange,
  className = '',
}: NameEditorProps) {
  const [localValue, setLocalValue] = useState(name)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Sync with external name changes
  useEffect(() => {
    setLocalValue(name)
  }, [name])

  // Focus input when entering edit mode
  useEffect(() => {
    if (isEditMode && isOwner && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isEditMode, isOwner])

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    setLocalValue(newValue)

    // Validate
    const result = validateName(newValue)
    if (!result.valid) {
      setError(result.error || 'Invalid name')
    } else {
      setError(null)
      onChange(newValue)
    }
  }, [onChange])

  // Display mode (not editing or not owner)
  if (!isEditMode || !isOwner) {
    return (
      <h2 className={`text-4xl md:text-5xl font-display tracking-wider text-bone lowercase ${className}`}>
        {name?.toLowerCase() || 'unnamed'}
      </h2>
    )
  }

  // Edit mode
  return (
    <div className={className}>
      <input
        ref={inputRef}
        type="text"
        value={localValue}
        onChange={handleChange}
        maxLength={100}
        placeholder="Enter character name..."
        className={`
          w-full bg-midnight/50 border px-4 py-2
          text-3xl md:text-4xl font-display tracking-wider text-bone lowercase
          placeholder:text-mist placeholder:normal-case placeholder:tracking-normal
          focus:outline-none focus:ring-2 focus:ring-soul-accent/50
          ${error ? 'border-blood' : 'border-midnight-light focus:border-soul-accent'}
        `}
        aria-label="Character name"
        aria-invalid={!!error}
        aria-describedby={error ? 'name-error' : undefined}
      />
      {error && (
        <p id="name-error" className="mt-1 text-xs text-red-400 font-medium">
          {error}
        </p>
      )}
      <p className="mt-1 text-md text-neutral-500">
        {localValue.length}/100 characters
      </p>
    </div>
  )
}
