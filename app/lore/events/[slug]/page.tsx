import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { BannerHeader } from '@/components/shared/BannerHeader';
import { LoreEventDetail } from '@/components/lore/LoreEventDetail';
import {
  getAllLoreCharacters,
  getAllLoreLocations,
  getRelatedEntitiesForEvent,
  loreSeasons,
} from '@/lib/lore';
import {
  getAllEffectiveLoreEvents,
  getEffectiveMediaForEvent,
  getEffectiveOfficialEventBySlug,
  getEffectiveSourcesForEvent,
} from '@/lib/lore/effective-query';
import type { LoreEvent } from '@/lib/lore/types';

export const dynamic = 'force-dynamic';

interface LoreEventPageProps {
  params: Promise<{ slug: string }>;
}

const getRelatedEvents = (event: LoreEvent, allEvents: LoreEvent[]) => {
  return allEvents
    .filter((candidate) => candidate.id !== event.id)
    .filter((candidate) => (
      candidate.characterIds.some((characterId) => event.characterIds.includes(characterId)) ||
      candidate.locationIds.some((locationId) => event.locationIds.includes(locationId))
    ))
    .slice(0, 4);
};

const resolveEventPageData = async (slug: string) => {
  const allEvents = await getAllEffectiveLoreEvents();
  const event = allEvents.find((candidate) => candidate.slug === slug && candidate.kind === 'official');

  if (!event) {
    return undefined;
  }

  const allCharacters = getAllLoreCharacters();
  const allLocations = getAllLoreLocations();
  const characterById = new Map(allCharacters.map((character) => [character.id, character]));
  const locationById = new Map(allLocations.map((location) => [location.id, location]));

  return {
    event,
    allLocations,
    locations: event.locationIds.flatMap((locationId) => {
      const location = locationById.get(locationId);
      return location ? [location] : [];
    }),
    characters: event.characterIds.flatMap((characterId) => {
      const character = characterById.get(characterId);
      return character ? [character] : [];
    }),
    season: event.seasonId ? loreSeasons.find((season) => season.id === event.seasonId) : undefined,
    relatedEntities: getRelatedEntitiesForEvent(event),
    sources: await getEffectiveSourcesForEvent(event),
    media: await getEffectiveMediaForEvent(event),
    relatedEvents: getRelatedEvents(event, allEvents),
  };
};


export async function generateMetadata({ params }: LoreEventPageProps): Promise<Metadata> {
  const { slug } = await params;
  const event = await getEffectiveOfficialEventBySlug(slug);

  if (!event) {
    return {
      title: 'Official lore record not found | WAGDIE',
    };
  }

  return {
    title: `${event.title} | WAGDIE Lore`,
    description: event.summary,
  };
}

export default async function OfficialLoreEventPage({ params }: LoreEventPageProps) {
  const { slug } = await params;
  const data = await resolveEventPageData(slug);

  if (!data) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-soul-950">
      <BannerHeader
        title="Official Lore Record"
        subtitle="A canonical event drawn from the official WAGDIE lore archive."
      />
      <LoreEventDetail
        event={data.event}
        season={data.season}
        locations={data.locations}
        characters={data.characters}
        relatedEntities={data.relatedEntities}
        sources={data.sources}
        media={data.media}
        relatedEvents={data.relatedEvents}
        seasons={loreSeasons}
        allLocations={data.allLocations}
      />
    </div>
  );
}
