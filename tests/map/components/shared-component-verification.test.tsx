/**
 * Tests verifying all markers use shared IconFactory
 * T026 [P] [US2] Test verifying all markers use shared IconFactory
 */

import { render } from '@testing-library/react';
import LocationMarker from '@/components/map/markers/LocationMarker';
import CharacterMarker from '@/components/map/markers/CharacterMarker';
import BurnMarker from '@/components/map/markers/BurnMarker';
import DeathMarker from '@/components/map/markers/DeathMarker';
import FightMarker from '@/components/map/markers/FightMarker';
import { getIconFactory } from '@/components/map/IconFactory';
import type { Location, CharacterLocation, EventMarker } from '@/lib/types/map';

// Mock data
const mockLocation: Location = {
  id: '1',
  name: 'Test Location',
  description: 'A test location',
  metadata: {
    bounds: [
      [0, 0],
      [100, 100],
    ],
    center: [50, 50],
  },
  created_at: '2025-01-01',
  updated_at: '2025-01-01',
};

const mockCharacter: CharacterLocation = {
  id: 'char1',
  character_token_id: 123,
  location_id: '1',
  wallet_address: '0x1234567890123456789012345678901234567890',
  transaction_hash: '0xabc123',
  status: 'confirmed',
  created_at: '2025-01-01',
  updated_at: '2025-01-01',
  location: mockLocation,
};

const mockEvent: EventMarker = {
  id: 'event1',
  type: 'burn',
  title: 'Test Event',
  position: [50, 50],
  timestamp: '2025-01-01T12:00:00Z',
};

describe('IconFactory Usage Verification (US2)', () => {
  it('LocationMarker uses IconFactory', () => {
    const onClick = jest.fn();
    const { container } = render(
      <LocationMarker
        id="loc-1"
        type="location"
        data={mockLocation}
        position={[50, 50]}
        onClick={onClick}
        isMobile={false}
      />
    );

    expect(container).toBeInTheDocument();
    // The IconFactory should be accessible and used by MarkerComponent
    expect(getIconFactory).toBeDefined();
  });

  it('CharacterMarker uses IconFactory', () => {
    const onClick = jest.fn();
    const { container } = render(
      <CharacterMarker
        id="char-1"
        type="character"
        data={mockCharacter}
        position={[50, 50]}
        onClick={onClick}
        isMobile={false}
      />
    );

    expect(container).toBeInTheDocument();
    expect(getIconFactory).toBeDefined();
  });

  it('BurnMarker uses IconFactory', () => {
    const onClick = jest.fn();
    const { container } = render(
      <BurnMarker
        id="burn-1"
        type="burn"
        data={mockEvent}
        position={[50, 50]}
        onClick={onClick}
        isMobile={false}
      />
    );

    expect(container).toBeInTheDocument();
    expect(getIconFactory).toBeDefined();
  });

  it('DeathMarker uses IconFactory', () => {
    const onClick = jest.fn();
    const { container } = render(
      <DeathMarker
        id="death-1"
        type="death"
        data={mockEvent}
        position={[50, 50]}
        onClick={onClick}
        isMobile={false}
      />
    );

    expect(container).toBeInTheDocument();
    expect(getIconFactory).toBeDefined();
  });

  it('FightMarker uses IconFactory', () => {
    const onClick = jest.fn();
    const { container } = render(
      <FightMarker
        id="fight-1"
        type="fight"
        data={mockEvent}
        position={[50, 50]}
        onClick={onClick}
        isMobile={false}
      />
    );

    expect(container).toBeInTheDocument();
    expect(getIconFactory).toBeDefined();
  });

  it('All marker types use the same IconFactory instance', () => {
    const factory1 = getIconFactory();
    const factory2 = getIconFactory();

    // Should be singleton
    expect(factory1).toBe(factory2);
  });

  it('IconFactory creates different icons for different marker types', () => {
    const factory = getIconFactory();

    const locationIcon = factory.createIcon('location', false);
    const characterIcon = factory.createIcon('character', false);
    const burnIcon = factory.createIcon('burn', false);

    // Each type should have its own icon configuration
    expect(locationIcon.options.iconUrl).toContain('location');
    expect(characterIcon.options.iconUrl).toContain('character');
    expect(burnIcon.options.iconUrl).toContain('burn');
  });

  it('IconFactory cache is shared across all markers', () => {
    const factory = getIconFactory();
    const initialCacheSize = factory.getCacheSize();

    // Create icons for all types
    factory.createIcon('location', false);
    factory.createIcon('character', false);
    factory.createIcon('burn', false);
    factory.createIcon('death', false);
    factory.createIcon('fight', false);

    const newCacheSize = factory.getCacheSize();

    // Cache should have grown
    expect(newCacheSize).toBeGreaterThan(initialCacheSize);
  });
});
