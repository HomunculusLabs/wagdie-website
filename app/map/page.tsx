'use client';

import dynamic from 'next/dynamic';
import Image from 'next/image';
import { useState, useRef } from 'react';
import { useMapData } from '@/hooks/map/useMapData';
import { useMapLayers } from '@/hooks/map/useMapLayers';
import { useWallet } from '@/hooks/map/useWallet';
import { CharacterListPanel } from '@/components/map/CharacterListPanel';
import { LoadingState } from '@/components/map/LoadingState';
import { Button, Spinner } from '@/components-new';
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

export default function MapPage() {
  const { locations, characterLocations, isLoading, error, loadingProgress, loadingStage, loadingStages } = useMapData();
  const { layers, toggleLayer } = useMapLayers();
  const { connectedWallet, connectWallet, isConnecting, connectionStage, connectionProgress, connectionStages } = useWallet();
  const [showCharacterPanel, setShowCharacterPanel] = useState(false);
  const mapRef = useRef<SimpleMapRef>(null);

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen bg-soul-950">
        <div className="text-center">
          <div className="text-red-800 text-6xl mb-4 opacity-60">⚠</div>
          <div className="text-neutral-200 text-xl font-display uppercase tracking-widest mb-2">
            Error loading map
          </div>
          <div className="text-neutral-500 font-serif mb-6">{error.message}</div>
          <Button
            variant="primary"
            onClick={() => window.location.reload()}
          >
            Retry
          </Button>
        </div>
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

  // Show wallet connection loading state
  if (isConnecting) {
    return (
      <div className="w-full h-screen relative bg-abyss flex items-center justify-center">
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

      {/* Character List Toggle Button - Responsive with enhanced accessibility */}
      <button
        onClick={() => setShowCharacterPanel(!showCharacterPanel)}
        className={`fixed top-4 left-4 z-50 flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-2 rounded-lg border-2 font-wagdie font-bold tracking-wide transition-all min-h-[44px] focus:ring-2 focus:ring-gold focus:ring-offset-2 focus:ring-offset-abyss ${showCharacterPanel
          ? 'bg-gold text-abyss border-gold'
          : 'bg-shadow text-gold border-gold hover:bg-gold/10'
          }`}
        aria-label="Toggle character list panel"
        aria-expanded={showCharacterPanel}
        aria-controls="character-list-panel"
        onKeyDown={(e) => {
          if (e.key === 'Escape' && showCharacterPanel) {
            setShowCharacterPanel(false);
          }
        }}
      >
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
          />
        </svg>
        <span className="hidden xs:inline text-sm sm:text-base">My Characters</span>
        <span className="xs:hidden text-sm sm:text-base">Chars</span>
        {connectedWallet && (
          <div className="w-2 h-2 bg-gold rounded-full animate-pulse" aria-label="Wallet connected"></div>
        )}
      </button>

      {/* Character List Panel - Responsive positioning */}
      {showCharacterPanel && (
        <div
          id="character-list-panel"
          className="fixed top-20 left-4 right-4 sm:left-4 sm:right-auto sm:max-w-sm z-40"
          role="dialog"
          aria-label="Character list"
          aria-modal="false"
        >
          <CharacterListPanel
            characters={characterLocations}
            connectedWallet={connectedWallet}
            onCharacterSelect={(character: CharacterLocation) => {
              // Focus map on the selected character
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

      {/* Wallet Connection Prompt - Image-based button with accessibility */}
      {!connectedWallet && (
        <button
          onClick={connectWallet}
          className="fixed top-4 right-4 z-50 relative w-[160px] sm:w-[180px] h-[48px] group focus:ring-2 focus:ring-gold focus:ring-offset-2 focus:ring-offset-abyss rounded-lg"
          aria-label="Connect wallet to view your characters"
        >
          <Image
            src="/images/walletbutton/button-connect.png"
            alt="Connect Wallet"
            fill
            className="object-contain transition-opacity duration-200 group-hover:opacity-90"
          />
          <span className="relative z-10 text-abyss font-wagdie font-bold text-sm tracking-wider group-hover:text-black transition-colors uppercase mt-1 block">
            Connect Wallet
          </span>
        </button>
      )}

      {/* Connected Wallet Indicator - Image-based button with disconnect */}
      {connectedWallet && (
        <button
          onClick={() => {
            // Disconnect logic would go here
            window.location.reload();
          }}
          className="fixed top-4 right-4 z-50 relative w-[160px] sm:w-[180px] h-[48px] group focus:ring-2 focus:ring-gold focus:ring-offset-2 focus:ring-offset-abyss rounded-lg"
          aria-label={`Connected wallet: ${connectedWallet.slice(0, 6)}...${connectedWallet.slice(-4)}. Click to disconnect`}
          title="Click to disconnect"
        >
          <Image
            src="/images/walletbutton/button-disconnect.png"
            alt="Disconnect Wallet"
            fill
            className="object-contain transition-opacity duration-200 group-hover:opacity-90"
          />
          <div className="relative z-10 flex items-center justify-center h-full">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-gold rounded-full animate-pulse" aria-hidden="true"></div>
              <span className="font-wagdie text-xs sm:text-sm text-bone group-hover:text-gold transition-colors hidden xs:inline">
                {connectedWallet.slice(0, 6)}...{connectedWallet.slice(-4)}
              </span>
              <span className="font-wagdie text-xs text-bone group-hover:text-gold transition-colors xs:hidden">
                {connectedWallet.slice(0, 4)}...{connectedWallet.slice(-2)}
              </span>
            </div>
          </div>
        </button>
      )}
    </div>
  );
}
