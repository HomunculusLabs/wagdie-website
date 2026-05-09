import { loreCharacters } from './data/characters';
import { loreEvents } from './data/events';
import { loreLocations } from './data/locations';
import { loreSeasons } from './data/seasons';
import { loreMedia, loreSources } from './data/sources';
import type {
  LoreArchiveValidationResult,
  LoreCharacter,
  LoreEvent,
  LoreLocation,
  LoreMedia,
  LoreSeason,
  SourceRecord,
} from './types';

export interface LoreArchiveValidationData {
  events?: readonly LoreEvent[];
  characters?: readonly LoreCharacter[];
  locations?: readonly LoreLocation[];
  seasons?: readonly LoreSeason[];
  sources?: readonly SourceRecord[];
  media?: readonly LoreMedia[];
}

type KeyedRecord = {
  id: string;
  slug?: string;
};

const addDuplicateErrors = <T extends KeyedRecord>(
  records: readonly T[],
  label: string,
  key: 'id' | 'slug',
  errors: string[],
): void => {
  const seen = new Set<string>();
  const duplicates = new Set<string>();

  records.forEach((record) => {
    const value = record[key];

    if (!value) {
      return;
    }

    if (seen.has(value)) {
      duplicates.add(value);
      return;
    }

    seen.add(value);
  });

  duplicates.forEach((value) => {
    errors.push(`Duplicate ${label} ${key}: ${value}`);
  });
};

const hasKnownId = (ids: ReadonlySet<string>, id: string): boolean => ids.has(id);

export const validateLoreArchive = (
  data: LoreArchiveValidationData = {},
): LoreArchiveValidationResult => {
  const events = data.events ?? loreEvents;
  const characters = data.characters ?? loreCharacters;
  const locations = data.locations ?? loreLocations;
  const seasons = data.seasons ?? loreSeasons;
  const sources = data.sources ?? loreSources;
  const media = data.media ?? loreMedia;
  const errors: string[] = [];

  addDuplicateErrors(events, 'event', 'id', errors);
  addDuplicateErrors(events, 'event', 'slug', errors);
  addDuplicateErrors(characters, 'character', 'id', errors);
  addDuplicateErrors(characters, 'character', 'slug', errors);
  addDuplicateErrors(locations, 'location', 'id', errors);
  addDuplicateErrors(locations, 'location', 'slug', errors);
  addDuplicateErrors(seasons, 'season', 'id', errors);
  addDuplicateErrors(seasons, 'season', 'slug', errors);
  addDuplicateErrors(sources, 'source', 'id', errors);
  addDuplicateErrors(media, 'media', 'id', errors);

  const eventIds = new Set(events.map((event) => event.id));
  const characterIds = new Set(characters.map((character) => character.id));
  const locationIds = new Set(locations.map((location) => location.id));
  const seasonIds = new Set(seasons.map((season) => season.id));
  const sourceIds = new Set(sources.map((source) => source.id));
  const mediaIds = new Set(media.map((item) => item.id));

  events.forEach((event) => {
    if (event.seasonId && !hasKnownId(seasonIds, event.seasonId)) {
      errors.push(`Event ${event.id} references missing season: ${event.seasonId}`);
    }

    event.sourceIds.forEach((sourceId) => {
      if (!hasKnownId(sourceIds, sourceId)) {
        errors.push(`Event ${event.id} references missing source: ${sourceId}`);
      }
    });

    event.characterIds.forEach((characterId) => {
      if (!hasKnownId(characterIds, characterId)) {
        errors.push(`Event ${event.id} references missing character: ${characterId}`);
      }
    });

    event.locationIds.forEach((locationId) => {
      if (!hasKnownId(locationIds, locationId)) {
        errors.push(`Event ${event.id} references missing location: ${locationId}`);
      }
    });

    event.mediaIds?.forEach((mediaId) => {
      if (!hasKnownId(mediaIds, mediaId)) {
        errors.push(`Event ${event.id} references missing media: ${mediaId}`);
      }
    });

    event.canon.path.forEach((step, stepIndex) => {
      step.sourceIds?.forEach((sourceId) => {
        if (!hasKnownId(sourceIds, sourceId)) {
          errors.push(`Event ${event.id} canon step ${stepIndex + 1} references missing source: ${sourceId}`);
        }
      });
    });
  });

  characters.forEach((character) => {
    if (character.firstAppearanceEventId && !hasKnownId(eventIds, character.firstAppearanceEventId)) {
      errors.push(
        `Character ${character.id} references missing first appearance event: ${character.firstAppearanceEventId}`,
      );
    }

    if (character.imageId && !hasKnownId(mediaIds, character.imageId)) {
      errors.push(`Character ${character.id} references missing image media: ${character.imageId}`);
    }
  });

  sources.forEach((source) => {
    source.mediaIds?.forEach((mediaId) => {
      if (!hasKnownId(mediaIds, mediaId)) {
        errors.push(`Source ${source.id} references missing media: ${mediaId}`);
      }
    });
  });

  return {
    valid: errors.length === 0,
    errors,
  };
};

export const assertValidLoreArchive = (data?: LoreArchiveValidationData): void => {
  const result = validateLoreArchive(data);

  if (!result.valid) {
    throw new Error(`Lore archive validation failed:\n${result.errors.join('\n')}`);
  }
};
