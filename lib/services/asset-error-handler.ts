/**
 * Asset Error Handler Service
 *
 * Provides centralized error handling and recovery strategies
 * for asset loading failures.
 */

import type {
  AssetError,
  ErrorRecoveryStrategy,
  AssetErrorHandler as IAssetErrorHandler
} from '@/types/assets';
import { getFallbackUrl, getRecoveryStrategy } from '@/lib/services/assets/asset-policy';
import { isAllowedAssetId } from '@/lib/services/assets/asset-ids';

export interface AssetErrorHandlerOptions {
  onError?: (error: AssetError) => void;
  onFallback?: (assetId: string, fallbackUrl: string) => void;
  enableLogging?: boolean;
  customFallbacks?: Record<string, string>;
}

export class AssetErrorHandler implements IAssetErrorHandler {
  private options: Required<AssetErrorHandlerOptions>;
  private errorLog: AssetError[] = [];

  constructor(options: AssetErrorHandlerOptions = {}) {
    this.options = {
      onError: options.onError || (() => { }),
      onFallback: options.onFallback || (() => { }),
      enableLogging: options.enableLogging ?? true,
      customFallbacks: options.customFallbacks || {}
    };
  }

  /**
   * Handle asset loading error
   */
  handleError(error: AssetError): void {
    // Log error if enabled
    if (this.options.enableLogging) {
      this.logError(error);
    }

    // Call custom error handler
    this.options.onError(error);
  }

  /**
   * Determine if error is retryable
   */
  isRetryableError(error: AssetError): boolean {
    const strategy = this.getRetryStrategy(error.errorType);
    return error.retryCount < strategy.maxRetries && strategy.maxRetries > 0;
  }

  /**
   * Get retry delay for error type
   */
  getRetryDelay(error: AssetError, attempt: number): number {
    const strategy = this.getRetryStrategy(error.errorType);

    // Exponential backoff with jitter
    const baseDelay = strategy.retryDelay;
    const exponentialDelay = baseDelay * Math.pow(2, attempt - 1);
    const jitter = Math.random() * 0.1 * exponentialDelay; // 10% jitter

    return Math.min(exponentialDelay + jitter, 30000); // Cap at 30 seconds
  }

  /**
   * Log error for monitoring
   */
  logError(error: AssetError): void {
    this.errorLog.push(error);

    // Keep only last 100 errors to prevent memory leaks
    if (this.errorLog.length > 100) {
      this.errorLog = this.errorLog.slice(-100);
    }

    // Console logging with appropriate level
    const logLevel = this.getLogLevel(error.errorType);
    const logMessage = `[AssetError] ${error.assetId}: ${error.errorMessage} (${error.errorType})`;

    switch (logLevel) {
      case 'error':
        console.error(logMessage, error);
        break;
      case 'warn':
        console.warn(logMessage, error);
        break;
      default:
        console.log(logMessage, error);
    }
  }

  /**
   * Get fallback asset for failed asset
   */
  getFallbackAsset(assetId: string): string | null {
    // Check custom fallbacks first
    const customFallback = this.options.customFallbacks[assetId];
    if (customFallback) {
      return customFallback;
    }

    // Known icon IDs use shared policy mapping (single source of truth)
    if (isAllowedAssetId(assetId)) {
      return getFallbackUrl(assetId);
    }

    // Generic fallbacks for unknown IDs (pattern-based)
    const defaultFallbacks: Record<string, string> = {
      default_marker: getFallbackUrl('location'),
      default_legend: getFallbackUrl('legend_location_on'),
      default_background: '/images/wagdie.png'
    };

    // Try exact match first (generic keys)
    const exactMatch = defaultFallbacks[assetId];
    if (exactMatch) {
      return exactMatch;
    }

    // Try pattern matching (unknown ids only)
    if (assetId.startsWith('legend_')) {
      return defaultFallbacks.default_legend;
    }

    if (assetId.includes('marker')) {
      return defaultFallbacks.default_marker;
    }

    if (assetId.includes('background') || ['wagdie', 'pilgrims', 'fire'].some(keyword => assetId.includes(keyword))) {
      return defaultFallbacks.default_background;
    }

    return null;
  }

  /**
   * Use fallback asset and notify
   */
  useFallbackAsset(assetId: string): string | null {
    const fallbackUrl = this.getFallbackAsset(assetId);

    if (fallbackUrl) {
      this.options.onFallback(assetId, fallbackUrl);
      return fallbackUrl;
    }

    return null;
  }

  /**
   * Get error statistics
   */
  getErrorStats(): {
    total: number;
    byType: Record<AssetError['errorType'], number>;
    byAsset: Record<string, number>;
    recentErrors: AssetError[];
  } {
    const byType: Record<AssetError['errorType'], number> = {
      network: 0,
      file_not_found: 0,
      timeout: 0,
      unknown: 0,
      corruption: 0
    };

    const byAsset: Record<string, number> = {};

    this.errorLog.forEach(error => {
      byType[error.errorType]++;
      byAsset[error.assetId] = (byAsset[error.assetId] || 0) + 1;
    });

    return {
      total: this.errorLog.length,
      byType,
      byAsset,
      recentErrors: this.errorLog.slice(-10) // Last 10 errors
    };
  }

  /**
   * Clear error log
   */
  clearErrorLog(): void {
    this.errorLog = [];
  }

  /**
   * Get error log
   */
  getErrorLog(): AssetError[] {
    return [...this.errorLog];
  }

  /**
   * Get retry strategy for error type
   */
  private getRetryStrategy(errorType: AssetError['errorType']): ErrorRecoveryStrategy {
    return getRecoveryStrategy(errorType);
  }

  /**
   * Get appropriate log level for error type
   */
  private getLogLevel(errorType: AssetError['errorType']): 'error' | 'warn' | 'log' {
    switch (errorType) {
      case 'file_not_found':
        return 'warn'; // File not found is often expected
      case 'network':
        return 'warn'; // Network issues are common
      case 'timeout':
        return 'warn'; // Timeouts can happen
      case 'corruption':
        return 'error'; // Corruption is serious and should be surfaced
      case 'unknown':
      default:
        return 'error'; // Unknown errors are more serious
    }
  }
}

// Singleton instance
let assetErrorHandlerInstance: AssetErrorHandler | null = null;

export function getAssetErrorHandler(options?: AssetErrorHandlerOptions): AssetErrorHandler {
  if (!assetErrorHandlerInstance) {
    assetErrorHandlerInstance = new AssetErrorHandler(options);
  }
  return assetErrorHandlerInstance;
}