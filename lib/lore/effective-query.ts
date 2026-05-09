import { loreCharacters } from './data/characters';
import { loreEvents } from './data/events';
import { loreLocations } from './data/locations';
import { loreMedia, loreSources } from './data/sources';
import { eventMatchesLoreArchiveFilters } from './filters';
import { adaptLoreSubmissionToEffectiveLore, type AdaptedLoreSubmission } from './submissions/adapter';
import { loreCanonizationRepository } from '@/lib/repositories/lore-canonization-repository';
import { loreSubmissionRepository } from '@/lib/repositories/lore-submission-repository';
import type {
  LoreCanonizationOverride,
  LoreCanonizationOverrideSet,
} from './canonization-overrides';
import type {
  LoreArchiveFilters,
  LoreCharacterConnection,
  LoreEvent,
  LoreMedia,
  SourceRecord,
} from './types';

const sourceById = new Map<string, SourceRecord>(
  loreSources.map((source) => [source.id, source as SourceRecord]),
);
const mediaById = new Map<string, LoreMedia>(
  loreMedia.map((media) => [media.id, media as LoreMedia]),
);

const byTimeline = (a: LoreEvent, b: LoreEvent): number => {
  if (a.timelineOrder !== b.timelineOrder) {
    return a.timelineOrder - b.timelineOrder;
  }

  return a.title.localeCompare(b.title);
};

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

export const getAllEffectiveLoreEvents = async (): Promise<LoreEvent[]> => {
  const [overrideSets, submissionLore] = await Promise.all([
    fetchPublishedOverrideSets(),
    fetchPublishedSubmissionLore(),
  ]);
  return [
    ...applyPublishedCanonizationOverrides([...loreEvents], overrideSets),
    ...submissionLore.map((record) => record.event),
  ].sort(byTimeline);
};

export const getEffectiveOfficialEvents = async (): Promise<LoreEvent[]> => {
  return (await getAllEffectiveLoreEvents()).filter((event) => event.kind === 'official');
};

export const getEffectiveCommunityEvents = async (): Promise<LoreEvent[]> => {
  return (await getAllEffectiveLoreEvents()).filter((event) => event.kind === 'community');
};

export const getEffectiveLoreEventBySlug = async (slug: string): Promise<LoreEvent | undefined> => {
  return (await getAllEffectiveLoreEvents()).find((event) => event.slug === slug);
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
  return (await getAllEffectiveLoreEvents()).filter((event) => eventMatchesLoreArchiveFilters(event, filters));
};

export const getEffectiveEventsForCharacter = async (characterId: string): Promise<LoreEvent[]> => {
  return (await getAllEffectiveLoreEvents()).filter((event) => event.characterIds.includes(characterId));
};

export const getEffectiveEventsForLocation = async (locationId: string): Promise<LoreEvent[]> => {
  return (await getAllEffectiveLoreEvents()).filter((event) => event.locationIds.includes(locationId));
};

const getEffectiveSubmissionSourceAndMedia = async (): Promise<{
  sourcesById: Map<string, SourceRecord>;
  mediaById: Map<string, LoreMedia>;
}> => {
  const submissionLore = await fetchPublishedSubmissionLore();
  return {
    sourcesById: new Map(submissionLore.flatMap((record) => record.sources.map((source) => [source.id, source] as const))),
    mediaById: new Map(submissionLore.flatMap((record) => record.media.map((media) => [media.id, media] as const))),
  };
};

export const getEffectiveSourcesForEvent = async (event: LoreEvent): Promise<SourceRecord[]> => {
  const submissionRecords = await getEffectiveSubmissionSourceAndMedia();
  return event.sourceIds.flatMap((sourceId) => {
    const source = sourceById.get(sourceId) ?? submissionRecords.sourcesById.get(sourceId);
    return source ? [source] : [];
  });
};

export const getEffectiveMediaForEvent = async (event: LoreEvent): Promise<LoreMedia[]> => {
  const [sources, submissionRecords] = await Promise.all([
    getEffectiveSourcesForEvent(event),
    getEffectiveSubmissionSourceAndMedia(),
  ]);
  const sourceMediaIds = sources.flatMap((source) => source.mediaIds ?? []);
  const mediaIds = [...new Set([...(event.mediaIds ?? []), ...sourceMediaIds])];

  return mediaIds.flatMap((mediaId) => {
    const media = mediaById.get(mediaId) ?? submissionRecords.mediaById.get(mediaId);
    return media ? [media] : [];
  });
};

export const getEffectiveCharacterConnections = async (
  characterId: string,
): Promise<LoreCharacterConnection[]> => {
  const appearances = await getEffectiveEventsForCharacter(characterId);
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
      const character = loreCharacters.find((item) => item.id === coCharacterId);
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

export const getAllEffectiveLoreLocations = () => {
  return [...loreLocations].sort((a, b) => a.name.localeCompare(b.name));
};
