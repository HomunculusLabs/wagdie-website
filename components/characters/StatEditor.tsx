'use client'

import { useState, useCallback, useEffect } from 'react'

interface StatEditorProps {
  label: string
  value: number | null | undefined
  min: number
  max: number
  onChange: (value: number | null) => void
  isEditMode: boolean
  isOwner: boolean
  className?: string
}

/**
 * StatEditor Component
 * Single stat input with validation and error display
 */
export function StatEditor({
  label,
  value,
  min,
  max,
  onChange,
  isEditMode,
  isOwner,
  className = '',
}: StatEditorProps) {
  const [localValue, setLocalValue] = useState<string>(value?.toString() || '')
  const [error, setError] = useState<string | null>(null)

  // Sync with external value changes
  useEffect(() => {
    setLocalValue(value?.toString() || '')
  }, [value])

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value

    // Allow empty string
    if (inputValue === '') {
      setLocalValue('')
      setError(null)
      onChange(null)
      return
    }

    // Validate numeric input
    const numValue = parseInt(inputValue, 10)
    if (isNaN(numValue)) {
      setLocalValue(inputValue)
      setError('Must be a number')
      return
    }

    setLocalValue(inputValue)

    // Validate range
    if (numValue < min || numValue > max) {
      setError(`Must be ${min}-${max}`)
    } else {
      setError(null)
      onChange(numValue)
    }
  }, [min, max, onChange])

  // Display mode
  if (!isEditMode || !isOwner) {
    return (
      <div className={`bg-black/40 border border-neutral-800 p-3 text-center ${className}`}>
        <p className="text-[10px] font-display  tracking-widest text-neutral-600 mb-1">
          {label}
        </p>
        <p className="text-xl font-display text-neutral-200">
          {value ?? '-'}
        </p>
      </div>
    )
  }

  // Edit mode
  return (
    <div className={`bg-black/40 border p-3 text-center ${error ? 'border-red-500' : 'border-neutral-700'} ${className}`}>
      <label className="text-[10px] font-display  tracking-widest text-neutral-600 mb-1 block">
        {label}
      </label>
      <input
        type="number"
        value={localValue}
        onChange={handleChange}
        min={min}
        max={max}
        className={`
          w-full bg-transparent text-center
          text-xl font-display text-neutral-200
          focus:outline-none
          [appearance:textfield]
          [&::-webkit-outer-spin-button]:appearance-none
          [&::-webkit-inner-spin-button]:appearance-none
        `}
        aria-label={label}
        aria-invalid={!!error}
        aria-describedby={error ? `${label}-error` : undefined}
      />
      {error && (
        <p id={`${label}-error`} className="mt-1 text-[10px] text-red-400">
          {error}
        </p>
      )}
    </div>
  )
}
