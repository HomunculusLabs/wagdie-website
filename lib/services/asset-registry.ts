/**
 * Asset Registry Service
 *
 * Manages registration and retrieval of asset definitions.
 * Provides centralized access to all asset metadata.
 */

import type {
  BaseAsset,
  AssetCategory,
  AssetPriority,
  AssetRegistry as IAssetRegistry
} from '@/types/assets';

export class AssetRegistry implements IAssetRegistry {
  private assets: Map<string, BaseAsset> = new Map();

  constructor() {
    this.initializeDefaultAssets();
  }

  /**
   * Get all registered assets
   */
  getAllAssets(): BaseAsset[] {
    return Array.from(this.assets.values());
  }

  /**
   * Get asset by ID
   */
  getAssetById(id: string): BaseAsset | undefined {
    return this.assets.get(id);
  }

  /**
   * Get assets by category
   */
  getAssetsByCategory(category: AssetCategory): BaseAsset[] {
    return Array.from(this.assets.values()).filter(
      asset => asset.category === category
    );
  }

  /**
   * Get all critical priority assets
   */
  getCriticalAssets(): BaseAsset[] {
    return Array.from(this.assets.values()).filter(
      asset => asset.priority === 'critical'
    );
  }

  /**
   * Register a new asset
   */
  registerAsset(asset: BaseAsset): void {
    this.assets.set(asset.id, asset);
  }

  /**
   * Update an existing asset
   */
  updateAsset(id: string, updates: Partial<BaseAsset>): boolean {
    const existing = this.assets.get(id);
    if (!existing) return false;

    const updated = { ...existing, ...updates };
    this.assets.set(id, updated);
    return true;
  }

  /**
   * Remove an asset from registry
   */
  removeAsset(id: string): boolean {
    return this.assets.delete(id);
  }

  /**
   * Check if asset exists
   */
  hasAsset(id: string): boolean {
    return this.assets.has(id);
  }

  /**
   * Get asset count
   */
  getAssetCount(): number {
    return this.assets.size;
  }

  /**
   * Get assets by priority
   */
  getAssetsByPriority(priority: AssetPriority): BaseAsset[] {
    return Array.from(this.assets.values()).filter(
      asset => asset.priority === priority
    );
  }

