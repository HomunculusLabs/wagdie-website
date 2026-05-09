import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { BannerHeader } from '@/components/shared/BannerHeader';
import { LocationProfile } from '@/components/lore/LocationProfile';
import {
  getAllLoreCharacters,
  getAllLoreLocations,
  getLocationBySlug,
  getMediaForLocation,
  getSourcesForLocation,
  loreSeasons,
} from '@/lib/lore';
import { getEffectiveEventsForLocation } from '@/lib/lore/effective-query';

export const dynamic = 'force-dynamic';

interface LoreLocationPageProps {
  params: Promise<{ slug: string }>;
}

const resolveLocationPageData = async (slug: string) => {
  const location = getLocationBySlug(slug);

  if (!location) {
    return undefined;
  }

  return {
    location,
    events: await getEffectiveEventsForLocation(location.id),
    allLocations: getAllLoreLocations(),
    characters: getAllLoreCharacters(),
    media: getMediaForLocation(location),
    sources: getSourcesForLocation(location),
  };
};


export async function generateMetadata({ params }: LoreLocationPageProps): Promise<Metadata> {
  const { slug } = await params;
  const location = getLocationBySlug(slug);

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
        seasons={loreSeasons}
        allLocations={data.allLocations}
        characters={data.characters}
        media={data.media}
        sources={data.sources}
      />
    </div>
  );
}
