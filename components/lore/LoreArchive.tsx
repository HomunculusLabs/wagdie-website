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

export function LoreArchive({ items, filters, seasons, locations, characters }: LoreArchiveProps) {
  const activeFilters = buildActiveFilterLabels(filters, seasons, locations, characters);
  const active = hasActiveFilters(filters);
  return (
    <main className="container mx-auto max-w-7xl space-y-8 px-4 py-8 md:py-12">
      <section className="max-w-3xl space-y-4">
        <p className="font-serif text-sm uppercase tracking-[0.08em] text-soul-accent/80">
          Lore archive
        </p>
        <h1 className="font-serif text-4xl leading-tight text-bone md:text-6xl">
          Stories from the dead.
        </h1>
        <p className="max-w-2xl font-serif text-lg leading-8 text-neutral-300">
          Official transmissions and community records, collected as a quiet visual archive.
        </p>
        <p className="font-serif text-base text-neutral-500">
          Showing {items.length} {items.length === 1 ? 'story' : 'stories'}{active ? ' for the current filters' : ''}.
        </p>
      </section>

      <LoreFilterBar
        filters={filters}
        seasons={seasons}
        locations={locations}
        characters={characters}
      />

      {active && (
        <section className="flex flex-wrap items-center justify-between gap-3 border-y border-midnight-light/30 py-4 font-serif text-sm text-neutral-400">
          <p>
            Filtered by {activeFilters.join(' · ')}
          </p>
          <Link href="/lore" className="text-soul-accent transition-colors hover:text-bone">
            Clear filters
          </Link>
        </section>
      )}

      {items.length > 0 ? (
        <LoreTimeline
          items={items}
          seasons={seasons}
          locations={locations}
          characters={characters}
        />
      ) : (
        <section className="border border-midnight-light/40 bg-black/20 p-8 text-center md:p-10">
          <h2 className="font-serif text-3xl text-bone">
            No stories found.
          </h2>
          <p className="mx-auto mt-3 max-w-xl font-serif text-base leading-7 text-neutral-400">
            Nothing matches {activeFilters.length > 0 ? activeFilters.join(', ') : 'the selected filters'}.
          </p>
          <Link
            href="/lore"
            className="mt-6 inline-flex border border-soul-accent/40 px-5 py-2 font-serif text-sm text-soul-accent transition-colors hover:border-soul-accent hover:text-bone"
          >
            Clear filters
          </Link>
        </section>
      )}
    </main>
  );
}
