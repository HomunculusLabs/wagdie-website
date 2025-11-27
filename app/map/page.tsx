'use client';

import dynamic from 'next/dynamic';
import { useState, useRef } from 'react';
import { useMapData } from '@/hooks/map/useMapData';
import { useMapLayers } from '@/hooks/map/useMapLayers';
import { useWallet } from '@/hooks/map/useWallet';
import { CharacterListPanel } from '@/components/map/CharacterListPanel';
import { LoadingState } from '@/components/map/LoadingState';
import { Button, Spinner, Card, CardContent } from '@/components-new';
import type { CharacterLocation } from '@/lib/types/map';
import type { SimpleMapRef } from '@/components/map/SimpleMap';

// Dynamically import SimpleMap to avoid SSR issues
const SimpleMap = dynamic(() => import('@/components/map/SimpleMap').then(mod => ({ default: mod.SimpleMap })), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-screen bg-soul-950">
      <div className="flex flex-col items-center gap-4">
        <Spinner size="lg" />
        <p className="text-neutral-500 font-display uppercase tracking-widest text-sm">
          Loading Map
        </p>
      </div>
    </div>
  ),
});

const UserIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
  </svg>
);

const WalletIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
  </svg>
);

const AlertIcon = () => (
  <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
  </svg>
);

export default function MapPage() {
  const { locations, characterLocations, isLoading, error, loadingProgress, loadingStage, loadingStages } = useMapData();
  const { layers, toggleLayer } = useMapLayers();
  const { connectedWallet, connectWallet, isConnecting, connectionStage, connectionProgress, connectionStages } = useWallet();
  const [showCharacterPanel, setShowCharacterPanel] = useState(false);
  const mapRef = useRef<SimpleMapRef>(null);

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen bg-soul-950">
        <Card className="max-w-md text-center">
          <CardContent className="py-12">
            <div className="text-red-700 mb-4 flex justify-center">
              <AlertIcon />
            </div>
            <h2 className="text-xl font-display uppercase tracking-widest text-neutral-200 mb-2">
              Error Loading Map
            </h2>
            <p className="text-neutral-500 font-serif mb-6">{error.message}</p>
            <Button variant="primary" onClick={() => window.location.reload()}>
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <LoadingState
        message="Initializing WAGDIE World"
        stage={loadingStage}
        progress={loadingProgress}
        showProgress={true}
        stageList={loadingStages}
        currentStage={loadingStages.indexOf(loadingStage)}
      />
    );
  }

  if (isConnecting) {
    return (
      <div className="w-full h-screen relative bg-soul-950 flex items-center justify-center">
        <LoadingState
          message="Connecting Wallet"
          stage={connectionStage}
          progress={connectionProgress}
          showProgress={true}
          stageList={connectionStages}
          currentStage={connectionStages.indexOf(connectionStage)}
        />
      </div>
    );
  }

  return (
    <div className="w-full h-screen relative">
      <SimpleMap
        locations={locations}
        characterLocations={characterLocations}
        layers={layers}
        toggleLayer={toggleLayer}
        onMarkerClick={(marker) => {
          console.log('Marker clicked:', marker);
        }}
        ref={mapRef}
      />

      {/* Character List Toggle Button */}
      <div className="fixed top-4 left-4 z-50">
        <Button
          variant={showCharacterPanel ? 'primary' : 'secondary'}
          onClick={() => setShowCharacterPanel(!showCharacterPanel)}
          className="gap-2"
          aria-label="Toggle character list panel"
          aria-expanded={showCharacterPanel}
        >
          <UserIcon />
          <span className="hidden sm:inline">My Characters</span>
          {connectedWallet && (
            <span className="w-2 h-2 bg-soul-accent rounded-full animate-pulse" />
          )}
        </Button>
      </div>

      {/* Character List Panel */}
      {showCharacterPanel && (
        <div
          id="character-list-panel"
          className="fixed top-20 left-4 right-4 sm:left-4 sm:right-auto sm:max-w-sm z-40"
          role="dialog"
          aria-label="Character list"
        >
          <CharacterListPanel
            characters={characterLocations}
            connectedWallet={connectedWallet}
            onCharacterSelect={(character: CharacterLocation) => {
              if (mapRef.current && character.location?.metadata) {
                const bounds = character.location.metadata.bounds;
                const center = character.location.metadata.center || [
                  (bounds[0][0] + bounds[1][0]) / 2,
                  (bounds[0][1] + bounds[1][1]) / 2,
                ];
                mapRef.current.setView(center, 1, {
                  animate: true,
                  duration: 0.5,
                });
              }
            }}
            onClose={() => setShowCharacterPanel(false)}
          />
        </div>
      )}

      {/* Wallet Connection Button */}
      <div className="fixed top-4 right-4 z-50">
        {!connectedWallet ? (
          <Button
            variant="primary"
            onClick={connectWallet}
            className="gap-2"
            aria-label="Connect wallet to view your characters"
          >
            <WalletIcon />
            <span className="hidden sm:inline">Connect Wallet</span>
            <span className="sm:hidden">Connect</span>
          </Button>
        ) : (
          <Button
            variant="secondary"
            onClick={() => window.location.reload()}
            className="gap-2"
            title="Click to disconnect"
          >
            <span className="w-2 h-2 bg-soul-accent rounded-full animate-pulse" />
            <span className="font-mono text-xs">
              {connectedWallet.slice(0, 6)}...{connectedWallet.slice(-4)}
            </span>
          </Button>
        )}
      </div>
    </div>
  );
}
