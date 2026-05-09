import {
  getAllLoreCharacters,
  getAllLoreLocations,
  getAllLoreSources,
  getCommunityEvents,
  getMediaForEvent,
  getOfficialEvents,
  getRelatedEntitiesForEvent,
  getSourcesForEvent,
  loreSeasons,
} from '@/lib/lore';
import type { LoreCharacter, LoreLocation } from '@/lib/lore/types';

const officialEvent = getOfficialEvents()[0];
const communityCanonizingEvent = getCommunityEvents().find((event) => event.canon.status === 'canonizing')!;
const communityRecordedEvent = getCommunityEvents().find((event) => event.canon.status === 'community')!;
const disputedEvent = getCommunityEvents().find((event) => event.canon.status === 'disputed')!;

export const loreStoryData = {
  seasons: loreSeasons,
  locations: getAllLoreLocations(),
  characters: getAllLoreCharacters(),
  allSources: getAllLoreSources(),
  officialEvent,
  communityCanonizingEvent,
  communityRecordedEvent,
  disputedEvent,
  officialEventSources: getSourcesForEvent(officialEvent),
  communityCanonizingSources: getSourcesForEvent(communityCanonizingEvent),
  communityRecordedSources: getSourcesForEvent(communityRecordedEvent),
  disputedSources: getSourcesForEvent(disputedEvent),
  officialEventMedia: getMediaForEvent(officialEvent),
  communityCanonizingMedia: getMediaForEvent(communityCanonizingEvent),
  officialRelatedEntities: getRelatedEntitiesForEvent(officialEvent),
  communityRelatedEntities: getRelatedEntitiesForEvent(communityCanonizingEvent),
  relatedEvents: getOfficialEvents().slice(1),
};

export const characterWithNoAppearances: LoreCharacter = {
  id: 'character-ghost-archivist',
  slug: 'ghost-archivist',
  name: 'Ghost Archivist',
  aliases: ['The Silent Ledger'],
  summary: 'A placeholder archivist profile used to exercise empty appearance states.',
  tags: ['archive', 'observer'],
};


export const locationWithNoEvents: LoreLocation = {
  id: 'location-silent-barrow',
  slug: 'silent-barrow',
  name: 'Silent Barrow',
  aliases: ['The Unrecorded Mound'],
  summary: 'A story fixture for a location with no linked archive records.',
  description: 'The Silent Barrow exists only in Storybook to verify the location empty state.',
  tags: ['fixture', 'empty'],
};
