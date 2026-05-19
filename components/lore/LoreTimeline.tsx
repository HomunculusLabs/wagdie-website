import { LoreEventCard } from './LoreEventCard';
import type { LoreCharacter, LoreEvent, LoreLocation, LoreSeason, SourceRecord } from '@/lib/lore/types';

interface LoreTimelineProps {
  items: LoreEvent[];
  seasons: LoreSeason[];
  locations?: LoreLocation[];
  characters: LoreCharacter[];
  sourcesByEventId?: Record<string, SourceRecord[]>;
}

export function LoreTimeline({ items, seasons, characters }: LoreTimelineProps) {
  const seasonsById = new Map(seasons.map((season) => [season.id, season]));
  const charactersById = new Map(characters.map((character) => [character.id, character]));

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {items.map((event) => (
        <LoreEventCard
          key={event.id}
          event={event}
          season={event.seasonId ? seasonsById.get(event.seasonId) : undefined}
          characters={event.characterIds.flatMap((characterId) => {
            const character = charactersById.get(characterId);
            return character ? [character] : [];
          })}
        />
      ))}
    </div>
  );
}
