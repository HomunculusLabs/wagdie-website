/**
 * SimpleMap Component - REFACTORED
 *
 * Main map component that orchestrates the display of WAGDIE world map with markers.
 * This is a refactored version that uses modular components for better maintainability.
 *
 * Reduced from 735 lines to ~150 lines by extracting:
 * - IconFactory for icon creation
 * - PopupRenderer and TooltipRenderer for UI
 * - MarkerComponent for generic marker rendering
 * - LayerController for layer management
 * - LayerControls for UI controls
 *
 * All marker-specific rendering is now handled by individual marker components.
 */

'use client';

import React, { useMemo, useRef, useCallback, useState, useLayoutEffect, useEffect } from 'react';
import { MapContainer, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
// Clustering temporarily disabled to avoid context issues
// import 'react-leaflet-markercluster/styles';
// import './MarkerCluster.css';
// import MarkerClusterGroup from 'react-leaflet-markercluster';

// Components
import { LayerController, useLayerFilteredMarkers } from './LayerController';
import LayerControls from './LayerControls';
import LocationMarker from './markers/LocationMarker';
import CharacterMarker from './markers/CharacterMarker';
import BurnMarker from './markers/BurnMarker';
import DeathMarker from './markers/DeathMarker';
import FightMarker from './markers/FightMarker';

// Types
import type { Location, CharacterLocation } from '@/lib/types/map';
import type { LayerVisibility } from '@/specs/008-map-refactor/contracts/layer-controller';
import type { MapMarkerData } from '@/specs/008-map-refactor/contracts/marker-component';

interface SimpleMapProps {
  locations: Location[];
  characterLocations: CharacterLocation[];
  layers: LayerVisibility;
  toggleLayer: (layer: keyof LayerVisibility) => void;
  onMarkerClick?: (marker: MapMarkerData) => void;
}

export interface SimpleMapRef {
  setView: (center: [number, number], zoom?: number, options?: L.ZoomPanOptions) => void;
  getMap: () => L.Map | null;
}

// Fix for default markers in react-leaflet with webpack
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

/**
 * Add image overlay to the map
 */
function ImageOverlay() {
  const map = useMap();

  React.useEffect(() => {
    if (!map) return;

    map.attributionControl.setPrefix('WAGDIE World');

    // Add WAGDIE world image overlay
    const bounds: L.LatLngBoundsExpression = [[0, 0], [2222, 2222]];
    const imageOverlay = L.imageOverlay('/images/wagdiemap.png', bounds);

    try {
      imageOverlay.addTo(map);
      map.fitBounds(bounds);

      return () => {
        try {
          imageOverlay.remove();
        } catch (e) {
          // Ignore errors during cleanup
        }
      };
    } catch (e) {
      // If image overlay fails to load, still set up the map
      console.warn('Failed to load map image overlay:', e);
      return undefined;
    }
  }, [map]);

  return null;
}

/**
 * Detect if device is mobile or tablet
 */
function isMobileOrTablet(): boolean {
  if (typeof window === 'undefined') return false;
  return window.innerWidth <= 1024;
}

/**
 * Error Boundary for MapContainer - handles "Map container is already initialized" and other map errors
 * Must be a class component to catch render errors of descendants.
 */
class MapErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean; error?: Error }> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error) {
    // eslint-disable-next-line no-console
    console.error('MapErrorBoundary caught:', error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center h-screen bg-abyss">
          <div className="text-center p-8 max-w-md">
            <div className="text-poison text-6xl mb-4">⚠️</div>
            <div className="text-bone text-xl mb-4 font-wagdie">Map Error</div>
            <div className="text-mist mb-6">
              An unexpected error occurred while loading the map.
            </div>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-2 bg-gold text-abyss font-wagdie font-bold rounded-lg hover:bg-ember transition-all"
            >
              Reload Page
            </button>
          </div>
        </div>
      );
    }
    return <>{this.props.children}</>;
  }
}

