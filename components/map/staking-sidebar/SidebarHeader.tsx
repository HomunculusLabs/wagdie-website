'use client';

import { Badge } from '@/components/ui';
import type { MarkerPayload, MapLocationData } from '@/game/EventBus';

interface SidebarHeaderProps {
  selectedMarker: MarkerPayload | null;
  headerTitle: string;
  isLocationMarker: boolean;
  locationData: MapLocationData | null;
  onClose: () => void;
}

export function SidebarHeader({
  selectedMarker,
  headerTitle,
  isLocationMarker,
  locationData,
  onClose,
}: SidebarHeaderProps) {
  return (
    <div className="px-5 py-4 border-b border-neutral-800/80 bg-gradient-to-b from-soul-950 to-transparent flex items-center justify-between gap-3">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <h2
            id="map-sidebar-title"
            className="font-eskapade text-neutral-100 tracking-wide text-lg truncate"
            title={headerTitle}
          >
            {headerTitle}
          </h2>
          {selectedMarker && (
            <Badge variant="outline" className="text-xs px-1.5 py-0 shrink-0">
              {selectedMarker.type.toUpperCase()}
            </Badge>
          )}
        </div>
        {isLocationMarker && locationData?.description && (
          <p className="text-sm text-neutral-500 font-eskapade mt-1 line-clamp-1">
            {locationData.description}
          </p>
        )}
      </div>

      <button
        onClick={onClose}
        className="w-8 h-8 flex items-center justify-center rounded-lg bg-neutral-900/50 border border-neutral-800 text-neutral-500 hover:text-neutral-300 hover:border-neutral-700 transition-all"
        aria-label="Close"
        type="button"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}

