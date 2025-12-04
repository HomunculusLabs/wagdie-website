'use client'

/**
 * EditorControls Component
 * Toolbar for switching editor modes
 */

import type { EditorMode } from '@/lib/types/map'

interface EditorControlsProps {
  mode: EditorMode
  onModeChange: (mode: 'view' | 'create') => void
  disabled: boolean
}

export function EditorControls({ mode, onModeChange, disabled }: EditorControlsProps) {
  return (
    <div className="flex gap-2 p-4 bg-soul-shadow border-b border-soul-accent/30">
      <button
        onClick={() => onModeChange('view')}
        disabled={disabled}
        className={`
          px-4 py-2 font-wagdie rounded transition-colors
          ${mode === 'view' || mode === 'edit'
            ? 'bg-soul-accent text-abyss'
            : 'bg-abyss text-soul-bone border border-soul-accent/60 hover:bg-soul-accent/20'
          }
          disabled:opacity-50 disabled:cursor-not-allowed
        `}
        aria-pressed={mode === 'view' || mode === 'edit'}
      >
        View Mode
      </button>
      <button
        onClick={() => onModeChange('create')}
        disabled={disabled}
        className={`
          px-4 py-2 font-wagdie rounded transition-colors
          ${mode === 'create'
            ? 'bg-soul-accent text-abyss'
            : 'bg-abyss text-soul-bone border border-soul-accent/60 hover:bg-soul-accent/20'
          }
          disabled:opacity-50 disabled:cursor-not-allowed
        `}
        aria-pressed={mode === 'create'}
      >
        Add Location
      </button>

      {/* Mode indicator */}
      <div className="flex-1 flex items-center justify-end">
        <span className="text-sm text-soul-mist">
          {mode === 'view' && 'Click a pin to edit'}
          {mode === 'create' && 'Click on the map to place a pin'}
          {mode === 'edit' && 'Editing location'}
        </span>
      </div>
    </div>
  )
}