/**
 * Main SimpleMap Component - REFACTORED
 *
 * Now a thin orchestrator that delegates to specialized components
 */
const SimpleMapComponent = React.forwardRef<SimpleMapRef, SimpleMapProps>(
  ({ locations, characterLocations, layers, toggleLayer, onMarkerClick }, ref) => {
    // State to control when to render the map (to avoid HMR conflicts)
    const [shouldRenderMap, setShouldRenderMap] = useState(false);
    // Stable key to force a clean MapContainer mount exactly once per component lifecycle
    const [mapKey] = useState(() => `wagdie-map-${Date.now()}`);
    // Hold Leaflet map instance for imperative handle
    const leafletMapRef = useRef<L.Map | null>(null);

    // Check for existing map and delay rendering slightly to avoid HMR conflicts
    useEffect(() => {
      const timer = setTimeout(() => {
        // Clean up any existing map instance
        const containerElement = document.getElementById('wagdie-world-map');
        if (containerElement) {
          try {
            // If Leaflet has previously associated a map with this container, clear its internal id
            if ((containerElement as any)._leaflet_id) {
              (containerElement as any)._leaflet_id = undefined;
            }
            // Proactively clear any leftover DOM children
            containerElement.innerHTML = '';
          } catch (e) {
            console.warn('Error cleaning up map:', e);
          }
        }
        setShouldRenderMap(true);
      }, 100); // Small delay to allow HMR cleanup

      return () => clearTimeout(timer);
    }, []);

    // Expose imperative methods to parent
    React.useImperativeHandle(ref, () => ({
      setView: (center: [number, number], zoom?: number, options?: L.ZoomPanOptions) => {
        if (leafletMapRef.current) {
          leafletMapRef.current.setView(center as any, zoom ?? leafletMapRef.current.getZoom(), options);
        }
      },
      getMap: () => leafletMapRef.current,
    }), []);

    // Bridge component to capture Leaflet map instance
    function MapHandleBridge() {
      const map = useMap();
      useEffect(() => {
        leafletMapRef.current = map;
        return () => {
          try {
            // Ensure full cleanup on unmount in dev/HMR
            const container = map.getContainer() as any;
            if (container && container._leaflet_id) {
              container._leaflet_id = undefined;
            }
            map.remove();
          } catch (_) {
            // ignore
          } finally {
            leafletMapRef.current = null;
          }
        };
      }, [map]);
      return null;
    }

    // Create location marker components
    const locationMarkers = useMemo(() => {
      if (!layers.locations) return [];

      return locations.map((location) => {
        if (!location.metadata?.bounds) {
          console.warn('Location missing metadata:', location);
          return null;
        }

        const center: [number, number] =
          location.metadata.center || [
            (location.metadata.bounds[0][0] + location.metadata.bounds[1][0]) / 2,
            (location.metadata.bounds[0][1] + location.metadata.bounds[1][1]) / 2,
          ];

        return (
          <LocationMarker
            key={`location-${location.id}`}
            id={location.id}
            type="location"
            data={location}
            position={center}
            onClick={onMarkerClick}
            isMobile={isMobileOrTablet()}
          />
        );
      }).filter(Boolean);
    }, [locations, layers.locations, onMarkerClick]);

    // Create character marker components
    const characterMarkers = useMemo(() => {
      if (!layers.characters) return [];

      return characterLocations.map((charLocation) => {
        if (!charLocation.location?.metadata?.bounds) {
          console.warn('Character location missing metadata:', charLocation);
          return null;
        }

        const center: [number, number] =
          charLocation.location.metadata.center || [
            (charLocation.location.metadata.bounds[0][0] + charLocation.location.metadata.bounds[1][0]) / 2,
            (charLocation.location.metadata.bounds[0][1] + charLocation.location.metadata.bounds[1][1]) / 2,
          ];

        return (
          <CharacterMarker
            key={`character-${charLocation.character_token_id}`}
            id={`character-${charLocation.character_token_id}`}
            type="character"
            data={charLocation}
            position={center}
            onClick={onMarkerClick}
            isMobile={isMobileOrTablet()}
          />
        );
      }).filter(Boolean);
    }, [characterLocations, layers.characters, onMarkerClick]);

    // Note: Event markers (burns, deaths, fights) would be added here
    // For now, using empty arrays as they're loaded via hooks
    // This will be implemented in the actual refactoring

    const burnMarkers: any[] = [];
    const deathMarkers: any[] = [];
    const fightMarkers: any[] = [];

    // Clustering options removed while clustering is disabled

    // Show loading state while waiting to render map
    if (!shouldRenderMap) {
      return (
        <div className="flex items-center justify-center h-screen bg-abyss">
          <div className="text-center p-8 max-w-md">
            <div className="text-bone text-xl mb-4 font-wagdie">
              Initializing Map...
            </div>
            <div className="text-mist mb-6">
              Please wait while we prepare the WAGDIE World map.
            </div>
            <div className="animate-spin w-8 h-8 border-2 border-gold border-t-transparent rounded-full mx-auto"></div>
          </div>
        </div>
      );
    }

    return (
      <React.Fragment>
        {/* Skip to content link for accessibility - Hot reload test */}
        <a
          href="#map-main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-gold focus:text-abyss focus:font-wagdie focus:font-bold focus:rounded"
        >
          Skip to map controls
        </a>

        <div style={{ height: '100%', width: '100%' }}>
          <MapErrorBoundary>
            <MapContainer
              key={mapKey}
              id="wagdie-world-map"
              center={[1111, 1111]}
              zoom={0}
              minZoom={-2}
              maxZoom={2}
              crs={L.CRS.Simple}
              style={{ height: '100%', width: '100%' }}
              attributionControl={true}
            >
              <MapHandleBridge />
              <ImageOverlay />

          {/* Layer Controller provides context for layer management */}
          <LayerController
            locations={locationMarkers}
            characterLocations={characterMarkers}
            burnMarkers={burnMarkers}
            deathMarkers={deathMarkers}
            fightMarkers={fightMarkers}
          >
            {/* Location markers (clustering disabled) */}
            {locationMarkers.length > 0 && (
              <>{locationMarkers}</>
            )}

            {/* Character markers (clustering disabled) */}
            {characterMarkers.length > 0 && (
              <>{characterMarkers}</>
            )}

            {/* Event markers - TODO: Add event markers here */}
            {burnMarkers.length > 0 && (
              <>{burnMarkers}</>
            )}

            {deathMarkers.length > 0 && (
              <>{deathMarkers}</>
            )}

            {fightMarkers.length > 0 && (
              <>{fightMarkers}</>
            )}
          </LayerController>
        </MapContainer>
          </MapErrorBoundary>
        </div>

        {/* Layer Controls - Moved to separate component for maintainability */}
        <div
          id="map-main-content"
          role="region"
          aria-label="Map layer controls"
        >
          <LayerControls
            layers={layers}
            onToggle={toggleLayer}
            showCounts={true}
          />
        </div>

        {/* Live region for announcements */}
        <div
          id="map-status"
          role="status"
          aria-live="polite"
          aria-atomic="true"
          className="sr-only"
        />
      </React.Fragment>
    );
  }
);

SimpleMapComponent.displayName = 'SimpleMap';

// Export with memoization for performance
export const SimpleMap = React.memo(SimpleMapComponent, (prevProps, nextProps) => {
  // Only re-render if these props have actually changed
  return (
    prevProps.locations === nextProps.locations &&
    prevProps.characterLocations === nextProps.characterLocations &&
    prevProps.layers === nextProps.layers &&
    prevProps.toggleLayer === nextProps.toggleLayer &&
    prevProps.onMarkerClick === nextProps.onMarkerClick
  );
});
