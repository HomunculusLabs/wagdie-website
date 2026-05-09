import Link from 'next/link';
import { LoreFilterBar } from './LoreFilterBar';
import { LoreTimeline } from './LoreTimeline';
import { canonStatusLabels, getCanonizationStageDefinition } from '@/lib/lore/canonization';
import type {
  LoreArchiveFilters,
  LoreCharacter,
  LoreEvent,
  LoreLocation,
  LoreSeason,
} from '@/lib/lore/types';

interface LoreArchiveProps {
  items: LoreEvent[];
  filters: LoreArchiveFilters;
  seasons: LoreSeason[];
  locations: LoreLocation[];
  characters: LoreCharacter[];
}

const hasActiveFilters = (filters: LoreArchiveFilters) => {
  return Boolean(filters.season || filters.location || filters.character || filters.keyword || filters.canonStatus || filters.canonStage);
};

const buildActiveFilterLabels = (
  filters: LoreArchiveFilters,
  seasons: LoreSeason[],
  locations: LoreLocation[],
  characters: LoreCharacter[],
) => {
  const labels: string[] = [];
  const season = seasons.find((item) => item.slug === filters.season || item.id === filters.season);
  const location = locations.find((item) => item.slug === filters.location || item.id === filters.location);
  const character = characters.find((item) => item.slug === filters.character || item.id === filters.character);

  if (filters.season) {
    labels.push(`Season: ${season?.title ?? filters.season}`);
  }

  if (filters.location) {
    labels.push(`Location: ${location?.name ?? filters.location}`);
  }

  if (filters.character) {
    labels.push(`Character: ${character?.name ?? filters.character}`);
  }

  if (filters.keyword) {
    labels.push(`Keyword: “${filters.keyword}”`);
  }

  if (filters.canonStatus) {
    labels.push(`Canon: ${canonStatusLabels[filters.canonStatus]}`);
  }

  if (filters.canonStage) {
    labels.push(`Stage: ${getCanonizationStageDefinition(filters.canonStage).label}`);
  }

  return labels;
};

const summarizeByKind = (items: LoreEvent[]) => {
  const official = items.filter((item) => item.kind === 'official').length;
  const community = items.length - official;

  return { official, community };
};

export function LoreArchive({ items, filters, seasons, locations, characters }: LoreArchiveProps) {
  const activeFilters = buildActiveFilterLabels(filters, seasons, locations, characters);
  const active = hasActiveFilters(filters);
  const { official, community } = summarizeByKind(items);

  return (
    <main className="container mx-auto space-y-8 px-4 py-8 md:py-10">
      <section className="grid gap-4 md:grid-cols-[1.4fr_0.6fr]">
        <div className="border border-midnight-light/50 bg-black/20 p-5 md:p-6">
          <p className="text-xs font-eskapade uppercase tracking-[0.12em] text-soul-accent">
            Connected timeline
          </p>
          <h1 className="mt-3 font-display text-3xl lowercase tracking-widest text-bone md:text-5xl">
            The dead, ordered by record
          </h1>
          <p className="mt-4 max-w-3xl font-serif text-lg leading-8 text-neutral-300">
            Browse seeded lore events through the domain query layer. Official transmissions and community-preserved records share a single timeline while keeping their canon status clear.
          </p>
        </div>

        <div className="grid grid-cols-3 gap-3 border border-midnight-light/50 bg-soul-900/40 p-4 text-center md:grid-cols-1">
          <div>
            <p className="font-display text-3xl text-bone">{items.length}</p>
            <p className="text-xs font-eskapade uppercase tracking-[0.14em] text-neutral-400">Visible records</p>
          </div>
          <div>
            <p className="font-display text-3xl text-soul-accent">{official}</p>
            <p className="text-xs font-eskapade uppercase tracking-[0.14em] text-neutral-400">Official</p>
          </div>
          <div>
            <p className="font-display text-3xl text-sky-300">{community}</p>
            <p className="text-xs font-eskapade uppercase tracking-[0.14em] text-neutral-400">Community</p>
          </div>
        </div>
      </section>

      <LoreFilterBar
        filters={filters}
        seasons={seasons}
        locations={locations}
        characters={characters}
      />

      <section className="flex flex-wrap items-center justify-between gap-3">
        <div className="space-y-2">
          <p className="text-xs font-eskapade uppercase tracking-[0.12em] text-neutral-400">
            {active ? 'Active filter context' : 'Archive context'}
          </p>
          <div className="flex flex-wrap gap-2">
            {activeFilters.length > 0 ? (
              activeFilters.map((label) => (
                <span key={label} className="border border-soul-accent/30 bg-soul-accent/10 px-3 py-1 text-xs font-eskapade text-soul-accent">
                  {label}
                </span>
              ))
            ) : (
              <span className="font-serif text-base text-neutral-300">
                Showing every seeded official and community lore record.
              </span>
            )}
          </div>
        </div>

        {active && (
          <Link href="/lore" className="text-xs font-eskapade uppercase tracking-[0.14em] text-neutral-300 transition-colors hover:text-soul-accent">
            Clear all filters
          </Link>
        )}
      </section>

      {items.length > 0 ? (
        <LoreTimeline
          items={items}
          seasons={seasons}
          locations={locations}
          characters={characters}
        />
      ) : (
        <section className="border border-midnight-light/50 bg-soul-900/50 p-8 text-center shadow-2xl md:p-12">
          <p className="text-xs font-eskapade uppercase tracking-[0.12em] text-soul-accent">
            No records matched
          </p>
          <h2 className="mt-3 font-display text-3xl lowercase tracking-widest text-bone">
            The archive is silent here
          </h2>
          <p className="mx-auto mt-4 max-w-2xl font-serif text-lg leading-8 text-neutral-300">
            No event currently matches {activeFilters.length > 0 ? activeFilters.join(', ') : 'the selected filters'}.
            Clear the filters to return to the complete connected timeline.
          </p>
          {activeFilters.length > 0 && (
            <div className="mt-5 flex flex-wrap justify-center gap-2">
              {activeFilters.map((label) => (
                <span key={label} className="border border-midnight-light/60 px-3 py-1 text-xs font-eskapade text-neutral-300">
                  {label}
                </span>
              ))}
            </div>
          )}
          <Link
            href="/lore"
            className="mt-8 inline-flex border border-soul-accent/40 px-5 py-2 text-sm font-eskapade uppercase tracking-[0.14em] text-soul-accent transition-colors hover:border-soul-accent hover:text-bone"
          >
            Clear filters
          </Link>
        </section>
      )}
    </main>
  );
}
