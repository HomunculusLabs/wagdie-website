'use client';

import { useEffect, useRef, useState } from 'react';
import type { MarkerPayload, MapLocationData } from '@/game/EventBus';
import type { CharacterWithLocation } from '@/lib/repositories/character-repository';
import { useMapStakingPanel, type SelectedStakingLocation } from '@/hooks/map/useMapStakingPanel';
import { Alert, Spinner } from '@/components/ui';
import { ApprovalBanner, ApprovalReadyBanner } from './staking-sidebar/ApprovalBanner';
import { CharacterStakeList } from './staking-sidebar/CharacterStakeList';
import { LocationTabs } from './staking-sidebar/LocationTabs';
import { MarkerDetailsCard } from './staking-sidebar/MarkerDetailsCard';
import { PaginationControls } from './staking-sidebar/PaginationControls';
import { SidebarHeader } from './staking-sidebar/SidebarHeader';
import { SidebarShell } from './staking-sidebar/SidebarShell';
import { StakedHereList } from './staking-sidebar/StakedHereList';
import { WalletGate } from './staking-sidebar/WalletGate';
import { getMarkerTitle } from './staking-sidebar/utils';

export type { SelectedStakingLocation } from '@/hooks/map/useMapStakingPanel';

export interface MapStakingSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  selectedMarker: MarkerPayload | null;
  stakedHere: CharacterWithLocation[];
  selectedLocation: SelectedStakingLocation | null;
  selectedLocationError?: string | null;
  walletAddress?: string;
  onStakingChanged?: () => void;
}

export function MapStakingSidebar({
  isOpen,
  onClose,
  selectedMarker,
  stakedHere,
  selectedLocation,
  selectedLocationError,
  walletAddress,
  onStakingChanged,
}: MapStakingSidebarProps) {
  const panelRef = useRef<HTMLDivElement | null>(null);
  const [visible, setVisible] = useState(false);

  const panel = useMapStakingPanel({
    isOpen,
    selectedLocation,
    selectedMarker,
    stakedHere,
    walletAddress,
    onStakingChanged,
  });

  useEffect(() => {
    if (isOpen) {
      setVisible(true);
      return;
    }

    const timer = window.setTimeout(() => setVisible(false), 300);
    return () => window.clearTimeout(timer);
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Escape' || !isOpen) return;
      e.preventDefault();
      onClose();
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const headerTitle = getMarkerTitle(selectedMarker);
  const isLocationMarker = selectedMarker?.type === 'location';
  const locationData = isLocationMarker ? (selectedMarker.data as MapLocationData) : null;
  const locationSelectionError =
    isLocationMarker && selectedLocationError ? selectedLocationError : null;

  if (!visible && !isOpen) return null;

  return (
    <SidebarShell
      isOpen={isOpen}
      panelRef={panelRef}
      onClose={onClose}
      footer={
        panel.isConnected &&
        !panel.canStakeNow &&
        selectedLocation &&
        panel.approvalState === 'approved' ? (
          <div className="px-5 py-3 border-t border-neutral-800/60 bg-gradient-to-t from-soul-950 to-transparent">
            <div className="flex items-center gap-2 text-sm text-neutral-500 font-eskapade">
              <svg className="w-4 h-4 text-soul-accent/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>Select an unstaked character to stake at <span className="text-neutral-400">{selectedLocation.location.name}</span></span>
            </div>
          </div>
        ) : null
      }
    >
      <SidebarHeader
        selectedMarker={selectedMarker}
        headerTitle={headerTitle}
        isLocationMarker={isLocationMarker}
        locationData={locationData}
        onClose={onClose}
      />

      <div className="flex-1 overflow-y-auto p-5 space-y-5">
        {selectedMarker && !isLocationMarker && (
          <MarkerDetailsCard marker={selectedMarker} />
        )}

        {isLocationMarker && (
          <LocationTabs
            activeTab={panel.activeTab}
            setActiveTab={panel.setActiveTab}
            stakedCount={stakedHere.length}
            totalCharacters={panel.totalCharacters}
            isConnected={panel.isConnected}
          />
        )}

        {isLocationMarker && panel.activeTab === 'staked-here' && (
          <div className="space-y-2">
            <StakedHereList
              stakedHere={stakedHere}
              effectiveWallet={panel.effectiveWallet}
              activeTokenId={panel.activeTokenId}
              isUnstaking={panel.isUnstaking}
              isLoadingStatuses={panel.isLoadingStatuses}
              handleUnstake={panel.handleUnstake}
            />
          </div>
        )}

        {(panel.activeTab === 'your-characters' || !isLocationMarker) && (
          <div className="space-y-3">
            {!panel.isConnected ? (
              <WalletGate />
            ) : (
              <>
                {panel.approvalState === 'approved' && <ApprovalReadyBanner />}

                {panel.showApprovalBanner && (
                  <ApprovalBanner
                    approvalState={panel.approvalState}
                    approvalError={panel.approvalError}
                    isApproving={panel.isApproving}
                    handleApprove={panel.handleApprove}
                  />
                )}

                {panel.chainError && (
                  <Alert variant="default" className="bg-neutral-900/30 border-neutral-800">
                    {panel.chainError}
                  </Alert>
                )}

                {(panel.isLoadingCharacters || panel.isLoadingStatuses) && (
                  <div className="flex items-center justify-center gap-3 py-4">
                    <Spinner size="sm" />
                    <span className="text-base text-neutral-500 font-eskapade">Loading characters…</span>
                  </div>
                )}

                {panel.dataLoadingError && (
                  <Alert variant="default" className="bg-neutral-900/30 border-neutral-800">
                    {panel.dataLoadingError}
                  </Alert>
                )}
                {locationSelectionError && (
                  <Alert variant="default" className="bg-neutral-900/30 border-neutral-800">
                    {locationSelectionError}
                  </Alert>
                )}
                {panel.transactionError && (
                  <Alert variant="destructive">
                    {panel.transactionError}
                  </Alert>
                )}

                {!panel.isLoadingCharacters && (
                  <CharacterStakeList
                    allCharacters={panel.allCharacters}
                    activeTokenId={panel.activeTokenId}
                    isStaking={panel.isStaking}
                    isUnstaking={panel.isUnstaking}
                    isLoadingStatuses={panel.isLoadingStatuses}
                    canStakeNow={panel.canStakeNow}
                    handleStake={panel.handleStake}
                    handleUnstake={panel.handleUnstake}
                  />
                )}

                <PaginationControls
                  page={panel.page}
                  totalPages={panel.totalPages}
                  startIndex={panel.startIndex}
                  endIndex={panel.endIndex}
                  totalCharacters={panel.totalCharacters}
                  isLoadingStatuses={panel.isLoadingStatuses}
                  setPage={panel.setPage}
                />
              </>
            )}
          </div>
        )}
      </div>
    </SidebarShell>
  );
}

export default MapStakingSidebar;
