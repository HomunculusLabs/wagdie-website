import type { Character } from '@/types/character';
import { getCharacterImageUrl } from '@/lib/utils/image';

export function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

export function truncateAddress(address?: string, left = 6, right = 4): string {
  if (!address) return '—';
  if (address.length <= left + right) return address;
  return `${address.slice(0, left)}...${address.slice(-right)}`;
}

export function getMarkerTitle(marker: { name?: string } | null): string {
  if (!marker) return 'Map';
  if (isNonEmptyString(marker.name)) return marker.name;
  return 'Marker Details';
}

export function getCharacterName(character: Character): string {
  const byName = character.name?.trim();
  if (byName) return byName;

  const byMetadata = character.metadata?.name?.trim();
  if (byMetadata) return byMetadata;

  return `#${character.token_id}`;
}

export function getCharacterImage(character: Character): string {
  return getCharacterImageUrl(character.token_id, character.metadata, character.image_url, {
    infectionStatus: character.infection_status,
    isInfected: character.infected,
  });
}

export function uniqueNumberList(items: number[]): number[] {
  const seen = new Set<number>();
  const out: number[] = [];

  for (const item of items) {
    if (typeof item !== 'number') continue;
    if (Number.isNaN(item)) continue;
    if (seen.has(item)) continue;

    seen.add(item);
    out.push(item);
  }

  return out;
}

