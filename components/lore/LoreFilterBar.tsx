'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { canonStatusLabels, getCanonizationStageOptions } from '@/lib/lore/canonization';
import { canonStatuses } from '@/lib/lore/types';
import type { LoreArchiveFilters, LoreCharacter, LoreLocation, LoreSeason } from '@/lib/lore/types';

interface LoreFilterBarProps {
  filters: LoreArchiveFilters;
  seasons: LoreSeason[];
  locations: LoreLocation[];
  characters: LoreCharacter[];
}

interface SelectFieldProps {
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (value: string) => void;
}

const unsetOption = (label: string) => ({ value: '', label });

const hasActiveFilter = (filters: LoreArchiveFilters) => {
  return Boolean(filters.season || filters.location || filters.character || filters.keyword || filters.canonStatus || filters.canonStage);
};

function SelectField({ label, value, options, onChange }: SelectFieldProps) {
  return (
    <label className="block space-y-2 font-serif text-sm text-neutral-400">
      <span>{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full border border-midnight-light/40 bg-black/30 px-3 py-2.5 font-serif text-sm text-bone outline-none transition-colors focus:border-soul-accent"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value} className="bg-soul-950 text-bone">
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

export function LoreFilterBar({ filters, seasons, locations, characters }: LoreFilterBarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [keyword, setKeyword] = useState(filters.keyword ?? '');
  const active = hasActiveFilter(filters);

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
    <section className="border-y border-midnight-light/30 py-4">
      <div className="mb-4 flex items-center justify-between gap-4">
        <p className="font-serif text-base text-neutral-300">
          Filter stories
          {active && <span className="ml-3 text-sm text-soul-accent">Active</span>}
        </p>
        {active && (
          <Link href="/lore" className="font-serif text-sm text-soul-accent transition-colors hover:text-bone">
            Reset all
          </Link>
        )}
      </div>

      <div className="space-y-4">
        <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-6">
          <SelectField
            label="Season"
            value={filters.season ?? ''}
            options={seasonOptions}
            onChange={(value) => pushFilter('season', value)}
          />
          <SelectField
            label="Location"
            value={filters.location ?? ''}
            options={locationOptions}
            onChange={(value) => pushFilter('location', value)}
          />
          <SelectField
            label="Character"
            value={filters.character ?? ''}
            options={characterOptions}
            onChange={(value) => pushFilter('character', value)}
          />
          <SelectField
            label="Canon status"
            value={filters.canonStatus ?? ''}
            options={canonOptions}
            onChange={(value) => pushFilter('canonStatus', value)}
          />
          <SelectField
            label="Canon stage"
            value={filters.canonStage ?? ''}
            options={canonStageOptions}
            onChange={(value) => pushFilter('canonStage', value)}
          />
          <form onSubmit={handleKeywordSubmit} className="space-y-2 font-serif text-sm text-neutral-400">
            <label htmlFor="lore-keyword">Keyword</label>
            <div className="flex gap-2">
              <input
                id="lore-keyword"
                aria-label="Search lore keyword"
                value={keyword}
                placeholder="altar, citadel..."
                onChange={(event) => setKeyword(event.target.value)}
                className="min-w-0 flex-1 border border-midnight-light/40 bg-black/30 px-3 py-2.5 font-serif text-sm text-bone outline-none transition-colors placeholder:text-neutral-600 focus:border-soul-accent"
              />
              <button
                type="submit"
                className="border border-soul-accent/40 px-3 py-2.5 font-serif text-sm text-soul-accent transition-colors hover:border-soul-accent hover:text-bone"
              >
                Search
              </button>
            </div>
          </form>
        </div>

      </div>
    </section>
  );
}
