/**
 * Focused lifecycle tests for the asset stack.
 */

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';

class MockImage {
  onload: (() => void) | null = null;
  onerror: (() => void) | null = null;
  private currentSrc = '';

  get src(): string {
    return this.currentSrc;
  }

  set src(value: string) {
    this.currentSrc = value;
  }
}

describe('asset loading lifecycle boundaries', () => {
  let images: MockImage[];
  let service: import('@/lib/services/asset-loading-service').AssetLoadingService;

  beforeEach(() => {
    jest.resetModules();
    jest.useFakeTimers();
    images = [];
    jest.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue({
      canvas: {
        toDataURL: (type: string) => `data:${type}`,
      },
    } as unknown as CanvasRenderingContext2D);
    (global as typeof globalThis & { Image: jest.Mock }).Image = jest.fn(() => {
      const image = new MockImage();
      images.push(image);
      return image;
    }) as unknown as jest.Mock;

    const { getAssetLoadingService } = require('@/lib/services/asset-loading-service');
    service = getAssetLoadingService();
  });

  afterEach(() => {
    service.destroy();
    const { destroyAssetCache } = require('@/lib/services/asset-cache');
    destroyAssetCache();
    jest.clearAllTimers();
    jest.useRealTimers();
    delete (performance as Performance & { memory?: unknown }).memory;
    delete (global as typeof globalThis & { IntersectionObserver?: unknown }).IntersectionObserver;
    jest.restoreAllMocks();
  });

  it('clears scheduled retry timers without leaving stale retry handles', async () => {
    const loadPromise = service.loadAsset('location');

    images[0].onerror?.();
    const failedState = await loadPromise;

    expect(failedState.status).toBe('retrying');
    expect((service as unknown as { retryTimers: Map<string, unknown> }).retryTimers.size).toBe(1);

    service.clearCache();

    expect((service as unknown as { retryTimers: Map<string, unknown> }).retryTimers.size).toBe(0);
  });

  it('dedupes load requests while a retry timer is pending', async () => {
    const firstLoad = service.loadAsset('location');

    images[0].onerror?.();
    const firstResult = await firstLoad;

    expect(firstResult.status).toBe('retrying');
    expect((service as unknown as { retryTimers: Map<string, unknown> }).retryTimers.size).toBe(1);
    expect(images).toHaveLength(1);

    const secondResult = await service.loadAsset('location');

    expect(secondResult).toBe(firstResult);
    expect(images).toHaveLength(1);
    expect((service as unknown as { retryTimers: Map<string, unknown> }).retryTimers.size).toBe(1);
  });

  it('settles in-flight loads safely when cleared before completion', async () => {
    const loadPromise = service.loadAsset('location');

    service.clearCache();
    images[0].onload?.();

    const result = await loadPromise;

    expect(result.status).toBe('failed');
    expect(result.lastError).toBe('Asset load cancelled');
    expect(service.getAssetState('location')).toBeUndefined();
  });

  it('resolves and cancels non-critical delay timers during cleanup', async () => {
    const loadPromise = service.loadNonCriticalAssets(['legend_location_on']);

    expect((service as unknown as { delayTimers: Map<unknown, unknown> }).delayTimers.size).toBe(1);

    service.clearCache();
    await loadPromise;

    expect((service as unknown as { delayTimers: Map<unknown, unknown> }).delayTimers.size).toBe(0);
    expect(service.getAssetState('legend_location_on')).toBeUndefined();
  });

  it('destroys cache cleanup and memory monitor timers', () => {
    Object.defineProperty(performance, 'memory', {
      configurable: true,
      value: {
        usedJSHeapSize: 90,
        jsHeapSizeLimit: 100,
      },
    });

    const { AssetCache } = require('@/lib/services/asset-cache');
    const cache = new AssetCache({ enablePersistence: false, cleanupInterval: 1000 });

    expect((cache as unknown as { cleanupTimer: unknown }).cleanupTimer).not.toBeNull();
    expect((cache as unknown as { memoryMonitor: unknown }).memoryMonitor).not.toBeNull();

    cache.destroy();

    expect((cache as unknown as { cleanupTimer: unknown }).cleanupTimer).toBeNull();
    expect((cache as unknown as { memoryMonitor: unknown }).memoryMonitor).toBeNull();
  });

  it('disconnects lazy image observers through destroy', () => {
    const disconnect = jest.fn();
    const observe = jest.fn();
    const unobserve = jest.fn();

    (global as typeof globalThis & { IntersectionObserver: jest.Mock }).IntersectionObserver = jest.fn(() => ({
      disconnect,
      observe,
      unobserve,
    })) as unknown as jest.Mock;

    const { getLazyImageLoader } = require('@/lib/utils/asset-optimization');
    const loader = getLazyImageLoader();

    loader.destroy();

    expect(disconnect).toHaveBeenCalledTimes(1);
  });
});
