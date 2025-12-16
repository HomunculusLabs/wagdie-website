/**
 * E2E test for map navigation flow
 * T012 [P] [US1] E2E test for navigation flow
 * Following TDD approach - this test is written BEFORE implementation
 *
 * Test Requirements:
 * - Navigate to /map URL
 * - Verify interactive map loads with iframe from wagdie.world
 * - Navigate from home page to map via "World Map" link
 */

import { test, expect } from '@playwright/test'

test.describe('Map Feature Navigation Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to home page before each test
    await page.goto('/')
  })

  test('can navigate to map from home page', async ({ page }) => {
    // Act: Click "World Map" link in navigation
    await page.click('text=World Map')

    // Assert: Verify URL changed to /map
    await expect(page).toHaveURL('/map')
  })

  test('map page displays correctly', async ({ page }) => {
    // Act: Navigate to map page
    await page.goto('/map')

    // Assert: Check that page has the expected heading
    await expect(page.getByRole('heading', { name: /world map/i })).toBeVisible()

    // Assert: Check that iframe is present
    const iframe = page.locator('iframe')
    await expect(iframe).toBeVisible()

    // Assert: Verify iframe has correct attributes
    await expect(iframe).toHaveAttribute('title', /WAGDIE World Map/i)
    await expect(iframe).toHaveAttribute('src', 'https://wagdie.world')
  })

  test('map iframe loads with correct source URL', async ({ page }) => {
    // Act: Navigate to map page
    await page.goto('/map')

    // Wait for iframe to load
    await page.waitForSelector('iframe')

    // Get iframe handle and check its src
    const iframe = page.locator('iframe').first()
    const src = await iframe.getAttribute('src')

    // Assert: Verify iframe src is wagdie.world
    expect(src).toBe('https://wagdie.world')
  })

  test('map page shows loading state initially', async ({ page }) => {
    // Act: Navigate to map page
    const mapPagePromise = page.waitForResponse('**/map*')
    await page.goto('/map')

    // Assert: Check for loading indicator (if present)
    // This will be implemented when loading.tsx is created
    // await expect(page.getByText('Loading map...')).toBeVisible()
  })

  test('can navigate directly to map via URL', async ({ page }) => {
    // Act: Navigate directly to map URL
    await page.goto('/map')

    // Assert: Verify page loaded correctly
    await expect(page.getByRole('heading', { name: /world map/i })).toBeVisible()
    await expect(page.locator('iframe')).toBeVisible()
  })

  test('back navigation works from map page', async ({ page }) => {
    // Act: Navigate from home to map
    await page.click('text=World Map')
    await expect(page).toHaveURL('/map')

    // Act: Go back
    await page.goBack()

    // Assert: Verify back on home page
    await expect(page).toHaveURL('/')
  })

  test('responsive design - map displays on mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 })

    // Act: Navigate to map page
    await page.goto('/map')

    // Assert: Map iframe still visible on mobile
    await expect(page.locator('iframe')).toBeVisible()

    // Assert: Heading visible on mobile
    await expect(page.getByRole('heading', { name: /world map/i })).toBeVisible()
  })

  test('character list section is present but empty initially', async ({ page }) => {
    // Act: Navigate to map page
    await page.goto('/map')

    // Assert: Check for "Your Characters" heading (if wallet not connected)
    // This should show different state based on wallet connection
    // Currently we expect either the list or an empty state
    const hasCharacterList = await page.locator('text=/your characters/i').isVisible()
    const hasEmptyState = await page.locator('text=/no characters/i').isVisible()
    const hasConnectPrompt = await page.locator('text=/connect/i').isVisible()

    // At least one of these states should be visible
    expect(hasCharacterList || hasEmptyState || hasConnectPrompt).toBeTruthy()
  })

  test('map loads within performance budget', async ({ page }) => {
    // Act: Navigate to map and measure performance
    const startTime = Date.now()
    await page.goto('/map')
    await page.waitForSelector('iframe')
    const loadTime = Date.now() - startTime

    // Assert: Map loads within 3 seconds (SC-002 from spec)
    expect(loadTime).toBeLessThan(3000)

    // Additional: Log performance
    console.log(`Map page loaded in ${loadTime}ms`)
  })
})
