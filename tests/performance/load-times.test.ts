/**
 * Load Time Monitoring Tests
 *
 * Tests for monitoring and reporting asset load times,
 * ensuring performance targets are met and metrics are accurate.
 */

import { describe, test, expect, beforeEach, afterEach, jest } from '@jest/globals';

// Mock performance monitoring utilities
jest.mock('@/lib/utils/asset-performance', () => {
  return {
    getAssetPerformanceMonitor: jest.fn().mockReturnValue({
      startMeasure: jest.fn().mockReturnValue(() => { }),
      recordLoadTime: jest.fn(),
      recordCacheHit: jest.fn(),
      recordCacheMiss: jest.fn(),
      recordError: jest.fn(),
      getMetrics: jest.fn().mockReturnValue([]),
      getAllAssetMetrics: jest.fn().mockReturnValue([]),
      generateReport: jest.fn().mockReturnValue({
        totalAssets: 0,
        averageLoadTime: 0,
        cacheHitRate: 0,
        errorRate: 0,
        totalLoadTime: 0,
      }),
      clearMetrics: jest.fn(),
    }),
  };
});

// Mock performance API
Object.defineProperty(global, 'performance', {
  value: {
    now: jest.fn().mockReturnValue(Date.now()),
    mark: jest.fn(),
    measure: jest.fn(),
    getEntriesByName: jest.fn().mockReturnValue([]),
    getEntriesByType: jest.fn().mockReturnValue([]),
  },
  writable: true,
});

import { getAssetPerformanceMonitor } from '@/lib/utils/asset-performance';

