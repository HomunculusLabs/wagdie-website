/**
 * Layer Controls UI Component
 *
 * Provides UI for toggling layer visibility on the map.
 * Displays layer options with icons and labels for easy user interaction.
 */

'use client';

import React from 'react';
import type { LayerControlsProps, LayerConfig } from '@/specs/008-map-refactor/contracts/layer-controller';

/**
 * Default layer configuration
 */
const layerConfigs: LayerConfig[] = [
  {
    key: 'locations',
    label: 'Locations',
    iconPath: '/images/map-icons/icon_location.png',
    defaultVisible: true,
    description: 'Toggle visibility of location markers',
    keyboardShortcut: 'l',
  },
  {
    key: 'characters',
    label: 'Characters',
    iconPath: '/images/map-icons/icon_youarehere.png',
    defaultVisible: true,
    description: 'Toggle visibility of character markers',
    keyboardShortcut: 'c',
  },
  {
    key: 'burns',
    label: 'Burns',
    iconPath: '/images/map-icons/icon_burn.png',
    defaultVisible: true,
    description: 'Toggle visibility of burn event markers',
  },
  {
    key: 'deaths',
    label: 'Deaths',
    iconPath: '/images/map-icons/icon_death.png',
    defaultVisible: true,
    description: 'Toggle visibility of death event markers',
  },
  {
    key: 'fights',
    label: 'Fights',
    iconPath: '/images/map-icons/icon_fight.png',
    defaultVisible: true,
    description: 'Toggle visibility of fight/battle event markers',
  },
];

/**
 * LayerControls component
 */
export const LayerControls: React.FC<LayerControlsProps> = ({
  layers,
  onToggle,
  onVisibilityChange,
  className = '',
  showCounts = false,
}) => {
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
          {/* Icon */}
          <img
            src={config.iconPath}
            alt={`${config.label} layer icon`}
            style={{
              width: '24px',
              height: '24px',
              filter: layers[config.key]
                ? 'drop-shadow(0 0 3px rgba(212, 175, 55, 0.5))'
                : 'grayscale(100%) opacity(0.3)',
              transition: 'all 0.2s ease',
            }}
            aria-hidden="true"
          />

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
