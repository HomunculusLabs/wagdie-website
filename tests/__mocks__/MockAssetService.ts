/**
 * Mock Asset Service
 *
 * Provides mock functionality for testing asset loading behavior.
 * Allows simulation of success, failure, and delay scenarios.
 */

import type {
  AssetLoadingState,
  AssetError,
  BaseAsset
} from '@/types/assets';

export interface MockAssetConfig {
  status: 'success' | 'failure' | 'timeout';
  delay?: number;
  error?: AssetError;
}

export interface MockCall {
  assetId: string;
  timestamp: number;
  config?: MockAssetConfig;
}

export class MockAssetService {
  private mockConfigs: Map<string, MockAssetConfig> = new Map();
  private callHistory: MockCall[] = [];
  private defaultDelay: number = 100;

  /**
   * Mock successful asset load
   */
  mockSuccessfulLoad(assetId: string, delay: number = this.defaultDelay): void {
    this.mockConfigs.set(assetId, {
      status: 'success',
      delay
    });
  }

  /**
   * Mock failed asset load
   */
  mockFailedLoad(assetId: string, error: AssetError): void {
    this.mockConfigs.set(assetId, {
      status: 'failure',
      error
    });
  }

  /**
   * Mock slow asset load
   */
  mockSlowLoad(assetId: string, delay: number): void {
    this.mockConfigs.set(assetId, {
      status: 'success',
      delay
    });
  }

  /**
   * Mock timeout
   */
  mockTimeout(assetId: string): void {
    this.mockConfigs.set(assetId, {
      status: 'timeout'
    });
  }

  /**
   * Mock multiple assets
   */
  mockMultipleAssets(configs: Record<string, MockAssetConfig>): void {
    Object.entries(configs).forEach(([assetId, config]) => {
      this.mockConfigs.set(assetId, config);
    });
  }

  /**
   * Simulate asset loading
   */
  async simulateLoad(assetId: string): Promise<AssetLoadingState> {
    const call: MockCall = {
      assetId,
      timestamp: Date.now()
    };

    const config = this.mockConfigs.get(assetId);
    if (config) {
      call.config = config;
    }

    this.callHistory.push(call);

    const startTime = Date.now();
    const loadingState: AssetLoadingState = {
      assetId,
      status: 'loading',
      loadStartTime: startTime,
      retryCount: 0,
      usedFallback: false
    };

    try {
      if (config) {
        // Apply delay if specified
        if (config.delay) {
          await new Promise(resolve => setTimeout(resolve, config.delay));
        }

        switch (config.status) {
          case 'success':
            loadingState.status = 'loaded';
            loadingState.loadEndTime = Date.now();
            break;

          case 'failure':
            if (config.error) {
              loadingState.status = 'failed';
              loadingState.lastError = config.error.errorMessage;
              loadingState.loadEndTime = Date.now();
            } else {
              throw new Error('Mock failure');
            }
            break;

          case 'timeout':
            throw new Error('Mock timeout');
        }
      } else {
        // Default success behavior
        await new Promise(resolve => setTimeout(resolve, this.defaultDelay));
        loadingState.status = 'loaded';
        loadingState.loadEndTime = Date.now();
      }

    } catch (error) {
      loadingState.status = 'failed';
      loadingState.lastError = error instanceof Error ? error.message : 'Unknown mock error';
      loadingState.loadEndTime = Date.now();
    }

    return loadingState;
  }

  /**
   * Simulate multiple asset loads
   */
  async simulateMultipleLoads(assetIds: string[]): Promise<AssetLoadingState[]> {
    const loadPromises = assetIds.map(id => this.simulateLoad(id));
    return Promise.all(loadPromises);
  }

  /**
   * Get mock call history
   */
  getCallHistory(): MockCall[] {
    return [...this.callHistory];
  }

  /**
   * Get call count for specific asset
   */
  getCallCount(assetId: string): number {
    return this.callHistory.filter(call => call.assetId === assetId).length;
  }

  /**
   * Get total call count
   */
  getTotalCallCount(): number {
    return this.callHistory.length;
  }

  /**
   * Get calls by status
   */
  getCallsByStatus(status: MockAssetConfig['status']): MockCall[] {
    return this.callHistory.filter(call =>
      call.config?.status === status
    );
  }

  /**
   * Reset all mocks
   */
  resetMocks(): void {
    this.mockConfigs.clear();
    this.callHistory = [];
  }

  /**
   * Clear call history
   */
  clearCallHistory(): void {
    this.callHistory = [];
  }

