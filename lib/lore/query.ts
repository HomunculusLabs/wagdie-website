import { loreCharacters } from './data/characters';
import { loreEvents } from './data/events';
import { loreLocations } from './data/locations';
import { loreMedia, loreSources } from './data/sources';
import { eventMatchesLoreArchiveFilters } from './filters';
import type {
  LoreArchiveFilters,
  LoreCharacter,
  LoreCharacterConnection,
  LoreEvent,
  LoreLocation,
  LoreMedia,
  LoreResolvedEntity,
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

export const getAllLoreEvents = (): LoreEvent[] => {
  return [...loreEvents].sort(byTimeline);
};

export const getOfficialEvents = (): LoreEvent[] => {
  return getAllLoreEvents().filter((event) => event.kind === 'official');
};

export const getCommunityEvents = (): LoreEvent[] => {
  return getAllLoreEvents().filter((event) => event.kind === 'community');
};

export const getLoreEventBySlug = (slug: string): LoreEvent | undefined => {
  return loreEvents.find((event) => event.slug === slug);
};

export const getOfficialEventBySlug = (slug: string): LoreEvent | undefined => {
  const event = getLoreEventBySlug(slug);
  return event?.kind === 'official' ? event : undefined;
};

export const getCommunityEventBySlug = (slug: string): LoreEvent | undefined => {
  const event = getLoreEventBySlug(slug);
  return event?.kind === 'community' ? event : undefined;
};

export const getCharacterBySlug = (slug: string): LoreCharacter | undefined => {
  return loreCharacters.find((character) => character.slug === slug);
};

export const getLocationBySlug = (slug: string): LoreLocation | undefined => {
  return loreLocations.find((location) => location.slug === slug);
};

export const getEventsForCharacter = (characterId: string): LoreEvent[] => {
  return getAllLoreEvents().filter((event) => event.characterIds.includes(characterId));
};


export const getCharacterConnections = (characterId: string): LoreCharacterConnection[] => {
  const appearances = getEventsForCharacter(characterId);
  const sharedEventIdsByCharacter = new Map<string, Set<string>>();

  appearances.forEach((event) => {
    event.characterIds.forEach((coCharacterId) => {
      if (coCharacterId === characterId) {
        return;
      }

      const sharedEventIds = sharedEventIdsByCharacter.get(coCharacterId) ?? new Set<string>();
      sharedEventIds.add(event.id);
      sharedEventIdsByCharacter.set(coCharacterId, sharedEventIds);
    });
  });

  return [...sharedEventIdsByCharacter.entries()]
    .map(([coCharacterId, sharedEventIds]) => {
      const character = loreCharacters.find((item) => item.id === coCharacterId);

      if (!character) {
        return undefined;
      }

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

export const getArchiveItems = (filters: LoreArchiveFilters = {}): LoreEvent[] => {
  return getAllLoreEvents().filter((event) => eventMatchesLoreArchiveFilters(event, filters));
};

export const getSourcesForEvent = (event: LoreEvent): SourceRecord[] => {
  return event.sourceIds.flatMap((sourceId) => {
    const source = sourceById.get(sourceId);
    return source ? [source] : [];
  });
};

export const getMediaForEvent = (event: LoreEvent): LoreMedia[] => {
  const sourceMediaIds = getSourcesForEvent(event).flatMap((source) => source.mediaIds ?? []);
  const mediaIds = [...new Set([...(event.mediaIds ?? []), ...sourceMediaIds])];

  return mediaIds.flatMap((mediaId) => {
    const media = mediaById.get(mediaId);
    return media ? [media] : [];
  });
};

export const getRelatedEntitiesForEvent = (event: LoreEvent): LoreResolvedEntity[] => {
  return event.entityRefs.map((entityRef) => {
    if (entityRef.kind === 'character') {
      const character = loreCharacters.find((item) => item.id === entityRef.id);
      return {
        ...entityRef,
        name: character?.name ?? entityRef.label ?? entityRef.id,
        slug: character?.slug,
        summary: character?.summary,
      };
    }

    if (entityRef.kind === 'location') {
      const location = loreLocations.find((item) => item.id === entityRef.id);
      return {
        ...entityRef,
        name: location?.name ?? entityRef.label ?? entityRef.id,
        slug: location?.slug,
        summary: location?.summary,
      };
    }

    if (entityRef.kind === 'event') {
      const relatedEvent = loreEvents.find((item) => item.id === entityRef.id);
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

export const getAllLoreCharacters = (): LoreCharacter[] => {
  return [...loreCharacters].sort((a, b) => a.name.localeCompare(b.name));
};

export const getAllLoreLocations = (): LoreLocation[] => {
  return [...loreLocations].sort((a, b) => a.name.localeCompare(b.name));
};

export const getAllLoreSources = (): SourceRecord[] => {
  return [...loreSources].sort((a, b) => a.title.localeCompare(b.title));
};
