import Link from 'next/link';
import { Card, CardContent } from '@/components/ui';
import { AppearedInTimeline } from './AppearedInTimeline';
import { CanonizationPath } from './CanonizationPath';
import { CanonStatusBadge } from './CanonStatusBadge';
import { CanonWorkflowSummary } from './CanonWorkflowSummary';
import { CharacterPortrait } from './CharacterPortrait';
import { EntityChips } from './EntityChips';
import { MediaGallery } from './MediaGallery';
import { SourceList } from './SourceList';
import type {
  LoreCharacter,
  LoreEvent,
  LoreLocation,
  LoreMedia,
  LoreResolvedEntity,
  LoreSeason,
  SourceRecord,
} from '@/lib/lore/types';

interface LoreEventDetailProps {
  event: LoreEvent;
  season?: LoreSeason;
  locations: LoreLocation[];
  characters: LoreCharacter[];
  relatedEntities: LoreResolvedEntity[];
  sources: SourceRecord[];
  media: LoreMedia[];
  relatedEvents: LoreEvent[];
  seasons: LoreSeason[];
  allLocations: LoreLocation[];
  communityContext?: boolean;
}

const eventKindLabels: Record<LoreEvent['kind'], string> = {
  official: 'Official record',
  community: 'Community record',
};

const formatDate = (dateString?: string) => {
  if (!dateString) {
    return 'Undated';
  }

  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(dateString));
};

const relatedEntityHref = (entity: LoreResolvedEntity) => {
  if (!entity.slug) {
    return undefined;
  }

  if (entity.kind === 'character') {
    return `/lore/characters/${entity.slug}`;
  }

  if (entity.kind === 'location') {
    return `/lore/locations/${entity.slug}`;
  }

  if (entity.kind === 'event') {
    return `/lore?keyword=${entity.slug}`;
  }

  return undefined;
};

