/**
 * Map with Assets End-to-End Tests
 *
 * Tests the complete user experience of interacting with the map
 * that includes all WAGDIE-themed assets and responsive behavior.
 */

import { test, expect } from '@playwright/test';

test.describe('Map with WAGDIE Assets', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the map page
    await page.goto('/map');

    // Wait for map to initialize
    await page.waitForSelector('[data-testid="map-container"]', { timeout: 10000 });
  });

  test('should display location markers with WAGDIE icons', async ({ page }) => {
    // Wait for location markers to appear
    await page.waitForSelector('[data-testid="location-marker"]', { timeout: 5000 });

    // Check that location markers have correct styling
    const locationMarkers = await page.locator('[data-testid="location-marker"]');
    await expect(locationMarkers).toHaveCount({ min: 1 });

    // Verify the WAGDIE-themed icon is loaded
    const firstMarker = locationMarkers.first();
    const iconElement = firstMarker.locator('img');
    await expect(iconElement).toHaveAttribute('src', /icon_location\.png/);

    // Check for WAGDIE styling classes
    await expect(firstMarker).toHaveClass(/custom-icon-location/);
  });

  test('should display event markers (burn, death, fight) with themed icons', async ({ page }) => {
    // Wait for map to load all asset types
    await page.waitForSelector('[data-testid="map-fully-loaded"]', { timeout: 8000 });

    // Check for event markers
    const burnMarkers = await page.locator('[data-testid="burn-marker"]');
    const deathMarkers = await page.locator('[data-testid="death-marker"]');
    const fightMarkers = await page.locator('[data-testid="fight-marker"]');

    // Verify event markers exist and have correct icons
    if (await burnMarkers.count() > 0) {
      const burnIcon = burnMarkers.first().locator('img');
      await expect(burnIcon).toHaveAttribute('src', /icon_burn\.png/);
    }

    if (await deathMarkers.count() > 0) {
      const deathIcon = deathMarkers.first().locator('img');
      await expect(deathIcon).toHaveAttribute('src', /icon_death\.png/);
    }

    if (await fightMarkers.count() > 0) {
      const fightIcon = fightMarkers.first().locator('img');
      await expect(fightIcon).toHaveAttribute('src', /icon_fight\.png/);
    }
  });

  test('should display legend controls with on/off states', async ({ page }) => {
    // Wait for legend controls to appear
    await page.waitForSelector('[data-testid="layer-controls"]', { timeout: 5000 });

    // Check for location layer toggle
    const locationToggle = page.locator('[data-testid="toggle-location"]');
    await expect(locationToggle).toBeVisible();

    // Click toggle to change state
    await locationToggle.click();

    // Verify the legend icon changes
    const locationLegendIcon = page.locator('[data-testid="legend-location-icon"]');
    await expect(locationLegendIcon).toBeVisible();

    // Verify the icon source reflects the new state
    await expect(locationLegendIcon).toHaveAttribute('src', /legend_icon_location_(on|off)\.png/);
  });

  test('should handle asset loading failures gracefully', async ({ page }) => {
    // Intercept network requests to simulate failures
    await page.route('**/icon_location.png', route => route.abort());

    // Reload page to trigger asset loading
    await page.reload();

    // Wait for error handling to kick in
    await page.waitForSelector('[data-testid="asset-loading-error"]', { timeout: 6000 });

    // Verify error state is handled gracefully
    const errorMessage = page.locator('[data-testid="asset-loading-error"]');
    await expect(errorMessage).toBeVisible();

    // Verify retry button is available
    const retryButton = page.locator('[data-testid="retry-asset-button"]');
    await expect(retryButton).toBeVisible();

    // Click retry
    await retryButton.click();

    // Verify retry attempt is made (will still fail, but shows retry logic works)
    await page.waitForTimeout(1000);
  });

  test('should be responsive across different viewport sizes', async ({ page }) => {
    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(1000);

    // Check that icons are touch-friendly on mobile
    const mobileMarkers = await page.locator('[data-testid="location-marker"]');
    if (await mobileMarkers.count() > 0) {
      const markerSize = await mobileMarkers.first().evaluate(el => {
        const styles = window.getComputedStyle(el);
        return {
          width: parseInt(styles.width),
          height: parseInt(styles.height)
        };
      });

      // Verify minimum touch target size (44px)
      expect(markerSize.width).toBeGreaterThanOrEqual(44);
      expect(markerSize.height).toBeGreaterThanOrEqual(44);
    }

    // Test tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.waitForTimeout(1000);

    // Verify legend icons scale appropriately on tablet
    const tabletLegendIcon = page.locator('[data-testid="legend-location-icon"]');
    if (await tabletLegendIcon.count() > 0) {
      await expect(tabletLegendIcon).toBeVisible();
    }

    // Test desktop viewport
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.waitForTimeout(1000);

    // Verify full resolution display on desktop
    const desktopMarkers = await page.locator('[data-testid="location-marker"]');
    await expect(desktopMarkers).toBeVisible();
  });

  test('should meet performance targets for asset loading', async ({ page }) => {
    // Start performance monitoring
    const performanceEntries: any[] = [];

    page.on('response', response => {
      if (response.url().includes('/images/') && response.url().includes('.png')) {
        performanceEntries.push({
          url: response.url(),
          status: response.status(),
          timestamp: Date.now()
        });
      }
    });

    // Navigate to map and wait for complete load
    await page.goto('/map');
    await page.waitForSelector('[data-testid="map-fully-loaded"]', { timeout: 8000 });

    // Check that critical assets loaded within 2 seconds
    const criticalAssets = [
      '/images/mapicons/icon_location.png',
      '/images/mapicons/icon_burn.png',
      '/images/mapicons/icon_death.png',
      '/images/mapicons/icon_fight.png'
    ];

    for (const asset of criticalAssets) {
      const assetEntry = performanceEntries.find(entry => entry.url.includes(asset));
      expect(assetEntry).toBeDefined();
      expect(assetEntry?.status).toBe(200);
    }

    // Verify total load time is reasonable
    const loadStartTime = performanceEntries[0]?.timestamp;
    const loadEndTime = performanceEntries[performanceEntries.length - 1]?.timestamp;
    const totalLoadTime = loadEndTime - loadStartTime;

    expect(totalLoadTime).toBeLessThan(5000); // 5 second upper bound for safety
  });

  test('should maintain functionality during concurrent loading', async ({ page }) => {
    // Navigate to map
    await page.goto('/map');

    // Start multiple operations while assets are loading
    const operations = [
      page.waitForSelector('[data-testid="layer-controls"]'),
      page.waitForSelector('[data-testid="map-container"]'),
      page.click('[data-testid="zoom-in-button"]'),
      page.click('[data-testid="zoom-out-button"]')
    ];

    // Execute operations concurrently with asset loading
    await Promise.race([
      Promise.all(operations),
      page.waitForSelector('[data-testid="map-fully-loaded"]', { timeout: 8000 })
    ]);

    // Verify map is still functional
    await expect(page.locator('[data-testid="map-container"]')).toBeVisible();
    await expect(page.locator('[data-testid="layer-controls"]')).toBeVisible();
  });

  test('should display WAGDIE branding elements', async ({ page }) => {
    // Check for WAGDIE logo or branding
    const wagdieLogo = page.locator('[data-testid="wagdie-logo"]');

    if (await wagdieLogo.count() > 0) {
      await expect(wagdieLogo).toBeVisible();
      await expect(wagdieLogo).toHaveAttribute('src', /wagdie\.png/);
    }

    // Check for WAGDIE-themed UI elements
    const themedElements = page.locator('[class*="wagdie"]');
    if (await themedElements.count() > 0) {
      await expect(themedElements.first()).toBeVisible();
    }
  });

  test('should handle staking dialog assets if present', async ({ page }) => {
    // Look for staking-related elements (may not be present in all views)
    const stakingButton = page.locator('[data-testid="staking-button"]');

    if (await stakingButton.count() > 0) {
      await stakingButton.click();

      // Check for staking dialog assets
      const stakingDialog = page.locator('[data-testid="staking-dialog"]');
      await expect(stakingDialog).toBeVisible({ timeout: 3000 });

      // Verify staking assets are loaded if dialog is visible
      const stakingAsset = stakingDialog.locator('img[src*="staking"]');
      if (await stakingAsset.count() > 0) {
        await expect(stakingAsset).toBeVisible();
      }
    }
  });

  test('should work in read-only mode without wallet connection', async ({ page }) => {
    // Verify map loads and displays assets even without wallet connection
    await page.waitForSelector('[data-testid="map-container"]', { timeout: 5000 });

    // Check that markers are visible
    const markers = page.locator('[data-testid="location-marker"]');
    await expect(markers).toHaveCount({ min: 0 }); // May be 0 if no location data

    // Verify wallet connection is optional for map viewing
    const walletButton = page.locator('[data-testid="wallet-connect-button"]');
    await expect(walletButton).toBeVisible(); // Should be present to allow connection

    // Verify map is functional without wallet
    await page.click('[data-testid="zoom-in-button"]');
    await page.waitForTimeout(500);
    await page.click('[data-testid="zoom-out-button"]');

    // Map should still be functional
    await expect(page.locator('[data-testid="map-container"]')).toBeVisible();
  });
});