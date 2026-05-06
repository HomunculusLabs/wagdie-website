/**
 * @jest-environment node
 */

import { describe, it, expect, afterEach, jest } from '@jest/globals';

describe('asset stack server-runtime guards', () => {
  afterEach(() => {
    jest.resetModules();
  });

  it('constructs optimizer and lazy loader without browser globals', async () => {
    const {
      getAssetOptimizer,
      getLazyImageLoader,
      loadOptimizedImage,
    } = await import('@/lib/utils/asset-optimization');

    const optimizer = getAssetOptimizer();
    const result = await optimizer.optimizeImageUrl('/images/mapicons/icon_location.png', {
      format: 'png',
      quality: 80,
    });

    expect(result.optimizedUrl).toBe('/images/mapicons/icon_location.png?q=80');
    expect(result.compressionRatio).toBe(0);

    const lazyLoader = getLazyImageLoader();
    expect(() => lazyLoader.disconnect()).not.toThrow();
    expect(() => lazyLoader.destroy()).not.toThrow();

    await expect(loadOptimizedImage('/images/mapicons/icon_location.png')).rejects.toThrow(
      'Image API is unavailable in this runtime'
    );
  });

  it('constructs cache and loading service without starting browser cleanup intervals', async () => {
    const { getAssetCache, destroyAssetCache } = await import('@/lib/services/asset-cache');
    const { getAssetLoadingService } = await import('@/lib/services/asset-loading-service');

    const cache = getAssetCache();
    expect((cache as unknown as { cleanupTimer: unknown }).cleanupTimer).toBeNull();

    const service = getAssetLoadingService();
    const state = await service.loadAsset('location');

    expect(state.status).toBe('failed');
    expect(state.lastError).toBe('Image API is unavailable in this runtime');
    expect((service as unknown as { retryTimers: Map<string, unknown> }).retryTimers.size).toBe(0);

    service.destroy();
    destroyAssetCache();
  });
});
