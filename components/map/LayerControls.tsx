/**
 * Layer Controls UI Component
 *
 * Provides UI for toggling layer visibility on the map.
 * Displays layer options with icons and labels for easy user interaction.
 */

'use client';

import React from 'react';
import type { LayerControlsProps, LayerConfig } from '@/specs/008-map-refactor/contracts/layer-controller';
import { useAssetLoading } from '@/hooks/useAssetLoading';
import { AssetLoadingPlaceholder, AssetFailedState } from './AssetLoadingStates';

/**
 * Enhanced layer configuration with asset types and legend icons
 */
const layerConfigs: (LayerConfig & {
  assetType: string;
  iconPathOn: string;
  iconPathOff: string;
})[] = [
  {
    key: 'locations',
    label: 'Locations',
    iconPath: '/images/mapicons/icon_location.png', // Fallback for LayerIcon component
    iconPathOn: '/images/legendicons/legend_icon_location_on.png',
    iconPathOff: '/images/legendicons/legend_icon_location_off.png',
    assetType: 'location',
    defaultVisible: true,
    description: 'Toggle visibility of location markers',
    keyboardShortcut: 'l',
  },
  {
    key: 'characters',
    label: 'Characters',
    iconPath: '/images/mapicons/icon_youarehere.png', // Fallback for LayerIcon component
    iconPathOn: '/images/legendicons/legend_icon_location_on.png', // Reuse location icon for characters
    iconPathOff: '/images/legendicons/legend_icon_location_off.png',
    assetType: 'character',
    defaultVisible: true,
    description: 'Toggle visibility of character markers',
    keyboardShortcut: 'c',
  },
  {
    key: 'burns',
    label: 'Burns',
    iconPath: '/images/mapicons/icon_burn.png', // Fallback for LayerIcon component
    iconPathOn: '/images/legendicons/legend_icon_burn_on.png',
    iconPathOff: '/images/legendicons/legend_icon_burn_off.png',
    assetType: 'burn',
    defaultVisible: true,
    description: 'Toggle visibility of burn event markers',
  },
  {
    key: 'deaths',
    label: 'Deaths',
    iconPath: '/images/mapicons/icon_death.png', // Fallback for LayerIcon component
    iconPathOn: '/images/legendicons/legend_icon_death_on.png',
    iconPathOff: '/images/legendicons/legend_icon_death_off.png',
    assetType: 'death',
    defaultVisible: true,
    description: 'Toggle visibility of death event markers',
  },
  {
    key: 'fights',
    label: 'Fights',
    iconPath: '/images/mapicons/icon_fight.png', // Fallback for LayerIcon component
    iconPathOn: '/images/legendicons/legend_icon_fight_on.png',
    iconPathOff: '/images/legendicons/legend_icon_fight_off.png',
    assetType: 'fight',
    defaultVisible: true,
    description: 'Toggle visibility of fight/battle event markers',
  },
];

/**
 * Enhanced LayerControls component with asset loading integration
 */
