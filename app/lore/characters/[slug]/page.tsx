import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { BannerHeader } from '@/components/shared/BannerHeader';
import { CharacterProfile } from '@/components/lore/CharacterProfile';
import {
  getAllLoreCharacters,
  getAllLoreLocations,
  getCharacterBySlug,
  loreMedia,
  loreSeasons,
} from '@/lib/lore';
import {
  getAllEffectiveLoreEvents,
  getEffectiveCharacterConnections,
  getEffectiveEventsForCharacter,
  getEffectiveSourcesForEvent,
} from '@/lib/lore/effective-query';

export const dynamic = 'force-dynamic';

interface LoreCharacterPageProps {
  params: Promise<{ slug: string }>;
}

const resolveCharacterPageData = async (slug: string) => {
  const character = getCharacterBySlug(slug);

  if (!character) {
    return undefined;
  }

  const allEffectiveEvents = await getAllEffectiveLoreEvents();
  const appearedInEvents = (await getEffectiveEventsForCharacter(character.id)).sort((a, b) => (
    a.timelineOrder - b.timelineOrder || a.title.localeCompare(b.title)
  ));
  const allLocations = getAllLoreLocations();
  const locationById = new Map(allLocations.map((location) => [location.id, location]));
  const associatedLocationIds = new Set(appearedInEvents.flatMap((event) => event.locationIds));
  const associatedLocations = [...associatedLocationIds].flatMap((locationId) => {
    const location = locationById.get(locationId);
    return location ? [location] : [];
  });
  const characterConnections = await getEffectiveCharacterConnections(character.id);
  const firstAppearance = character.firstAppearanceEventId
    ? allEffectiveEvents.find((event) => event.id === character.firstAppearanceEventId)
    : appearedInEvents[0];
  const image = character.imageId
    ? loreMedia.find((media) => media.id === character.imageId)
    : undefined;
  const appearedInSources = (await Promise.all(
    appearedInEvents.map((event) => getEffectiveSourcesForEvent(event)),
  )).flat();
  const sourceById = new Map(appearedInSources.map((source) => [source.id, source]));

  return {
    character,
    image,
    appearedInEvents,
    firstAppearance,
    associatedLocations,
    characterConnections,
    allLocations,
    sources: [...sourceById.values()],
  };
};


export async function generateMetadata({ params }: LoreCharacterPageProps): Promise<Metadata> {
  const { slug } = await params;
  const character = getCharacterBySlug(slug);

  if (!character) {
    return {
      title: 'Lore character not found | WAGDIE',
    };
  }

  return {
    title: `${character.name} | WAGDIE Lore Character`,
    description: character.summary,
  };
}

export default async function LoreCharacterPage({ params }: LoreCharacterPageProps) {
  const { slug } = await params;
  const data = await resolveCharacterPageData(slug);

  if (!data) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-soul-950">
      <BannerHeader
        title="Character Lore Profile"
        subtitle="Every official and community appearance for a character, ordered through the shared lore timeline."
      />
      <CharacterProfile
        character={data.character}
        image={data.image}
        appearedInEvents={data.appearedInEvents}
        firstAppearance={data.firstAppearance}
        associatedLocations={data.associatedLocations}
        characterConnections={data.characterConnections}
        seasons={loreSeasons}
        allLocations={data.allLocations}
        sources={data.sources}
      />
    </div>
  );
}
