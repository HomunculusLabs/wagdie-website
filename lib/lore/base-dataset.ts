import { loreCharacters } from './data/characters';
import { loreEvents } from './data/events';
import { loreLocations } from './data/locations';
import { loreSeasons } from './data/seasons';
import { loreMedia, loreSources } from './data/sources';
import {
  canonStatuses,
  canonizationStageIds,
  type Canonization,
  type CanonizationStep,
  type LoreCharacter,
  type LoreEvent,
  type LoreLocation,
  type LoreMedia,
  type LoreSeason,
  type SourceRecord,
} from './types';

export type LoreBaseSource = 'database' | 'static';

export interface LoreBaseDatasetInput {
  source: LoreBaseSource;
  events: LoreEvent[];
  characters: LoreCharacter[];
  locations: LoreLocation[];
  seasons: LoreSeason[];
  sources: SourceRecord[];
  media: LoreMedia[];
}

export interface LoreBaseIndexes {
  eventsById: Map<string, LoreEvent>;
  eventsBySlug: Map<string, LoreEvent>;
  charactersById: Map<string, LoreCharacter>;
  charactersBySlug: Map<string, LoreCharacter>;
  locationsById: Map<string, LoreLocation>;
  locationsBySlug: Map<string, LoreLocation>;
  seasonsById: Map<string, LoreSeason>;
  seasonsBySlug: Map<string, LoreSeason>;
  sourcesById: Map<string, SourceRecord>;
  mediaById: Map<string, LoreMedia>;
}

export interface LoreBaseDataset extends LoreBaseDatasetInput {
  indexes: LoreBaseIndexes;
}

export interface LoreBaseValidationResult {
  valid: boolean;
  errors: string[];
}

export const sortLoreEvents = (a: LoreEvent, b: LoreEvent): number => {
  if (a.timelineOrder !== b.timelineOrder) {
    return a.timelineOrder - b.timelineOrder;
  }

  return a.title.localeCompare(b.title);
};

export const sortLoreCharacters = (a: LoreCharacter, b: LoreCharacter): number => {
  return a.name.localeCompare(b.name) || a.id.localeCompare(b.id);
};

export const sortLoreLocations = (a: LoreLocation, b: LoreLocation): number => {
  return a.name.localeCompare(b.name) || a.id.localeCompare(b.id);
};

export const sortLoreSeasons = (a: LoreSeason, b: LoreSeason): number => {
  return a.order - b.order || a.title.localeCompare(b.title) || a.id.localeCompare(b.id);
};

export const sortLoreSources = (a: SourceRecord, b: SourceRecord): number => {
  return a.title.localeCompare(b.title) || a.id.localeCompare(b.id);
};

export const sortLoreMedia = (a: LoreMedia, b: LoreMedia): number => {
  return a.title.localeCompare(b.title) || a.id.localeCompare(b.id);
};

const cloneStringArray = (value: string[] | undefined): string[] | undefined => {
  return value ? [...value] : undefined;
};

const cloneCanonPath = (path: CanonizationStep[]): CanonizationStep[] => {
  return path.map((step) => ({
    ...step,
    sourceIds: cloneStringArray(step.sourceIds),
  }));
};

const cloneCanon = (canon: Canonization): Canonization => ({
  ...canon,
  path: cloneCanonPath(canon.path),
});

const cloneEvent = (event: LoreEvent): LoreEvent => ({
  ...event,
  locationIds: [...event.locationIds],
  characterIds: [...event.characterIds],
  entityRefs: event.entityRefs.map((ref) => ({ ...ref })),
  canon: cloneCanon(event.canon),
  sourceIds: [...event.sourceIds],
  mediaIds: cloneStringArray(event.mediaIds),
  tags: [...event.tags],
  keywords: [...event.keywords],
});

const cloneCharacter = (character: LoreCharacter): LoreCharacter => ({
  ...character,
  aliases: [...character.aliases],
  tags: [...character.tags],
});

const cloneLocation = (location: LoreLocation): LoreLocation => ({
  ...location,
  aliases: [...location.aliases],
  sourceIds: cloneStringArray(location.sourceIds),
  tags: [...location.tags],
});

const cloneSource = (source: SourceRecord): SourceRecord => ({
  ...source,
  mediaIds: cloneStringArray(source.mediaIds),
});

const cloneMedia = (media: LoreMedia): LoreMedia => ({ ...media });
const cloneSeason = (season: LoreSeason): LoreSeason => ({ ...season });

export const buildLoreBaseIndexes = (dataset: LoreBaseDatasetInput): LoreBaseIndexes => ({
  eventsById: new Map(dataset.events.map((event) => [event.id, event])),
  eventsBySlug: new Map(dataset.events.map((event) => [event.slug, event])),
  charactersById: new Map(dataset.characters.map((character) => [character.id, character])),
  charactersBySlug: new Map(dataset.characters.map((character) => [character.slug, character])),
  locationsById: new Map(dataset.locations.map((location) => [location.id, location])),
  locationsBySlug: new Map(dataset.locations.map((location) => [location.slug, location])),
  seasonsById: new Map(dataset.seasons.map((season) => [season.id, season])),
  seasonsBySlug: new Map(dataset.seasons.map((season) => [season.slug, season])),
  sourcesById: new Map(dataset.sources.map((source) => [source.id, source])),
  mediaById: new Map(dataset.media.map((media) => [media.id, media])),
});