  /**
   * Setup common test scenarios
   */
  setupCommonScenarios(): void {
    // Successful critical assets
    this.mockSuccessfulLoad('location', 50);
    this.mockSuccessfulLoad('character', 75);
    this.mockSuccessfulLoad('burn', 100);
    this.mockSuccessfulLoad('death', 100);
    this.mockSuccessfulLoad('fight', 100);

    // Legend assets (slower)
    this.mockSuccessfulLoad('legend_location_on', 150);
    this.mockSuccessfulLoad('legend_location_off', 150);
    this.mockSuccessfulLoad('legend_burn_on', 200);
    this.mockSuccessfulLoad('legend_burn_off', 200);

    // Some failed assets for error testing
    this.mockFailedLoad('legend_death_on', {
      assetId: 'legend_death_on',
      errorType: 'file_not_found',
      errorMessage: 'File not found',
      timestamp: Date.now(),
      retryCount: 0,
      canRetry: true
    });

    // Slow loading asset for timeout testing
    this.mockSlowLoad('slow_asset', 5000);
  }

  /**
   * Setup failure scenario
   */
  setupFailureScenario(): void {
    // All assets fail
    const assetIds = ['location', 'character', 'burn', 'death', 'fight'];
    assetIds.forEach(assetId => {
      this.mockFailedLoad(assetId, {
        assetId,
        errorType: 'network',
        errorMessage: `Network error for ${assetId}`,
        timestamp: Date.now(),
        retryCount: 0,
        canRetry: true
      });
    });
  }

  /**
   * Setup timeout scenario
   */
  setupTimeoutScenario(): void {
    const assetIds = ['location', 'character', 'burn'];
    assetIds.forEach(assetId => {
      this.mockTimeout(assetId);
    });
  }

  /**
   * Setup mixed scenario (some success, some failures)
   */
  setupMixedScenario(): void {
    // Successful assets
    this.mockSuccessfulLoad('location', 100);
    this.mockSuccessfulLoad('character', 150);
    this.mockSuccessfulLoad('burn', 200);

    // Failed assets
    this.mockFailedLoad('death', {
      assetId: 'death',
      errorType: 'file_not_found',
      errorMessage: 'Death icon not found',
      timestamp: Date.now(),
      retryCount: 0,
      canRetry: true
    });

    this.mockFailedLoad('fight', {
      assetId: 'fight',
      errorType: 'network',
      errorMessage: 'Network error for fight icon',
      timestamp: Date.now(),
      retryCount: 0,
      canRetry: true
    });
  }

  /**
   * Verify mock was called with specific parameters
   */
  verifyCalledWith(assetId: string, expectedStatus?: MockAssetConfig['status']): boolean {
    const calls = this.callHistory.filter(call => call.assetId === assetId);

    if (calls.length === 0) {
      return false;
    }

    if (expectedStatus) {
      return calls.some(call => call.config?.status === expectedStatus);
    }

    return true;
  }

  /**
   * Get wait time for asset
   */
  getWaitTime(assetId: string): number {
    const call = this.callHistory.find(c => c.assetId === assetId);
    return call?.config?.delay || this.defaultDelay;
  }

  /**
   * Set default delay
   */
  setDefaultDelay(delay: number): void {
    this.defaultDelay = delay;
  }

  /**
   * Get mock summary
   */
  getSummary(): {
    totalCalls: number;
    successCalls: number;
    failureCalls: number;
    timeoutCalls: number;
    uniqueAssets: string[];
  } {
    const totalCalls = this.callHistory.length;
    const successCalls = this.getCallsByStatus('success').length;
    const failureCalls = this.getCallsByStatus('failure').length;
    const timeoutCalls = this.getCallsByStatus('timeout').length;
    const uniqueAssets = [...new Set(this.callHistory.map(call => call.assetId))];

    return {
      totalCalls,
      successCalls,
      failureCalls,
      timeoutCalls,
      uniqueAssets
    };
  }
}

// Factory function for creating mock service
export function createMockAssetService(): MockAssetService {
  return new MockAssetService();
}

// Jest helper functions for common testing patterns
export const mockAssetHelpers = {
  /**
   * Wait for mock call
   */
  waitForCall: async (assetId: string, timeout: number = 1000): Promise<boolean> => {
    return new Promise((resolve) => {
      const startTime = Date.now();
      const checkInterval = setInterval(() => {
        // In a real test environment, you would check the actual service calls
        // This is a placeholder for the concept
        if (Date.now() - startTime > timeout) {
          clearInterval(checkInterval);
          resolve(false);
        } else {
          // Simulate finding the call
          clearInterval(checkInterval);
          resolve(true);
        }
      }, 50);
    });
  },

  /**
   * Create test asset
   */
  createTestAsset: (id: string, category: string = 'marker'): BaseAsset => ({
    id,
    name: `Test ${id}`,
    iconUrl: `/images/test_${id}.png`,
    fallbackUrl: `/images/default_${id}.png`,
    category: category as any,
    priority: 'critical' as any
  }),

  /**
   * Assert asset loading state
   */
  assertLoadingState: (state: AssetLoadingState, expectedStatus: string): void => {
    if (state.status !== expectedStatus) {
      throw new Error(`Expected status ${expectedStatus}, got ${state.status}`);
    }
  }
};