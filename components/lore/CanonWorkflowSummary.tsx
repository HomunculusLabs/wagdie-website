import { getCanonizationProgress } from '@/lib/lore/canonization';
import { CanonStatusBadge } from './CanonStatusBadge';
import type { Canonization } from '@/lib/lore/types';

interface CanonWorkflowSummaryProps {
  canon: Canonization;
  variant?: 'card' | 'detail';
}

const formatDate = (dateString?: string) => {
  if (!dateString) {
    return undefined;
  }

  const normalizedDate = /^\d{4}-\d{2}-\d{2}$/.test(dateString)
    ? `${dateString}T00:00:00.000Z`
    : dateString;
  const date = new Date(normalizedDate);

  if (!Number.isFinite(date.getTime())) {
    return undefined;
  }

  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  }).format(date);
};

export function CanonWorkflowSummary({ canon, variant = 'card' }: CanonWorkflowSummaryProps) {
  const progress = getCanonizationProgress(canon);
  const updatedAt = formatDate(canon.updatedAt);
  const isDetail = variant === 'detail';

  return (
    <section className={`border border-midnight-light/50 bg-black/20 ${isDetail ? 'p-5' : 'p-4'}`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-eskapade uppercase tracking-[0.18em] text-soul-accent">
            Canon workflow
          </p>
          <h3 className={`${isDetail ? 'mt-2 text-2xl' : 'mt-1 text-lg'} font-display lowercase tracking-widest text-neutral-50`}>
            {progress.stage.label}
          </h3>
        </div>
        <CanonStatusBadge status={canon.status} stageId={canon.stageId} compact={!isDetail} />
      </div>

      <p className={`mt-3 font-serif leading-7 text-neutral-200 ${isDetail ? 'text-base' : 'text-sm'}`}>
        {progress.stage.description}
      </p>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 font-serif text-sm uppercase tracking-[0.06em] text-neutral-300">
        <span>{progress.terminal ? 'Terminal state' : `${progress.completedCount}/${progress.totalCount} steps advanced`}</span>
        <span>{progress.percent}%</span>
      </div>
      <div className="mt-2 h-1.5 overflow-hidden bg-neutral-900">
        <div className="h-full bg-soul-accent" style={{ width: `${progress.percent}%` }} />
      </div>

      {updatedAt && (
        <p className="mt-3 text-xs font-serif uppercase tracking-[0.06em] text-neutral-400">
          Updated {updatedAt}
        </p>
      )}
    </section>
  );
}
