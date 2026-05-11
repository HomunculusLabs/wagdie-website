import { LoreEventCard } from './LoreEventCard';
import type { LoreCharacter, LoreEvent, LoreLocation, LoreSeason, SourceRecord } from '@/lib/lore/types';

interface LoreTimelineProps {
  items: LoreEvent[];
  seasons: LoreSeason[];
  locations: LoreLocation[];
  characters: LoreCharacter[];
  sourcesByEventId?: Record<string, SourceRecord[]>;
}

export function LoreTimeline({ items, seasons, locations, characters, sourcesByEventId = {} }: LoreTimelineProps) {
  const seasonsById = new Map(seasons.map((season) => [season.id, season]));
  const locationsById = new Map(locations.map((location) => [location.id, location]));
  const charactersById = new Map(characters.map((character) => [character.id, character]));

  return (
    <div className="relative space-y-6">
      <div className="absolute left-3 top-0 hidden h-full w-px bg-gradient-to-b from-soul-accent/40 via-midnight-light to-transparent md:block" />

      {items.map((event) => (
        <div key={event.id} className="relative md:pl-10">
          <div className="absolute left-[0.45rem] top-8 hidden h-4 w-4 rounded-full border border-soul-accent/50 bg-soul-950 shadow-soul-glow md:block" />
          <LoreEventCard
            event={event}
            season={event.seasonId ? seasonsById.get(event.seasonId) : undefined}
            locations={event.locationIds.flatMap((locationId) => {
              const location = locationsById.get(locationId);
              return location ? [location] : [];
            })}
            characters={event.characterIds.flatMap((characterId) => {
              const character = charactersById.get(characterId);
              return character ? [character] : [];
            })}
            sources={sourcesByEventId[event.id] ?? []}
          />
        </div>
      ))}
    </div>
  );
}
