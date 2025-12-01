/**
 * Asset Error Boundary Component
 *
 * React component that catches and handles asset loading errors
 * with graceful degradation and user-friendly error states.
 */

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, AlertCircle } from 'lucide-react';

interface AssetErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  maxRetries?: number;
  resetOnRetry?: boolean;
}

interface AssetErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
  retryCount: number;
  retryDelay: number;
}

/**
 * Asset Error Boundary Component
 */
export class AssetErrorBoundary extends Component<AssetErrorBoundaryProps, AssetErrorBoundaryState> {
  private retryTimer: NodeJS.Timeout | null = null;

  constructor(props: AssetErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      retryCount: 0,
      retryDelay: 1000
    };
  }

  static getDerivedStateFromError(error: Error): Partial<AssetErrorBoundaryState> {
    return {
      hasError: true,
      error,
      retryCount: 0 // Reset retry count on new error
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[AssetErrorBoundary] Caught error:', error, errorInfo);

    // Call custom error handler if provided
    this.props.onError?.(error, errorInfo);

    this.setState({
      error,
      errorInfo,
      retryCount: this.state.retryCount + 1,
      retryDelay: Math.min(this.state.retryDelay * 2, 30000) // Exponential backoff, max 30s
    });
  }

  componentWillUnmount() {
    if (this.retryTimer) {
      clearTimeout(this.retryTimer);
    }
  }

  /**
   * Handle retry with exponential backoff
   */
  private handleRetry = () => {
    const maxRetries = this.props.maxRetries || 3;

    if (this.state.retryCount < maxRetries) {
      // Schedule retry with exponential backoff
      this.retryTimer = setTimeout(() => {
        this.setState({ hasError: false, error: undefined, errorInfo: undefined });
      }, this.state.retryDelay);
    } else {
      // Max retries reached, show manual retry option
      this.forceUpdate();
    }
  };

  /**
   * Handle manual retry without automatic retry
   */
  private handleManualRetry = () => {
    this.setState({
      hasError: false,
      error: undefined,
      errorInfo: undefined,
      retryCount: 0,
      retryDelay: 1000
    });
  };

  /**
   * Handle refresh page
   */
  private handleRefresh = () => {
    window.location.reload();
  };

  /**
   * Render error based on retry count
   */
  private renderError(): ReactNode {
    const { maxRetries = 3 } = this.props;
    const { error, retryCount } = this.state;
    const canAutoRetry = retryCount < maxRetries;
    const canManualRetry = true;

    if (this.props.fallback) {
      return this.props.fallback;
    }

    // Determine error type for appropriate icon
    const getErrorIcon = () => {
      if (error?.message?.includes('network') || error?.message?.includes('fetch')) {
        return <RefreshCw className="animate-spin" />;
      }
      if (error?.message?.includes('timeout')) {
        return <AlertCircle className="text-amber-500" />;
      }
      return <AlertTriangle className="text-red-500" />;
    };

    return (
      <div className="flex flex-col items-center justify-center min-h-[200px] p-8 bg-abyss/50 rounded-lg border border-gold/20">
        <div className="text-center max-w-md">
          {/* Error Icon */}
          <div className="mb-4 text-gold">
            {getErrorIcon()}
          </div>

          {/* Error Message */}
          <h3 className="text-bone text-xl mb-2 font-wagdie">Asset Loading Error</h3>

          <div className="text-mist mb-6 text-sm">
            {error?.message || 'An unexpected error occurred while loading map assets.'}
          </div>

          {/* Retry Information */}
          {retryCount > 1 && (
            <div className="text-mist mb-4 text-xs">
              Retry attempt {retryCount} of {maxRetries}
              {!canAutoRetry && ' (Max retries reached)'}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col gap-3">
            {canAutoRetry && (
              <button
                onClick={this.handleRetry}
                disabled={this.state.retryDelay > 1000 && this.state.retryDelay < 30000}
                className="relative px-6 py-3 bg-gold text-abyss font-wagdie font-bold rounded-lg hover:bg-amber-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {this.state.retryDelay > 1000 ? (
                  <>
                    <RefreshCw className="absolute left-2 top-1/2 transform -translate-y-1/2 w-4 h-4 animate-spin" />
                    <span>Retrying...</span>
                  </>
                ) : (
                  'Retry Loading'
                )}
              </button>
            )}

            {canManualRetry && (
              <button
                onClick={this.handleManualRetry}
                className="px-6 py-3 bg-ember text-bone font-wagdie font-bold rounded-lg hover:bg-orange-600 transition-all"
              >
                Manual Retry
              </button>
            )}

            <button
              onClick={this.handleRefresh}
              className="px-6 py-3 border border-gold/50 text-bone font-wagdie font-bold rounded-lg hover:bg-abyss transition-all"
            >
              Refresh Page
            </button>
          </div>

          {/* Additional Context */}
          {error?.stack && (
            <details className="mt-4 text-left">
              <summary className="text-xs text-mist cursor-pointer hover:text-bone">
                Technical Details
              </summary>
              <pre className="mt-2 p-2 bg-abyss/30 rounded text-xs text-mist overflow-auto max-h-32">
                {error.stack}
              </pre>
            </details>
          )}
        </div>
      </div>
    );
  }

  render() {
    if (this.state.hasError) {
      return this.renderError();
    }

    return <>{this.props.children}</>;
  }
}

