import type { IconType } from '@/types/assets';

export const ALLOWED_ASSET_IDS: ReadonlySet<IconType> = new Set<IconType>([
  'location',
  'character',
  'burn',
  'death',
  'fight',
  'legend_location_on',
  'legend_location_off',
  'legend_burn_on',
  'legend_burn_off',
  'legend_death_on',
  'legend_death_off',
  'legend_fight_on',
  'legend_fight_off',
]);

export function isAllowedAssetId(value: string): value is IconType {
  return (ALLOWED_ASSET_IDS as ReadonlySet<string>).has(value);
}