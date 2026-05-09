'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Button, Input, Select } from '@/components/ui';
import { canonStatusLabels, getCanonizationStageOptions } from '@/lib/lore/canonization';
import { canonStatuses } from '@/lib/lore/types';
import type { LoreArchiveFilters, LoreCharacter, LoreLocation, LoreSeason } from '@/lib/lore/types';

interface LoreFilterBarProps {
  filters: LoreArchiveFilters;
  seasons: LoreSeason[];
  locations: LoreLocation[];
  characters: LoreCharacter[];
}

const unsetOption = (label: string) => ({ value: '', label });

export function LoreFilterBar({ filters, seasons, locations, characters }: LoreFilterBarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [keyword, setKeyword] = useState(filters.keyword ?? '');

  useEffect(() => {
    setKeyword(filters.keyword ?? '');
  }, [filters.keyword]);

  const seasonOptions = useMemo(() => [
    unsetOption('All seasons'),
    ...[...seasons]
      .sort((a, b) => a.order - b.order)
      .map((season) => ({ value: season.slug, label: season.title })),
  ], [seasons]);

  const locationOptions = useMemo(() => [
    unsetOption('All locations'),
    ...locations.map((location) => ({ value: location.slug, label: location.name })),
  ], [locations]);

  const characterOptions = useMemo(() => [
    unsetOption('All characters'),
    ...characters.map((character) => ({ value: character.slug, label: character.name })),
  ], [characters]);

  const canonOptions = useMemo(() => [
    unsetOption('All canon states'),
    ...canonStatuses.map((status) => ({ value: status, label: canonStatusLabels[status] })),
  ], []);

  const canonStageOptions = useMemo(() => [
    unsetOption('All workflow stages'),
    ...getCanonizationStageOptions().map((stage) => ({ value: stage.id, label: stage.label })),
  ], []);

  const pushFilter = (key: keyof LoreArchiveFilters, value: string) => {
    const params = new URLSearchParams(searchParams.toString());

    if (value.trim()) {
      params.set(key, value.trim());
    } else {
      params.delete(key);
    }

    const queryString = params.toString();
    router.push(`${pathname}${queryString ? `?${queryString}` : ''}`);
  };

  const handleKeywordSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    pushFilter('keyword', keyword);
  };

  return (
    <section className="border border-midnight-light/50 bg-soul-900/50 p-4 shadow-2xl backdrop-blur-md md:p-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-midnight-light/40 pb-4">
        <div>
          <p className="text-xs font-eskapade uppercase tracking-[0.28em] text-soul-accent">
            Archive filters
          </p>
          <p className="mt-1 text-sm font-eskapade text-neutral-500">
            URL-driven controls for season, place, character, keyword, canon status, and canon workflow stage.
          </p>
        </div>
        <Link
          href="/lore"
          className="text-xs font-eskapade uppercase tracking-[0.22em] text-neutral-500 transition-colors hover:text-soul-accent"
        >
          Clear filters
        </Link>
      </div>

      <div className="grid gap-4 lg:grid-cols-6">
        <Select
          label="Season"
          aria-label="Filter by season"
          value={filters.season ?? ''}
          options={seasonOptions}
          onChange={(event) => pushFilter('season', event.target.value)}
        />
        <Select
          label="Location"
          aria-label="Filter by location"
          value={filters.location ?? ''}
          options={locationOptions}
          onChange={(event) => pushFilter('location', event.target.value)}
        />
        <Select
          label="Character"
          aria-label="Filter by character"
          value={filters.character ?? ''}
          options={characterOptions}
          onChange={(event) => pushFilter('character', event.target.value)}
        />
        <Select
          label="Canon status"
          aria-label="Filter by canon status"
          value={filters.canonStatus ?? ''}
          options={canonOptions}
          onChange={(event) => pushFilter('canonStatus', event.target.value)}
        />
        <Select
          label="Canon stage"
          aria-label="Filter by canon workflow stage"
          value={filters.canonStage ?? ''}
          options={canonStageOptions}
          onChange={(event) => pushFilter('canonStage', event.target.value)}
        />
        <form onSubmit={handleKeywordSubmit} className="flex items-end gap-2">
          <Input
            label="Keyword"
            aria-label="Search lore keyword"
            value={keyword}
            placeholder="altar, citadel..."
            onChange={(event) => setKeyword(event.target.value)}
          />
          <Button type="submit" size="sm" className="mb-[1px] whitespace-nowrap py-2.5">
            Search
          </Button>
        </form>
      </div>
    </section>
  );
}
