import * as React from 'react';
import { getActiveLoreBaseDataset } from './base-query';
import {
  createLoreBaseDataset,
  sortLoreCharacters,
  sortLoreEvents,
  sortLoreLocations,
  sortLoreSeasons,
  type LoreBaseDataset,
} from './base-dataset';
import { adaptLoreSubmissionToEffectiveLore, type AdaptedLoreSubmission } from './submissions/adapter';
import { loreCanonizationRepository } from '@/lib/repositories/lore-canonization-repository';
import { loreSubmissionRepository } from '@/lib/repositories/lore-submission-repository';
import type {
  LoreCanonizationOverride,
  LoreCanonizationOverrideSet,
} from './canonization-overrides';
import type {
  LoreArchiveFilters,
  LoreCharacter,
  LoreCharacterConnection,
  LoreEvent,
  LoreLocation,
  LoreMedia,
  LoreResolvedEntity,
  LoreSeason,
  SourceRecord,
} from './types';

export const applyPublishedCanonizationOverrides = (
  events: LoreEvent[],
  overrideSets: LoreCanonizationOverrideSet[],
): LoreEvent[] => {
  const publishedEntries: Array<[string, LoreCanonizationOverride]> = overrideSets.flatMap((overrideSet) => (
    overrideSet.publishedOverride
      ? [[overrideSet.eventId, overrideSet.publishedOverride] as [string, LoreCanonizationOverride]]
      : []
  ));
  const publishedByEventId = new Map(publishedEntries);

  return events.map((event) => {
    const publishedOverride = publishedByEventId.get(event.id);
    return publishedOverride ? { ...event, canon: publishedOverride.canon } : event;
  });
};

let hasWarnedAboutOverrideFallback = false;
let hasWarnedAboutSubmissionFallback = false;
let hasWarnedAboutSubmissionCollision = false;

const summarizeQueryError = (error: unknown): string => {
  if (error instanceof Error) {
    return error.message.slice(0, 240);
  }

  return String(error).slice(0, 240);
};

const fetchPublishedOverrideSets = async (): Promise<LoreCanonizationOverrideSet[]> => {
  try {
    return await loreCanonizationRepository.findAll();
  } catch (error) {
    if (!hasWarnedAboutOverrideFallback) {
      hasWarnedAboutOverrideFallback = true;
      console.warn(
        `Falling back to static lore canonization; published overrides unavailable: ${summarizeQueryError(error)}`,
      );
    }

    return [];
  }
};

const fetchPublishedSubmissionLore = async (): Promise<AdaptedLoreSubmission[]> => {
  try {
    const details = await loreSubmissionRepository.listPublishedForEffectiveLore();
    return details.flatMap((detail) => {
      const adapted = adaptLoreSubmissionToEffectiveLore(detail);
      return adapted ? [adapted] : [];
    });
  } catch (error) {
    if (!hasWarnedAboutSubmissionFallback) {
      hasWarnedAboutSubmissionFallback = true;
      console.warn(
        `Falling back to static lore events; published submissions unavailable: ${summarizeQueryError(error)}`,
      );
    }

    return [];
  }
};

interface EffectiveLoreContext {
  baseDataset: LoreBaseDataset;
  events: LoreEvent[];
  eventsById: Map<string, LoreEvent>;
  eventsBySlug: Map<string, LoreEvent>;
  sourcesById: Map<string, SourceRecord>;
  mediaById: Map<string, LoreMedia>;
}

const warnSubmissionCollisionOnce = (message: string): void => {
  if (hasWarnedAboutSubmissionCollision) return;
  hasWarnedAboutSubmissionCollision = true;
  console.warn(message);
};

const filterCollidingSubmissionLore = (
  baseDataset: LoreBaseDataset,
  submissionLore: AdaptedLoreSubmission[],
): AdaptedLoreSubmission[] => {
  const eventIds = new Set(baseDataset.events.map((event) => event.id));
  const eventSlugs = new Set(baseDataset.events.map((event) => event.slug));
  const acceptedIds = new Set<string>();
  const acceptedSlugs = new Set<string>();
  const skipped: string[] = [];

  const accepted = submissionLore.filter((record) => {
    const { id, slug } = record.event;
    const collides = eventIds.has(id)
      || eventSlugs.has(slug)
      || acceptedIds.has(id)
      || acceptedSlugs.has(slug);

    if (collides) {
      skipped.push(`${id} (${slug})`);
      return false;
    }

    acceptedIds.add(id);
    acceptedSlugs.add(slug);
    return true;
  });

  if (skipped.length > 0) {
    warnSubmissionCollisionOnce(
      `Skipping published lore submissions with base/effective lore id or slug collisions: ${skipped.join(', ')}`,
    );
  }

  return accepted;
};

