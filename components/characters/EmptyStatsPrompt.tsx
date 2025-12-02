'use client'

interface EmptyStatsPromptProps {
  onAssignStats: () => void
  className?: string
}

/**
 * EmptyStatsPrompt Component
 * CTA for characters with no stats assigned
 */
export function EmptyStatsPrompt({
  onAssignStats,
  className = '',
}: EmptyStatsPromptProps) {
  return (
    <div className={`bg-black/40 border border-neutral-700 p-6 text-center ${className}`}>
      <div className="text-4xl mb-4 opacity-30">⚔</div>
      <h3 className="text-lg font-display  tracking-widest text-neutral-300 mb-2">
        No Stats Assigned
      </h3>
      <p className="text-sm text-neutral-500 mb-4">
        This character has no stats yet. Assign stats to bring them to life!
      </p>
      <button
        onClick={onAssignStats}
        className="px-6 py-2 bg-soul-accent/20 border border-soul-accent text-soul-accent font-display  tracking-widest text-sm hover:bg-soul-accent/30 transition-colors"
      >
        Assign Stats
      </button>
    </div>
  )
}