export function LoreEventDetail({
  event,
  season,
  locations,
  characters,
  relatedEntities,
  sources,
  media,
  relatedEvents,
  seasons,
  allLocations,
  communityContext = false,
}: LoreEventDetailProps) {
  const occurredAt = formatDate(event.occurredAt ?? event.publishedAt);

  return (
    <main className="container mx-auto max-w-7xl space-y-10 px-6 py-8 md:py-12">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link href="/lore" className="text-sm font-serif uppercase tracking-[0.06em] text-neutral-200 transition-colors hover:text-soul-accent">
          ← Back to lore archive
        </Link>
        <Link href={event.kind === 'official' ? '/lore?canonStatus=canon' : '/lore?season=community-chronicles'} className="text-sm font-serif uppercase tracking-[0.06em] text-neutral-200 transition-colors hover:text-soul-accent">
          Browse related archive context
        </Link>
      </div>

      <Card className="overflow-hidden border-midnight-light/60 bg-soul-900/50">
        <CardContent className="p-0">
          <article className="relative">
            <div className={`absolute left-0 top-0 h-full w-1 ${event.kind === 'official' ? 'bg-gradient-to-b from-soul-accent via-soul-accent/20 to-transparent' : 'bg-gradient-to-b from-sky-300 via-sky-300/20 to-transparent'}`} />
            <div className="space-y-6 p-6 pl-8 md:p-8 md:pl-10">
              <div className="flex flex-wrap items-center gap-2">
                <span className={`border px-2.5 py-1 text-sm font-serif uppercase tracking-[0.06em] ${event.kind === 'official' ? 'border-soul-accent/40 bg-soul-accent/10 text-soul-accent' : 'border-sky-400/40 bg-sky-400/10 text-sky-300'}`}>
                  {eventKindLabels[event.kind]}
                </span>
                <CanonStatusBadge status={event.canon.status} stageId={event.canon.stageId} />
              </div>

              {communityContext && (
                <div className="border border-sky-400/30 bg-sky-400/10 p-4 font-serif text-base leading-7 text-sky-100">
                  This is a community-originated archive record. Its canon workflow is shown explicitly so preserved community material, review candidates, disputes, and approved canon are not confused.
                  {event.canon.status !== 'canon' && ' This record is not fully accepted canon.'}
                </div>
              )}

              <CanonWorkflowSummary canon={event.canon} variant="detail" />

              <div className="space-y-4">
                <p className="text-sm font-serif uppercase tracking-[0.06em] text-neutral-200">
                  {season?.title ?? 'Unseasoned'} / {occurredAt} / Order {event.timelineOrder}
                </p>
                <h1 className="font-display text-4xl lowercase tracking-wide text-neutral-50 md:text-5xl">
                  {event.title}
                </h1>
                <p className="max-w-4xl font-serif text-2xl leading-9 text-neutral-100">
                  {event.summary}
                </p>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <div className="border border-midnight-light/50 bg-black/20 p-4">
                  <p className="text-sm font-serif uppercase tracking-[0.06em] text-neutral-200">Season</p>
                  <p className="mt-2 font-serif text-base text-neutral-200">{season?.title ?? 'Unseasoned'}</p>
                  {season?.summary && <p className="mt-2 font-serif text-sm leading-6 text-neutral-200">{season.summary}</p>}
                </div>
                <div className="border border-midnight-light/50 bg-black/20 p-4">
                  <p className="text-sm font-serif uppercase tracking-[0.06em] text-neutral-200">Date</p>
                  <p className="mt-2 font-serif text-base text-neutral-200">{occurredAt}</p>
                  {event.publishedAt && <p className="mt-2 font-serif text-sm text-neutral-200">Published: {formatDate(event.publishedAt)}</p>}
                </div>
                <div className="border border-midnight-light/50 bg-black/20 p-4">
                  <p className="text-sm font-serif uppercase tracking-[0.06em] text-neutral-200">Timeline</p>
                  <p className="mt-2 font-serif text-base text-neutral-200">Order {event.timelineOrder}</p>
                  <p className="mt-2 font-serif text-sm text-neutral-200">{event.kind === 'official' ? 'Official route' : 'Community route'}</p>
                </div>
              </div>
            </div>
          </article>
        </CardContent>
      </Card>

      <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_420px]">
        <article className="space-y-5 border border-midnight-light/50 bg-black/30 p-6 md:p-8">
          <p className="text-sm font-serif uppercase tracking-[0.06em] text-soul-accent">
            Chronicle body
          </p>
          <div className="space-y-6 font-serif text-xl leading-9 text-neutral-100">
            {event.body.split('\n').map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </div>
        </article>

        <aside className="space-y-6 border border-midnight-light/50 bg-soul-900/50 p-6 md:p-7">
          <div className="space-y-3">
            <p className="text-sm font-serif uppercase tracking-[0.06em] text-soul-accent">
              Characters
            </p>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
              {characters.map((character) => (
                <CharacterPortrait
                  key={character.id}
                  character={character}
                  href={`/lore/characters/${character.slug}`}
                  size="sm"
                />
              ))}
            </div>
          </div>
          <EntityChips
            label="Locations"
            items={locations.map((location) => ({
              label: location.name,
              href: `/lore/locations/${location.slug}`,
            }))}
          />
          <EntityChips
            label="Related entities"
            items={relatedEntities.map((entity) => ({
              label: entity.name,
              href: relatedEntityHref(entity),
            }))}
            emptyLabel="No additional entities"
          />
        </aside>
      </section>

      <CanonizationPath canon={event.canon} sources={sources} />
      <MediaGallery media={media} />
      <SourceList sources={sources} />

      <section className="space-y-4">
        <div>
          <p className="text-sm font-serif uppercase tracking-[0.06em] text-soul-accent">
            Related navigation
          </p>
          <h2 className="mt-2 font-display text-3xl lowercase tracking-wide text-neutral-50">
            Nearby records
          </h2>
        </div>
        <AppearedInTimeline events={relatedEvents} seasons={seasons} locations={allLocations} />
      </section>
    </main>
  );
}