  /**
   * Initialize default assets based on available files
   */
  private initializeDefaultAssets(): void {
    // Map marker assets (critical)
    const markerAssets: BaseAsset[] = [
      {
        id: 'location',
        name: 'Location Marker',
        iconUrl: '/images/mapicons/icon_location.png',
        fallbackUrl: '/images/mapicons/icon_location.png',
        category: 'marker',
        priority: 'critical'
      },
      {
        id: 'character',
        name: 'Character Marker',
        iconUrl: '/images/mapicons/icon_youarehere.png',
        fallbackUrl: '/images/mapicons/icon_youarehere.png',
        category: 'marker',
        priority: 'critical'
      },
      {
        id: 'burn',
        name: 'Burn Event Marker',
        iconUrl: '/images/mapicons/icon_burn.png',
        fallbackUrl: '/images/mapicons/icon_burn.png',
        category: 'marker',
        priority: 'critical'
      },
      {
        id: 'death',
        name: 'Death Event Marker',
        iconUrl: '/images/mapicons/icon_death.png',
        fallbackUrl: '/images/mapicons/icon_death.png',
        category: 'marker',
        priority: 'critical'
      },
      {
        id: 'fight',
        name: 'Fight Event Marker',
        iconUrl: '/images/mapicons/icon_fight.png',
        fallbackUrl: '/images/mapicons/icon_fight.png',
        category: 'marker',
        priority: 'critical'
      }
    ];

    // Legend icon assets (non-critical)
    const legendAssets: BaseAsset[] = [
      {
        id: 'legend_location_on',
        name: 'Location Legend On',
        iconUrl: '/images/legendicons/legend_icon_location_on.png',
        fallbackUrl: '/images/legendicons/legend_icon_location_on.png',
        category: 'legend',
        priority: 'non-critical'
      },
      {
        id: 'legend_location_off',
        name: 'Location Legend Off',
        iconUrl: '/images/legendicons/legend_icon_location_off.png',
        fallbackUrl: '/images/legendicons/legend_icon_location_off.png',
        category: 'legend',
        priority: 'non-critical'
      },
      {
        id: 'legend_burn_on',
        name: 'Burn Legend On',
        iconUrl: '/images/legendicons/legend_icon_burn_on.png',
        fallbackUrl: '/images/legendicons/legend_icon_burn_on.png',
        category: 'legend',
        priority: 'non-critical'
      },
      {
        id: 'legend_burn_off',
        name: 'Burn Legend Off',
        iconUrl: '/images/legendicons/legend_icon_burn_off.png',
        fallbackUrl: '/images/legendicons/legend_icon_burn_off.png',
        category: 'legend',
        priority: 'non-critical'
      },
      {
        id: 'legend_death_on',
        name: 'Death Legend On',
        iconUrl: '/images/legendicons/legend_icon_death_on.png',
        fallbackUrl: '/images/legendicons/legend_icon_death_on.png',
        category: 'legend',
        priority: 'non-critical'
      },
      {
        id: 'legend_death_off',
        name: 'Death Legend Off',
        iconUrl: '/images/legendicons/legend_icon_death_off.png',
        fallbackUrl: '/images/legendicons/legend_icon_death_off.png',
        category: 'legend',
        priority: 'non-critical'
      },
      {
        id: 'legend_fight_on',
        name: 'Fight Legend On',
        iconUrl: '/images/legendicons/legend_icon_fight_on.png',
        fallbackUrl: '/images/legendicons/legend_icon_fight_on.png',
        category: 'legend',
        priority: 'non-critical'
      },
      {
        id: 'legend_fight_off',
        name: 'Fight Legend Off',
        iconUrl: '/images/legendicons/legend_icon_fight_off.png',
        fallbackUrl: '/images/legendicons/legend_icon_fight_off.png',
        category: 'legend',
        priority: 'non-critical'
      }
    ];

    // Border assets (non-critical)
    const borderAssets: BaseAsset[] = [
      {
        id: 'border_bottom_l',
        name: 'Bottom Left Border',
        iconUrl: '/images/border-bottom-l.png',
        fallbackUrl: '/images/border-bottom-l.png',
        category: 'border',
        priority: 'non-critical'
      },
      {
        id: 'border_bottom_r',
        name: 'Bottom Right Border',
        iconUrl: '/images/border-bottom-r.png',
        fallbackUrl: '/images/border-bottom-r.png',
        category: 'border',
        priority: 'non-critical'
      },
      {
        id: 'border_left',
        name: 'Left Border',
        iconUrl: '/images/border-l.png',
        fallbackUrl: '/images/border-l.png',
        category: 'border',
        priority: 'non-critical'
      },
      {
        id: 'border_right',
        name: 'Right Border',
        iconUrl: '/images/border-r.png',
        fallbackUrl: '/images/border-r.png',
        category: 'border',
        priority: 'non-critical'
      }
    ];

    // Background assets (non-critical)
    const backgroundAssets: BaseAsset[] = [
      {
        id: 'wagdie_logo',
        name: 'WAGDIE Logo',
        iconUrl: '/images/wagdie.png',
        fallbackUrl: '/images/wagdie.png',
        category: 'background',
        priority: 'non-critical'
      },
      {
        id: 'wagdie_map',
        name: 'WAGDIE Map Background',
        iconUrl: '/images/wagdiemap.png',
        fallbackUrl: '/images/wagdiemap.png',
        category: 'background',
        priority: 'non-critical'
      },
      {
        id: 'pilgrims',
        name: 'Pilgrims Image',
        iconUrl: '/images/pilgrims.png',
        fallbackUrl: '/images/pilgrims.png',
        category: 'background',
        priority: 'non-critical'
      }
    ];

    // Other assets (non-critical)
    const otherAssets: BaseAsset[] = [
      {
        id: 'fire_animation',
        name: 'Fire Animation',
        iconUrl: '/images/fire.gif',
        fallbackUrl: '/images/fire.gif',
        category: 'background',
        priority: 'non-critical'
      },
      {
        id: 'arrow_down',
        name: 'Arrow Down Icon',
        iconUrl: '/images/icon_arrow_down.png',
        fallbackUrl: '/images/icon_arrow_down.png',
        category: 'background',
        priority: 'non-critical'
      }
    ];

    // Register all assets
    [...markerAssets, ...legendAssets, ...borderAssets, ...backgroundAssets, ...otherAssets]
      .forEach(asset => this.registerAsset(asset));
  }
}

// Singleton instance
let assetRegistryInstance: AssetRegistry | null = null;

export function getAssetRegistry(): AssetRegistry {
  if (!assetRegistryInstance) {
    assetRegistryInstance = new AssetRegistry();
  }
  return assetRegistryInstance;
}