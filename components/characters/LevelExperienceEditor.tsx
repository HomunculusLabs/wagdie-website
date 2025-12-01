'use client'

import { useCallback, useState, useEffect } from 'react'
import { STAT_CONSTRAINTS } from '@/lib/utils/stat-validation'

interface LevelExperience {
  level: number | null
  experience: number | null
}

interface LevelExperienceEditorProps {
  stats: LevelExperience
  characterClass?: string | null
  isOwner: boolean
  isEditMode: boolean
  onChange: (stats: LevelExperience) => void
  className?: string
}

/**
 * LevelExperienceEditor Component
 * Editable Level and Experience values
 */
export function LevelExperienceEditor({
  stats,
  characterClass,
  isOwner,
  isEditMode,
  onChange,
  className = '',
}: LevelExperienceEditorProps) {
  const [levelValue, setLevelValue] = useState(stats.level?.toString() || '')
  const [expValue, setExpValue] = useState(stats.experience?.toString() || '')
  const [levelError, setLevelError] = useState<string | null>(null)
  const [expError, setExpError] = useState<string | null>(null)

  // Sync with external changes
  useEffect(() => {
    setLevelValue(stats.level?.toString() || '')
    setExpValue(stats.experience?.toString() || '')
  }, [stats.level, stats.experience])

  const handleLevelChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setLevelValue(value)

    if (value === '') {
      setLevelError(null)
      onChange({ ...stats, level: null })
      return
    }

    const numValue = parseInt(value, 10)
    if (isNaN(numValue)) {
      setLevelError('Must be a number')
      return
    }

    const { min, max } = STAT_CONSTRAINTS.level
    if (numValue < min || numValue > max) {
      setLevelError(`Must be ${min}-${max}`)
    } else {
      setLevelError(null)
      onChange({ ...stats, level: numValue })
    }
  }, [stats, onChange])

  const handleExpChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setExpValue(value)

    if (value === '') {
      setExpError(null)
      onChange({ ...stats, experience: null })
      return
    }

    const numValue = parseInt(value, 10)
    if (isNaN(numValue)) {
      setExpError('Must be a number')
      return
    }

    const { min, max } = STAT_CONSTRAINTS.experience
    if (numValue < min || numValue > max) {
      setExpError(`0-${max.toLocaleString()}`)
    } else {
      setExpError(null)
      onChange({ ...stats, experience: numValue })
    }
  }, [stats, onChange])

  // Display mode
  if (!isEditMode || !isOwner) {
    return (
      <p className={`text-sm font-display uppercase tracking-widest text-soul-accent ${className}`}>
        {characterClass ? `${characterClass} • ` : ''}Level {stats.level ?? 1}
        {stats.experience !== null && stats.experience > 0 && (
          <span className="text-neutral-500 text-xs ml-2">({stats.experience.toLocaleString()} XP)</span>
        )}
      </p>
    )
  }

  // Edit mode
  return (
    <div className={`flex flex-wrap items-center gap-3 ${className}`}>
      {characterClass && (
        <span className="text-sm font-display uppercase tracking-widest text-soul-accent">
          {characterClass} •
        </span>
      )}
      <div className="flex items-center gap-2">
        <label className="text-sm font-display uppercase tracking-widest text-neutral-500">
          Level
        </label>
        <input
          type="number"
          value={levelValue}
          onChange={handleLevelChange}
          min={STAT_CONSTRAINTS.level.min}
          max={STAT_CONSTRAINTS.level.max}
          className={`
            w-16 bg-black/40 border px-2 py-1
            text-sm font-display text-soul-accent text-center
            focus:outline-none focus:ring-1 focus:ring-soul-accent/50
            [appearance:textfield]
            [&::-webkit-outer-spin-button]:appearance-none
            [&::-webkit-inner-spin-button]:appearance-none
            ${levelError ? 'border-red-500' : 'border-neutral-700'}
          `}
          aria-label="Level"
          aria-invalid={!!levelError}
        />
        {levelError && (
          <span className="text-xs text-red-400">{levelError}</span>
        )}
      </div>
      <div className="flex items-center gap-2">
        <label className="text-sm font-display uppercase tracking-widest text-neutral-500">
          XP
        </label>
        <input
          type="number"
          value={expValue}
          onChange={handleExpChange}
          min={STAT_CONSTRAINTS.experience.min}
          max={STAT_CONSTRAINTS.experience.max}
          className={`
            w-24 bg-black/40 border px-2 py-1
            text-sm font-display text-neutral-300 text-center
            focus:outline-none focus:ring-1 focus:ring-soul-accent/50
            [appearance:textfield]
            [&::-webkit-outer-spin-button]:appearance-none
            [&::-webkit-inner-spin-button]:appearance-none
            ${expError ? 'border-red-500' : 'border-neutral-700'}
          `}
          aria-label="Experience"
          aria-invalid={!!expError}
        />
        {expError && (
          <span className="text-xs text-red-400">{expError}</span>
        )}
      </div>
    </div>
  )
}
