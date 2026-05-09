import type { LoreSubmissionStatus, LoreSubmissionVisibility } from '@/types/lore-submission';

const statusLabels: Record<LoreSubmissionStatus, string> = {
  submitted: 'Submitted',
  changes_requested: 'Changes requested',
  public: 'Public community',
  canonized: 'Canonized',
  closed: 'Closed',
};

const statusClasses: Record<LoreSubmissionStatus, string> = {
  submitted: 'border-soul-accent/40 bg-soul-accent/10 text-soul-accent',
  changes_requested: 'border-amber-400/50 bg-amber-500/10 text-amber-200',
  public: 'border-emerald-400/50 bg-emerald-500/10 text-emerald-200',
  canonized: 'border-purple-300/50 bg-purple-500/10 text-purple-200',
  closed: 'border-soul-ember/50 bg-soul-ember/10 text-soul-ember',
};

export interface SubmissionStatusBadgeProps {
  status: LoreSubmissionStatus;
  visibility?: LoreSubmissionVisibility;
  className?: string;
}

export function SubmissionStatusBadge({ status, visibility, className = '' }: SubmissionStatusBadgeProps) {
  const visibilitySuffix = visibility && visibility !== 'pending' ? ` · ${visibility}` : '';

  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-display uppercase tracking-wide ${statusClasses[status]} ${className}`}
    >
      {statusLabels[status]}{visibilitySuffix}
    </span>
  );
}
