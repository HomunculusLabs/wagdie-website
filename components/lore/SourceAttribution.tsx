import type { SourceRecord } from '@/lib/lore/types';

interface SourceAttributionProps {
  sources: SourceRecord[];
}

const pluralize = (count: number, singular: string, plural = `${singular}s`) => {
  return `${count} ${count === 1 ? singular : plural}`;
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
  }).format(new Date(dateString));
};

const isNavigableUrl = (url?: string) => {
  return Boolean(url && !url.startsWith('manual://'));
};

function InlineSourceLink({ href, label }: { href?: string; label: string }) {
  if (!href) {
    return null;
  }

  return isNavigableUrl(href) ? (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="border border-soul-accent/30 px-2 py-1 text-xs text-soul-accent transition-colors hover:border-soul-accent hover:text-neutral-50"
    >
      {label}
    </a>
  ) : (
    <span className="border border-midnight-light/60 px-2 py-1 text-xs text-neutral-200">
      {label}: {href}
    </span>
  );
}

export function SourceAttribution({ sources }: SourceAttributionProps) {
  const primarySource = sources[0];

  if (!primarySource) {
    return (
      <div className="rounded-sm border border-midnight-light/40 bg-black/20 p-3 text-sm font-serif text-neutral-200">
        No source attribution records attached.
      </div>
    );
  }

  const capturedAt = formatDate(primarySource.capturedAt);
  const offlineOnly = !primarySource.url && !primarySource.archivedUrl;

  return (
    <div className="rounded-sm border border-midnight-light/40 bg-black/20 p-3">
      <div className="flex flex-wrap items-center gap-2 text-sm font-serif text-neutral-200">
        <span className="uppercase tracking-[0.14em] text-neutral-200">Sources</span>
        <span className="text-soul-accent">{pluralize(sources.length, 'record')}</span>
      </div>

      <div className="mt-2 space-y-2">
        <p className="font-serif text-base text-neutral-200">{primarySource.title}</p>
        <p className="text-sm font-serif uppercase tracking-[0.06em] text-neutral-200">
          {primarySource.platform ?? primarySource.kind} • {primarySource.kind.replace('_', ' ')}
          {primarySource.author ? ` • ${primarySource.author}` : ''}
        </p>
        <p className="font-serif text-sm leading-6 text-neutral-200">
          {primarySource.attribution}
        </p>

        <div className="flex flex-wrap gap-2">
          <InlineSourceLink href={primarySource.url} label="Original" />
          <InlineSourceLink href={primarySource.archivedUrl} label="Archive" />
          {offlineOnly && (
            <span className="border border-violet-400/30 bg-violet-400/10 px-2 py-1 text-sm font-serif text-violet-300">
              Offline/manual archive only
            </span>
          )}
        </div>

        {(capturedAt || primarySource.preservationNote) && (
          <p className="font-serif text-sm leading-6 text-neutral-200">
            {capturedAt ? `Captured: ${capturedAt}. ` : ''}
            {primarySource.preservationNote ?? ''}
          </p>
        )}
      </div>
    </div>
  );
}
