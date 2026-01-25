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
import { EventBus, MapEvents, type MapCharacterData, type MarkerPayload, type MapLocationData, type MapEventData, type MapEventsData } from '@/game/EventBus';
import { isBurnedOwner } from '@/lib/utils/blockchain';
import { Spinner } from '@/components/ui';
import MapStakingSidebar from '@/components/map/MapStakingSidebar';
import { MapOnboarding } from '@/components/map/MapOnboarding';
import type { IRefPhaserGame } from '@/game/PhaserGame';
import type { Location } from '@/lib/types/map';
import { parseChainLocationId } from '@/lib/utils/chainIds';
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

  const { locations, stakedCharacters, isLoading, error, refetch } = useMapData();
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

  // Sidebar state
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Staking selection (sticky, location-only updates)
  const [selectedStakingLocation, setSelectedStakingLocation] = useState<SelectedStakingLocation | null>(null);
  const [selectedStakingError, setSelectedStakingError] = useState<string | null>(null);

  const handleSceneReady = useCallback(() => {
    setMapReady(true);
  }, []);

  const handleMarkerClick = useCallback((marker: MarkerPayload) => {
    setSelectedMarker(marker);
    setIsSidebarOpen(true);

    if (marker.type === 'location') {
      const locationData = marker.data as MapLocationData;
      // Convert MapLocationData to Location-compatible object for the sidebar
      const location: Location = {
        id: locationData.id,
        name: locationData.name,
        description: locationData.description,
        chain_location_id: locationData.chain_location_id,
        metadata: {
          bounds: locationData.metadata?.bounds ?? [[0, 0], [0, 0]],
          center: locationData.metadata?.center,
        },
        created_at: locationData.created_at ?? '',
        updated_at: locationData.updated_at ?? '',
      };

      const chainLocationId = parseChainLocationId(location.id);

      if (chainLocationId === null) {
        console.warn(`Location "${location.id}" has no valid chain_location_id`);
        setSelectedStakingError('This location is not registered on-chain. Staking is unavailable.');
        setSelectedStakingLocation(null);
      } else {
        setSelectedStakingError(null);
        setSelectedStakingLocation({ location, locationId: chainLocationId });
      }
      return;
    }

    setSelectedStakingError(null);
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
      // When a character is staked, owner_address becomes the staking contract; staker_address tracks the wallet that staked it.
      const effectiveOwner = c.staker_address ?? c.owner_address;
      const effectiveOwnerLower =
        typeof effectiveOwner === 'string' && effectiveOwner.length > 0
          ? effectiveOwner.toLowerCase()
          : null;
      if (!effectiveOwnerLower || effectiveOwnerLower !== walletLower) continue;

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
        wallet_address: effectiveOwner ?? undefined,
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

  // Build death events for burned staked characters ("Fallen Warriors")
  // These show on the map as death markers, independent of wallet connection
  // Offset from location center so they don't overlap with the main location pin
  const fallenDeaths = useMemo((): MapEventData[] => {
    // Offset distance in pixels from the location center
    const OFFSET_DISTANCE = 35;

    return stakedCharacters
      .filter((c) => isBurnedOwner(c.owner_address, c.burned))
      .flatMap((c, index) => {
        const center = c.location?.metadata?.center;
        if (!Array.isArray(center) || center.length !== 2) return [];

        // Spread multiple fallen warriors in a circle around the location
        // Use index to create different angles for each marker
        const angle = (index * 137.5 * Math.PI) / 180; // Golden angle for even distribution
        const offsetX = Math.cos(angle) * OFFSET_DISTANCE;
        const offsetY = Math.sin(angle) * OFFSET_DISTANCE;

        return [{
          id: `fallen-${c.token_id}`,
          title: `Fallen Warrior #${c.token_id}`,
          name: c.name || c.metadata?.name || `Character #${c.token_id}`,
          htmlcoordinates: [center[0] + offsetX, center[1] + offsetY] as [number, number],
          character_token_id: c.token_id,
        }];
      });
  }, [stakedCharacters]);

  // Combined events payload for map
  const eventsPayload = useMemo((): MapEventsData => ({
    burns: [],
    deaths: fallenDeaths,
    fights: [],
  }), [fallenDeaths]);

  // Emit events to Phaser (includes fallen warrior deaths)
  useEffect(() => {
    if (!mapReady) return;
    // Always emit even if empty, so Phaser can reconcile and remove stale event markers
    EventBus.emit(MapEvents.UPDATE_EVENTS, eventsPayload);
  }, [mapReady, eventsPayload]);

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
  }, [isSidebarOpen]);

  // Error state
  if (error) {
    return (
      <div className="h-[calc(100vh-64px)] flex items-center justify-center bg-[#0a0a0a]">
        <div className="text-center p-8">
          <div className="text-red-500 text-4xl mb-4">⚠</div>
          <h2 className="text-xl font-eskapade  tracking-widest text-neutral-200 mb-2">
            Error Loading Map
          </h2>
          <p className="text-neutral-500 font-eskapade mb-6">{error}</p>
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

        {/* Onboarding tooltip for first-time users */}
        {mapReady && !isSidebarOpen && <MapOnboarding />}

        {/* Staking sidebar toggle button */}
        {mapReady && !isSidebarOpen && (
          <button
            type="button"
            onClick={() => {
              setSelectedMarker(null);
              setIsSidebarOpen(true);
            }}
            className="absolute top-4 right-4 z-30 flex items-center gap-2 px-4 py-2.5 rounded-lg bg-neutral-900/90 border border-neutral-800 hover:border-soul-accent/50 hover:bg-neutral-900 transition-all shadow-lg backdrop-blur-sm"
          >
            <svg className="w-5 h-5 text-soul-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.879 16.121A3 3 0 1012.015 11L11 14H9c0 .768.293 1.536.879 2.121z" />
            </svg>
            <span className="text-sm text-neutral-200 font-eskapade">Manage Staking</span>
          </button>
        )}
      </div>

      {/* Right sidebar */}
      <MapStakingSidebar
        isOpen={isSidebarOpen}
        onClose={handleCloseSidebar}
        selectedMarker={selectedMarker}
        stakedHere={stakedHere}
        selectedLocation={selectedStakingLocation}
        selectedLocationError={selectedStakingError}
        walletAddress={address}
        onStakingChanged={refetch}
      />
    </div>
  );
}
