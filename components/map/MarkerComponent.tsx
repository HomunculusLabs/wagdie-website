/**
 * Generic MarkerComponent
 *
 * Reusable component for rendering all types of map markers (location, character, burn, death, fight).
 * Handles icon creation, positioning, click handling, tooltips, and popups consistently.
 */

'use client';

import React, { useMemo, useEffect, useCallback } from 'react';
import { Marker, Popup, Tooltip } from 'react-leaflet';
import { getIconFactory } from './IconFactory';
import PopupRenderer from './PopupRenderer';
import TooltipRenderer from './TooltipRenderer';
import { getPerformanceMonitor } from '@/lib/utils/performance-monitor';
import type { MarkerProps, MapMarkerData } from '@/specs/008-map-refactor/contracts/marker-component';
import type { Location, CharacterLocation, EventMarker } from '@/lib/types/map';

/**
 * Build popup content for location markers
 */
function buildLocationPopupContent(location: Location) {
  return {
    title: location.name,
    description: location.description || 'A location in the WAGDIE world',
    details: {
      Area: location.metadata?.area || 'Unknown',
      Type: location.metadata?.properties?.terrain || 'Unknown',
      Difficulty: location.metadata?.properties?.difficulty || 'Unknown',
    },
    actions: [
      {
        label: 'Stake Character',
        onClick: () => alert('Stake feature coming soon!'),
        variant: 'primary' as const,
      },
      {
        label: 'View Details',
        onClick: () => console.log('View details for', location.name),
        variant: 'secondary' as const,
      },
    ],
  };
}

/**
 * Build popup content for character markers
 */
function buildCharacterPopupContent(charLocation: CharacterLocation) {
  return {
    title: `Character #${charLocation.character_token_id}`,
    description: 'A WAGDIE character',
    details: {
      'Token ID': charLocation.character_token_id,
      Location: charLocation.location?.name || 'Unknown',
      Status: charLocation.status,
      Wallet: `${charLocation.wallet_address.slice(0, 6)}...${charLocation.wallet_address.slice(-4)}`,
    },
    actions: [
      {
        label: 'View Character',
        onClick: () => alert('View character feature coming soon!'),
        variant: 'primary' as const,
      },
      {
        label: 'Move Character',
        onClick: () => alert('Move character feature coming soon!'),
        variant: 'secondary' as const,
      },
    ],
  };
}

/**
 * Build popup content for event markers
 */
function buildEventPopupContent(event: EventMarker) {
  const eventTypeMap = {
    burn: 'Burn Event',
    death: 'Death Event',
    fight: 'Fight/Battle Event',
  };

  return {
    title: event.title,
    description: event.description || `A ${event.type} event in the WAGDIE world`,
    details: {
      Type: eventTypeMap[event.type],
    },
  };
}

/**
 * Build tooltip content for location markers
 */
function buildLocationTooltip(location: Location) {
  return {
    title: location.name,
    subtitle: location.description || 'WAGDIE Location',
  };
}

/**
 * Build tooltip content for character markers
 */
function buildCharacterTooltip(charLocation: CharacterLocation) {
  return {
    title: `Character #${charLocation.character_token_id}`,
    subtitle: charLocation.location?.name || 'Unknown Location',
  };
}

/**
 * Build tooltip content for event markers
 */
function buildEventTooltip(event: EventMarker) {
  return {
    title: event.title,
    subtitle: event.description || `${event.type} Event`,
  };
}

/**
 * Calculate center position from bounds
 */
function calculateCenter(
  bounds: [[number, number], [number, number]],
  explicitCenter?: [number, number]
): [number, number] {
  if (explicitCenter) {
    return explicitCenter;
  }

  return [
    (bounds[0][0] + bounds[1][0]) / 2,
    (bounds[0][1] + bounds[1][1]) / 2,
  ];
}

/**
 * Check if device is mobile or tablet
 */
function isMobileOrTablet(): boolean {
  if (typeof window === 'undefined') return false;
  return window.innerWidth <= 1024;
}

/**
 * Generic MarkerComponent
 */
const MarkerComponentImpl: React.FC<MarkerProps> = (props) => {
  const { id, position, onClick, isMobile, type, data } = props;

  // Performance monitoring
  const performanceMonitor = getPerformanceMonitor();
  const measureRender = performanceMonitor.startMeasure();

  // Track render time (cleanup immediately after)
  useEffect(() => {
    return () => {
      measureRender();
    };
  }, [measureRender]);

  // Get icon from IconFactory
  const iconFactory = getIconFactory();
  const icon = useMemo(
    () => iconFactory.createIcon(type, isMobile ?? isMobileOrTablet()),
    [iconFactory, type, isMobile]
  );

  // Calculate center position from bounds if data has bounds
  const centerPosition = useMemo(() => {
    if (data && 'metadata' in data && data.metadata?.bounds) {
      return calculateCenter(data.metadata.bounds, data.metadata.center);
    }
    if (data && 'position' in data && Array.isArray(data.position) && data.position.length === 2) {
      return data.position as [number, number];
    }
    return position;
  }, [data, position]);

  // Handle marker click with useCallback to prevent re-renders
  const handleClick = useCallback(() => {
    if (onClick) {
      const markerData: MapMarkerData = {
        id,
        type,
        position: centerPosition,
        data,
      };
      onClick(markerData);
    }
  }, [id, type, centerPosition, data, onClick]);

  // Build tooltip content
  const tooltipContent = useMemo(() => {
    if (type === 'location' && 'metadata' in data) {
      return buildLocationTooltip(data as Location);
    } else if (type === 'character') {
      return buildCharacterTooltip(data as CharacterLocation);
    } else {
      return buildEventTooltip(data as EventMarker);
    }
  }, [type, data]);

  // Build popup content
  const popupContent = useMemo(() => {
    if (type === 'location' && 'metadata' in data) {
      return buildLocationPopupContent(data as Location);
    } else if (type === 'character') {
      return buildCharacterPopupContent(data as CharacterLocation);
    } else {
      return buildEventPopupContent(data as EventMarker);
    }
  }, [type, data]);

  return (
    <Marker
      key={id}
      position={centerPosition}
      icon={icon}
      eventHandlers={{ click: handleClick }}
    >
      {/* Tooltip */}
      <Tooltip direction="top" className="custom-tooltip">
        <div style={{ fontFamily: "'Wagdie_Fraktur_21', serif" }}>
          <strong>{tooltipContent.title}</strong>
          {tooltipContent.subtitle && (
            <>
              <br />
              {tooltipContent.subtitle}
            </>
          )}
        </div>
      </Tooltip>

      {/* Popup */}
      <Popup className="custom-popup" maxWidth={300}>
        <PopupRenderer type={type} data={data} content={popupContent} />
      </Popup>
    </Marker>
  );
};

/**
 * Custom comparison function for React.memo
 */
const areEqual = (prevProps: MarkerProps, nextProps: MarkerProps): boolean => {
  return (
    prevProps.id === nextProps.id &&
    prevProps.position === nextProps.position &&
    prevProps.isMobile === nextProps.isMobile &&
    prevProps.type === nextProps.type &&
    // Shallow comparison for data objects
    (prevProps.data === nextProps.data ||
      (prevProps.data && nextProps.data &&
        'id' in prevProps.data && 'id' in nextProps.data &&
        prevProps.data.id === nextProps.data.id))
  );
};

export const MarkerComponent = React.memo(MarkerComponentImpl, areEqual);

export default MarkerComponent;
