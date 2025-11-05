'use client';

import type { Location, CharacterLocation } from '@/lib/types/map';

interface MapTooltipProps {
  data: Location | CharacterLocation | null;
  type: 'location' | 'character' | 'burn' | 'death' | 'fight';
}

export function MapTooltip({ data, type }: MapTooltipProps) {
  if (!data) return null;

  const isLocation = type === 'location';
  const isCharacter = type === 'character';

  let title = '';
  let subtitle = '';

  if (isLocation) {
    const location = data as Location;
    title = location.name;
    subtitle = location.description || 'WAGDIE Location';
  } else if (isCharacter) {
    const charLocation = data as CharacterLocation;
    title = `Character #${charLocation.character_token_id}`;
    subtitle = charLocation.location?.name || 'Unknown Location';
  }

  return (
    <div className="bg-shadow border border-midnight rounded-lg p-3 shadow-lg max-w-xs">
      <div className="font-wagdie text-bone text-sm font-bold mb-1">{title}</div>
      {subtitle && (
        <div className="font-wagdie text-mist text-xs">{subtitle}</div>
      )}
      {isCharacter && (
        <div className="mt-2 flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-poison"></div>
          <span className="text-xs text-bone">Staked</span>
        </div>
      )}
      {isLocation && (data as Location).character_locations && (
        <div className="mt-2 flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-gold"></div>
          <span className="text-xs text-bone">
            {(data as Location).character_locations?.length || 0} characters
          </span>
        </div>
      )}
    </div>
  );
}
