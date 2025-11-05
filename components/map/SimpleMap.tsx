'use client';

import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { Location, CharacterLocation, LayerVisibility, MapMarkerData } from '@/lib/types/map';

interface SimpleMapProps {
  locations: Location[];
  characterLocations: CharacterLocation[];
  layers: LayerVisibility;
  toggleLayer: (layer: keyof LayerVisibility) => void;
  onMarkerClick?: (marker: MapMarkerData) => void;
}

export function SimpleMap({ locations, characterLocations, layers, toggleLayer, onMarkerClick }: SimpleMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);

  useEffect(() => {
    // Guard against SSR
    if (typeof window === 'undefined') return;

    if (!mapRef.current || mapInstanceRef.current) return;

    // Initialize map
    const map = L.map(mapRef.current, {
      center: [1111, 1111],
      zoom: 0,
      zoomControl: true,
      crs: L.CRS.Simple,
      minZoom: -2,
      maxZoom: 2,
      attributionControl: true,
    });

    // Set attribution separately
    map.attributionControl.setPrefix('WAGDIE World');

    // Add WAGDIE world image with loading tracking
    const bounds: L.LatLngBoundsExpression = [[0, 0], [2222, 2222]];
    const imageOverlay = L.imageOverlay('/images/wagdiemap.png', bounds);

    imageOverlay.on('load', () => {
      console.log('Map image loaded successfully');
    });

    imageOverlay.on('error', (error) => {
      console.error('Failed to load map image:', error);
    });

    imageOverlay.addTo(map);
    map.fitBounds(bounds);

    // Handle window resize for responsive behavior
    const handleResize = () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.invalidateSize();
      }
    };

    window.addEventListener('resize', handleResize);

    mapInstanceRef.current = map;

    return () => {
      window.removeEventListener('resize', handleResize);
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!mapInstanceRef.current) return;

    const map = mapInstanceRef.current;

    // Clear existing markers
    map.eachLayer((layer) => {
      if (layer instanceof L.Marker) {
        map.removeLayer(layer);
      }
    });

    // Add location markers
    if (layers.locations) {
      locations.forEach((location) => {
        // Skip if no metadata or bounds
        if (!location.metadata || !location.metadata.bounds) {
          console.warn('Location missing metadata:', location);
          return;
        }

        const bounds = location.metadata.bounds;
        const center: [number, number] = location.metadata.center || [
          (bounds[0][0] + bounds[1][0]) / 2,
          (bounds[0][1] + bounds[1][1]) / 2,
        ];

        // Create custom icon using WAGDIE icon
        const locationIcon = L.icon({
          iconUrl: '/images/map-icons/icon_location.png',
          iconSize: [32, 32],
          iconAnchor: [16, 32],
          popupAnchor: [0, -32],
        });

        const marker = L.marker(center, {
          icon: locationIcon,
        });

        // Add tooltip on hover
        marker.bindTooltip(
          `<div style="font-family: 'Wagdie_Fraktur_21', serif;">
            <strong>${location.name}</strong><br/>
            ${location.description || 'WAGDIE Location'}
          </div>`,
          {
            direction: 'top',
            offset: [0, -32],
            className: 'custom-tooltip',
          }
        );

        // Add popup on click
        const popupContent = `
          <div style="font-family: 'Wagdie_Fraktur_21', serif; min-width: 250px;">
            <h3 style="color: #d4af37; font-weight: bold; margin-bottom: 8px; border-bottom: 1px solid #252525; padding-bottom: 4px;">
              ${location.name}
            </h3>
            <p style="color: #e8e8e8; font-size: 12px; margin-bottom: 8px;">
              ${location.description || 'A location in the WAGDIE world'}
            </p>
            <div style="background: #1a1a1a; padding: 8px; border-radius: 4px; margin-bottom: 8px;">
              <div style="color: #b0b0b0; font-size: 11px; margin-bottom: 4px;">
                <span style="color: #e8e8e8;">Area:</span> ${location.metadata.area || 'Unknown'}
              </div>
              <div style="color: #b0b0b0; font-size: 11px; margin-bottom: 4px;">
                <span style="color: #e8e8e8;">Type:</span> ${location.metadata.properties?.terrain || 'Unknown'}
              </div>
              <div style="color: #b0b0b0; font-size: 11px;">
                <span style="color: #e8e8e8;">Difficulty:</span> ${location.metadata.properties?.difficulty || 'Unknown'}
              </div>
            </div>
            <div style="display: flex; gap: 8px;">
              <button onclick="alert('Stake feature coming soon!')" style="flex: 1; background: #d4af37; color: #0a0a0a; border: none; padding: 8px; border-radius: 4px; font-family: 'Wagdie_Fraktur_21', serif; font-size: 11px; cursor: pointer;">
                Stake Character
              </button>
              <button onclick="console.log('View details for ${location.name}')" style="flex: 1; background: #252525; color: #e8e8e8; border: 1px solid #252525; padding: 8px; border-radius: 4px; font-family: 'Wagdie_Fraktur_21', serif; font-size: 11px; cursor: pointer;">
                View Details
              </button>
            </div>
          </div>
        `;

        marker.bindPopup(popupContent, {
          className: 'custom-popup',
          maxWidth: 300,
        });

        marker.on('click', () => {
          if (onMarkerClick) {
            onMarkerClick({
              id: location.id,
              type: 'location',
              position: center,
              data: location,
            });
          }
        });

        marker.addTo(map);
      });
    }

    // Add character markers
    if (layers.characters) {
      characterLocations.forEach((charLocation) => {
        if (!charLocation.location) return;

        // Skip if no metadata or bounds
        if (!charLocation.location.metadata || !charLocation.location.metadata.bounds) {
          console.warn('Character location missing metadata:', charLocation);
          return;
        }

        const bounds = charLocation.location.metadata.bounds;
        const center: [number, number] = charLocation.location.metadata.center || [
          (bounds[0][0] + bounds[1][0]) / 2,
          (bounds[0][1] + bounds[1][1]) / 2,
        ];

        // Create custom icon using WAGDIE icon
        const characterIcon = L.icon({
          iconUrl: '/images/map-icons/icon_youarehere.png',
          iconSize: [24, 24],
          iconAnchor: [12, 24],
          popupAnchor: [0, -24],
        });

        const marker = L.marker(center, {
          icon: characterIcon,
        });

        // Add tooltip on hover
        marker.bindTooltip(
          `<div style="font-family: 'Wagdie_Fraktur_21', serif;">
            <strong>Character #${charLocation.character_token_id}</strong><br/>
            ${charLocation.location?.name || 'Unknown Location'}
          </div>`,
          {
            direction: 'top',
            offset: [0, -24],
            className: 'custom-tooltip',
          }
        );

        // Add popup on click
        const characterPopupContent = `
          <div style="font-family: 'Wagdie_Fraktur_21', serif; min-width: 250px;">
            <h3 style="color: #d4af37; font-weight: bold; margin-bottom: 8px; border-bottom: 1px solid #252525; padding-bottom: 4px;">
              Character #${charLocation.character_token_id}
            </h3>
            <p style="color: #e8e8e8; font-size: 12px; margin-bottom: 8px;">
              A WAGDIE character
            </p>
            <div style="background: #1a1a1a; padding: 8px; border-radius: 4px; margin-bottom: 8px;">
              <div style="color: #b0b0b0; font-size: 11px; margin-bottom: 4px;">
                <span style="color: #e8e8e8;">Token ID:</span> ${charLocation.character_token_id}
              </div>
              <div style="color: #b0b0b0; font-size: 11px; margin-bottom: 4px;">
                <span style="color: #e8e8e8;">Location:</span> ${charLocation.location?.name || 'Unknown'}
              </div>
              <div style="color: #b0b0b0; font-size: 11px; margin-bottom: 4px;">
                <span style="color: #e8e8e8;">Status:</span> <span style="color: #4a7c59; text-transform: capitalize;">${charLocation.status}</span>
              </div>
              <div style="color: #b0b0b0; font-size: 11px;">
                <span style="color: #e8e8e8;">Wallet:</span> ${charLocation.wallet_address.slice(0, 6)}...${charLocation.wallet_address.slice(-4)}
              </div>
            </div>
            <div style="display: flex; gap: 8px;">
              <button onclick="alert('View character feature coming soon!')" style="flex: 1; background: #d4af37; color: #0a0a0a; border: none; padding: 8px; border-radius: 4px; font-family: 'Wagdie_Fraktur_21', serif; font-size: 11px; cursor: pointer;">
                View Character
              </button>
              <button onclick="alert('Move character feature coming soon!')" style="flex: 1; background: #252525; color: #e8e8e8; border: 1px solid #252525; padding: 8px; border-radius: 4px; font-family: 'Wagdie_Fraktur_21', serif; font-size: 11px; cursor: pointer;">
                Move Character
              </button>
            </div>
          </div>
        `;

        marker.bindPopup(characterPopupContent, {
          className: 'custom-popup',
          maxWidth: 300,
        });

        marker.on('click', () => {
          if (onMarkerClick) {
            onMarkerClick({
              id: `character-${charLocation.character_token_id}`,
              type: 'character',
              position: center,
              data: charLocation,
            });
          }
        });

        marker.addTo(map);
      });
    }
  }, [locations, characterLocations, layers, onMarkerClick]);

  return (
    <div className="relative w-full h-full">
      <div ref={mapRef} className="w-full h-full" />

      {/* Enhanced Layer Controls with WAGDIE Theme */}
      <div className="absolute top-4 right-4 bg-abyss border-2 border-gold rounded-lg p-4 shadow-xl z-[1000] backdrop-blur-sm">
        <h3 className="font-wagdie text-gold text-sm font-bold mb-3 border-b border-midnight pb-2">
          Map Layers
        </h3>
        <div className="space-y-2.5">
          <label className="flex items-center gap-3 text-bone text-sm cursor-pointer hover:text-gold transition-all duration-200 group">
            <img
              src="/images/map-icons/icon_location.png"
              alt="Locations"
              className="w-6 h-6 filter drop-shadow-[0_0_3px_rgba(212,175,55,0.3)] group-hover:brightness-110 transition-all"
            />
            <input
              type="checkbox"
              checked={layers.locations}
              onChange={() => toggleLayer('locations')}
              className="ml-1 h-4 w-4 rounded border-midnight bg-shadow text-gold focus:ring-gold focus:ring-2"
            />
            <span className="font-wagdie tracking-wide">Locations</span>
          </label>
          <label className="flex items-center gap-3 text-bone text-sm cursor-pointer hover:text-gold transition-all duration-200 group">
            <img
              src="/images/map-icons/icon_youarehere.png"
              alt="Characters"
              className="w-6 h-6 filter drop-shadow-[0_0_3px_rgba(212,175,55,0.3)] group-hover:brightness-110 transition-all"
            />
            <input
              type="checkbox"
              checked={layers.characters}
              onChange={() => toggleLayer('characters')}
              className="ml-1 h-4 w-4 rounded border-midnight bg-shadow text-gold focus:ring-gold focus:ring-2"
            />
            <span className="font-wagdie tracking-wide">Characters</span>
          </label>
          <div className="border-t border-midnight my-2"></div>
          <label className="flex items-center gap-3 text-mist text-sm cursor-pointer hover:text-ember transition-all duration-200 group opacity-80">
            <img
              src="/images/map-icons/icon_burn.png"
              alt="Burns"
              className="w-6 h-6 opacity-60 group-hover:opacity-80 transition-opacity"
            />
            <input
              type="checkbox"
              disabled
              className="ml-1 h-4 w-4 rounded border-midnight bg-midnight opacity-50 cursor-not-allowed"
            />
            <span className="font-wagdie tracking-wide">Burns</span>
            <span className="text-xs text-ash font-wagdie ml-auto">(Soon)</span>
          </label>
          <label className="flex items-center gap-3 text-mist text-sm cursor-pointer hover:text-ember transition-all duration-200 group opacity-80">
            <img
              src="/images/map-icons/icon_death.png"
              alt="Deaths"
              className="w-6 h-6 opacity-60 group-hover:opacity-80 transition-opacity"
            />
            <input
              type="checkbox"
              disabled
              className="ml-1 h-4 w-4 rounded border-midnight bg-midnight opacity-50 cursor-not-allowed"
            />
            <span className="font-wagdie tracking-wide">Deaths</span>
            <span className="text-xs text-ash font-wagdie ml-auto">(Soon)</span>
          </label>
          <label className="flex items-center gap-3 text-mist text-sm cursor-pointer hover:text-ember transition-all duration-200 group opacity-80">
            <img
              src="/images/map-icons/icon_fight.png"
              alt="Fights"
              className="w-6 h-6 opacity-60 group-hover:opacity-80 transition-opacity"
            />
            <input
              type="checkbox"
              disabled
              className="ml-1 h-4 w-4 rounded border-midnight bg-midnight opacity-50 cursor-not-allowed"
            />
            <span className="font-wagdie tracking-wide">Fights</span>
            <span className="text-xs text-ash font-wagdie ml-auto">(Soon)</span>
          </label>
        </div>
      </div>
    </div>
  );
}