export const LayerControls: React.FC<LayerControlsProps> = ({
  layers,
  onToggle,
  onVisibilityChange,
  className = '',
  showCounts = false,
}) => {
  // Asset loading integration for layer icons
  const {
    getAssetState,
    retryAsset
  } = useAssetLoading();

  /**
   * LayerIcon component with asset loading states
   */
  const LayerIcon: React.FC<{ config: typeof layerConfigs[0]; isActive: boolean }> = ({ config, isActive }) => {
    const assetState = getAssetState(config.assetType as any);

    if (assetState?.status === 'loading') {
      return (
        <AssetLoadingPlaceholder
          assetId={config.assetType}
          type="marker"
          size="small"
          className="w-6 h-6"
        />
      );
    }

    if (assetState?.status === 'failed') {
      return (
        <AssetFailedState
          assetId={config.assetType}
          type="marker"
          error={assetState.lastError}
          onRetry={() => retryAsset(config.assetType)}
          className="w-6 h-6"
        />
      );
    }

    // Use legend icons (on/off state) if available, otherwise fallback to original icon
    const iconSrc = isActive
      ? (config.iconPathOn || config.iconPath)
      : (config.iconPathOff || config.iconPath);

    return (
      <img
        src={iconSrc}
        alt={`${config.label} layer icon ${isActive ? 'on' : 'off'}`}
        style={{
          width: '24px',
          height: '24px',
          filter: isActive
            ? 'drop-shadow(0 0 3px rgba(212, 175, 55, 0.5))'
            : 'grayscale(50%) opacity(0.6)', // Less severe filtering for legend icons
          transition: 'all 0.2s ease',
        }}
        onError={(e) => {
          // Handle image loading errors
          console.warn(`[LayerControls] Failed to load icon for ${config.label}:`, iconSrc);
          // Attempt to retry loading
          retryAsset(config.assetType);
        }}
        aria-hidden="true"
      />
    );
  };

  const handleToggle = (layerKey: keyof typeof layers) => {
    onToggle(layerKey);
    if (onVisibilityChange) {
      onVisibilityChange(layers);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent, config: LayerConfig) => {
    if (config.keyboardShortcut && (e.key === config.keyboardShortcut || e.key === config.keyboardShortcut.toUpperCase())) {
      e.preventDefault();
      handleToggle(config.key);
    }
  };

  return (
    <div
      className={className}
      data-testid="layer-controls"
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        background: '#0f0f0f',
        border: '2px solid #d4af37',
        borderRadius: '8px',
        padding: '16px',
        boxShadow: '0 4px 16px rgba(0, 0, 0, 0.5)',
        maxWidth: '280px',
        position: 'fixed',
        top: '16px',
        right: '16px',
        zIndex: 30,
      }}
      role="region"
      aria-label="Map layer controls"
    >
      {/* Header */}
      <h3
        style={{
          fontFamily: "'Wagdie_Fraktur_21', serif",
          color: '#d4af37',
          fontSize: '14px',
          fontWeight: 'bold',
          margin: '0 0 4px 0',
          letterSpacing: '1px',
        }}
      >
        Map Layers
      </h3>

      {/* Screen reader instructions */}
      <p style={{ position: 'absolute', left: '-9999px' }}>
        Use Tab to navigate, Space or Enter to toggle layers. Press L to toggle Locations, C to toggle Characters.
      </p>

      {/* Layer toggles */}
      {layerConfigs.map((config) => (
        <label
          key={config.key}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            color: '#e8e8e8',
            fontSize: '14px',
            cursor: 'pointer',
            minHeight: '44px',
            padding: '4px',
            borderRadius: '4px',
            transition: 'all 0.2s ease',
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.color = '#d4af37';
          }}
          onMouseOut={(e) => {
            if (!layers[config.key]) {
              e.currentTarget.style.color = '#888';
            } else {
              e.currentTarget.style.color = '#e8e8e8';
            }
          }}
        >
          {/* Icon with asset loading states */}
          <div data-testid={`legend-${config.key}-icon`}>
            <LayerIcon
              config={config}
              isActive={layers[config.key]}
            />
          </div>

          {/* Label */}
          <span
            style={{
              fontFamily: "'Wagdie_Fraktur_21', serif",
              letterSpacing: '0.5px',
              flex: 1,
              color: layers[config.key] ? '#e8e8e8' : '#888',
            }}
          >
            {config.label}
          </span>

          {/* Checkbox */}
          <input
            type="checkbox"
            checked={layers[config.key]}
            onChange={() => handleToggle(config.key)}
            onKeyDown={(e) => handleKeyDown(e, config)}
            data-testid={`toggle-${config.key}`}
            style={{
              width: '18px',
              height: '18px',
              cursor: 'pointer',
              accentColor: '#d4af37',
            }}
            aria-label={`Toggle ${config.label.toLowerCase()} layer${config.keyboardShortcut ? ` (press ${config.keyboardShortcut})` : ''}`}
            aria-describedby={`${config.key}-description`}
          />

          {/* Hidden description for screen readers */}
          <div id={`${config.key}-description`} style={{ position: 'absolute', left: '-9999px' }}>
            {config.description}
          </div>
        </label>
      ))}

      {/* Keyboard shortcuts hint */}
      <div
        style={{
          marginTop: '8px',
          paddingTop: '8px',
          borderTop: '1px solid #252525',
          fontSize: '11px',
          color: '#888',
          fontFamily: "'Wagdie_Fraktur_21', serif",
        }}
      >
        Shortcuts: L (Locations), C (Characters)
      </div>
    </div>
  );
};

export default LayerControls;
