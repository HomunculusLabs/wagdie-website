import Link from 'next/link';
import { Card, CardContent } from '@/components/ui';
import { CanonStatusBadge } from './CanonStatusBadge';
import { CanonWorkflowSummary } from './CanonWorkflowSummary';
import { CharacterPortrait } from './CharacterPortrait';
import { EntityChips } from './EntityChips';
import { SourceAttribution } from './SourceAttribution';
import type {
  LoreCharacter,
  LoreEvent,
  LoreLocation,
  LoreSeason,
  SourceRecord,
} from '@/lib/lore/types';

interface LoreEventCardProps {
  event: LoreEvent;
  season?: LoreSeason;
  locations: LoreLocation[];
  characters: LoreCharacter[];
  sources: SourceRecord[];
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
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(dateString));
};

const eventHref = (event: LoreEvent) => {
  return event.kind === 'official'
    ? `/lore/events/${event.slug}`
    : `/lore/community/${event.slug}`;
};

export function LoreEventCard({
  event,
  season,
  locations,
  characters,
  sources,
}: LoreEventCardProps) {
  const href = eventHref(event);
  const displayDate = formatDate(event.occurredAt ?? event.publishedAt);

  return (
    <Card className="overflow-hidden transition-all duration-300 hover:border-soul-accent/50 hover:shadow-soul-glow">
      <CardContent className="p-0">
        <article className="relative">
          <div className="absolute left-0 top-0 h-full w-1 bg-gradient-to-b from-soul-accent/70 via-soul-accent/20 to-transparent" />

          <div className="space-y-5 p-5 pl-7 md:p-6 md:pl-8">
            <div className="flex flex-wrap items-center gap-2">
              <span className={`border px-2.5 py-1 text-sm font-serif uppercase tracking-[0.06em] ${event.kind === 'official' ? 'border-soul-accent/40 bg-soul-accent/10 text-soul-accent' : 'border-sky-400/40 bg-sky-400/10 text-sky-300'}`}>
                {eventKindLabels[event.kind]}
              </span>
              <CanonStatusBadge status={event.canon.status} stageId={event.canon.stageId} />
            </div>

            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm font-serif uppercase tracking-[0.06em] text-neutral-200">
                <span>{season?.title ?? 'Unseasoned'}</span>
                <span className="text-neutral-300">/</span>
                <span>{displayDate}</span>
                <span className="text-neutral-300">/</span>
                <span>Order {event.timelineOrder}</span>
              </div>

              <Link href={href} className="group/title block">
                <h2 className="font-display text-2xl lowercase tracking-widest text-neutral-50 transition-colors group-hover/title:text-soul-accent md:text-3xl">
                  {event.title}
                </h2>
              </Link>

              <p className="max-w-3xl font-serif text-base leading-7 text-neutral-200 md:text-lg">
                {event.summary}
              </p>
            </div>

            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {characters.slice(0, 6).map((character) => (
                <CharacterPortrait
                  key={character.id}
                  character={character}
                  href={`/lore/characters/${character.slug}`}
                  size="sm"
                />
              ))}
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <EntityChips
                label="Characters"
                items={characters.map((character) => ({
                  label: character.name,
                  href: `/lore?character=${character.slug}`,
                }))}
              />
              <EntityChips
                label="Locations"
                items={locations.map((location) => ({
                  label: location.name,
                  href: `/lore/locations/${location.slug}`,
                }))}
              />
            </div>

            <CanonWorkflowSummary canon={event.canon} />

            {event.canon.note && (
              <p className="border-l border-midnight-light/60 pl-3 font-serif text-sm leading-6 text-neutral-200">
                {event.canon.note}
              </p>
            )}

            <SourceAttribution sources={sources} />

            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-midnight-light/40 pt-4">
              <div className="flex flex-wrap gap-2">
                {event.tags.slice(0, 4).map((tag) => (
                  <span key={tag} className="text-sm font-serif uppercase tracking-[0.06em] text-neutral-200">
                    #{tag}
                  </span>
                ))}
              </div>

              <Link
                href={href}
                className="text-sm font-serif uppercase tracking-[0.06em] text-soul-accent transition-colors hover:text-neutral-50"
              >
                Open future detail route →
              </Link>
            </div>
          </div>
        </article>
      </CardContent>
    </Card>
  );
}