const buildSubmissionTokenCharacters = (
  baseDataset: LoreBaseDataset,
  submissionLore: AdaptedLoreSubmission[],
): LoreCharacter[] => {
  const existingCharacterIds = new Set(baseDataset.characters.map((character) => character.id));
  const existingCharacterSlugs = new Set(baseDataset.characters.map((character) => character.slug));
  const created = new Set<string>();

  return submissionLore.flatMap((record) => (
    record.event.characterIds.flatMap((characterId) => {
      const match = /^character-([1-9]\d*)$/.exec(characterId);
      if (!match || existingCharacterIds.has(characterId) || created.has(characterId)) return [];

      const tokenId = Number(match[1]);
      const slug = existingCharacterSlugs.has(characterId) ? `${characterId}-token` : characterId;
      created.add(characterId);

      return [{
        id: characterId,
        slug,
        name: `WAGDIE #${tokenId}`,
        aliases: [`Token #${tokenId}`],
        summary: `Community lore record for WAGDIE #${tokenId}.`,
        tokenId,
        imageUrl: `/images/characters/${tokenId}.png`,
        externalUrl: `/characters/${tokenId}`,
        tags: ['community-submission', `token-${tokenId}`],
      } satisfies LoreCharacter];
    })
  ));
};

const augmentBaseDatasetWithSubmissionCharacters = (
  baseDataset: LoreBaseDataset,
  submissionLore: AdaptedLoreSubmission[],
): LoreBaseDataset => {
  const submissionCharacters = buildSubmissionTokenCharacters(baseDataset, submissionLore);
  if (submissionCharacters.length === 0) return baseDataset;

  return createLoreBaseDataset({
    source: baseDataset.source,
    events: baseDataset.events,
    characters: [...baseDataset.characters, ...submissionCharacters],
    locations: baseDataset.locations,
    seasons: baseDataset.seasons,
    sources: baseDataset.sources,
    media: baseDataset.media,
  });
};

const buildEffectiveLoreContextUncached = async (): Promise<EffectiveLoreContext> => {
  const [baseDataset, overrideSets, submissionLore] = await Promise.all([
    getActiveLoreBaseDataset(),
    fetchPublishedOverrideSets(),
    fetchPublishedSubmissionLore(),
  ]);
  const acceptedSubmissionLore = filterCollidingSubmissionLore(baseDataset, submissionLore);
  const effectiveBaseDataset = augmentBaseDatasetWithSubmissionCharacters(baseDataset, acceptedSubmissionLore);
  const baseEvents = applyPublishedCanonizationOverrides([...effectiveBaseDataset.events], overrideSets);
  const events = [
    ...baseEvents,
    ...acceptedSubmissionLore.map((record) => record.event),
  ].sort(sortLoreEvents);

  const sourcesById = new Map<string, SourceRecord>(effectiveBaseDataset.sources.map((source) => [source.id, source]));
  const mediaById = new Map<string, LoreMedia>(effectiveBaseDataset.media.map((media) => [media.id, media]));

  acceptedSubmissionLore.forEach((record) => {
    record.sources.forEach((source) => {
      if (!sourcesById.has(source.id)) {
        sourcesById.set(source.id, source);
      }
    });

    record.media.forEach((media) => {
      if (!mediaById.has(media.id)) {
        mediaById.set(media.id, media);
      }
    });
  });

  return {
    baseDataset: effectiveBaseDataset,
    events,
    eventsById: new Map(events.map((event) => [event.id, event])),
    eventsBySlug: new Map(events.map((event) => [event.slug, event])),
    sourcesById,
    mediaById,
  };
};

const reactCache = (React as typeof React & {
  cache?: <T extends (...args: never[]) => unknown>(fn: T) => T;
}).cache;
const getCachedEffectiveLoreContext = reactCache
  ? reactCache(buildEffectiveLoreContextUncached)
  : buildEffectiveLoreContextUncached;

const buildEffectiveLoreContext = async (): Promise<EffectiveLoreContext> => {
  return process.env.NODE_ENV === 'test'
    ? buildEffectiveLoreContextUncached()
    : getCachedEffectiveLoreContext();
};

const matchesIdOrSlug = (
  ids: string[],
  filterValue: string,
  recordsById: ReadonlyMap<string, { slug: string }>,
): boolean => {
  return ids.some((id) => id === filterValue || recordsById.get(id)?.slug === filterValue);
};

const includesToken = (value: string | undefined, token: string): boolean => {
  return value?.toLocaleLowerCase().includes(token) ?? false;
};

