'use client';

import { useState } from 'react';
import type { LayerVisibility } from '@/lib/types/map';

const layerConfigs = [
  {
    key: 'locations',
    label: 'Locations',
    description: 'Places you can inspect.',
    iconOn: '/images/legendicons/legend_icon_location_on.png',
    iconOff: '/images/legendicons/legend_icon_location_off.png',
  },
  {
    key: 'characters',
    label: 'Your Characters',
    description: 'Only visible when connected.',
    iconOn: '/images/legendicons/legend_icon_location_on.png',
    iconOff: '/images/legendicons/legend_icon_location_off.png',
  },
  {
    key: 'burns',
    label: 'Burns',
    description: 'Burn events and searing traces.',
    iconOn: '/images/legendicons/legend_icon_burn_on.png',
    iconOff: '/images/legendicons/legend_icon_burn_off.png',
  },
  {
    key: 'deaths',
    label: 'Deaths',
    description: 'Fallen warriors.',
    iconOn: '/images/legendicons/legend_icon_death_on.png',
    iconOff: '/images/legendicons/legend_icon_death_off.png',
  },
  {
    key: 'fights',
    label: 'Fights',
    description: 'Recorded battles.',
    iconOn: '/images/legendicons/legend_icon_fight_on.png',
    iconOff: '/images/legendicons/legend_icon_fight_off.png',
  },
] as const;

interface MapLayerControlsProps {
  layers: LayerVisibility;
  onToggleLayer: (layer: keyof LayerVisibility) => void;
}

export function MapLayerControls({ layers, onToggleLayer }: MapLayerControlsProps) {
  const [showLayerPanel, setShowLayerPanel] = useState(false);

  return (
    <>
      <button
        onClick={() => setShowLayerPanel((visible) => !visible)}
        className={`absolute top-4 left-4 z-50 flex items-center gap-2 px-3 py-2 rounded border transition-all ${
          showLayerPanel
            ? 'bg-soul-accent text-black border-soul-accent'
            : 'bg-black/80 text-neutral-300 border-neutral-700 hover:border-soul-accent hover:text-soul-accent'
        }`}
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
        {/* REPOMARK:SCOPE: 2 - Replace font-display with font-eskapade for Map page UI button labels and marker panel labels */}
        <span className="font-eskapade text-xs  tracking-widest hidden sm:inline">Layers</span>
      </button>

      <div
        className={`absolute top-16 left-4 z-40 bg-black/95 border border-soul-accent/60 rounded-lg p-4 shadow-xl backdrop-blur-sm transition-all duration-200 ${
          showLayerPanel ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2 pointer-events-none'
        }`}
        style={{ minWidth: '180px' }}
      >
        <h3 className="font-eskapade text-soul-accent text-xs  tracking-widest mb-3 pb-2 border-b border-neutral-800">
          Map Layers
        </h3>

        <div className="space-y-1">
          {layerConfigs.map((config) => (
            <button
              key={config.key}
              onClick={() => onToggleLayer(config.key)}
              className={`w-full flex items-center gap-3 px-2 py-2 rounded transition-all ${
                layers[config.key]
                  ? 'bg-soul-accent/10'
                  : 'hover:bg-white/5'
              }`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={layers[config.key] ? config.iconOn : config.iconOff}
                alt=""
                className="w-5 h-5"
                style={{
                  filter: layers[config.key]
                    ? 'drop-shadow(0 0 4px rgba(212, 175, 55, 0.6))'
                    : 'grayscale(100%) opacity(0.4)',
                }}
              />
              <span className="min-w-0 flex-1 text-left">
                <span
                  className={`block font-eskapade text-sm ${
                    layers[config.key] ? 'text-neutral-200' : 'text-neutral-500'
                  }`}
                >
                  {config.label}
                </span>
                <span className="block text-xs leading-snug text-neutral-600 font-eskapade">
                  {config.description}
                </span>
              </span>
              <div
                className={`ml-auto w-3 h-3 rounded-full transition-all ${
                  layers[config.key] ? 'bg-soul-accent' : 'bg-neutral-700'
                }`}
              />
            </button>
          ))}
        </div>
      </div>
    </>
  );
}

export default MapLayerControls;
