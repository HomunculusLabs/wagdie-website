import { renderHook, waitFor } from '@testing-library/react';

import { useAssetLoading } from '@/hooks/useAssetLoading';

const mockLoadAsset = jest.fn();
const mockLoadAssets = jest.fn();
const mockPreloadCriticalAssets = jest.fn();
const mockGetLoadingContext = jest.fn();
const mockGetAssetState = jest.fn();
const mockRetryAsset = jest.fn();
const mockRecordAssetLoad = jest.fn();
const mockGenerateReport = jest.fn();

const mockLoadingService = {
  loadAsset: mockLoadAsset,
  loadAssets: mockLoadAssets,
  preloadCriticalAssets: mockPreloadCriticalAssets,
  getLoadingContext: mockGetLoadingContext,
  getAssetState: mockGetAssetState,
  retryAsset: mockRetryAsset,
};

jest.mock('@/lib/services/asset-loading-service', () => ({
  getAssetLoadingService: () => mockLoadingService,
}));

jest.mock('@/lib/services/asset-error-handler', () => ({
  getAssetErrorHandler: jest.fn(() => ({})),
}));

jest.mock('@/lib/utils/asset-performance', () => ({
  getAssetPerformanceMonitor: jest.fn(() => ({
    recordAssetLoad: mockRecordAssetLoad,
    generateReport: mockGenerateReport,
  })),
}));

describe('useAssetLoading', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    mockLoadAssets.mockResolvedValue([]);
    mockPreloadCriticalAssets.mockResolvedValue(undefined);
    mockGetLoadingContext.mockReturnValue({
      assets: new Map(),
      loadingQueue: [],
      completedCritical: true,
      errorCount: 0,
    });
  });

  it('does not re-initialize when assetIds identity changes but content is unchanged', async () => {
    const { rerender } = renderHook(
      ({ assetIds }) => useAssetLoading({ assetIds, preloadCritical: true, enablePerformanceMonitoring: false }),
      { initialProps: { assetIds: ['location', 'burn'] } }
    );

    await waitFor(() => {
      expect(mockPreloadCriticalAssets).toHaveBeenCalledTimes(1);
      expect(mockLoadAssets).toHaveBeenCalledTimes(1);
    });

    rerender({ assetIds: ['location', 'burn'] });

    await waitFor(() => {
      expect(mockPreloadCriticalAssets).toHaveBeenCalledTimes(1);
      expect(mockLoadAssets).toHaveBeenCalledTimes(1);
    });
  });

  it('re-initializes when assetIds content changes', async () => {
    const { rerender } = renderHook(
      ({ assetIds }) => useAssetLoading({ assetIds, preloadCritical: true, enablePerformanceMonitoring: false }),
      { initialProps: { assetIds: ['location', 'burn'] } }
    );

    await waitFor(() => {
      expect(mockLoadAssets).toHaveBeenCalledTimes(1);
    });

    rerender({ assetIds: ['location', 'death'] });

    await waitFor(() => {
      expect(mockLoadAssets).toHaveBeenCalledTimes(2);
    });
  });
});
