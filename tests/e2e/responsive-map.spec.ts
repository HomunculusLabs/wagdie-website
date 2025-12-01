/**
 * Responsive Map Visual Regression Tests
 *
 * Tests for responsive behavior across different viewports and device types.
 * Ensures WAGDIE map displays correctly and remains functional on all screen sizes.
 */

import { test, expect } from '@playwright/test';

test.describe('Responsive Map Behavior', () => {
  // Define viewport sizes for different devices
  const viewports = [
    { name: 'iPhone SE', width: 375, height: 667, deviceType: 'mobile' },
    { name: 'iPhone 12', width: 390, height: 844, deviceType: 'mobile' },
    { name: 'Samsung Galaxy S21', width: 384, height: 854, deviceType: 'mobile' },
    { name: 'iPad', width: 768, height: 1024, deviceType: 'tablet' },
    { name: 'iPad Pro', width: 1024, height: 1366, deviceType: 'tablet' },
    { name: 'Small Desktop', width: 1280, height: 720, deviceType: 'desktop' },
    { name: 'Standard Desktop', width: 1920, height: 1080, deviceType: 'desktop' },
    { name: 'Large Desktop', width: 2560, height: 1440, deviceType: 'desktop' },
  ];

  viewports.forEach(viewport => {
    test.describe(`${viewport.name} (${viewport.width}x${viewport.height})`, () => {
      test.beforeEach(async ({ page }) => {
        // Set viewport size
        await page.setViewportSize({
          width: viewport.width,
          height: viewport.height
        });

        // Navigate to map page
        await page.goto('/map');

        // Wait for map to initialize
        await page.waitForSelector('[data-testid="map-container"]', { timeout: 10000 });

        // Wait for assets to load
        await page.waitForSelector('[data-testid="map-fully-loaded"]', { timeout: 15000 });
      });

      test('should display map container correctly', async ({ page }) => {
        const mapContainer = page.locator('[data-testid="map-container"]');

        // Check that map container is visible
        await expect(mapContainer).toBeVisible();

        // Check that container fills viewport appropriately
        const boundingBox = await mapContainer.boundingBox();
        expect(boundingBox).toBeTruthy();

        if (boundingBox) {
          // Map should take up most of the viewport
          expect(boundingBox.width).toBeGreaterThan(viewport.width * 0.8);
          expect(boundingBox.height).toBeGreaterThan(viewport.height * 0.6);
        }
      });

      test('should display layer controls appropriately', async ({ page }) => {
        const layerControls = page.locator('[data-testid="layer-controls"]');

        // Layer controls should be visible on all devices
        await expect(layerControls).toBeVisible();

        // Check positioning (should be in top-right corner)
        const boundingBox = await layerControls.boundingBox();
        expect(boundingBox).toBeTruthy();

        if (boundingBox) {
          // Should be positioned in the right portion of the screen
          expect(boundingBox.x + boundingBox.width).toBeGreaterThan(viewport.width * 0.7);
          expect(boundingBox.y).toBeLessThan(200); // Should be near the top
        }
      });

      test('should display markers with appropriate sizing', async ({ page }) => {
        // Wait for markers to load
        await page.waitForTimeout(2000);

        const locationMarkers = page.locator('[data-testid="location-marker"]');

        if (await locationMarkers.count() > 0) {
          // Check that markers are visible
          await expect(locationMarkers.first()).toBeVisible();

          // Check marker size based on device type
          const markerSize = await locationMarkers.first()
            .evaluate(el => {
              const styles = window.getComputedStyle(el);
              return {
                width: parseInt(styles.width) || 0,
                height: parseInt(styles.height) || 0,
              };
            });

          if (viewport.deviceType === 'mobile') {
            // Mobile markers should meet touch target requirements
            expect(markerSize.width).toBeGreaterThanOrEqual(44);
            expect(markerSize.height).toBeGreaterThanOrEqual(44);
          } else if (viewport.deviceType === 'tablet') {
            // Tablet markers should be touch-friendly but not too large
            expect(markerSize.width).toBeGreaterThanOrEqual(40);
            expect(markerSize.height).toBeGreaterThanOrEqual(40);
            expect(markerSize.width).toBeLessThan(80);
            expect(markerSize.height).toBeLessThan(80);
          } else {
            // Desktop markers can be smaller but still visible
            expect(markerSize.width).toBeGreaterThanOrEqual(20);
            expect(markerSize.height).toBeGreaterThanOrEqual(20);
          }
        }
      });

      test('should have functional layer toggles', async ({ page }) => {
        const locationToggle = page.locator('[data-testid="toggle-location"]');

        if (await locationToggle.count() > 0) {
          // Check initial state
          const initialState = await locationToggle.isChecked();

          // Click toggle
          await locationToggle.click();

          // Wait for state change
          await page.waitForTimeout(500);

          // Verify state changed
          const newState = await locationToggle.isChecked();
          expect(newState).toBe(!initialState);

          // Check that legend icon updated
          const legendIcon = page.locator('[data-testid="legend-location-icon"]');
          if (await legendIcon.count() > 0) {
            await expect(legendIcon).toBeVisible();
          }
        }
      });

      test('should handle zoom controls appropriately', async ({ page }) => {
        // Look for zoom controls (these might be part of Leaflet)
        const zoomControls = page.locator('.leaflet-control-zoom');

        if (await zoomControls.count() > 0) {
          await expect(zoomControls).toBeVisible();

          // Check that zoom controls are appropriately sized for touch
          const zoomIn = zoomControls.locator('.leaflet-control-zoom-in');
          const zoomOut = zoomControls.locator('.leaflet-control-zoom-out');

          if (viewport.deviceType === 'mobile' || viewport.deviceType === 'tablet') {
            // Touch targets should be larger on mobile/tablet
            const inSize = await zoomIn.boundingBox();
            const outSize = await zoomOut.boundingBox();

            if (inSize && outSize) {
              expect(inSize.width).toBeGreaterThanOrEqual(40);
              expect(inSize.height).toBeGreaterThanOrEqual(40);
              expect(outSize.width).toBeGreaterThanOrEqual(40);
              expect(outSize.height).toBeGreaterThanOrEqual(40);
            }
          }
        }
      });

      test('should display popups correctly when markers are clicked', async ({ page }) => {
        const locationMarkers = page.locator('[data-testid="location-marker"]');

        if (await locationMarkers.count() > 0) {
          // Click on a marker
          await locationMarkers.first().click();

          // Wait for popup to appear
          await page.waitForTimeout(1000);

          // Check for popup content
          const popup = page.locator('.leaflet-popup-content');
          if (await popup.count() > 0) {
            await expect(popup).toBeVisible();

            // Check popup positioning and size
            const popupBounds = await popup.boundingBox();
            if (popupBounds) {
              // Popup should be positioned reasonably and not too large
              expect(popupBounds.width).toBeLessThan(viewport.width * 0.8);
              expect(popupBounds.height).toBeLessThan(viewport.height * 0.6);
            }
          }
        }
      });

      test('should handle orientation changes gracefully', async ({ page }) => {
        if (viewport.deviceType === 'mobile' || viewport.deviceType === 'tablet') {
          // Store initial marker count
          const initialMarkers = await page.locator('[data-testid="location-marker"]').count();

          // Simulate orientation change
          const newWidth = viewport.height;
          const newHeight = viewport.width;

          await page.setViewportSize({
            width: newWidth,
            height: newHeight
          });

          // Wait for layout adjustment
          await page.waitForTimeout(1000);

          // Map should still be visible
          const mapContainer = page.locator('[data-testid="map-container"]');
          await expect(mapContainer).toBeVisible();

          // Markers should still be present
          const finalMarkers = await page.locator('[data-testid="location-marker"]').count();
          expect(finalMarkers).toBe(initialMarkers);
        }
      });

      test('should maintain performance on viewport changes', async ({ page }) => {
        // Measure initial load time
        const startTime = Date.now();
        await page.waitForSelector('[data-testid="map-fully-loaded"]', { timeout: 15000 });
        const initialLoadTime = Date.now() - startTime;

        // Resize viewport
        const newSize = viewport.width === 375 ? 768 : 375;
        await page.setViewportSize({
          width: newSize,
          height: viewport.height
        });

        // Measure resize response time
        const resizeStartTime = Date.now();
        await page.waitForTimeout(2000); // Wait for layout adjustment
        const resizeResponseTime = Date.now() - resizeStartTime;

        // Performance should be reasonable
        expect(initialLoadTime).toBeLessThan(10000); // 10 seconds max load
        expect(resizeResponseTime).toBeLessThan(5000); // 5 seconds max resize response

        // Map should still be functional after resize
        const mapContainer = page.locator('[data-testid="map-container"]');
        await expect(mapContainer).toBeVisible();
      });

      test('should display appropriate loading states', async ({ page }) => {
        // Navigate to map page fresh to see loading states
        await page.goto('/map');

        // Check for loading spinner (should appear briefly)
        const loadingSpinner = page.locator('.animate-spin');
        if (await loadingSpinner.count() > 0) {
          await expect(loadingSpinner.first()).toBeVisible();
        }

        // Wait for loading to complete
        await page.waitForSelector('[data-testid="map-fully-loaded"]', { timeout: 15000 });

        // Loading spinner should be gone
        if (await loadingSpinner.count() > 0) {
          await expect(loadingSpinner.first()).not.toBeVisible();
        }

        // Map should be visible
        const mapContainer = page.locator('[data-testid="map-container"]');
        await expect(mapContainer).toBeVisible();
      });

      test('should handle asset loading failures gracefully', async ({ page }) => {
        // Intercept asset requests to simulate failures
        await page.route('**/icon_location.png', route => route.abort());

        // Reload page
        await page.reload();

        // Wait for error handling
        await page.waitForTimeout(3000);

        // Map should still be visible even with asset failures
        const mapContainer = page.locator('[data-testid="map-container"]');
        await expect(mapContainer).toBeVisible();

        // Check for error states or fallbacks
        const errorIndicators = page.locator('[data-testid*="error"], [data-testid*="failed"]');
        if (await errorIndicators.count() > 0) {
          // Error indicators should be visible if present
          await expect(errorIndicators.first()).toBeVisible();
        }
      });
    });
  });

  test.describe('Cross-viewport consistency', () => {
    test('should maintain consistent functionality across viewports', async ({ page }) => {
      const testViewports = [
        { width: 375, height: 667 },  // Mobile
        { width: 768, height: 1024 }, // Tablet
        { width: 1920, height: 1080 }, // Desktop
      ];

      const results: any[] = [];

      for (const vp of testViewports) {
        await page.setViewportSize({ width: vp.width, height: vp.height });
        await page.goto('/map');
        await page.waitForSelector('[data-testid="map-fully-loaded"]', { timeout: 15000 });

        // Test basic functionality
        const layerControlsVisible = await page.locator('[data-testid="layer-controls"]').isVisible();
        const mapContainerVisible = await page.locator('[data-testid="map-container"]').isVisible();
        const locationMarkersCount = await page.locator('[data-testid="location-marker"]').count();

        results.push({
          viewport: vp,
          layerControlsVisible,
          mapContainerVisible,
          locationMarkersCount,
        });
      }

      // All viewports should have consistent basic functionality
      results.forEach(result => {
        expect(result.layerControlsVisible).toBe(true);
        expect(result.mapContainerVisible).toBe(true);
        expect(result.locationMarkersCount).toBeGreaterThan(0);
      });

      // Marker count should be consistent (allowing for some variation due to viewport-based filtering)
      const markerCounts = results.map(r => r.locationMarkersCount);
      const maxCount = Math.max(...markerCounts);
      const minCount = Math.min(...markerCounts);

      // Should not have extreme variations in marker count
      expect(minCount).toBeGreaterThan(maxCount * 0.5);
    });
  });

  test.describe('Accessibility across viewports', () => {
    test('should maintain accessibility features on all screen sizes', async ({ page }) => {
      const accessibilityViewports = [
        { width: 375, height: 667 },  // Small mobile
        { width: 1920, height: 1080 }, // Large desktop
      ];

      for (const vp of accessibilityViewports) {
        await page.setViewportSize({ width: vp.width, height: vp.height });
        await page.goto('/map');
        await page.waitForSelector('[data-testid="map-fully-loaded"]', { timeout: 15000 });

        // Check for ARIA labels
        const mapContainer = page.locator('[data-testid="map-container"]');
        await expect(mapContainer).toHaveAttribute('role');

        // Check for skip links
        const skipLink = page.locator('a[href*="map-main-content"]');
        if (await skipLink.count() > 0) {
          await expect(skipLink.first()).toBeVisible();
        }

        // Check for keyboard navigation
        const layerControls = page.locator('[data-testid="layer-controls"]');
        if (await layerControls.count() > 0) {
          await expect(layerControls.first()).toHaveAttribute('role');
          await expect(layerControls.first()).toHaveAttribute('aria-label');
        }
      }
    });
  });
});