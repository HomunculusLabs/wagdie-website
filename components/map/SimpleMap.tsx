'use client';

import { useEffect, useRef, useImperativeHandle, forwardRef, memo, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Tooltip, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'react-leaflet-markercluster/styles';
import './MarkerCluster.css';
import MarkerClusterGroup from 'react-leaflet-markercluster';
import type { Location, CharacterLocation, LayerVisibility, MapMarkerData, EventMarker } from '@/lib/types/map';
import { useEventMarkers } from '@/hooks/map/useEventMarkers';

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

// Component to handle map ref and initialization
function MapController({ mapRef }: { mapRef: React.MutableRefObject<L.Map | null> }) {
  const map = useMap();
  useEffect(() => {
    mapRef.current = map;
    map.attributionControl.setPrefix('WAGDIE World');
    const bounds: L.LatLngBoundsExpression = [[0, 0], [2222, 2222]];
    const imageOverlay = L.imageOverlay('/images/wagdiemap.png', bounds);
    imageOverlay.addTo(map);
    map.fitBounds(bounds);
  }, [map, mapRef]);
  return null;
}

// Memoized component to prevent unnecessary re-renders
const SimpleMapComponent = forwardRef<SimpleMapRef, SimpleMapProps>(({ locations, characterLocations, layers, toggleLayer, onMarkerClick }, ref) => {
  const mapInstanceRef = useRef<L.Map | null>(null);

  // Helper function to get responsive icon sizes for touch targets
  const getIconSizes = (isMobile: boolean, baseSize: [number, number]) => {
    // Minimum touch target size: 44px (Apple/Google guidelines)
    const minTouchSize = 44;
    const scaleFactor = isMobile ? 1.5 : 1;
    const size = Math.max(baseSize[0] * scaleFactor, minTouchSize);
    return [size, size] as [number, number];
  };

  // Detect mobile/tablet
  const isMobileOrTablet = () => {
    if (typeof window === 'undefined') return false;
    return window.innerWidth <= 1024;
  };

  // Create custom icons
  const createLocationIcon = (isMobile: boolean) => {
    const size = getIconSizes(isMobile, [32, 32]);
    return L.icon({
      iconUrl: '/images/map-icons/icon_location.png',
      iconSize: size,
      iconAnchor: [size[0] / 2, size[1]],
      popupAnchor: [0, -size[1]],
    });
  };

  const createCharacterIcon = (isMobile: boolean) => {
    const size = getIconSizes(isMobile, [24, 24]);
    return L.icon({
      iconUrl: '/images/map-icons/icon_character.png',
      iconSize: size,
      iconAnchor: [size[0] / 2, size[1]],
      popupAnchor: [0, -size[1]],
    });
  };

  const createBurnIcon = (isMobile: boolean) => {
    const size = getIconSizes(isMobile, [28, 28]);
    return L.icon({
      iconUrl: '/images/map-icons/icon_burn.png',
      iconSize: size,
      iconAnchor: [size[0] / 2, size[1]],
      popupAnchor: [0, -size[1]],
    });
  };

  const createDeathIcon = (isMobile: boolean) => {
    const size = getIconSizes(isMobile, [28, 28]);
    return L.icon({
      iconUrl: '/images/map-icons/icon_death.png',
      iconSize: size,
      iconAnchor: [size[0] / 2, size[1]],
      popupAnchor: [0, -size[1]],
    });
  };

  const createFightIcon = (isMobile: boolean) => {
    const size = getIconSizes(isMobile, [28, 28]);
    return L.icon({
      iconUrl: '/images/map-icons/icon_fight.png',
      iconSize: size,
      iconAnchor: [size[0] / 2, size[1]],
      popupAnchor: [0, -size[1]],
    });
  };

  // Fetch event markers
  const { eventMarkers } = useEventMarkers();

  // Create location markers
  const locationMarkers = useMemo(() => {
    if (!layers.locations) return [];

    return locations.map((location) => {
      if (!location.metadata || !location.metadata.bounds) {
        console.warn('Location missing metadata:', location);
        return null;
      }

      const bounds = location.metadata.bounds;
      const center: [number, number] = location.metadata.center || [
        (bounds[0][0] + bounds[1][0]) / 2,
        (bounds[0][1] + bounds[1][1]) / 2,
      ];

      const isMobile = isMobileOrTablet();
      const icon = createLocationIcon(isMobile);

      const handleClick = () => {
        if (onMarkerClick) {
          onMarkerClick({
            id: location.id,
            type: 'location',
            position: center,
            data: location,
          });
        }
      };

      return (
        <Marker
          key={`location-${location.id}`}
          position={center}
          icon={icon}
          eventHandlers={{ click: handleClick }}
        >
          <Tooltip direction="top" className="custom-tooltip">
            <div style={{ fontFamily: "'Wagdie_Fraktur_21', serif" }}>
              <strong>{location.name}</strong><br />
              {location.description || 'WAGDIE Location'}
            </div>
          </Tooltip>
          <Popup className="custom-popup" maxWidth={300}>
            <div style={{ fontFamily: "'Wagdie_Fraktur_21', serif", minWidth: '250px' }}>
              <h3 style={{ color: '#d4af37', fontWeight: 'bold', marginBottom: '8px', borderBottom: '1px solid #252525', paddingBottom: '4px' }}>
                {location.name}
              </h3>
              <p style={{ color: '#e8e8e8', fontSize: '12px', marginBottom: '8px' }}>
                {location.description || 'A location in the WAGDIE world'}
              </p>
              <div style={{ background: '#1a1a1a', padding: '8px', borderRadius: '4px', marginBottom: '8px' }}>
                <div style={{ color: '#b0b0b0', fontSize: '11px', marginBottom: '4px' }}>
                  <span style={{ color: '#e8e8e8' }}>Area:</span> {location.metadata.area || 'Unknown'}
                </div>
                <div style={{ color: '#b0b0b0', fontSize: '11px', marginBottom: '4px' }}>
                  <span style={{ color: '#e8e8e8' }}>Type:</span> {location.metadata.properties?.terrain || 'Unknown'}
                </div>
                <div style={{ color: '#b0b0b0', fontSize: '11px' }}>
                  <span style={{ color: '#e8e8e8' }}>Difficulty:</span> {location.metadata.properties?.difficulty || 'Unknown'}
                </div>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={() => alert('Stake feature coming soon!')}
                  style={{
                    flex: 1,
                    background: '#d4af37',
                    color: '#0a0a0a',
                    border: 'none',
                    padding: '8px',
                    borderRadius: '4px',
                    fontFamily: "'Wagdie_Fraktur_21', serif",
                    fontSize: '11px',
                    cursor: 'pointer',
                  }}
                >
                  Stake Character
                </button>
                <button
                  onClick={() => console.log('View details for', location.name)}
                  style={{
                    flex: 1,
                    background: '#252525',
                    color: '#e8e8e8',
                    border: '1px solid #252525',
                    padding: '8px',
                    borderRadius: '4px',
                    fontFamily: "'Wagdie_Fraktur_21', serif",
                    fontSize: '11px',
                    cursor: 'pointer',
                  }}
                >
                  View Details
                </button>
              </div>
            </div>
          </Popup>
        </Marker>
      );
    }).filter(Boolean);
  }, [locations, layers.locations, onMarkerClick]);

  // Create character markers
  const characterMarkers = useMemo(() => {
    if (!layers.characters) return [];

    return characterLocations.map((charLocation) => {
      if (!charLocation.location) return null;

      if (!charLocation.location.metadata || !charLocation.location.metadata.bounds) {
        console.warn('Character location missing metadata:', charLocation);
        return null;
      }

      const bounds = charLocation.location.metadata.bounds;
      const center: [number, number] = charLocation.location.metadata.center || [
        (bounds[0][0] + bounds[1][0]) / 2,
        (bounds[0][1] + bounds[1][1]) / 2,
      ];

      const isMobile = isMobileOrTablet();
      const icon = createCharacterIcon(isMobile);

      const handleClick = () => {
        if (onMarkerClick) {
          onMarkerClick({
            id: `character-${charLocation.character_token_id}`,
            type: 'character',
            position: center,
            data: charLocation,
          });
        }
      };

      return (
        <Marker
          key={`character-${charLocation.character_token_id}`}
          position={center}
          icon={icon}
          eventHandlers={{ click: handleClick }}
        >
          <Tooltip direction="top" className="custom-tooltip">
            <div style={{ fontFamily: "'Wagdie_Fraktur_21', serif" }}>
              <strong>Character #{charLocation.character_token_id}</strong><br />
              {charLocation.location?.name || 'Unknown Location'}
            </div>
          </Tooltip>
          <Popup className="custom-popup" maxWidth={300}>
            <div style={{ fontFamily: "'Wagdie_Fraktur_21', serif", minWidth: '250px' }}>
              <h3 style={{ color: '#d4af37', fontWeight: 'bold', marginBottom: '8px', borderBottom: '1px solid #252525', paddingBottom: '4px' }}>
                Character #{charLocation.character_token_id}
              </h3>
              <p style={{ color: '#e8e8e8', fontSize: '12px', marginBottom: '8px' }}>
                A WAGDIE character
              </p>
              <div style={{ background: '#1a1a1a', padding: '8px', borderRadius: '4px', marginBottom: '8px' }}>
                <div style={{ color: '#b0b0b0', fontSize: '11px', marginBottom: '4px' }}>
                  <span style={{ color: '#e8e8e8' }}>Token ID:</span> {charLocation.character_token_id}
                </div>
                <div style={{ color: '#b0b0b0', fontSize: '11px', marginBottom: '4px' }}>
                  <span style={{ color: '#e8e8e8' }}>Location:</span> {charLocation.location?.name || 'Unknown'}
                </div>
                <div style={{ color: '#b0b0b0', fontSize: '11px', marginBottom: '4px' }}>
                  <span style={{ color: '#e8e8e8' }}>Status:</span> <span style={{ color: '#4a7c59', textTransform: 'capitalize' }}>{charLocation.status}</span>
                </div>
                <div style={{ color: '#b0b0b0', fontSize: '11px' }}>
                  <span style={{ color: '#e8e8e8' }}>Wallet:</span> {charLocation.wallet_address.slice(0, 6)}...{charLocation.wallet_address.slice(-4)}
                </div>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={() => alert('View character feature coming soon!')}
                  style={{
                    flex: 1,
                    background: '#d4af37',
                    color: '#0a0a0a',
                    border: 'none',
                    padding: '8px',
                    borderRadius: '4px',
                    fontFamily: "'Wagdie_Fraktur_21', serif",
                    fontSize: '11px',
                    cursor: 'pointer',
                  }}
                >
                  View Character
                </button>
                <button
                  onClick={() => alert('Move character feature coming soon!')}
                  style={{
                    flex: 1,
                    background: '#252525',
                    color: '#e8e8e8',
                    border: '1px solid #252525',
                    padding: '8px',
                    borderRadius: '4px',
                    fontFamily: "'Wagdie_Fraktur_21', serif",
                    fontSize: '11px',
                    cursor: 'pointer',
                  }}
                >
                  Move Character
                </button>
              </div>
            </div>
          </Popup>
        </Marker>
      );
    }).filter(Boolean);
  }, [characterLocations, layers.characters, onMarkerClick]);

  // Create burn event markers
  const burnMarkers = useMemo(() => {
    if (!layers.burns) return [];

    return eventMarkers.burns.map((event) => {
      const isMobile = isMobileOrTablet();
      const icon = createBurnIcon(isMobile);

      const handleClick = () => {
        if (onMarkerClick) {
          onMarkerClick({
            id: event.id,
            type: 'burn',
            position: event.position as [number, number],
            data: event,
          });
        }
      };

      return (
        <Marker
          key={event.id}
          position={event.position as [number, number]}
          icon={icon}
          eventHandlers={{ click: handleClick }}
        >
          <Tooltip direction="top" className="custom-tooltip">
            <div style={{ fontFamily: "'Wagdie_Fraktur_21', serif" }}>
              <strong>{event.title}</strong><br />
              {event.description || 'Burn Event'}
            </div>
          </Tooltip>
          <Popup className="custom-popup" maxWidth={300}>
            <div style={{ fontFamily: "'Wagdie_Fraktur_21', serif", minWidth: '250px' }}>
              <h3 style={{ color: '#ff6b35', fontWeight: 'bold', marginBottom: '8px', borderBottom: '1px solid #252525', paddingBottom: '4px' }}>
                {event.title}
              </h3>
              <p style={{ color: '#e8e8e8', fontSize: '12px', marginBottom: '8px' }}>
                {event.description || 'A burn event in the WAGDIE world'}
              </p>
              <div style={{ background: '#1a1a1a', padding: '8px', borderRadius: '4px' }}>
                <div style={{ color: '#b0b0b0', fontSize: '11px' }}>
                  <span style={{ color: '#e8e8e8' }}>Type:</span> Burn Event
                </div>
              </div>
            </div>
          </Popup>
        </Marker>
      );
    }).filter(Boolean);
  }, [eventMarkers.burns, layers.burns, onMarkerClick]);

  // Create death event markers
  const deathMarkers = useMemo(() => {
    if (!layers.deaths) return [];

    return eventMarkers.deaths.map((event) => {
      const isMobile = isMobileOrTablet();
      const icon = createDeathIcon(isMobile);

      const handleClick = () => {
        if (onMarkerClick) {
          onMarkerClick({
            id: event.id,
            type: 'death',
            position: event.position as [number, number],
            data: event,
          });
        }
      };

      return (
        <Marker
          key={event.id}
          position={event.position as [number, number]}
          icon={icon}
          eventHandlers={{ click: handleClick }}
        >
          <Tooltip direction="top" className="custom-tooltip">
            <div style={{ fontFamily: "'Wagdie_Fraktur_21', serif" }}>
              <strong>{event.title}</strong><br />
              {event.description || 'Death Event'}
            </div>
          </Tooltip>
          <Popup className="custom-popup" maxWidth={300}>
            <div style={{ fontFamily: "'Wagdie_Fraktur_21', serif", minWidth: '250px' }}>
              <h3 style={{ color: '#c92a2a', fontWeight: 'bold', marginBottom: '8px', borderBottom: '1px solid #252525', paddingBottom: '4px' }}>
                {event.title}
              </h3>
              <p style={{ color: '#e8e8e8', fontSize: '12px', marginBottom: '8px' }}>
                {event.description || 'A death event in the WAGDIE world'}
              </p>
              <div style={{ background: '#1a1a1a', padding: '8px', borderRadius: '4px' }}>
                <div style={{ color: '#b0b0b0', fontSize: '11px' }}>
                  <span style={{ color: '#e8e8e8' }}>Type:</span> Death Event
                </div>
              </div>
            </div>
          </Popup>
        </Marker>
      );
    }).filter(Boolean);
  }, [eventMarkers.deaths, layers.deaths, onMarkerClick]);

  // Create fight event markers
  const fightMarkers = useMemo(() => {
    if (!layers.fights) return [];

    return eventMarkers.fights.map((event) => {
      const isMobile = isMobileOrTablet();
      const icon = createFightIcon(isMobile);

      const handleClick = () => {
        if (onMarkerClick) {
          onMarkerClick({
            id: event.id,
            type: 'fight',
            position: event.position as [number, number],
            data: event,
          });
        }
      };

      return (
        <Marker
          key={event.id}
          position={event.position as [number, number]}
          icon={icon}
          eventHandlers={{ click: handleClick }}
        >
          <Tooltip direction="top" className="custom-tooltip">
            <div style={{ fontFamily: "'Wagdie_Fraktur_21', serif" }}>
              <strong>{event.title}</strong><br />
              {event.description || 'Fight Event'}
            </div>
          </Tooltip>
          <Popup className="custom-popup" maxWidth={300}>
            <div style={{ fontFamily: "'Wagdie_Fraktur_21', serif", minWidth: '250px' }}>
              <h3 style={{ color: '#ff6b35', fontWeight: 'bold', marginBottom: '8px', borderBottom: '1px solid #252525', paddingBottom: '4px' }}>
                {event.title}
              </h3>
              <p style={{ color: '#e8e8e8', fontSize: '12px', marginBottom: '8px' }}>
                {event.description || 'A fight/battle event in the WAGDIE world'}
              </p>
              <div style={{ background: '#1a1a1a', padding: '8px', borderRadius: '4px' }}>
                <div style={{ color: '#b0b0b0', fontSize: '11px' }}>
                  <span style={{ color: '#e8e8e8' }}>Type:</span> Fight/Battle Event
                </div>
              </div>
            </div>
          </Popup>
        </Marker>
      );
    }).filter(Boolean);
  }, [eventMarkers.fights, layers.fights, onMarkerClick]);

  // Expose map methods via ref
  useImperativeHandle(ref, () => ({
    setView: (center: [number, number], zoom = 1, options?: L.ZoomPanOptions) => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.setView(center, zoom, options);
      }
    },
    getMap: () => mapInstanceRef.current,
  }), []);

  // Cluster options for performance
  const clusterOptions = {
    disableClusteringAtZoom: 16,
    spiderfyOnMaxZoom: true,
    showCoverageOnHover: false,
    zoomToBoundsOnClick: true,
    maxClusterRadius: 80,
    iconCreateFunction: (cluster: any) => {
      const count = cluster.getChildCount();
      const size = count < 100 ? 'large' : count < 1000 ? 'medium' : 'large';
      const className = `marker-cluster marker-cluster-${size}`;
      return L.divIcon({
        html: `<div><span>${count}</span></div>`,
        className,
        iconSize: L.point(40, 40),
      });
    },
  };

  return (
    <>
      {/* Skip to content link for accessibility */}
      <a
        href="#map-main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-gold focus:text-abyss focus:font-wagdie focus:font-bold focus:rounded"
      >
        Skip to map controls
      </a>

      <MapContainer
        center={[1111, 1111]}
        zoom={0}
        minZoom={-2}
        maxZoom={2}
        crs={L.CRS.Simple}
        style={{ height: '100%', width: '100%' }}
        attributionControl={true}
      >
        <MapController mapRef={mapInstanceRef} />

        {/* Location markers with clustering */}
        {layers.locations && (
          <MarkerClusterGroup {...clusterOptions}>
            {locationMarkers}
          </MarkerClusterGroup>
        )}

        {/* Character markers with clustering */}
        {layers.characters && (
          <MarkerClusterGroup {...clusterOptions}>
            {characterMarkers}
          </MarkerClusterGroup>
        )}

        {/* Burn event markers with clustering */}
        {layers.burns && (
          <MarkerClusterGroup {...clusterOptions}>
            {burnMarkers}
          </MarkerClusterGroup>
        )}

        {/* Death event markers with clustering */}
        {layers.deaths && (
          <MarkerClusterGroup {...clusterOptions}>
            {deathMarkers}
          </MarkerClusterGroup>
        )}

        {/* Fight event markers with clustering */}
        {layers.fights && (
          <MarkerClusterGroup {...clusterOptions}>
            {fightMarkers}
          </MarkerClusterGroup>
        )}
      </MapContainer>

      {/* Layer Controls - Responsive for mobile/tablet with enhanced accessibility */}
      <div
        id="map-main-content"
        className="fixed top-4 right-4 sm:right-20 z-30 bg-shadow border-2 border-gold rounded-lg p-3 sm:p-4 shadow-2xl max-w-[calc(100vw-2rem)] sm:max-w-sm"
        role="region"
        aria-label="Map layer controls"
      >
        <div className="flex flex-col gap-2 sm:gap-3">
          <h3 className="font-wagdie text-gold text-xs sm:text-sm font-bold mb-1 sm:mb-2 tracking-wide">
            Map Layers
          </h3>
          <p className="sr-only">
            Use Tab to navigate, Space or Enter to toggle layers. Press L to toggle Locations, C to toggle Characters.
          </p>

          <label className="flex items-center gap-2 sm:gap-3 text-mist text-xs sm:text-sm cursor-pointer hover:text-ember transition-all duration-200 group min-h-[44px] focus-within:ring-2 focus-within:ring-gold focus-within:ring-offset-2 focus-within:ring-offset-abyss rounded">
            <img
              src="/images/map-icons/icon_location.png"
              alt="Locations layer icon"
              className="w-5 h-5 sm:w-6 sm:h-6 filter drop-shadow-[0_0_3px_rgba(212,175,55,0.3)] group-hover:brightness-110 transition-all"
              aria-hidden="true"
            />
            <input
              type="checkbox"
              checked={layers.locations}
              onChange={() => toggleLayer('locations')}
              onKeyDown={(e) => {
                if (e.key === 'l' || e.key === 'L') {
                  e.preventDefault();
                  toggleLayer('locations');
                }
              }}
              className="ml-1 h-4 w-4 rounded border-midnight bg-shadow text-gold focus:ring-gold focus:ring-2 touch-manipulation"
              aria-label="Toggle locations layer (press L)"
              aria-describedby="locations-description"
            />
            <span className="font-wagdie tracking-wide">Locations</span>
          </label>
          <div id="locations-description" className="sr-only">
            Toggle visibility of location markers on the map
          </div>

          <label className="flex items-center gap-2 sm:gap-3 text-mist text-xs sm:text-sm cursor-pointer hover:text-ember transition-all duration-200 group min-h-[44px] focus-within:ring-2 focus-within:ring-gold focus-within:ring-offset-2 focus-within:ring-offset-abyss rounded">
            <img
              src="/images/map-icons/icon_character.png"
              alt="Characters layer icon"
              className="w-5 h-5 sm:w-6 sm:h-6 filter drop-shadow-[0_0_3px_rgba(212,175,55,0.3)] group-hover:brightness-110 transition-all"
              aria-hidden="true"
            />
            <input
              type="checkbox"
              checked={layers.characters}
              onChange={() => toggleLayer('characters')}
              onKeyDown={(e) => {
                if (e.key === 'c' || e.key === 'C') {
                  e.preventDefault();
                  toggleLayer('characters');
                }
              }}
              className="ml-1 h-4 w-4 rounded border-midnight bg-shadow text-gold focus:ring-gold focus:ring-2 touch-manipulation"
              aria-label="Toggle characters layer (press C)"
              aria-describedby="characters-description"
            />
            <span className="font-wagdie tracking-wide">Characters</span>
          </label>
          <div id="characters-description" className="sr-only">
            Toggle visibility of character markers on the map
          </div>

          <div className="border-t border-midnight my-1 sm:my-2" role="separator" aria-hidden="true"></div>

          <label className="flex items-center gap-2 sm:gap-3 text-mist text-xs sm:text-sm cursor-pointer hover:text-ember transition-all duration-200 group min-h-[44px] focus-within:ring-2 focus-within:ring-gold focus-within:ring-offset-2 focus-within:ring-offset-abyss rounded">
            <img
              src="/images/map-icons/icon_burn.png"
              alt="Burns layer icon"
              className="w-5 h-5 sm:w-6 sm:h-6 filter drop-shadow-[0_0_3px_rgba(212,175,55,0.3)] group-hover:brightness-110 transition-all"
              aria-hidden="true"
            />
            <input
              type="checkbox"
              checked={layers.burns}
              onChange={() => toggleLayer('burns')}
              className="ml-1 h-4 w-4 rounded border-midnight bg-shadow text-gold focus:ring-gold focus:ring-2 touch-manipulation"
              aria-label="Toggle burns layer"
              aria-describedby="burns-description"
            />
            <span className="font-wagdie tracking-wide">Burns</span>
          </label>
          <div id="burns-description" className="sr-only">
            Toggle visibility of burn event markers on the map
          </div>

          <label className="flex items-center gap-2 sm:gap-3 text-mist text-xs sm:text-sm cursor-pointer hover:text-ember transition-all duration-200 group min-h-[44px] focus-within:ring-2 focus-within:ring-gold focus-within:ring-offset-2 focus-within:ring-offset-abyss rounded">
            <img
              src="/images/map-icons/icon_death.png"
              alt="Deaths layer icon"
              className="w-5 h-5 sm:w-6 sm:h-6 filter drop-shadow-[0_0_3px_rgba(212,175,55,0.3)] group-hover:brightness-110 transition-all"
              aria-hidden="true"
            />
            <input
              type="checkbox"
              checked={layers.deaths}
              onChange={() => toggleLayer('deaths')}
              className="ml-1 h-4 w-4 rounded border-midnight bg-shadow text-gold focus:ring-gold focus:ring-2 touch-manipulation"
              aria-label="Toggle deaths layer"
              aria-describedby="deaths-description"
            />
            <span className="font-wagdie tracking-wide">Deaths</span>
          </label>
          <div id="deaths-description" className="sr-only">
            Toggle visibility of death event markers on the map
          </div>

          <label className="flex items-center gap-2 sm:gap-3 text-mist text-xs sm:text-sm cursor-pointer hover:text-ember transition-all duration-200 group min-h-[44px] focus-within:ring-2 focus-within:ring-gold focus-within:ring-offset-2 focus-within:ring-offset-abyss rounded">
            <img
              src="/images/map-icons/icon_fight.png"
              alt="Fights layer icon"
              className="w-5 h-5 sm:w-6 sm:h-6 filter drop-shadow-[0_0_3px_rgba(212,175,55,0.3)] group-hover:brightness-110 transition-all"
              aria-hidden="true"
            />
            <input
              type="checkbox"
              checked={layers.fights}
              onChange={() => toggleLayer('fights')}
              className="ml-1 h-4 w-4 rounded border-midnight bg-shadow text-gold focus:ring-gold focus:ring-2 touch-manipulation"
              aria-label="Toggle fights layer"
              aria-describedby="fights-description"
            />
            <span className="font-wagdie tracking-wide">Fights</span>
          </label>
          <div id="fights-description" className="sr-only">
            Toggle visibility of fight/battle event markers on the map
          </div>
        </div>
      </div>

      {/* Live region for announcements */}
      <div
        id="map-status"
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      />
    </>
  );
});

SimpleMapComponent.displayName = 'SimpleMap';

// Memoize the component with custom comparison
export const SimpleMap = memo(SimpleMapComponent, (prevProps, nextProps) => {
  // Only re-render if these props have actually changed
  return (
    prevProps.locations === nextProps.locations &&
    prevProps.characterLocations === nextProps.characterLocations &&
    prevProps.layers === nextProps.layers &&
    prevProps.toggleLayer === nextProps.toggleLayer &&
    prevProps.onMarkerClick === nextProps.onMarkerClick
  );
});
