'use client'

import { useCallback } from 'react'
import { StatEditor } from './StatEditor'
import { STAT_CONSTRAINTS } from '@/lib/utils/stat-validation'

interface DerivedStats {
  hp: number | null
  max_hp: number | null
  ac: number | null
  speed: number | null
}

interface DerivedStatsEditorProps {
  stats: DerivedStats
  isOwner: boolean
  isEditMode: boolean
  onChange: (stats: DerivedStats) => void
  className?: string
}

/**
 * DerivedStatsEditor Component
 * Editable derived stats: HP, Max HP, AC, Speed
 * Includes HP > Max HP validation warning (non-blocking)
 */
export function DerivedStatsEditor({
  stats,
  isOwner,
  isEditMode,
  onChange,
  className = '',
}: DerivedStatsEditorProps) {
  const handleStatChange = useCallback((key: keyof DerivedStats, value: number | null) => {
    onChange({
      ...stats,
      [key]: value,
    })
  }, [stats, onChange])

  // Check if HP exceeds Max HP (warning, non-blocking)
  const hpWarning = stats.hp !== null && stats.max_hp !== null && stats.hp > stats.max_hp

  // Display mode - quick stat cards
  if (!isEditMode || !isOwner) {
    return (
      <div className={`grid grid-cols-2 sm:grid-cols-4 gap-3 ${className}`}>
        {stats.hp !== null && (
          <div className="bg-black/30 border border-neutral-800 p-3 text-center">
            <p className="text-[10px] font-display  tracking-widest text-neutral-500 mb-1">HP</p>
            <p className="text-xl font-display text-soul-accent">
              {stats.hp}
              {stats.max_hp !== null && (
                <span className="text-neutral-500 text-xs">/{stats.max_hp}</span>
              )}
            </p>
          </div>
        )}
        {stats.ac !== null && (
          <div className="bg-black/30 border border-neutral-800 p-3 text-center">
            <p className="text-[10px] font-display  tracking-widest text-neutral-500 mb-1">AC</p>
            <p className="text-xl font-display text-neutral-200">{stats.ac}</p>
          </div>
        )}
        {stats.speed !== null && (
          <div className="bg-black/30 border border-neutral-800 p-3 text-center">
            <p className="text-[10px] font-display  tracking-widest text-neutral-500 mb-1">Speed</p>
            <p className="text-xl font-display text-neutral-200">
              {stats.speed}<span className="text-xs text-neutral-500"> ft</span>
            </p>
          </div>
        )}
      </div>
    )
  }

  // Edit mode
  return (
    <div className={className}>
      <p className="text-[10px] font-display  tracking-widest text-neutral-500 mb-3">
        Quick Stats <span className="text-neutral-600">(edit mode)</span>
      </p>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatEditor
          label="HP"
          value={stats.hp}
          min={STAT_CONSTRAINTS.hp.min}
          max={STAT_CONSTRAINTS.hp.max}
          isEditMode={isEditMode}
          isOwner={isOwner}
          onChange={(value) => handleStatChange('hp', value)}
        />
        <StatEditor
          label="Max HP"
          value={stats.max_hp}
          min={STAT_CONSTRAINTS.maxHp.min}
          max={STAT_CONSTRAINTS.maxHp.max}
          isEditMode={isEditMode}
          isOwner={isOwner}
          onChange={(value) => handleStatChange('max_hp', value)}
        />
        <StatEditor
          label="AC"
          value={stats.ac}
          min={STAT_CONSTRAINTS.ac.min}
          max={STAT_CONSTRAINTS.ac.max}
          isEditMode={isEditMode}
          isOwner={isOwner}
          onChange={(value) => handleStatChange('ac', value)}
        />
        <StatEditor
          label="Speed"
          value={stats.speed}
          min={STAT_CONSTRAINTS.speed.min}
          max={STAT_CONSTRAINTS.speed.max}
          isEditMode={isEditMode}
          isOwner={isOwner}
          onChange={(value) => handleStatChange('speed', value)}
        />
      </div>
      {hpWarning && (
        <p className="mt-2 text-xs text-amber-400 text-center">
          Warning: HP exceeds Max HP
        </p>
      )}
    </div>
  )
}