export const createLoreBaseDataset = (input: LoreBaseDatasetInput): LoreBaseDataset => {
  const sortedInput: LoreBaseDatasetInput = {
    source: input.source,
    events: [...input.events].sort(sortLoreEvents),
    characters: [...input.characters].sort(sortLoreCharacters),
    locations: [...input.locations].sort(sortLoreLocations),
    seasons: [...input.seasons].sort(sortLoreSeasons),
    sources: [...input.sources].sort(sortLoreSources),
    media: [...input.media].sort(sortLoreMedia),
  };

  return {
    ...sortedInput,
    indexes: buildLoreBaseIndexes(sortedInput),
  };
};

export const buildStaticLoreBaseDataset = (): LoreBaseDataset => {
  return createLoreBaseDataset({
    source: 'static',
    events: loreEvents.map(cloneEvent),
    characters: loreCharacters.map(cloneCharacter),
    locations: loreLocations.map(cloneLocation),
    seasons: loreSeasons.map(cloneSeason),
    sources: loreSources.map(cloneSource),
    media: loreMedia.map(cloneMedia),
  });
};

let staticDataset: LoreBaseDataset | null = null;

export const getStaticLoreBaseDataset = (): LoreBaseDataset => {
  if (!staticDataset) {
    staticDataset = buildStaticLoreBaseDataset();
  }

  return staticDataset;
};

const addDuplicateErrors = <T>(
  errors: string[],
  label: string,
  items: T[],
  getValue: (item: T) => string | undefined,
  field: string,
): void => {
  const counts = new Map<string, number>();

  items.forEach((item) => {
    const value = getValue(item);
    if (!value) return;
    counts.set(value, (counts.get(value) ?? 0) + 1);
  });

  counts.forEach((count, value) => {
    if (count > 1) {
      errors.push(`${label} duplicate ${field}: ${value}`);
    }
  });
};

const addGlobalDuplicateErrors = (
  errors: string[],
  field: 'id' | 'slug',
  entries: Array<{ type: string; value?: string }>,
): void => {
  const seen = new Map<string, string[]>();

  entries.forEach((entry) => {
    if (!entry.value) return;
    const labels = seen.get(entry.value) ?? [];
    labels.push(entry.type);
    seen.set(entry.value, labels);
  });

  seen.forEach((labels, value) => {
    if (labels.length > 1) {
      errors.push(`Global duplicate ${field}: ${value} (${labels.join(', ')})`);
    }
  });
};

const hasStringId = (map: Map<string, unknown>, id: string): boolean => map.has(id);

const requireReference = (
  errors: string[],
  owner: string,
  field: string,
  id: string | undefined,
  index: Map<string, unknown>,
): void => {
  if (id && !hasStringId(index, id)) {
    errors.push(`${owner} references missing ${field}: ${id}`);
  }
};

const requireReferences = (
  errors: string[],
  owner: string,
  field: string,
  ids: string[] | undefined,
  index: Map<string, unknown>,
): void => {
  (ids ?? []).forEach((id) => requireReference(errors, owner, field, id, index));
};

const isStringArray = (value: unknown): value is string[] => {
  return Array.isArray(value) && value.every((item) => typeof item === 'string');
};

const isRecord = (value: unknown): value is Record<string, unknown> => {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
};

const validateCanonPath = (
  errors: string[],
  owner: string,
  canon: unknown,
  sourceIndex: Map<string, SourceRecord>,
): void => {
  if (!isRecord(canon)) {
    errors.push(`${owner} canon must be an object`);
    return;
  }

  if (!canonStatuses.includes(canon.status as Canonization['status'])) {
    errors.push(`${owner} has invalid canon status: ${String(canon.status)}`);
  }

  if (!canonizationStageIds.includes(canon.stageId as Canonization['stageId'])) {
    errors.push(`${owner} has invalid canon stageId: ${String(canon.stageId)}`);
  }

  if (!Array.isArray(canon.path)) {
    errors.push(`${owner} canon path must be an array`);
    return;
  }

  canon.path.forEach((step, index) => {
    const stepOwner = `${owner} canon.path[${index}]`;

    if (!isRecord(step)) {
      errors.push(`${stepOwner} must be an object`);
      return;
    }

    if (!canonizationStageIds.includes(step.stageId as CanonizationStep['stageId'])) {
      errors.push(`${stepOwner} has invalid stageId: ${String(step.stageId)}`);
    }

    if (!['complete', 'current', 'blocked', 'not_started', 'skipped'].includes(String(step.status))) {
      errors.push(`${stepOwner} has invalid status: ${String(step.status)}`);
    }

    if (step.sourceIds !== undefined && !isStringArray(step.sourceIds)) {
      errors.push(`${stepOwner} sourceIds must be a string array`);
      return;
    }

    requireReferences(errors, stepOwner, 'source', step.sourceIds, sourceIndex);
  });
};

