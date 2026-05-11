import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { BannerHeader } from '@/components/shared/BannerHeader';
import { LocationProfile } from '@/components/lore/LocationProfile';
import {
  getAllEffectiveLoreCharacters,
  getAllEffectiveLoreLocations,
  getAllEffectiveLoreSeasons,
  getEffectiveEventsForLocation,
  getEffectiveLocationBySlug,
  getEffectiveMediaForLocation,
  getEffectiveSourcesByEventId,
  getEffectiveSourcesForLocation,
} from '@/lib/lore/effective-query';

export const dynamic = 'force-dynamic';

interface LoreLocationPageProps {
  params: Promise<{ slug: string }>;
}

const resolveLocationPageData = async (slug: string) => {
  const location = await getEffectiveLocationBySlug(slug);

  if (!location) {
    return undefined;
  }

  const [events, allLocations, characters, seasons, media, sources] = await Promise.all([
    getEffectiveEventsForLocation(location.id),
    getAllEffectiveLoreLocations(),
    getAllEffectiveLoreCharacters(),
    getAllEffectiveLoreSeasons(),
    getEffectiveMediaForLocation(location),
    getEffectiveSourcesForLocation(location),
  ]);
  const sourcesByEventId = await getEffectiveSourcesByEventId(events);

  return {
    location,
    events,
    allLocations,
    characters,
    seasons,
    media,
    sources,
    sourcesByEventId,
  };
};

export async function generateMetadata({ params }: LoreLocationPageProps): Promise<Metadata> {
  const { slug } = await params;
  const location = await getEffectiveLocationBySlug(slug);

  if (!location) {
    return {
      title: 'Lore location not found | WAGDIE',
    };
  }

  return {
    title: `${location.name} | Lore Locations | WAGDIE`,
    description: location.summary,
  };
}

export default async function LoreLocationPage({ params }: LoreLocationPageProps) {
  const { slug } = await params;
  const data = await resolveLocationPageData(slug);

  if (!data) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-soul-950">
      <BannerHeader
        title="Location Lore Profile"
        subtitle="Every official and community record tied to a place in the WAGDIE archive."
      />
      <LocationProfile
        location={data.location}
        events={data.events}
        seasons={data.seasons}
        allLocations={data.allLocations}
        characters={data.characters}
        media={data.media}
        sources={data.sources}
        sourcesByEventId={data.sourcesByEventId}
      />
    </div>
  );
}
