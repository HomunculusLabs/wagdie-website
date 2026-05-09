import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { BannerHeader } from '@/components/shared/BannerHeader';
import { CharacterProfile } from '@/components/lore/CharacterProfile';
import {
  getAllLoreCharacters,
  getAllLoreEvents,
  getAllLoreLocations,
  getCharacterBySlug,
  getEventsForCharacter,
  getCharacterConnections,
  getSourcesForEvent,
  loreMedia,
  loreSeasons,
} from '@/lib/lore';

interface LoreCharacterPageProps {
  params: Promise<{ slug: string }>;
}

const resolveCharacterPageData = (slug: string) => {
  const character = getCharacterBySlug(slug);

  if (!character) {
    return undefined;
  }

  const appearedInEvents = getEventsForCharacter(character.id).sort((a, b) => (
    a.timelineOrder - b.timelineOrder || a.title.localeCompare(b.title)
  ));
  const allLocations = getAllLoreLocations();
  const locationById = new Map(allLocations.map((location) => [location.id, location]));
  const associatedLocationIds = new Set(appearedInEvents.flatMap((event) => event.locationIds));
  const associatedLocations = [...associatedLocationIds].flatMap((locationId) => {
    const location = locationById.get(locationId);
    return location ? [location] : [];
  });
  const characterConnections = getCharacterConnections(character.id);
  const firstAppearance = character.firstAppearanceEventId
    ? getAllLoreEvents().find((event) => event.id === character.firstAppearanceEventId)
    : appearedInEvents[0];
  const image = character.imageId
    ? loreMedia.find((media) => media.id === character.imageId)
    : undefined;
  const sourceById = new Map(
    appearedInEvents
      .flatMap((event) => getSourcesForEvent(event))
      .map((source) => [source.id, source]),
  );

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

export function generateStaticParams() {
  return getAllLoreCharacters().map((character) => ({ slug: character.slug }));
}

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
  const data = resolveCharacterPageData(slug);

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
