/**
 * WAGDIE World Map - Phaser Implementation
 *
 * Interactive map of the WAGDIE world built with Phaser 3.
 * Features zoom, pan, markers for locations/characters/events,
 * and layer controls.
 */

'use client';

import dynamic from 'next/dynamic';
import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { useAccount } from 'wagmi';
import { useMapData } from '@/hooks/map/useMapData';
import { useMapLayers } from '@/hooks/map/useMapLayers';
import { EventBus, MapEvents, type MapCharacterData, type MarkerPayload, type MapLocationData } from '@/game/EventBus';
import { Spinner } from '@/components/ui';
import MapStakingSidebar from '@/components/map/MapStakingSidebar';
import type { IRefPhaserGame } from '@/game/PhaserGame';
import type { Location } from '@/lib/types/map';
import type { CharacterWithLocation } from '@/lib/repositories/character-repository';

// Dynamically import PhaserGame to avoid SSR issues
const PhaserGame = dynamic(() => import('@/game/PhaserGame'), {
  ssr: false,
  loading: () => (
    <div className="absolute inset-0 flex items-center justify-center bg-[#0a0a0a]">
      <div className="flex flex-col items-center gap-4">
        <Spinner size="lg" />
        {/* REPOMARK:SCOPE: 1 - Replace font-display with font-eskapade for Map page loading/error/status UI labels */}
        <p className="text-neutral-500 font-eskapade  tracking-widest text-sm">
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

interface SelectedStakingLocation {
  location: Location;
  locationId: bigint;
}

type MapSidebarTab = 'details' | 'characters';

/**
 * Get location ID from a marker, returns null if not a location marker
 */
function getLocationIdFromMarker(marker: MarkerPayload | null): string | null {
  if (!marker || marker.type !== 'location') return null;
  const locationData = marker.data as MapLocationData;
  const maybeId = locationData?.id;
  return typeof maybeId === 'string' && maybeId.length > 0 ? maybeId : null;
}

export default function MapPage() {
  const phaserRef = useRef<IRefPhaserGame>(null);
  const mapContentRef = useRef<HTMLDivElement | null>(null);

  const { address } = useAccount();

  // Normalize wallet address for case-insensitive comparison
  const walletLower = useMemo(() => (address ? address.toLowerCase() : null), [address]);

  const { locations, stakedCharacters, isLoading, error } = useMapData();
  const { layers, toggleLayer } = useMapLayers();

  const stakedByLocationId = useMemo((): Map<string, CharacterWithLocation[]> => {
    const index = new Map<string, CharacterWithLocation[]>();

    for (const row of stakedCharacters) {
      const locationId = row.location_id;
      if (!locationId) continue;

      const list = index.get(locationId);
      if (list) list.push(row);
      else index.set(locationId, [row]);
    }

    for (const [, list] of index) {
      list.sort((a, b) => a.token_id - b.token_id);
    }

    return index;
  }, [stakedCharacters]);

  const [selectedMarker, setSelectedMarker] = useState<MarkerPayload | null>(null);
  const [showLayerPanel, setShowLayerPanel] = useState(false);
  const [mapReady, setMapReady] = useState(false);
  const didInitialFly = useRef(false);

  const selectedLocationId = getLocationIdFromMarker(selectedMarker);
  const stakedHere = selectedLocationId
    ? (stakedByLocationId.get(selectedLocationId) ?? [])
    : [];

  // Unified sidebar state
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [sidebarTab, setSidebarTab] = useState<MapSidebarTab>('details');

  // Staking selection (sticky, location-only updates)
  const [selectedStakingLocation, setSelectedStakingLocation] = useState<SelectedStakingLocation | null>(null);

  const handleSceneReady = useCallback(() => {
    setMapReady(true);
  }, []);

  const handleMarkerClick = useCallback((marker: MarkerPayload) => {
    setSelectedMarker(marker);
    setSidebarTab('details');
    setIsSidebarOpen(true);

    if (marker.type === 'location') {
      const locationData = marker.data as MapLocationData;
      // Convert MapLocationData to Location-compatible object for the sidebar
      const location: Location = {
        id: locationData.id,
        name: locationData.name,
        description: locationData.description,
        metadata: {
          bounds: locationData.metadata?.bounds ?? [[0, 0], [0, 0]],
          center: locationData.metadata?.center,
        },
        created_at: locationData.created_at ?? '',
        updated_at: locationData.updated_at ?? '',
      };

      try {
        const locationId = BigInt(location.id);
        setSelectedStakingLocation({ location, locationId });
      } catch {
        // Keep existing selection sticky; do not clear if conversion fails
      }
    }
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
    if (!mapReady) return;
    if (didInitialFly.current) return;

    const firstWithCenter = locations.find(
      (loc) => Array.isArray(loc.metadata?.center) && loc.metadata.center.length === 2
    );
    if (!firstWithCenter?.metadata?.center) return;

    didInitialFly.current = true;
    EventBus.emit(MapEvents.FLY_TO_LOCATION, {
      x: firstWithCenter.metadata.center[0],
      y: firstWithCenter.metadata.center[1],
      zoom: 1.5,
    });
  }, [locations, mapReady]);

  const mapCharacterMarkers = useMemo((): MapCharacterData[] => {
    // Wallet-only pins: if no connected wallet, show no character markers.
    // The location popup list still shows ALL staked characters (stakedByLocationId is unchanged).
    if (!walletLower) return [];

    const out: MapCharacterData[] = [];

    for (const c of stakedCharacters) {
      // Only render pins for the connected wallet's characters.
      // owner_address should already be stored lowercase in DB, but normalize defensively.
      const ownerLower =
        typeof c.owner_address === 'string' && c.owner_address.length > 0
          ? c.owner_address.toLowerCase()
          : null;
      if (!ownerLower || ownerLower !== walletLower) continue;

      // Now properly typed as CharacterWithLocation with location?: JoinedLocation | null
      const joinedLocation = c.location;

      if (!joinedLocation) continue;

      // Location metadata is already normalized by the repository
      const center = joinedLocation.metadata.center;

      if (!Array.isArray(center) || center.length !== 2) continue;

      const characterName =
        (typeof c.name === 'string' && c.name.trim().length > 0 ? c.name.trim() : null) ??
        (typeof c.metadata?.name === 'string' && c.metadata.name.trim().length > 0 ? c.metadata.name.trim() : null) ??
        `Character #${c.token_id}`;

      out.push({
        character_token_id: c.token_id,
        character_name: characterName,
        wallet_address: c.owner_address ?? undefined,
        location: {
          id: joinedLocation.id,
          name: joinedLocation.name,
          metadata: { center },
        },
      });
    }

    out.sort((a, b) => a.character_token_id - b.character_token_id);
    return out;
  }, [stakedCharacters, walletLower]);

  useEffect(() => {
    if (!mapReady) return;
    // Always emit, even if empty, so Phaser can clear stale markers on disconnect/wallet change.
    EventBus.emit(MapEvents.UPDATE_CHARACTERS, mapCharacterMarkers);
  }, [mapCharacterMarkers, mapReady]);

  // When the sidebar pushes the content, the Phaser container width changes.
  // Nudge Phaser to resize; if the scale manager supports resize, call it explicitly.
  useEffect(() => {
    if (typeof window === 'undefined') return;

    window.dispatchEvent(new Event('resize'));

    const container = mapContentRef.current;
    const game = phaserRef.current?.game;

    if (!container || !game) return;

    const rect = container.getBoundingClientRect();
    const width = Math.max(0, Math.floor(rect.width));
    const height = Math.max(0, Math.floor(rect.height));

    const maybeScale = (game as unknown as { scale?: { resize?: (w: number, h: number) => void } }).scale;
    if (maybeScale && typeof maybeScale.resize === 'function' && width > 0 && height > 0) {
      maybeScale.resize(width, height);
    }
  }, [isSidebarOpen, sidebarTab]);

  // Error state
  if (error) {
    return (
      <div className="h-[calc(100vh-64px)] flex items-center justify-center bg-[#0a0a0a]">
        <div className="text-center p-8">
          <div className="text-red-500 text-4xl mb-4">⚠</div>
          <h2 className="text-xl font-eskapade  tracking-widest text-neutral-200 mb-2">
            Error Loading Map
          </h2>
          <p className="text-neutral-500 font-eskapade mb-6">{error.message}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-2 bg-soul-accent text-black font-eskapade  text-sm hover:bg-soul-accent/80 transition-colors"
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
          <p className="text-neutral-500 font-eskapade  tracking-widest text-sm">
            Loading WAGDIE World
          </p>
        </div>
      </div>
    );
  }

  const handleCloseSidebar = () => {
    setIsSidebarOpen(false);
    setSelectedMarker(null);
  };

  const sidebarWidthPx = 460;

  return (
    <div
      className="relative h-[calc(100vh-64px)] bg-[#0a0a0a]"
      style={{ ['--map-sidebar-width' as never]: `${sidebarWidthPx}px` }}
    >
      {/* Map Content (pushes on desktop when sidebar is open) */}
      <div
        ref={mapContentRef}
        className={`
          relative h-full transition-[margin] duration-300
          ${isSidebarOpen ? 'md:mr-[var(--map-sidebar-width)]' : ''}
        `}
      >
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
          {/* REPOMARK:SCOPE: 2 - Replace font-display with font-eskapade for Map page UI button labels and marker panel labels */}
          <span className="font-eskapade text-xs  tracking-widest hidden sm:inline">Layers</span>
        </button>

        {/* Characters sidebar toggle (opens unified sidebar in Characters tab) */}
        <button
          onClick={() => {
            setSelectedMarker(null);
            setSidebarTab('characters');
            setIsSidebarOpen((prev) => {
              if (!prev) return true;
              return sidebarTab === 'characters' ? !prev : true;
            });
          }}
          className={`absolute top-4 right-4 z-50 flex items-center gap-2 px-3 py-2 rounded border transition-all ${
            isSidebarOpen && sidebarTab === 'characters'
              ? 'bg-soul-accent text-black border-soul-accent'
              : 'bg-black/80 text-neutral-300 border-neutral-700 hover:border-soul-accent hover:text-soul-accent'
          }`}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M17 20h5v-2a4 4 0 00-4-4h-1m-4 6H2v-2a4 4 0 014-4h7m0 6v-2a4 4 0 00-4-4H6m9-6a4 4 0 11-8 0 4 4 0 018 0zm7 4a3 3 0 10-6 0 3 3 0 006 0z"
            />
          </svg>
          <span className="font-eskapade text-xs  tracking-widest hidden sm:inline">Characters</span>
        </button>

        {/* Layer Panel */}
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
                onClick={() => toggleLayer(config.key)}
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

        {/* Instructions */}
        {mapReady && !selectedMarker && (
          <div className="absolute bottom-4 left-4 z-30 hidden sm:block">
            <p className="text-xs text-neutral-600 font-eskapade">
              Scroll to zoom · Drag to pan
            </p>
          </div>
        )}
      </div>

      {/* Unified right sidebar (Details + Characters/Staking) */}
      <MapStakingSidebar
        isOpen={isSidebarOpen}
        activeTab={sidebarTab}
        onTabChange={setSidebarTab}
        onClose={handleCloseSidebar}
        selectedMarker={selectedMarker}
        stakedHere={stakedHere}
        selectedLocation={selectedStakingLocation}
        walletAddress={address}
      />
    </div>
  );
}
