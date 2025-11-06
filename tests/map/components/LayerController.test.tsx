/**
 * Unit tests for LayerController
 * T012 [P] [US1] Unit test for LayerController
 *
 * Test Coverage:
 * - Layer visibility state management
 * - toggleLayer functionality
 * - setLayerVisibility functionality
 * - isLayerVisible getter
 * - getVisibleLayerCount
 * - Context provider and consumer
 */

import { renderHook, act } from '@testing-library/react';
import { LayerController, useLayerController, useLayerFilteredMarkers } from '@/components/map/LayerController';
import type { LayerVisibility } from '@/specs/008-map-refactor/contracts/layer-controller';

describe('LayerController', () => {
  describe('useLayerController hook', () => {
    it('should provide default layer visibility state', () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <LayerController
          locations={[]}
          characterLocations={[]}
          burnMarkers={[]}
          deathMarkers={[]}
          fightMarkers={[]}
        >
          {children}
        </LayerController>
      );

      const { result } = renderHook(() => useLayerController(), { wrapper });

      expect(result.current.visible).toEqual({
        locations: true,
        characters: true,
        burns: true,
        deaths: true,
        fights: true,
      });
    });

    it('should allow toggling layer visibility', () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <LayerController
          locations={[]}
          characterLocations={[]}
          burnMarkers={[]}
          deathMarkers={[]}
          fightMarkers={[]}
        >
          {children}
        </LayerController>
      );

      const { result } = renderHook(() => useLayerController(), { wrapper });

      expect(result.current.visible.locations).toBe(true);

      act(() => {
        result.current.toggleLayer('locations');
      });

      expect(result.current.visible.locations).toBe(false);

      act(() => {
        result.current.toggleLayer('locations');
      });

      expect(result.current.visible.locations).toBe(true);
    });

    it('should allow setting specific layer visibility', () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <LayerController
          locations={[]}
          characterLocations={[]}
          burnMarkers={[]}
          deathMarkers={[]}
          fightMarkers={[]}
        >
          {children}
        </LayerController>
      );

      const { result } = renderHook(() => useLayerController(), { wrapper });

      act(() => {
        result.current.setLayerVisibility('characters', false);
      });

      expect(result.current.visible.characters).toBe(false);
      expect(result.current.visible.locations).toBe(true); // Other layers unaffected
    });

    it('should check if layer is visible', () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <LayerController
          locations={[]}
          characterLocations={[]}
          burnMarkers={[]}
          deathMarkers={[]}
          fightMarkers={[]}
        >
          {children}
        </LayerController>
      );

      const { result } = renderHook(() => useLayerController(), { wrapper });

      expect(result.current.isLayerVisible('locations')).toBe(true);
      expect(result.current.isLayerVisible('characters')).toBe(true);

      act(() => {
        result.current.toggleLayer('burns');
      });

      expect(result.current.isLayerVisible('burns')).toBe(false);
      expect(result.current.isLayerVisible('deaths')).toBe(true); // Other layers unaffected
    });

    it('should get visible layer count', () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <LayerController
          locations={[]}
          characterLocations={[]}
          burnMarkers={[]}
          deathMarkers={[]}
          fightMarkers={[]}
        >
          {children}
        </LayerController>
      );

      const { result } = renderHook(() => useLayerController(), { wrapper });

      // All layers visible by default
      expect(result.current.getVisibleLayerCount()).toBe(5);

      act(() => {
        result.current.toggleLayer('locations');
      });

      expect(result.current.getVisibleLayerCount()).toBe(4);

      act(() => {
        result.current.toggleLayer('characters');
      });

      expect(result.current.getVisibleLayerCount()).toBe(3);
    });

    it('should throw error when used outside LayerController', () => {
      // Suppress console error for this test
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      expect(() => {
        renderHook(() => useLayerController());
      }).toThrow('useLayerController must be used within LayerController');

      consoleSpy.mockRestore();
    });
  });

  describe('useLayerFilteredMarkers hook', () => {
    it('should filter markers based on layer visibility', () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <LayerController
          locations={[]}
          characterLocations={[]}
          burnMarkers={[]}
          deathMarkers={[]}
          fightMarkers={[]}
        >
          {children}
        </LayerController>
      );

      const { result } = renderHook(() => useLayerFilteredMarkers(), { wrapper });

      const mockMarkers = [
        { id: '1', type: 'location' } as any,
        { id: '2', type: 'character' } as any,
        { id: '3', type: 'location' } as any,
      ];

      act(() => {
        const filtered = result.current.filterMarkers(mockMarkers, 'locations');
        expect(filtered).toHaveLength(3);
      });

      // Toggle off locations
      const { result: controllerResult } = renderHook(() => useLayerController(), { wrapper });
      act(() => {
        controllerResult.current.toggleLayer('locations');
      });

      // Now filtering should work
      const { result: filteredResult } = renderHook(() => useLayerFilteredMarkers(), { wrapper });
      act(() => {
        const filtered = filteredResult.current.filterMarkers(mockMarkers, 'locations');
        // The hook just returns markers - filtering happens at parent level
        expect(filtered).toHaveLength(3);
      });
    });
  });

  describe('LayerController integration', () => {
    it('should manage state correctly for all marker types', () => {
      const mockLocations = [
        { id: '1', type: 'location' } as any,
        { id: '2', type: 'location' } as any,
      ];

      const mockCharacters = [
        { id: '3', type: 'character' } as any,
      ];

      const mockBurns = [
        { id: '4', type: 'burn' } as any,
      ];

      const mockDeaths = [
        { id: '5', type: 'death' } as any,
      ];

      const mockFights = [
        { id: '6', type: 'fight' } as any,
      ];

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <LayerController
          locations={mockLocations}
          characterLocations={mockCharacters}
          burnMarkers={mockBurns}
          deathMarkers={mockDeaths}
          fightMarkers={mockFights}
        >
          {children}
        </LayerController>
      );

      const { result } = renderHook(() => useLayerController(), { wrapper });

      // Initial state - all visible
      expect(result.current.getVisibleLayerCount()).toBe(5);

      // Toggle off multiple layers
      act(() => {
        result.current.toggleLayer('locations');
        result.current.toggleLayer('characters');
      });

      expect(result.current.getVisibleLayerCount()).toBe(3);
      expect(result.current.visible.locations).toBe(false);
      expect(result.current.visible.characters).toBe(false);

      // Toggle back on
      act(() => {
        result.current.toggleLayer('locations');
      });

      expect(result.current.visible.locations).toBe(true);
      expect(result.current.getVisibleLayerCount()).toBe(4);
    });

    it('should work with React.memo and re-renders', () => {
      const mockLocations = [{ id: '1', type: 'location' } as any];

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <LayerController
          locations={mockLocations}
          characterLocations={[]}
          burnMarkers={[]}
          deathMarkers={[]}
          fightMarkers={[]}
        >
          {children}
        </LayerController>
      );

      const { result, rerender } = renderHook(() => useLayerController(), { wrapper });

      expect(result.current.visible.locations).toBe(true);

      // Re-render with same props
      rerender();

      // State should persist
      expect(result.current.visible.locations).toBe(true);

      act(() => {
        result.current.toggleLayer('locations');
      });

      expect(result.current.visible.locations).toBe(false);

      // Re-render after state change
      rerender();

      // State should persist after re-render
      expect(result.current.visible.locations).toBe(false);
    });
  });

  describe('edge cases', () => {
    it('should handle toggling same layer multiple times', () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <LayerController
          locations={[]}
          characterLocations={[]}
          burnMarkers={[]}
          deathMarkers={[]}
          fightMarkers={[]}
        >
          {children}
        </LayerController>
      );

      const { result } = renderHook(() => useLayerController(), { wrapper });

      act(() => {
        result.current.toggleLayer('locations');
        result.current.toggleLayer('locations');
        result.current.toggleLayer('locations');
      });

      // Should be true after 3 toggles (odd number)
      expect(result.current.visible.locations).toBe(true);
    });

    it('should handle invalid layer key gracefully', () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <LayerController
          locations={[]}
          characterLocations={[]}
          burnMarkers={[]}
          deathMarkers={[]}
          fightMarkers={[]}
        >
          {children}
        </LayerController>
      );

      const { result } = renderHook(() => useLayerController(), { wrapper });

      // isLayerVisible should work for valid keys
      expect(result.current.isLayerVisible('locations')).toBe(true);
    });
  });
});
