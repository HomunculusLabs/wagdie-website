import {
  canonStatusLabels,
  getCanonizationStageDefinition,
} from '@/lib/lore/canonization';
import type { CanonStatus, CanonizationStageId } from '@/lib/lore/types';

interface CanonStatusBadgeProps {
  status: CanonStatus;
  stageId?: CanonizationStageId;
  compact?: boolean;
  className?: string;
}

type BadgeTone = 'neutral' | 'info' | 'success' | 'warning' | 'danger' | 'muted';

const statusTones: Record<CanonStatus, BadgeTone> = {
  canon: 'success',
  canonizing: 'warning',
  community: 'info',
  disputed: 'warning',
  non_canon: 'danger',
  archival: 'muted',
};

const toneStyles: Record<BadgeTone, string> = {
  neutral: 'border-neutral-500/40 bg-neutral-500/10 text-neutral-200',
  info: 'border-sky-400/40 bg-sky-400/10 text-sky-300',
  success: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300',
  warning: 'border-amber-400/50 bg-amber-400/10 text-amber-300',
  danger: 'border-blood/50 bg-blood/10 text-blood',
  muted: 'border-violet-400/40 bg-violet-400/10 text-violet-300',
};

export { canonStatusLabels };

export function CanonStatusBadge({
  status,
  stageId,
  compact = false,
  className = '',
}: CanonStatusBadgeProps) {
  const stage = stageId ? getCanonizationStageDefinition(stageId) : undefined;
  const tone = stage?.tone ?? statusTones[status];
  const label = canonStatusLabels[status];
  const stageLabel = stage?.shortLabel;
  const accessibleLabel = stage ? `${label}: ${stage.label}` : label;

  return (
    <span
      className={`inline-flex items-center gap-1.5 border px-2.5 py-1 text-[0.65rem] font-eskapade uppercase tracking-[0.22em] ${toneStyles[tone]} ${className}`}
      aria-label={accessibleLabel}
      title={accessibleLabel}
    >
      <span>{label}</span>
      {stageLabel && !compact && (
        <>
          <span aria-hidden="true" className="opacity-60">/</span>
          <span>{stageLabel}</span>
        </>
      )}
    </span>
  );
}
