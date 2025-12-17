import type { AssetError, ErrorRecoveryStrategy, IconType } from '@/types/assets';

const ASSET_URLS: Record<IconType, string> = {
  location: '/images/mapicons/icon_location.png',
  character: '/images/mapicons/icon_youarehere.png',
  burn: '/images/mapicons/icon_burn.png',
  death: '/images/mapicons/icon_death.png',
  fight: '/images/mapicons/icon_fight.png',

  legend_location_on: '/images/legendicons/legend_icon_location_on.png',
  legend_location_off: '/images/legendicons/legend_icon_location_off.png',
  legend_burn_on: '/images/legendicons/legend_icon_burn_on.png',
  legend_burn_off: '/images/legendicons/legend_icon_burn_off.png',
  legend_death_on: '/images/legendicons/legend_icon_death_on.png',
  legend_death_off: '/images/legendicons/legend_icon_death_off.png',
  legend_fight_on: '/images/legendicons/legend_icon_fight_on.png',
  legend_fight_off: '/images/legendicons/legend_icon_fight_off.png',
};

const FALLBACK_URLS: Record<IconType, string> = {
  location: '/images/mapicons/icon_location.png',
  character: '/images/mapicons/icon_youarehere.png',
  burn: '/images/mapicons/icon_burn.png',
  death: '/images/mapicons/icon_death.png',
  fight: '/images/mapicons/icon_fight.png',

  legend_location_on: '/images/legendicons/legend_icon_location_on.png',
  legend_location_off: '/images/legendicons/legend_icon_location_off.png',
  legend_burn_on: '/images/legendicons/legend_icon_burn_on.png',
  legend_burn_off: '/images/legendicons/legend_icon_burn_off.png',
  legend_death_on: '/images/legendicons/legend_icon_death_on.png',
  legend_death_off: '/images/legendicons/legend_icon_death_off.png',
  legend_fight_on: '/images/legendicons/legend_icon_fight_on.png',
  legend_fight_off: '/images/legendicons/legend_icon_fight_off.png',
};

const RECOVERY_STRATEGIES: Record<AssetError['errorType'], ErrorRecoveryStrategy> = {
  network: {
    errorType: 'network',
    maxRetries: 3,
    retryDelay: 1000,
    useFallback: true,
    logError: true,
  },
  file_not_found: {
    errorType: 'file_not_found',
    maxRetries: 1,
    retryDelay: 0,
    useFallback: true,
    logError: true,
  },
  timeout: {
    errorType: 'timeout',
    maxRetries: 2,
    retryDelay: 2000,
    useFallback: true,
    logError: true,
  },
  unknown: {
    errorType: 'unknown',
    maxRetries: 2,
    retryDelay: 1500,
    useFallback: true,
    logError: true,
  },
  corruption: {
    errorType: 'corruption',
    maxRetries: 0,
    retryDelay: 0,
    useFallback: true,
    logError: true,
  },
};

export function getAssetUrl(assetId: IconType): string {
  return ASSET_URLS[assetId];
}

export function getFallbackUrl(assetId: IconType): string {
  return FALLBACK_URLS[assetId];
}

export function getRecoveryStrategy(errorType: AssetError['errorType']): ErrorRecoveryStrategy {
  return { ...RECOVERY_STRATEGIES[errorType] };
}