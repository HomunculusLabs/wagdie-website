// Jest setup file
// This file is run before each test file

require('@testing-library/jest-dom')

const React = require('react');

// IMPORTANT: Mock react-leaflet BEFORE any imports
jest.mock('react-leaflet', () => {
  return {
    MapContainer: ({ children }) => (
      React.createElement('div', { 'data-testid': 'map-container' }, children)
    ),
    TileLayer: () => React.createElement('div', { 'data-testid': 'tile-layer' }),
    Marker: ({ children, position }) => {
      return React.createElement(
        'div',
        {
          'data-testid': 'leaflet-marker',
          'data-position': JSON.stringify(position),
        },
        children
      );
    },
    Popup: ({ children }) => (
      React.createElement('div', { 'data-testid': 'leaflet-popup' }, children)
    ),
    Tooltip: ({ children }) => (
      React.createElement('div', { 'data-testid': 'leaflet-tooltip' }, children)
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
  const MarkerClusterGroup = ({ children }) =>
    React.createElement('div', { 'data-testid': 'marker-cluster-group' }, children);
  return { default: MarkerClusterGroup };
});

// Mock leaflet module
jest.mock('leaflet', () => {
  const mockIcon = (options) => ({
    options,
  });

  mockIcon.Default = {
    mergeOptions: jest.fn(),
    prototype: {
      _getIconUrl: jest.fn(),
    },
  };

  return {
    ...mockIcon,
    icon: (options) => mockIcon(options),
    divIcon: (options) => ({
      options,
    }),
    CRS: {
      Simple: 'simple',
    },
  };
});

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter() {
    return {
      push: jest.fn(),
      prefetch: jest.fn(),
      back: jest.fn(),
      forward: jest.fn(),
      refresh: jest.fn(),
    };
  },
}));

// Mock wagmi
jest.mock('wagmi', () => ({
  useAccount() {
    return {
      address: undefined,
      isConnected: false,
    };
  },
  useReadContract: jest.fn(),
  useWriteContract: jest.fn(),
  useWaitForTransactionReceipt: jest.fn(),
}));

// Note: Map hooks (useLocations, useLocationStaking, useCharacterLocation) are not yet implemented
// They will be added in future phases. For now, tests mock them inline as needed.
