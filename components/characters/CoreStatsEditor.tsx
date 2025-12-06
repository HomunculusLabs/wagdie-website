'use client'

import { useCallback } from 'react'
import { StatEditor } from './StatEditor'
import { STAT_CONSTRAINTS } from '@/lib/utils/stat-validation'
import { ProgressBar } from '@/components/ui'

interface CoreStats {
  str: number | null
  dex: number | null
  con: number | null
  int: number | null
  wis: number | null
  cha: number | null
}

interface CoreStatsEditorProps {
  stats: CoreStats
  isOwner: boolean
  isEditMode: boolean
  onChange: (stats: CoreStats) => void
  className?: string
}

const CORE_STAT_LABELS = [
  { key: 'str' as const, label: 'STR' },
  { key: 'dex' as const, label: 'DEX' },
  { key: 'con' as const, label: 'CON' },
  { key: 'int' as const, label: 'INT' },
  { key: 'wis' as const, label: 'WIS' },
  { key: 'cha' as const, label: 'CHA' },
]

/**
 * CoreStatsEditor Component
 * Groups all 6 core D&D stats with edit capability
 */
export function CoreStatsEditor({
  stats,
  isOwner,
  isEditMode,
  onChange,
  className = '',
}: CoreStatsEditorProps) {
  const { min, max } = STAT_CONSTRAINTS.coreStats

  const handleStatChange = useCallback((key: keyof CoreStats, value: number | null) => {
    onChange({
      ...stats,
      [key]: value,
    })
  }, [stats, onChange])

  // Display mode with progress bars
  if (!isEditMode || !isOwner) {
    return (
      <div className={className}>
        <p className="text-[10px] font-display  tracking-normal text-neutral-500 mb-3">Attributes</p>
        <div className="grid grid-cols-3 gap-2">
          {CORE_STAT_LABELS.map(({ key, label }) => {
            const value = stats[key] ?? 0
            return (
              <div
                key={key}
                className="bg-black/40 border border-neutral-800 p-3 text-center"
              >
                <p className="text-[10px] font-display  tracking-normal text-neutral-600 mb-1">{label}</p>
                <p className="text-xl font-display text-neutral-200 mb-2">{value}</p>
                <ProgressBar value={value} max={20} showValue={false} variant="souls" />
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  // Edit mode
  return (
    <div className={className}>
      <p className="text-[10px] font-display  tracking-normal text-neutral-500 mb-3">
        Attributes <span className="text-neutral-600">(edit mode)</span>
      </p>
      <div className="grid grid-cols-3 gap-2">
        {CORE_STAT_LABELS.map(({ key, label }) => (
          <StatEditor
            key={key}
            label={label}
            value={stats[key]}
            min={min}
            max={max}
            isEditMode={isEditMode}
            isOwner={isOwner}
            onChange={(value) => handleStatChange(key, value)}
          />
        ))}
      </div>
      <p className="my-2 text-md text-neutral-500 text-center">
        Valid range: {min}-{max}
      </p>
    </div>
  )
}
