import { CanonStatusBadge } from './CanonStatusBadge';
import type { Canonization, CanonizationStepStatus, SourceRecord } from '@/lib/lore/types';

interface CanonizationPathProps {
  canon: Canonization;
  sources: SourceRecord[];
}

const stepStyles: Record<CanonizationStepStatus, string> = {
  complete: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300',
  current: 'border-soul-accent/50 bg-soul-accent/10 text-soul-accent',
  blocked: 'border-amber-400/50 bg-amber-400/10 text-amber-300',
  not_started: 'border-neutral-700 bg-neutral-900/40 text-neutral-200',
};

const stepLabels: Record<CanonizationStepStatus, string> = {
  complete: 'Complete',
  current: 'Current',
  blocked: 'Blocked',
  not_started: 'Not started',
};

const isNavigableUrl = (url?: string) => {
  return Boolean(url && !url.startsWith('manual://'));
};

const formatDate = (dateString?: string) => {
  if (!dateString) {
    return undefined;
  }

  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(`${dateString}T00:00:00.000Z`));
};

export function CanonizationPath({ canon, sources }: CanonizationPathProps) {
  const sourceById = new Map(sources.map((source) => [source.id, source]));

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <div>
          <p className="text-sm font-serif uppercase tracking-[0.06em] text-soul-accent">
            Canonization path
          </p>
          <h2 className="mt-2 font-display text-2xl lowercase tracking-widest text-neutral-50">
            Status and review trail
          </h2>
        </div>
        <CanonStatusBadge status={canon.status} />
      </div>

      {canon.note && (
        <p className="border-l border-soul-accent/30 pl-3 font-serif text-lg leading-8 text-neutral-100">
          {canon.note}
        </p>
      )}

      <ol className="space-y-3">
        {canon.path.map((step, index) => {
          const date = formatDate(step.date);
          const linkedSources = (step.sourceIds ?? []).flatMap((sourceId) => {
            const source = sourceById.get(sourceId);
            return source ? [source] : [];
          });

          return (
            <li key={`${step.label}-${index}`} className="relative border border-midnight-light/50 bg-black/30 p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-serif text-lg text-neutral-100">{step.label}</p>
                  {date && (
                    <p className="mt-1 text-sm font-serif uppercase tracking-[0.06em] text-neutral-200">
                      {date}
                    </p>
                  )}
                </div>
                <span className={`border px-2.5 py-1 text-sm font-serif uppercase tracking-[0.06em] ${stepStyles[step.status]}`}>
                  {stepLabels[step.status]}
                </span>
              </div>

              {linkedSources.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {linkedSources.map((source) => {
                    const href = source.archivedUrl ?? source.url;

                    return isNavigableUrl(href) ? (
                      <a
                        key={source.id}
                        href={href}
                        target="_blank"
                        rel="noreferrer"
                        className="border border-soul-accent/30 px-2 py-1 text-sm font-serif text-soul-accent transition-colors hover:border-soul-accent hover:text-neutral-50"
                      >
                        Source: {source.title}
                      </a>
                    ) : (
                      <span key={source.id} className="border border-midnight-light/60 px-2 py-1 text-sm font-serif text-neutral-200">
                        Source: {source.title}{href ? ` (${href})` : ''}
                      </span>
                    );
                  })}
                </div>
              )}
            </li>
          );
        })}
      </ol>
    </section>
  );
}
