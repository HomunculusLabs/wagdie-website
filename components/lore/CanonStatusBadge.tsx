import type { CanonStatus } from '@/lib/lore/types';

interface CanonStatusBadgeProps {
  status: CanonStatus;
  className?: string;
}

const statusStyles: Record<CanonStatus, string> = {
  canon: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300',
  canonizing: 'border-soul-accent/50 bg-soul-accent/10 text-soul-accent',
  community: 'border-sky-400/40 bg-sky-400/10 text-sky-300',
  disputed: 'border-amber-400/50 bg-amber-400/10 text-amber-300',
  non_canon: 'border-blood/50 bg-blood/10 text-blood',
  archival: 'border-violet-400/40 bg-violet-400/10 text-violet-300',
};

export const canonStatusLabels: Record<CanonStatus, string> = {
  canon: 'Canon',
  canonizing: 'Canonizing',
  community: 'Community',
  disputed: 'Disputed',
  non_canon: 'Non-canon',
  archival: 'Archival',
};

export function CanonStatusBadge({ status, className = '' }: CanonStatusBadgeProps) {
  return (
    <span
      className={`inline-flex items-center border px-2.5 py-1 text-[0.65rem] font-eskapade uppercase tracking-[0.22em] ${statusStyles[status]} ${className}`}
    >
      {canonStatusLabels[status]}
    </span>
  );
}
