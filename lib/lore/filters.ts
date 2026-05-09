import { loreCharacters } from './data/characters';
import { loreLocations } from './data/locations';
import { loreSeasons } from './data/seasons';
import { isCanonizationStageId } from './canonization';
import { canonStatuses } from './types';
import type { CanonStatus, LoreArchiveFilters, LoreEvent } from './types';

type FilterInputValue = string | string[] | undefined | null;
type FilterInput = URLSearchParams | Record<string, FilterInputValue> | undefined | null;

const isCanonStatus = (value: string): value is CanonStatus => {
  return (canonStatuses as readonly string[]).includes(value);
};

const firstValue = (value: FilterInputValue): string | undefined => {
  if (Array.isArray(value)) {
    return value[0];
  }

  return value ?? undefined;
};

const cleanValue = (value: string | undefined): string | undefined => {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
};

const getParam = (input: FilterInput, key: keyof LoreArchiveFilters): string | undefined => {
  if (!input) {
    return undefined;
  }

  if (input instanceof URLSearchParams) {
    return cleanValue(input.get(key) ?? undefined);
  }

  return cleanValue(firstValue(input[key]));
};

export const parseLoreArchiveFilters = (input: FilterInput): LoreArchiveFilters => {
  const canonStatus = getParam(input, 'canonStatus');
  const canonStage = getParam(input, 'canonStage');

  return {
    season: getParam(input, 'season'),
    location: getParam(input, 'location'),
    character: getParam(input, 'character'),
    keyword: getParam(input, 'keyword'),
    canonStatus: canonStatus && isCanonStatus(canonStatus) ? canonStatus : undefined,
    canonStage: canonStage && isCanonizationStageId(canonStage) ? canonStage : undefined,
  };
};

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
