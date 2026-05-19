import Image from 'next/image';
import Link from 'next/link';
import type {
  LoreCharacter,
  LoreEvent,
  LoreSeason,
} from '@/lib/lore/types';

interface LoreEventCardProps {
  event: LoreEvent;
  season?: LoreSeason;
  characters: LoreCharacter[];
}

const eventKindLabels: Record<LoreEvent['kind'], string> = {
  official: 'Official',
  community: 'Community',
};

const eventCoverImages: Record<string, string> = {
  'genesis-mint': '/images/lore/archive/genesis-mint.jpg',
  'first-citadel-march': '/images/lore/archive/first-citadel-march.jpg',
  'searing-rite': '/images/lore/archive/searing-rite.jpg',
  'pilgrims-of-the-ashen-road': '/images/lore/archive/ashen-road-pilgrims.jpg',
  'ash-cartographer-chart': '/images/lore/archive/ash-cartographer-chart.jpg',
  'rumor-beneath-the-citadel': '/images/lore/archive/rumor-beneath-citadel.jpg',
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

export function LoreEventCard({ event, season, characters }: LoreEventCardProps) {
  const href = eventHref(event);
  const displayDate = formatDate(event.occurredAt ?? event.publishedAt);
  const imageCharacter = characters.find((character) => character.imageUrl);
  const coverImage = eventCoverImages[event.slug] ?? imageCharacter?.imageUrl;
  const coverAlt = eventCoverImages[event.slug]
    ? `${event.title} lore cover`
    : `${imageCharacter?.name}, featured in ${event.title}`;

  return (
    <article className="group overflow-hidden border border-midnight-light/35 bg-black/20 transition-colors hover:border-soul-accent/50">
      <div className="relative aspect-[16/9] overflow-hidden bg-soul-900/60">
        {coverImage ? (
          <Image
            src={coverImage}
            alt={coverAlt}
            fill
            sizes="(min-width: 1280px) 33vw, (min-width: 640px) 50vw, 100vw"
            className="object-cover opacity-85 transition duration-500 group-hover:scale-105 group-hover:opacity-100"
          />
        ) : (
          <div className="flex h-full items-center justify-center bg-gradient-to-br from-soul-900 via-soul-950 to-black px-8 text-center" aria-hidden="true">
            <span className="font-serif text-5xl text-bone/20">{event.title.charAt(0)}</span>
          </div>
        )}
        <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/80 to-transparent" aria-hidden="true" />
      </div>

      <div className="space-y-3 p-4">
        <p className="font-serif text-xs text-neutral-400">
          {displayDate} · {eventKindLabels[event.kind]}{season ? ` · ${season.title}` : ''}
        </p>

        <Link href={href} className="block">
          <h2 className="font-serif text-xl leading-tight text-bone transition-colors group-hover:text-soul-accent md:text-2xl">
            {event.title}
          </h2>
        </Link>

        <p className="line-clamp-2 font-serif text-sm leading-6 text-neutral-300">
          {event.summary}
        </p>

        <Link
          href={href}
          className="inline-flex font-serif text-sm text-soul-accent transition-colors hover:text-bone"
        >
          Read story →
        </Link>
      </div>
    </article>
  );
}
