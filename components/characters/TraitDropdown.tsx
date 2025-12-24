/**
 * TraitDropdown Component
 * Generic dropdown filter for character traits (Armor, Back, Mask, etc.)
 * WAGDIE themed styling
 */

'use client'

import React, { useState, useRef, useEffect } from 'react'
import type { TraitCount } from '@/types/character'

interface TraitDropdownProps {
  /** The trait type label (e.g., "Armor", "Back", "Mask") */
  label: string
  /** Currently selected value */
  value: string | null
  /** Available options with counts */
  options: TraitCount[]
  /** Callback when selection changes */
  onChange: (value: string | null) => void
  /** Disable the dropdown */
  disabled?: boolean
  /** Show loading state */
  isLoading?: boolean
  /** Additional CSS classes */
  className?: string
}

export function TraitDropdown({
  label,
  value,
  options,
  onChange,
  disabled = false,
  isLoading = false,
  className = ''
}: TraitDropdownProps) {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Close on escape key
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsOpen(false)
    }
    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [])

  const selectedOption = options.find(o => o.value === value)
  const displayValue = selectedOption ? selectedOption.value : `All ${label}`

  return (
    <div ref={dropdownRef} className={`relative inline-block ${className}`}>
      <button
        type="button"
        onClick={() => !disabled && !isLoading && setIsOpen(!isOpen)}
        disabled={disabled || isLoading}
        className={`
          flex items-center gap-2 px-3 py-2 min-w-[140px]
          bg-black/40 border rounded-sm
          font-eskapade text-md tracking-wider
          transition-all duration-200
          ${isOpen ? 'border-soul-accent text-soul-accent' : 'border-neutral-700 text-neutral-400'}
          ${disabled || isLoading ? 'opacity-50 cursor-not-allowed' : 'hover:border-neutral-600'}
        `}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label={`Filter by ${label}`}
      >
        {isLoading ? (
          <span className="flex items-center gap-2">
            <svg className="w-3 h-3 animate-spin" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Loading...
          </span>
        ) : (
          <>
            <span className="flex-1 text-left truncate">{displayValue}</span>
            {value && selectedOption && (
              <span className="text-[12px] text-neutral-500">
                ({selectedOption.count})
              </span>
            )}
            <svg
              className={`w-3 h-3 transition-transform ${isOpen ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </>
        )}
      </button>

      {/* Dropdown Menu */}
      {isOpen && !isLoading && (
        <div
          className="absolute z-50 mt-1 w-64 max-h-72 overflow-y-auto
            bg-soul-950 border border-neutral-700 rounded-sm shadow-xl"
          role="listbox"
          aria-label={`${label} options`}
        >
          {/* Clear option */}
          <button
            type="button"
            onClick={() => {
              onChange(null)
              setIsOpen(false)
            }}
            className={`
              w-full px-3 py-2 text-left text-md font-eskapade tracking-wider
              transition-colors hover:bg-neutral-800/50
              ${!value ? 'text-soul-accent bg-soul-accent/10' : 'text-neutral-400'}
            `}
            role="option"
            aria-selected={!value}
          >
            All {label}
          </button>

          <div className="border-t border-neutral-800" />

          {/* Trait options */}
          {options.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => {
                onChange(option.value)
                setIsOpen(false)
              }}
              className={`
                w-full px-3 py-2 text-left text-md font-eskapade
                transition-colors hover:bg-neutral-800/50
                flex items-center justify-between
                ${value === option.value ? 'text-soul-accent bg-soul-accent/10' : 'text-neutral-300'}
              `}
              role="option"
              aria-selected={value === option.value}
            >
              <span className="truncate">{option.value}</span>
              <span className="text-[12px] text-neutral-500 ml-2">
                {option.count}
              </span>
            </button>
          ))}

          {options.length === 0 && (
            <div className="px-3 py-4 text-center text-md text-neutral-500">
              No {label.toLowerCase()} options available
            </div>
          )}
        </div>
      )}
    </div>
  )
}
