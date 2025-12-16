/**
 * Mock utilities for Leaflet components
 * T046 [P] [US3] Create mock utilities for Leaflet components in tests
 *
 * Provides mocks for react-leaflet components to enable isolated testing
 * without requiring a full map rendering
 */

import React from 'react';

// Mock react-leaflet components
jest.mock('react-leaflet', () => {
  return {
    MapContainer: ({ children }: { children: React.ReactNode }) => (
      <div data-testid="map-container">{children}</div>
    ),
    TileLayer: () => <div data-testid="tile-layer" />,
    Marker: ({
      children,
      position,
      icon,
      eventHandlers,
    }: {
      children?: React.ReactNode;
      position: [number, number];
      icon?: any;
      eventHandlers?: any;
    }) => (
      <div
        data-testid="leaflet-marker"
        data-position={JSON.stringify(position)}
      >
        {children}
      </div>
    ),
    Popup: ({ children, maxWidth, className }: any) => (
      <div data-testid="leaflet-popup" data-maxwidth={maxWidth} className={className}>
        {children}
      </div>
    ),
    Tooltip: ({ children, direction, className }: any) => (
      <div
        data-testid="leaflet-tooltip"
        data-direction={direction}
        className={className}
      >
        {children}
      </div>
    ),
    useMap: () => ({
      setView: jest.fn(),
      fitBounds: jest.fn(),
      invalidateSize: jest.fn(),
      getBounds: jest.fn(() => ({
        getSouth: () => 0,
        getNorth: () => 100,
        getWest: () => 0,
        getEast: () => 100,
      })),
    }),
  };
});

// Mock react-leaflet-markercluster
jest.mock('react-leaflet-markercluster', () => {
  const React = require('react');
  const MarkerClusterGroup = ({ children }: { children: React.ReactNode }) => (
    <div data-testid="marker-cluster-group">{children}</div>
  );
  return { default: MarkerClusterGroup };
});

// Mock leaflet module
jest.mock('leaflet', () => {
  const mockIcon = (options: any) => ({
    options,
  });

  mockIcon.Default = {
    mergeOptions: jest.fn(),
    prototype: {
      _getIconUrl: jest.fn(),
    },
  };

  const mockMap = {
    setView: jest.fn(),
    fitBounds: jest.fn(),
    invalidateSize: jest.fn(),
    addTo: jest.fn(),
    remove: jest.fn(),
    getBounds: jest.fn(() => ({
      getSouth: () => 0,
      getNorth: () => 100,
      getWest: () => 0,
      getEast: () => 100,
    })),
    attributionControl: {
      setPrefix: jest.fn(),
    },
  };

  const createMap = (id: string, options: any) => mockMap;
  const icon = (options: any) => mockIcon(options);
  const imageOverlay = (url: string, bounds: any) => ({
    addTo: jest.fn(),
  });
  const divIcon = (options: any) => ({
    options,
  });

  return {
    ...mockMap,
    Map: createMap,
    icon,
    divIcon,
    imageOverlay,
    CRS: {
      Simple: 'simple',
    },
    LatLngBounds: jest.fn(),
    point: (x: number, y: number) => ({ x, y }),
  };
});

// Mock global window object for isMobile check
Object.defineProperty(window, 'innerWidth', {
  writable: true,
  configurable: true,
  value: 1024,
});

// Mock IntersectionObserver
global.IntersectionObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

// Mock ResizeObserver
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

/**
 * Utility to create mock marker data
 */
export const createMockMarkerData = (id: string, type: string, position: [number, number]) => ({
  id,
  type,
  position,
  data: {
    id,
    name: `Mock ${type} ${id}`,
  },
});

/**
 * Utility to wait for async operations in tests
 */
export const waitForAsync = () => new Promise((resolve) => setTimeout(resolve, 0));

/**
 * Utility to measure render time
 */
export const measureRenderTime = async (renderFn: () => void): Promise<number> => {
  const startTime = performance.now();
  renderFn();
  const endTime = performance.now();
  return endTime - startTime;
};

/**
 * Utility to create test locations
 */
export const createTestLocation = (id: string, center: [number, number]) => ({
  id,
  name: `Test Location ${id}`,
  description: 'A test location',
  metadata: {
    bounds: [
      [center[0] - 10, center[1] - 10],
      [center[0] + 10, center[1] + 10],
    ],
    center,
  },
  created_at: '2025-01-01',
  updated_at: '2025-01-01',
});

/**
 * Utility to create test character locations
 */
export const createTestCharacter = (id: string, locationId: string) => ({
  id,
  character_token_id: parseInt(id, 10),
  location_id: locationId,
  wallet_address: `0x${'1234567890'.repeat(4)}`,
  transaction_hash: '0xabc123',
  status: 'confirmed' as const,
  created_at: '2025-01-01',
  updated_at: '2025-01-01',
});

/**
 * Mock performance.now for testing
 */
export const mockPerformanceNow = (time: number = 100) => {
  jest.spyOn(performance, 'now').mockReturnValue(time);
};

/**
 * Restore original performance.now
 */
export const restorePerformanceNow = () => {
  jest.restoreAllMocks();
};

/**
 * Helper to test component renders within time limit
 */
export const expectRendersWithinTime = async (
  renderFn: () => void,
  maxTimeMs: number,
  description: string
) => {
  const renderTime = await measureRenderTime(renderFn);
  expect(renderTime).toBeLessThan(maxTimeMs);
};

/**
 * Mock Leaflet icon with test properties
 */
export const createMockLeafletIcon = (type: string, isMobile: boolean = false) => ({
  options: {
    iconUrl: `/images/mapicons/icon_${type}.png`,
    iconSize: isMobile ? [44, 44] : [32, 32],
    iconAnchor: isMobile ? [22, 44] : [16, 32],
  },
});

export default {
  createMockMarkerData,
  waitForAsync,
  measureRenderTime,
  createTestLocation,
  createTestCharacter,
  mockPerformanceNow,
  restorePerformanceNow,
  expectRendersWithinTime,
  createMockLeafletIcon,
};