/**
 * Loading state for asset errors
 */
export interface AssetLoadingStateProps {
  loading?: boolean;
  error?: string | null;
  assetId?: string;
  children?: ReactNode;
  fallback?: ReactNode;
}

/**
 * Asset Loading State Component
 *
 * Shows loading states and handles error states for specific assets
 */
export const AssetLoadingState: React.FC<AssetLoadingStateProps> = ({
  loading = false,
  error = null,
  assetId,
  children,
  fallback
}) => {
  if (error) {
    return (
      <div className="flex items-center justify-center p-4 bg-red-900/20 border border-red-500/30 rounded-lg">
        <AlertTriangle className="w-4 h-4 text-red-500 mr-2" />
        <span className="text-red-300 text-sm">
          Failed to load {assetId ? `${assetId} asset` : 'asset'}: {error}
        </span>
        {fallback && <div className="ml-4">{fallback}</div>}
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-4 bg-gold/20 border border-gold/30 rounded-lg">
        <div className="w-4 h-4 border-2 border-gold border-t-transparent rounded-full animate-spin mr-2" />
        <span className="text-gold text-sm">
          Loading {assetId ? `${assetId} asset` : 'asset'}...
        </span>
      </div>
    );
  }

  return <>{children}</>;
};

/**
 * Asset Loading Progress Indicator
 */
export interface AssetLoadingProgressProps {
  totalAssets: number;
  loadedAssets: number;
  failedAssets: number;
  onCancel?: () => void;
}

export const AssetLoadingProgress: React.FC<AssetLoadingProgressProps> = ({
  totalAssets,
  loadedAssets,
  failedAssets,
  onCancel
}) => {
  const progressPercentage = totalAssets > 0 ? (loadedAssets / totalAssets) * 100 : 0;
  const isComplete = loadedAssets + failedAssets >= totalAssets;
  const hasErrors = failedAssets > 0;

  return (
    <div className="p-4 bg-abyss/80 border border-gold/20 rounded-lg backdrop-blur-sm">
      <div className="mb-3">
        <div className="flex justify-between items-center mb-1">
          <span className="text-bone text-sm font-medium">
            Loading Map Assets
          </span>
          <span className="text-gold text-xs">
            {loadedAssets} / {totalAssets}
          </span>
        </div>
        <div className="w-full bg-abyss/30 rounded-full h-2 mb-1">
          <div
            className="bg-gold h-2 rounded-full transition-all duration-300 ease-out"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
        <div className="text-xs text-mist text-right">
          {progressPercentage.toFixed(0)}%
        </div>
      </div>

      {hasErrors && (
        <div className="text-red-400 text-xs mb-2">
          {failedAssets} asset{failedAssets === 1 ? '' : 's'} failed to load
        </div>
      )}

      {isComplete && (
        <div className="text-center">
          <p className="text-green-400 text-sm mb-2">
            ✓ All assets loaded
          </p>
          {hasErrors && (
            <p className="text-mist text-xs">
              Some assets may be using fallbacks
            </p>
          )}
        </div>
      )}

      {!isComplete && onCancel && (
        <div className="text-center">
          <button
            onClick={onCancel}
            className="px-4 py-2 bg-ember text-bone text-sm rounded hover:bg-orange-600 transition-all"
          >
            Cancel
          </button>
        </div>
      )}
    </div>
  );
};

export default AssetErrorBoundary;