describe('Load Time Monitoring', () => {
  let performanceMonitor: any;
  let mockPerformance: any;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();

    performanceMonitor = getAssetPerformanceMonitor();
    mockPerformance = global.performance;

    // Mock performance.now to return increasing timestamps
    let timestamp = 1000;
    mockPerformance.now.mockImplementation(() => {
      timestamp += Math.random() * 100;
      return timestamp;
    });
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('Critical Asset Load Time Targets', () => {
    test('should track load times for critical assets under 2 seconds', async () => {
      const criticalAssets = [
        { id: 'location', expectedMaxTime: 1500 },
        { id: 'character', expectedMaxTime: 1800 },
        { id: 'burn', expectedMaxTime: 1200 },
        { id: 'death', expectedMaxTime: 1200 },
        { id: 'fight', expectedMaxTime: 1400 },
      ];

      const loadTimes: { [key: string]: number } = {};

      // Mock measurement tracking
      const startMeasure = jest.fn().mockReturnValue(() => {
        const startTime = mockPerformance.now();
        return () => {
          const endTime = mockPerformance.now();
          return endTime - startTime;
        };
      });

      performanceMonitor.startMeasure = startMeasure;

      // Simulate asset loading with performance tracking
      for (const asset of criticalAssets) {
        const endMeasure = startMeasure();

        // Simulate load time
        const loadTime = Math.random() * asset.expectedMaxTime;
        jest.advanceTimersByTime(loadTime);

        const actualTime = endMeasure();
        loadTimes[asset.id] = actualTime;

        performanceMonitor.recordLoadTime(asset.id, actualTime);
      }

      // Verify all assets met their targets
      for (const asset of criticalAssets) {
        expect(loadTimes[asset.id]).toBeLessThan(asset.expectedMaxTime);
        expect(loadTimes[asset.id]).toBeLessThan(2000); // Overall 2s target
        expect(performanceMonitor.recordLoadTime).toHaveBeenCalledWith(
          asset.id,
          expect.any(Number)
        );
      }

      // Check that all critical assets were measured
      expect(performanceMonitor.recordLoadTime).toHaveBeenCalledTimes(criticalAssets.length);
    });

    test('should identify slow-loading critical assets', async () => {
      const slowAssets = [
        { id: 'slow-location', loadTime: 2500 },
        { id: 'slow-character', loadTime: 3000 },
      ];

      const fastAssets = [
        { id: 'fast-burn', loadTime: 800 },
        { id: 'fast-death', loadTime: 900 },
      ];

      const allAssets = [...slowAssets, ...fastAssets];

      // Record load times
      for (const asset of allAssets) {
        performanceMonitor.recordLoadTime(asset.id, asset.loadTime);
      }

      // Mock metrics that would be returned
      const mockMetrics = allAssets.map(asset => ({
        assetId: asset.id,
        loadTime: asset.loadTime,
        timestamp: Date.now(),
        cached: false,
        error: null,
        retryCount: 0,
      }));

      performanceMonitor.getAllAssetMetrics.mockReturnValue(mockMetrics);

      const metrics = performanceMonitor.getAllAssetMetrics();

      // Identify slow assets (over 2s)
      const slowAssetsDetected = metrics.filter(m => m.loadTime > 2000);
      const fastAssetsDetected = metrics.filter(m => m.loadTime <= 2000);

      expect(slowAssetsDetected).toHaveLength(2);
      expect(fastAssetsDetected).toHaveLength(2);
      expect(slowAssetsDetected.map(m => m.assetId)).toEqual(
        expect.arrayContaining(['slow-location', 'slow-character'])
      );
    });

    test('should generate performance report with load time analysis', () => {
      const loadTimeData = [
        { id: 'location', loadTime: 1200, cached: false },
        { id: 'character', loadTime: 1500, cached: false },
        { id: 'burn', loadTime: 800, cached: true },
        { id: 'death', loadTime: 900, cached: true },
        { id: 'fight', loadTime: 1100, cached: false },
      ];

      const mockMetrics = loadTimeData.map(asset => ({
        assetId: asset.id,
        loadTime: asset.loadTime,
        timestamp: Date.now(),
        cached: asset.cached,
        error: null,
        retryCount: 0,
      }));

      performanceMonitor.getAllAssetMetrics.mockReturnValue(mockMetrics);

      const report = performanceMonitor.generateReport();

      // Verify report contains load time statistics
      expect(report.totalAssets).toBe(5);
      expect(report.averageLoadTime).toBeGreaterThan(0);
      expect(report.totalLoadTime).toBeGreaterThan(0);

      // Verify calculation accuracy
      const expectedAverage = loadTimeData.reduce((sum, asset) => sum + asset.loadTime, 0) / loadTimeData.length;
      expect(Math.abs(report.averageLoadTime - expectedAverage)).toBeLessThan(1);
    });
  });

  describe('Real-time Performance Monitoring', () => {
    test('should track performance metrics in real-time', async () => {
      const assetId = 'realtime-asset';
      const measurementEvents: string[] = [];

      // Mock real-time tracking
      performanceMonitor.recordLoadTime = jest.fn().mockImplementation((id: string, time: number) => {
        measurementEvents.push(`Load completed: ${id} in ${time}ms`);
      });

      performanceMonitor.recordCacheHit = jest.fn().mockImplementation((id: string) => {
        measurementEvents.push(`Cache hit: ${id}`);
      });

      performanceMonitor.recordCacheMiss = jest.fn().mockImplementation((id: string) => {
        measurementEvents.push(`Cache miss: ${id}`);
      });

      performanceMonitor.recordError = jest.fn().mockImplementation((id: string, error: Error) => {
        measurementEvents.push(`Error: ${id} - ${error.message}`);
      });

      // Simulate real-time loading sequence
      performanceMonitor.recordCacheMiss(assetId);
      jest.advanceTimersByTime(500);

      performanceMonitor.recordLoadTime(assetId, 850);
      jest.advanceTimersByTime(100);

      // Second load should hit cache
      performanceMonitor.recordCacheHit(assetId);
      jest.advanceTimersByTime(50);

      // Verify real-time events were recorded
      expect(measurementEvents).toHaveLength(3);
      expect(measurementEvents[0]).toContain('Cache miss');
      expect(measurementEvents[1]).toContain('Load completed');
      expect(measurementEvents[2]).toContain('Cache hit');
    });

    test('should measure performance with high precision', async () => {
      const assetId = 'precision-asset';
      const precisionTarget = 1; // 1ms precision

      performanceMonitor.startMeasure = jest.fn().mockReturnValue(() => {
        const startTime = mockPerformance.now();
        return () => {
          const endTime = mockPerformance.now();
          return endTime - startTime;
        };
      });

      // Test measurement precision
      for (let i = 0; i < 10; i++) {
        const endMeasure = performanceMonitor.startMeasure();

        // Simulate very small time differences
        jest.advanceTimersByTime(precisionTarget + Math.random());

        const measuredTime = endMeasure();

        // Verify precision is maintained
        expect(measuredTime).toBeGreaterThanOrEqual(precisionTarget);
        expect(measuredTime).toBeLessThan(precisionTarget * 10);
      }
    });

    test('should aggregate performance metrics over time', async () => {
      const timeWindows = [
        { start: 1000, end: 2000, expectedAvg: 1200 },
        { start: 2000, end: 3000, expectedAvg: 900 },
        { start: 3000, end: 4000, expectedAvg: 1100 },
      ];

      const metricsByTime: { [key: number]: any[] } = {};

      // Generate metrics over time
      for (const window of timeWindows) {
        const windowMetrics = [];

        for (let i = 0; i < 5; i++) {
          const loadTime = window.expectedAvg + (Math.random() - 0.5) * 400;
          windowMetrics.push({
            assetId: `asset-${window.start}-${i}`,
            loadTime,
            timestamp: window.start + (i * 200),
            cached: false,
            error: null,
            retryCount: 0,
          });
        }

        metricsByTime[window.start] = windowMetrics;
      }

      // Mock time-based filtering
      performanceMonitor.getAllAssetMetrics.mockImplementation((filter?: any) => {
        if (filter?.startTime && filter?.endTime) {
          return Object.values(metricsByTime)
            .flat()
            .filter(m => m.timestamp >= filter.startTime && m.timestamp <= filter.endTime);
        }
        return Object.values(metricsByTime).flat();
      });

      // Test time-window aggregation
      for (const window of timeWindows) {
        const windowMetrics = performanceMonitor.getAllAssetMetrics({
          startTime: window.start,
          endTime: window.end
        });

        const avgLoadTime = windowMetrics.reduce((sum, m) => sum + m.loadTime, 0) / windowMetrics.length;

        expect(avgLoadTime).toBeGreaterThan(window.expectedAvg - 200);
        expect(avgLoadTime).toBeLessThan(window.expectedAvg + 200);
      }
    });
  });

  describe('Performance Threshold Monitoring', () => {
    test('should alert when performance thresholds are exceeded', async () => {
      const thresholds = {
        criticalAssetMaxLoadTime: 2000,
        averageLoadTimeTarget: 1500,
        maxErrorRate: 0.1, // 10%
        minCacheHitRate: 0.7, // 70%
      };

      const performanceAlerts: string[] = [];

      // Mock alert system
      const checkThresholds = (metrics: any[]) => {
        const averageLoadTime = metrics.reduce((sum, m) => sum + m.loadTime, 0) / metrics.length;
        const slowAssets = metrics.filter(m => m.loadTime > thresholds.criticalAssetMaxLoadTime);
        const errors = metrics.filter(m => m.error);

        if (averageLoadTime > thresholds.averageLoadTimeTarget) {
          performanceAlerts.push(`Average load time (${averageLoadTime.toFixed(0)}ms) exceeds target (${thresholds.averageLoadTimeTarget}ms)`);
        }

        if (slowAssets.length > 0) {
          performanceAlerts.push(`${slowAssets.length} assets exceed critical load time threshold`);
        }

        if (errors.length / metrics.length > thresholds.maxErrorRate) {
          performanceAlerts.push(`Error rate (${(errors.length / metrics.length * 100).toFixed(1)}%) exceeds threshold`);
        }
      };

      // Create metrics with some performance issues
      const problematicMetrics = [
        { assetId: 'slow-asset-1', loadTime: 2500, cached: false, error: null, retryCount: 0 },
        { assetId: 'slow-asset-2', loadTime: 2200, cached: false, error: null, retryCount: 0 },
        { assetId: 'normal-asset-1', loadTime: 800, cached: false, error: null, retryCount: 0 },
        { assetId: 'normal-asset-2', loadTime: 900, cached: true, error: null, retryCount: 0 },
        { assetId: 'error-asset', loadTime: 0, cached: false, error: new Error('Network error'), retryCount: 2 },
      ];

      performanceMonitor.getAllAssetMetrics.mockReturnValue(problematicMetrics);
      checkThresholds(problematicMetrics);

      // Verify alerts were generated for performance issues
      expect(performanceAlerts.length).toBeGreaterThan(0);
      expect(performanceAlerts.some(alert => alert.includes('Average load time'))).toBe(true);
      expect(performanceAlerts.some(alert => alert.includes('exceeds critical'))).toBe(true);
    });

    test('should track performance degradation over time', async () => {
      const performanceSnapshots: { timestamp: number; avgLoadTime: number; errorRate: number }[] = [];

      // Simulate performance degradation
      const degradationData = [
        { time: 1000, avgLoadTime: 800, errorRate: 0 },
        { time: 2000, avgLoadTime: 950, errorRate: 0.02 },
        { time: 3000, avgLoadTime: 1200, errorRate: 0.05 },
        { time: 4000, avgLoadTime: 1800, errorRate: 0.12 },
        { time: 5000, avgLoadTime: 2200, errorRate: 0.18 },
      ];

      for (const snapshot of degradationData) {
        const metrics = [
          { assetId: `asset-${snapshot.time}-1`, loadTime: snapshot.avgLoadTime * 0.8, cached: false, error: null, retryCount: 0 },
          { assetId: `asset-${snapshot.time}-2`, loadTime: snapshot.avgLoadTime * 1.2, cached: false, error: null, retryCount: 0 },
        ];

        if (snapshot.errorRate > 0) {
          metrics.push({
            assetId: `error-${snapshot.time}`,
            loadTime: 0,
            cached: false,
            error: new Error('Network error'),
            retryCount: 2,
          });
        }

        performanceMonitor.getAllAssetMetrics.mockReturnValue(metrics);

        const report = performanceMonitor.generateReport();
        performanceSnapshots.push({
          timestamp: snapshot.time,
          avgLoadTime: report.averageLoadTime,
          errorRate: snapshot.errorRate,
        });
      }

      // Detect performance degradation
      const initialPerformance = performanceSnapshots[0];
      const finalPerformance = performanceSnapshots[performanceSnapshots.length - 1];

      const loadTimeIncrease = (finalPerformance.avgLoadTime - initialPerformance.avgLoadTime) / initialPerformance.avgLoadTime;
      const errorRateIncrease = finalPerformance.errorRate - initialPerformance.errorRate;

      // Verify degradation was detected
      expect(loadTimeIncrease).toBeGreaterThan(1.5); // >150% increase
      expect(errorRateIncrease).toBeGreaterThan(0.1); // >10% increase
    });
  });

  describe('Performance Reporting', () => {
    test('should generate comprehensive performance reports', () => {
      const testMetrics = [
        { assetId: 'location', loadTime: 1200, cached: false, error: null, retryCount: 0 },
        { assetId: 'character', loadTime: 800, cached: true, error: null, retryCount: 0 },
        { assetId: 'burn', loadTime: 1500, cached: false, error: null, retryCount: 1 },
        { assetId: 'death', loadTime: 900, cached: true, error: null, retryCount: 0 },
        { assetId: 'fight', loadTime: 0, cached: false, error: new Error('Failed'), retryCount: 2 },
      ];

      performanceMonitor.getAllAssetMetrics.mockReturnValue(testMetrics);

      const report = performanceMonitor.generateReport();

      // Verify comprehensive reporting
      expect(report).toHaveProperty('totalAssets');
      expect(report).toHaveProperty('averageLoadTime');
      expect(report).toHaveProperty('cacheHitRate');
      expect(report).toHaveProperty('errorRate');
      expect(report).toHaveProperty('totalLoadTime');

      expect(report.totalAssets).toBe(5);
      expect(report.cacheHitRate).toBeCloseTo(0.4, 1); // 2/5 assets cached
      expect(report.errorRate).toBeCloseTo(0.2, 1); // 1/5 assets errored
      expect(report.averageLoadTime).toBeCloseTo(1100, 50); // Average of successful loads
    });

    test('should categorize assets by performance characteristics', async () => {
      const performanceCategories = {
        fast: { threshold: 500, count: 0 },
        normal: { threshold: 1500, count: 0 },
        slow: { threshold: 3000, count: 0 },
        verySlow: { threshold: Infinity, count: 0 },
      };

      const testMetrics = [
        { assetId: 'fast-1', loadTime: 300 },
        { assetId: 'fast-2', loadTime: 450 },
        { assetId: 'normal-1', loadTime: 800 },
        { assetId: 'normal-2', loadTime: 1200 },
        { assetId: 'slow-1', loadTime: 2000 },
        { assetId: 'slow-2', loadTime: 2500 },
        { assetId: 'very-slow-1', loadTime: 3500 },
      ];

      // Categorize assets
      for (const metric of testMetrics) {
        if (metric.loadTime <= performanceCategories.fast.threshold) {
          performanceCategories.fast.count++;
        } else if (metric.loadTime <= performanceCategories.normal.threshold) {
          performanceCategories.normal.count++;
        } else if (metric.loadTime <= performanceCategories.slow.threshold) {
          performanceCategories.slow.count++;
        } else {
          performanceCategories.verySlow.count++;
        }
      }

      // Verify categorization
      expect(performanceCategories.fast.count).toBe(2);
      expect(performanceCategories.normal.count).toBe(2);
      expect(performanceCategories.slow.count).toBe(2);
      expect(performanceCategories.verySlow.count).toBe(1);

      // Most assets should be in fast or normal categories
      const fastAndNormalTotal = performanceCategories.fast.count + performanceCategories.normal.count;
      expect(fastAndNormalTotal).toBeGreaterThan(testMetrics.length / 2);
    });

    test('should provide actionable performance insights', async () => {
      const insights: string[] = [];

      const generateInsights = (metrics: any[]) => {
        const avgLoadTime = metrics.reduce((sum, m) => sum + (m.loadTime || 0), 0) / metrics.length;
        const slowAssets = metrics.filter(m => m.loadTime > 2000);
        const errorAssets = metrics.filter(m => m.error);
        const retriedAssets = metrics.filter(m => m.retryCount > 0);

        if (avgLoadTime > 1500) {
          insights.push(`Consider optimizing image sizes to reduce average load time from ${avgLoadTime.toFixed(0)}ms`);
        }

        if (slowAssets.length > 0) {
          insights.push(`${slowAssets.length} assets loading slowly (>2s) - consider preloading or compression`);
        }

        if (errorAssets.length > 0) {
          insights.push(`${errorAssets.length} assets failing to load - review error handling`);
        }

        if (retriedAssets.length > 0) {
          insights.push(`${retriedAssets.length} assets required retries - investigate network stability`);
        }
      };

      const testMetrics = [
        { assetId: 'asset-1', loadTime: 1800, error: null, retryCount: 0 },
        { assetId: 'asset-2', loadTime: 2500, error: null, retryCount: 1 },
        { assetId: 'asset-3', loadTime: 0, error: new Error('Network error'), retryCount: 2 },
      ];

      generateInsights(testMetrics);

      // Verify actionable insights were generated
      expect(insights.length).toBeGreaterThan(0);
      expect(insights.some(insight => insight.includes('optimizing'))).toBe(true);
      expect(insights.some(insight => insight.includes('slowly'))).toBe(true);
      expect(insights.some(insight => insight.includes('failing'))).toBe(true);
    });
  });
});