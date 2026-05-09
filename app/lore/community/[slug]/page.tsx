import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { BannerHeader } from '@/components/shared/BannerHeader';
import { CommunityEventDetail } from '@/components/lore/CommunityEventDetail';
import {
  getAllLoreCharacters,
  getAllLoreEvents,
  getAllLoreLocations,
  getCommunityEventBySlug,
  getCommunityEvents,
  getMediaForEvent,
  getRelatedEntitiesForEvent,
  getSourcesForEvent,
  loreSeasons,
} from '@/lib/lore';
import type { LoreEvent } from '@/lib/lore/types';

interface CommunityLoreEventPageProps {
  params: Promise<{ slug: string }>;
}

const getRelatedEvents = (event: LoreEvent) => {
  return getAllLoreEvents()
    .filter((candidate) => candidate.id !== event.id)
    .filter((candidate) => (
      candidate.characterIds.some((characterId) => event.characterIds.includes(characterId)) ||
      candidate.locationIds.some((locationId) => event.locationIds.includes(locationId))
    ))
    .slice(0, 4);
};

const resolveEventPageData = (slug: string) => {
  const event = getCommunityEventBySlug(slug);

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
    sources: getSourcesForEvent(event),
    media: getMediaForEvent(event),
    relatedEvents: getRelatedEvents(event),
  };
};

export function generateStaticParams() {
  return getCommunityEvents().map((event) => ({ slug: event.slug }));
}

export async function generateMetadata({ params }: CommunityLoreEventPageProps): Promise<Metadata> {
  const { slug } = await params;
  const event = getCommunityEventBySlug(slug);

  if (!event) {
    return {
      title: 'Community lore record not found | WAGDIE',
    };
  }

  return {
    title: `${event.title} | WAGDIE Community Lore`,
    description: `${event.summary} Canon status: ${event.canon.status}.`,
  };
}

export default async function CommunityLoreEventPage({ params }: CommunityLoreEventPageProps) {
  const { slug } = await params;
  const data = resolveEventPageData(slug);

  if (!data) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-soul-950">
      <BannerHeader
        title="Community Lore Record"
        subtitle="A community-originated chronicle with explicit canon status, attribution, and preservation context."
      />
      <CommunityEventDetail
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