const requireNonEmptyCollection = (
  errors: string[],
  label: string,
  items: unknown[],
): void => {
  if (items.length === 0) {
    errors.push(`${label} collection must not be empty`);
  }
};

export const validateLoreBaseDataset = (dataset: LoreBaseDataset): LoreBaseValidationResult => {
  const errors: string[] = [];
  const { indexes } = dataset;

  requireNonEmptyCollection(errors, 'Events', dataset.events);
  requireNonEmptyCollection(errors, 'Characters', dataset.characters);
  requireNonEmptyCollection(errors, 'Locations', dataset.locations);
  requireNonEmptyCollection(errors, 'Seasons', dataset.seasons);
  requireNonEmptyCollection(errors, 'Sources', dataset.sources);
  requireNonEmptyCollection(errors, 'Media', dataset.media);

  addDuplicateErrors(errors, 'Events', dataset.events, (event) => event.id, 'id');
  addDuplicateErrors(errors, 'Events', dataset.events, (event) => event.slug, 'slug');
  addDuplicateErrors(errors, 'Characters', dataset.characters, (character) => character.id, 'id');
  addDuplicateErrors(errors, 'Characters', dataset.characters, (character) => character.slug, 'slug');
  addDuplicateErrors(errors, 'Locations', dataset.locations, (location) => location.id, 'id');
  addDuplicateErrors(errors, 'Locations', dataset.locations, (location) => location.slug, 'slug');
  addDuplicateErrors(errors, 'Seasons', dataset.seasons, (season) => season.id, 'id');
  addDuplicateErrors(errors, 'Seasons', dataset.seasons, (season) => season.slug, 'slug');
  addDuplicateErrors(errors, 'Sources', dataset.sources, (source) => source.id, 'id');
  addDuplicateErrors(errors, 'Media', dataset.media, (media) => media.id, 'id');

  addGlobalDuplicateErrors(errors, 'id', [
    ...dataset.events.map((event) => ({ type: 'event', value: event.id })),
    ...dataset.characters.map((character) => ({ type: 'character', value: character.id })),
    ...dataset.locations.map((location) => ({ type: 'location', value: location.id })),
    ...dataset.seasons.map((season) => ({ type: 'season', value: season.id })),
    ...dataset.sources.map((source) => ({ type: 'source', value: source.id })),
    ...dataset.media.map((media) => ({ type: 'media', value: media.id })),
  ]);

  addGlobalDuplicateErrors(errors, 'slug', [
    ...dataset.events.map((event) => ({ type: 'event', value: event.slug })),
    ...dataset.characters.map((character) => ({ type: 'character', value: character.slug })),
    ...dataset.locations.map((location) => ({ type: 'location', value: location.slug })),
    ...dataset.seasons.map((season) => ({ type: 'season', value: season.slug })),
  ]);

  dataset.events.forEach((event) => {
    const owner = `Event ${event.id}`;
    requireReference(errors, owner, 'season', event.seasonId, indexes.seasonsById);
    requireReferences(errors, owner, 'location', event.locationIds, indexes.locationsById);
    requireReferences(errors, owner, 'character', event.characterIds, indexes.charactersById);
    requireReferences(errors, owner, 'source', event.sourceIds, indexes.sourcesById);
    requireReferences(errors, owner, 'media', event.mediaIds, indexes.mediaById);
    validateCanonPath(errors, owner, event.canon, indexes.sourcesById);

    event.entityRefs.forEach((entityRef, index) => {
      const refOwner = `${owner} entityRefs[${index}]`;
      if (entityRef.kind === 'character') {
        requireReference(errors, refOwner, 'character', entityRef.id, indexes.charactersById);
      } else if (entityRef.kind === 'location') {
        requireReference(errors, refOwner, 'location', entityRef.id, indexes.locationsById);
      } else if (entityRef.kind === 'event') {
        requireReference(errors, refOwner, 'event', entityRef.id, indexes.eventsById);
      }
    });
  });

  dataset.sources.forEach((source) => {
    requireReferences(errors, `Source ${source.id}`, 'media', source.mediaIds, indexes.mediaById);
  });

  dataset.locations.forEach((location) => {
    const owner = `Location ${location.id}`;
    requireReference(errors, owner, 'image media', location.imageId, indexes.mediaById);
    requireReferences(errors, owner, 'source', location.sourceIds, indexes.sourcesById);
  });

  dataset.characters.forEach((character) => {
    const owner = `Character ${character.id}`;
    requireReference(errors, owner, 'image media', character.imageId, indexes.mediaById);
    requireReference(errors, owner, 'first appearance event', character.firstAppearanceEventId, indexes.eventsById);
  });

  return {
    valid: errors.length === 0,
    errors,
  };
};