const eventMatchesEffectiveArchiveFilters = (
  event: LoreEvent,
  context: EffectiveLoreContext,
  filters: LoreArchiveFilters = {},
): boolean => {
  const { baseDataset } = context;

  if (filters.season) {
    const seasonMatches = event.seasonId
      ? matchesIdOrSlug([event.seasonId], filters.season, baseDataset.indexes.seasonsById)
      : false;

    if (!seasonMatches) return false;
  }

  if (filters.location && !matchesIdOrSlug(event.locationIds, filters.location, baseDataset.indexes.locationsById)) {
    return false;
  }

  if (filters.character && !matchesIdOrSlug(event.characterIds, filters.character, baseDataset.indexes.charactersById)) {
    return false;
  }

  if (filters.canonStatus && event.canon.status !== filters.canonStatus) {
    return false;
  }

  if (filters.canonStage && event.canon.stageId !== filters.canonStage) {
    return false;
  }

  if (filters.keyword) {
    const token = filters.keyword.toLocaleLowerCase();
    const characters = event.characterIds.flatMap((characterId) => {
      const character = baseDataset.indexes.charactersById.get(characterId);
      return character ? [character] : [];
    });
    const locations = event.locationIds.flatMap((locationId) => {
      const location = baseDataset.indexes.locationsById.get(locationId);
      return location ? [location] : [];
    });

    const matchesKeyword = [
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

    if (!matchesKeyword) return false;
  }

  return true;
};

export const getAllEffectiveLoreEvents = async (): Promise<LoreEvent[]> => {
  return [...(await buildEffectiveLoreContext()).events].sort(sortLoreEvents);
};

export const getEffectiveOfficialEvents = async (): Promise<LoreEvent[]> => {
  return (await getAllEffectiveLoreEvents()).filter((event) => event.kind === 'official');
};

export const getEffectiveCommunityEvents = async (): Promise<LoreEvent[]> => {
  return (await getAllEffectiveLoreEvents()).filter((event) => event.kind === 'community');
};

export const getEffectiveLoreEventBySlug = async (slug: string): Promise<LoreEvent | undefined> => {
  return (await buildEffectiveLoreContext()).eventsBySlug.get(slug);
};

export const getEffectiveOfficialEventBySlug = async (slug: string): Promise<LoreEvent | undefined> => {
  const event = await getEffectiveLoreEventBySlug(slug);
  return event?.kind === 'official' ? event : undefined;
};

export const getEffectiveCommunityEventBySlug = async (slug: string): Promise<LoreEvent | undefined> => {
  const event = await getEffectiveLoreEventBySlug(slug);
  return event?.kind === 'community' ? event : undefined;
};

export const getEffectiveArchiveItems = async (
  filters: LoreArchiveFilters = {},
): Promise<LoreEvent[]> => {
  const context = await buildEffectiveLoreContext();
  return context.events.filter((event) => eventMatchesEffectiveArchiveFilters(event, context, filters));
};

export const getEffectiveEventsForCharacter = async (characterId: string): Promise<LoreEvent[]> => {
  return (await getAllEffectiveLoreEvents()).filter((event) => event.characterIds.includes(characterId));
};

export const getEffectiveEventsForLocation = async (locationId: string): Promise<LoreEvent[]> => {
  return (await getAllEffectiveLoreEvents()).filter((event) => event.locationIds.includes(locationId));
};

const resolveSourcesForEvent = (
  event: LoreEvent,
  context: EffectiveLoreContext,
): SourceRecord[] => {
  return event.sourceIds.flatMap((sourceId) => {
    const source = context.sourcesById.get(sourceId);
    return source ? [source] : [];
  });
};

export const getEffectiveSourcesForEvent = async (event: LoreEvent): Promise<SourceRecord[]> => {
  return resolveSourcesForEvent(event, await buildEffectiveLoreContext());
};

export const getEffectiveSourcesByEventId = async (
  events: LoreEvent[],
): Promise<Record<string, SourceRecord[]>> => {
  const context = await buildEffectiveLoreContext();

  return Object.fromEntries(events.map((event) => [event.id, resolveSourcesForEvent(event, context)]));
};

export const getEffectiveMediaById = async (mediaId: string): Promise<LoreMedia | undefined> => {
  return (await buildEffectiveLoreContext()).mediaById.get(mediaId);
};

export const getEffectiveMediaForEvent = async (event: LoreEvent): Promise<LoreMedia[]> => {
  const context = await buildEffectiveLoreContext();
  const sources = resolveSourcesForEvent(event, context);
  const sourceMediaIds = sources.flatMap((source) => source.mediaIds ?? []);
  const mediaIds = [...new Set([...(event.mediaIds ?? []), ...sourceMediaIds])];

  return mediaIds.flatMap((mediaId) => {
    const media = context.mediaById.get(mediaId);
    return media ? [media] : [];
  });
};

export const getEffectiveCharacterConnections = async (
  characterId: string,
): Promise<LoreCharacterConnection[]> => {
  const context = await buildEffectiveLoreContext();
  const appearances = context.events.filter((event) => event.characterIds.includes(characterId));
  const sharedEventIdsByCharacter = new Map<string, Set<string>>();

  appearances.forEach((event) => {
    event.characterIds.forEach((coCharacterId) => {
      if (coCharacterId === characterId) return;

      const sharedEventIds = sharedEventIdsByCharacter.get(coCharacterId) ?? new Set<string>();
      sharedEventIds.add(event.id);
      sharedEventIdsByCharacter.set(coCharacterId, sharedEventIds);
    });
  });

  return [...sharedEventIdsByCharacter.entries()]
    .map(([coCharacterId, sharedEventIds]) => {
      const character = context.baseDataset.indexes.charactersById.get(coCharacterId);
      if (!character) return undefined;

      return {
        character,
        sharedEvents: appearances.filter((event) => sharedEventIds.has(event.id)),
      } satisfies LoreCharacterConnection;
    })
    .filter((connection): connection is LoreCharacterConnection => Boolean(connection))
    .sort((a, b) => (
      b.sharedEvents.length - a.sharedEvents.length || a.character.name.localeCompare(b.character.name)
    ));
};

export const getEffectiveCharacterBySlug = async (slug: string): Promise<LoreCharacter | undefined> => {
  return (await buildEffectiveLoreContext()).baseDataset.indexes.charactersBySlug.get(slug);
};

export const getEffectiveLocationBySlug = async (slug: string): Promise<LoreLocation | undefined> => {
  return (await buildEffectiveLoreContext()).baseDataset.indexes.locationsBySlug.get(slug);
};

export const getAllEffectiveLoreCharacters = async (): Promise<LoreCharacter[]> => {
  return [...(await buildEffectiveLoreContext()).baseDataset.characters].sort(sortLoreCharacters);
};

export const getAllEffectiveLoreLocations = async (): Promise<LoreLocation[]> => {
  return [...(await buildEffectiveLoreContext()).baseDataset.locations].sort(sortLoreLocations);
};

export const getAllEffectiveLoreSeasons = async (): Promise<LoreSeason[]> => {
  return [...(await buildEffectiveLoreContext()).baseDataset.seasons].sort(sortLoreSeasons);
};

export const getEffectiveRelatedEntitiesForEvent = async (
  event: LoreEvent,
): Promise<LoreResolvedEntity[]> => {
  const context = await buildEffectiveLoreContext();

  return event.entityRefs.map((entityRef) => {
    if (entityRef.kind === 'character') {
      const character = context.baseDataset.indexes.charactersById.get(entityRef.id);
      return {
        ...entityRef,
        name: character?.name ?? entityRef.label ?? entityRef.id,
        slug: character?.slug,
        summary: character?.summary,
      };
    }

    if (entityRef.kind === 'location') {
      const location = context.baseDataset.indexes.locationsById.get(entityRef.id);
      return {
        ...entityRef,
        name: location?.name ?? entityRef.label ?? entityRef.id,
        slug: location?.slug,
        summary: location?.summary,
      };
    }

    if (entityRef.kind === 'event') {
      const relatedEvent = context.eventsById.get(entityRef.id);
      return {
        ...entityRef,
        name: relatedEvent?.title ?? entityRef.label ?? entityRef.id,
        slug: relatedEvent?.slug,
        summary: relatedEvent?.summary,
      };
    }

    return {
      ...entityRef,
      name: entityRef.label ?? entityRef.id,
    };
  });
};

export const getEffectiveSourcesForLocation = async (location: LoreLocation): Promise<SourceRecord[]> => {
  const context = await buildEffectiveLoreContext();
  return (location.sourceIds ?? []).flatMap((sourceId) => {
    const source = context.sourcesById.get(sourceId);
    return source ? [source] : [];
  });
};

export const getEffectiveMediaForLocation = async (location: LoreLocation): Promise<LoreMedia[]> => {
  const context = await buildEffectiveLoreContext();
  const sources = (location.sourceIds ?? []).flatMap((sourceId) => {
    const source = context.sourcesById.get(sourceId);
    return source ? [source] : [];
  });
  const mediaIds = [...new Set([
    ...(location.imageId ? [location.imageId] : []),
    ...sources.flatMap((source) => source.mediaIds ?? []),
  ])];

  return mediaIds.flatMap((mediaId) => {
    const media = context.mediaById.get(mediaId);
    return media ? [media] : [];
  });
};
