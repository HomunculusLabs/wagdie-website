/**
 * WAGDIE World Map - Phaser Implementation
 *
 * Interactive map of the WAGDIE world built with Phaser 3.
 * Features zoom, pan, markers for locations/characters/events,
 * and layer controls.
 */

'use client';

import dynamic from 'next/dynamic';
import { useState, useRef, useEffect, useCallback } from 'react';
import { useMapData } from '@/hooks/map/useMapData';
import { useMapLayers } from '@/hooks/map/useMapLayers';
import { EventBus, MapEvents } from '@/game/EventBus';
import { Spinner } from '@/components-new';
import type { IRefPhaserGame } from '@/game/PhaserGame';

// Dynamically import PhaserGame to avoid SSR issues
const PhaserGame = dynamic(() => import('@/game/PhaserGame'), {
  ssr: false,
  loading: () => (
    <div className="absolute inset-0 flex items-center justify-center bg-[#0a0a0a]">
      <div className="flex flex-col items-center gap-4">
        <Spinner size="lg" />
        <p className="text-neutral-500 font-display  tracking-widest text-sm">
          Loading Map
        </p>
      </div>
    </div>
  ),
});

// Layer configuration
const layerConfigs = [
  { key: 'locations', label: 'Locations', iconOn: '/images/legendicons/legend_icon_location_on.png', iconOff: '/images/legendicons/legend_icon_location_off.png' },
  { key: 'characters', label: 'Characters', iconOn: '/images/legendicons/legend_icon_location_on.png', iconOff: '/images/legendicons/legend_icon_location_off.png' },
  { key: 'burns', label: 'Burns', iconOn: '/images/legendicons/legend_icon_burn_on.png', iconOff: '/images/legendicons/legend_icon_burn_off.png' },
  { key: 'deaths', label: 'Deaths', iconOn: '/images/legendicons/legend_icon_death_on.png', iconOff: '/images/legendicons/legend_icon_death_off.png' },
  { key: 'fights', label: 'Fights', iconOn: '/images/legendicons/legend_icon_fight_on.png', iconOff: '/images/legendicons/legend_icon_fight_off.png' },
] as const;

interface MarkerInfo {
  id: string;
  type: string;
  name: string;
  data: any;
}

export default function MapPage() {
  const phaserRef = useRef<IRefPhaserGame>(null);
  const { locations, characterLocations, isLoading, error } = useMapData();
  const { layers, toggleLayer } = useMapLayers();

  const [selectedMarker, setSelectedMarker] = useState<MarkerInfo | null>(null);
  const [showLayerPanel, setShowLayerPanel] = useState(false);
  const [mapReady, setMapReady] = useState(false);

  const handleSceneReady = useCallback(() => {
    setMapReady(true);
  }, []);

  const handleMarkerClick = useCallback((marker: MarkerInfo) => {
    setSelectedMarker(marker);
  }, []);

  useEffect(() => {
    if (mapReady) {
      EventBus.emit(MapEvents.SET_LAYER_VISIBILITY, layers);
    }
  }, [layers, mapReady]);

  useEffect(() => {
    if (mapReady && locations.length > 0) {
      EventBus.emit(MapEvents.UPDATE_LOCATIONS, locations);
    }
  }, [locations, mapReady]);

  useEffect(() => {
    if (mapReady && characterLocations.length > 0) {
      EventBus.emit(MapEvents.UPDATE_CHARACTERS, characterLocations);
    }
  }, [characterLocations, mapReady]);

  // Error state
  if (error) {
    return (
      <div className="h-[calc(100vh-64px)] flex items-center justify-center bg-[#0a0a0a]">
        <div className="text-center p-8">
          <div className="text-red-500 text-4xl mb-4">⚠</div>
          <h2 className="text-xl font-display  tracking-widest text-neutral-200 mb-2">
            Error Loading Map
          </h2>
          <p className="text-neutral-500 font-eskapade mb-6">{error.message}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-2 bg-soul-accent text-black font-display  text-sm hover:bg-soul-accent/80 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="h-[calc(100vh-64px)] flex items-center justify-center bg-[#0a0a0a]">
        <div className="flex flex-col items-center gap-4">
          <Spinner size="lg" />
          <p className="text-neutral-500 font-display  tracking-widest text-sm">
            Loading WAGDIE World
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-[calc(100vh-64px)] bg-[#0a0a0a]">
      {/* Phaser Canvas */}
      <PhaserGame
        ref={phaserRef}
        onSceneReady={handleSceneReady}
        onMarkerClick={handleMarkerClick}
      />

      {/* Layer Toggle */}
      <button
        onClick={() => setShowLayerPanel(!showLayerPanel)}
        className={`absolute top-4 left-4 z-50 flex items-center gap-2 px-3 py-2 rounded border transition-all ${
          showLayerPanel
            ? 'bg-soul-accent text-black border-soul-accent'
            : 'bg-black/80 text-neutral-300 border-neutral-700 hover:border-soul-accent hover:text-soul-accent'
        }`}
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
        <span className="font-display text-xs  tracking-widest hidden sm:inline">Layers</span>
      </button>

      {/* Layer Panel */}
      <div
        className={`absolute top-16 left-4 z-40 bg-black/95 border border-soul-accent/60 rounded-lg p-4 shadow-xl backdrop-blur-sm transition-all duration-200 ${
          showLayerPanel ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2 pointer-events-none'
        }`}
        style={{ minWidth: '180px' }}
      >
        <h3 className="font-display text-soul-accent text-xs  tracking-widest mb-3 pb-2 border-b border-neutral-800">
          Map Layers
        </h3>

        <div className="space-y-1">
          {layerConfigs.map((config) => (
            <button
              key={config.key}
              onClick={() => toggleLayer(config.key)}
              className={`w-full flex items-center gap-3 px-2 py-2 rounded transition-all ${
                layers[config.key]
                  ? 'bg-soul-accent/10'
                  : 'hover:bg-white/5'
              }`}
            >
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
              <span
                className={`font-eskapade text-sm ${
                  layers[config.key] ? 'text-neutral-200' : 'text-neutral-500'
                }`}
              >
                {config.label}
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

      {/* Selected Marker Panel */}
      {selectedMarker && (
        <div className="absolute bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:w-80 z-40">
          <div className="bg-black/95 border border-soul-accent/60 rounded-lg overflow-hidden backdrop-blur-sm">
            <div className="flex items-center justify-between px-4 py-2 border-b border-neutral-800">
              <span className="text-[10px] px-2 py-0.5 bg-soul-accent/20 text-soul-accent font-display  tracking-widest rounded">
                {selectedMarker.type}
              </span>
              <button
                onClick={() => setSelectedMarker(null)}
                className="text-neutral-500 hover:text-neutral-300 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-4">
              <h3 className="font-display text-neutral-100  tracking-wider">
                {selectedMarker.name}
              </h3>
              {selectedMarker.data?.description && (
                <p className="text-sm text-neutral-400 font-eskapade mt-2 line-clamp-3">
                  {selectedMarker.data.description}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Instructions */}
      {mapReady && !selectedMarker && (
        <div className="absolute bottom-4 left-4 z-30 hidden sm:block">
          <p className="text-xs text-neutral-600 font-eskapade">
            Scroll to zoom · Drag to pan
          </p>
        </div>
      )}
    </div>
  );
}
