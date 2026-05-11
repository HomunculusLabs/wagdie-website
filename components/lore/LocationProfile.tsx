import Link from 'next/link';
import { Card, CardContent } from '@/components/ui';
import { EntityChips } from './EntityChips';
import { LoreTimeline } from './LoreTimeline';
import { MediaGallery } from './MediaGallery';
import { SourceList } from './SourceList';
import type {
  LoreCharacter,
  LoreEvent,
  LoreLocation,
  LoreMedia,
  LoreSeason,
  SourceRecord,
} from '@/lib/lore/types';

interface LocationProfileProps {
  location: LoreLocation;
  events: LoreEvent[];
  seasons: LoreSeason[];
  allLocations: LoreLocation[];
  characters: LoreCharacter[];
  media?: LoreMedia[];
  sources?: SourceRecord[];
  sourcesByEventId?: Record<string, SourceRecord[]>;
}

export function LocationProfile({
  location,
  events,
  seasons,
  allLocations,
  characters,
  media = [],
  sources = [],
  sourcesByEventId = {},
}: LocationProfileProps) {
  const officialCount = events.filter((event) => event.kind === 'official').length;
  const communityCount = events.length - officialCount;

  return (
    <main className="container mx-auto space-y-8 px-4 py-8 md:py-10">
      <Link href="/lore" className="text-sm font-serif uppercase tracking-[0.24em] text-neutral-300 transition-colors hover:text-soul-accent">
        ← Back to lore archive
      </Link>

      <Card className="overflow-hidden border-midnight-light/60 bg-soul-900/50">
        <CardContent className="p-0">
          <section className="grid gap-0 lg:grid-cols-[1.2fr_0.8fr]">
            <div className="space-y-6 p-6 md:p-8">
              <div className="space-y-3">
                <p className="text-sm font-serif uppercase tracking-[0.28em] text-soul-accent">
                  Location profile
                </p>
                <h1 className="font-display text-4xl lowercase tracking-widest text-neutral-50 md:text-6xl">
                  {location.name}
                </h1>
                <p className="max-w-3xl font-serif text-xl leading-8 text-neutral-200">
                  {location.summary}
                </p>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <EntityChips
                  label="Aliases"
                  items={location.aliases.map((alias) => ({ label: alias }))}
                  emptyLabel="No aliases"
                />
                <EntityChips
                  label="Tags"
                  items={location.tags.map((tag) => ({ label: `#${tag}`, href: `/lore?keyword=${tag}` }))}
                  emptyLabel="No tags"
                />
              </div>
            </div>

            <aside className="grid grid-cols-3 gap-3 border-t border-midnight-light/50 bg-black/20 p-5 text-center lg:grid-cols-1 lg:border-l lg:border-t-0 md:p-6">
              <div>
                <p className="font-display text-3xl text-bone">{events.length}</p>
                <p className="text-xs font-eskapade uppercase tracking-[0.14em] text-neutral-400">Linked records</p>
              </div>
              <div>
                <p className="font-display text-3xl text-soul-accent">{officialCount}</p>
                <p className="text-xs font-eskapade uppercase tracking-[0.14em] text-neutral-400">Official</p>
              </div>
              <div>
                <p className="font-display text-3xl text-sky-300">{communityCount}</p>
                <p className="text-xs font-eskapade uppercase tracking-[0.14em] text-neutral-400">Community</p>
              </div>
            </aside>
          </section>
        </CardContent>
      </Card>

      {media.length > 0 && <MediaGallery media={media} title="Location media" />}

      <section className="grid gap-6 lg:grid-cols-[0.7fr_1.3fr]">
        <aside className="space-y-5 border border-midnight-light/50 bg-soul-900/40 p-5 md:p-6">
          <div>
            <p className="text-sm font-serif uppercase tracking-[0.28em] text-soul-accent">
              Archive context
            </p>
            <h2 className="mt-2 font-display text-2xl lowercase tracking-widest text-neutral-50">
              Place in the lore
            </h2>
          </div>
          <p className="font-serif text-base leading-7 text-neutral-200">
            {location.description ?? location.summary}
          </p>
          <p className="font-serif text-base leading-7 text-neutral-200">
            This page gathers every official and community record that references {location.name}, ordered by the shared lore timeline.
          </p>
        </aside>

        <section className="space-y-4">
          <div>
            <p className="text-sm font-serif uppercase tracking-[0.06em] text-soul-accent">
              Appears in lore
            </p>
            <h2 className="mt-2 font-display text-2xl lowercase tracking-widest text-neutral-50">
              {events.length} linked {events.length === 1 ? 'record' : 'records'}
            </h2>
          </div>

          {events.length > 0 ? (
            <LoreTimeline
              items={events}
              seasons={seasons}
              locations={allLocations}
              characters={characters}
              sourcesByEventId={sourcesByEventId}
            />
          ) : (
            <div className="border border-midnight-light/50 bg-black/20 p-6 font-serif text-base text-neutral-200">
              No lore events are currently linked to this location.
            </div>
          )}
        </section>
      </section>

      {sources.length > 0 && <SourceList sources={sources} title="Location sources" />}
    </main>
  );
}
