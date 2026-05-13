/**
 * WAGDIE World Map - Phaser Implementation
 *
 * Interactive map of the WAGDIE world built with Phaser 3.
 * Features zoom, pan, markers for locations/characters/events,
 * and layer controls.
 */

'use client';

import dynamic from 'next/dynamic';
import { useCallback, useRef, useState } from 'react';
import { useAccount } from 'wagmi';
import MapLayerControls from '@/components/map/MapLayerControls';
import MapPageHud from '@/components/map/MapPageHud';
import MapStakingSidebar from '@/components/map/MapStakingSidebar';
import { Spinner } from '@/components/ui';
import type { IRefPhaserGame } from '@/game/PhaserGame';
import { useMapData } from '@/hooks/map/useMapData';
import { useMapLayers } from '@/hooks/map/useMapLayers';
import { useMapPageEventBridge } from '@/hooks/map/useMapPageEventBridge';
import { useMapPageMarkers } from '@/hooks/map/useMapPageMarkers';
import { useMapPageSelection } from '@/hooks/map/useMapPageSelection';

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

const SIDEBAR_WIDTH_PX = 460;

export default function MapPage() {
  const phaserRef = useRef<IRefPhaserGame>(null);
  const mapContentRef = useRef<HTMLDivElement>(null);
  const [mapReady, setMapReady] = useState(false);

  const { address, isConnected } = useAccount();
  const {
    locations,
    stakedCharacters,
    isLoading,
    error,
    loadingProgress,
    loadingStage,
    refetch,
  } = useMapData();
  const { layers, toggleLayer } = useMapLayers();
  const { characterMarkers, eventsPayload } = useMapPageMarkers(stakedCharacters, address);
  const {
    selectedMarker,
    isSidebarOpen,
    selectedStakingLocation,
    selectedStakingError,
    stakedHere,
    handleMarkerClick,
    handleCloseSidebar,
    handleOpenStakingSidebar,
  } = useMapPageSelection(stakedCharacters);

  useMapPageEventBridge({
    mapReady,
    layers,
    locations,
    characterMarkers,
    eventsPayload,
    isSidebarOpen,
    mapContentRef,
    phaserRef,
  });

  const handleSceneReady = useCallback(() => {
    setMapReady(true);
  }, []);

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
            Reload map
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
          <div className="text-center space-y-2">
            <p className="text-neutral-500 font-eskapade  tracking-widest text-sm">
              {loadingStage || 'Loading WAGDIE World'}
            </p>
            <div className="h-1 w-48 overflow-hidden rounded-full bg-neutral-900">
              <div
                className="h-full rounded-full bg-soul-accent transition-[width] duration-300"
                style={{ width: `${loadingProgress}%` }}
              />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="relative h-[calc(100vh-64px)] bg-[#0a0a0a]"
      style={{ ['--map-sidebar-width' as never]: `${SIDEBAR_WIDTH_PX}px` }}
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

        <MapLayerControls layers={layers} onToggleLayer={toggleLayer} />

        <MapPageHud
          mapReady={mapReady}
          isSidebarOpen={isSidebarOpen}
          isConnected={isConnected}
          walletAddress={address}
          locationsCount={locations.length}
          stakedCount={stakedCharacters.length}
          onOpenStaking={handleOpenStakingSidebar}
        />

        {/* Instructions */}
        {mapReady && !selectedMarker && (
          <div className="absolute bottom-4 right-4 z-30 hidden sm:block">
            <p className="text-xs text-neutral-600 font-eskapade">
              Scroll to zoom · Drag to pan
            </p>
          </div>
        )}

        {/* Staking sidebar toggle button */}
        {mapReady && !isSidebarOpen && (
          <button
            type="button"
            onClick={handleOpenStakingSidebar}
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
