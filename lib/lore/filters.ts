import { loreCharacters } from './data/characters';
import { loreLocations } from './data/locations';
import { loreSeasons } from './data/seasons';
import type { LoreArchiveFilters, LoreEvent } from './types';
export { parseLoreArchiveFilters } from './archive-filter-params';

// Static compatibility: eventMatchesLoreArchiveFilters powers the synchronous
// query.ts fallback layer. Public routes use effective-query filtering instead.

const includesToken = (value: string | undefined, token: string): boolean => {
  return value?.toLocaleLowerCase().includes(token) ?? false;
};

const matchesIdOrSlug = (ids: string[], filterValue: string, records: Array<{ id: string; slug: string }>): boolean => {
  return ids.some((id) => {
    if (id === filterValue) {
      return true;
    }

    const record = records.find((item) => item.id === id);
    return record?.slug === filterValue;
  });
};

const eventMatchesKeyword = (event: LoreEvent, keyword: string): boolean => {
  const token = keyword.toLocaleLowerCase();
  const characters = loreCharacters.filter((character) => event.characterIds.includes(character.id));
  const locations = loreLocations.filter((location) => event.locationIds.includes(location.id));

  return [
    event.title,
    event.summary,
    event.body,
    event.canon.stageId,
    ...event.tags,
    ...event.keywords,
    ...event.canon.path.flatMap((step) => [step.label, step.stageId, step.note]),
    ...characters.flatMap((character) => [character.name, ...character.aliases, character.summary]),
    ...locations.flatMap((location) => [location.name, location.summary, ...location.tags]),
  ].some((value) => includesToken(value, token));
};

export const eventMatchesLoreArchiveFilters = (
  event: LoreEvent,
  filters: LoreArchiveFilters = {},
): boolean => {
  if (filters.season) {
    const seasonMatches = event.seasonId
      ? matchesIdOrSlug([event.seasonId], filters.season, loreSeasons)
      : false;

    if (!seasonMatches) {
      return false;
    }
  }

  if (filters.location && !matchesIdOrSlug(event.locationIds, filters.location, loreLocations)) {
    return false;
  }

  if (filters.character && !matchesIdOrSlug(event.characterIds, filters.character, loreCharacters)) {
    return false;
  }

  if (filters.canonStatus && event.canon.status !== filters.canonStatus) {
    return false;
  }

  if (filters.canonStage && event.canon.stageId !== filters.canonStage) {
    return false;
  }

  if (filters.keyword && !eventMatchesKeyword(event, filters.keyword)) {
    return false;
  }

  return true;
};
