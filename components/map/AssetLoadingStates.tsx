/**
 * Asset Loading States Component
 *
 * Provides UI components for displaying loading states,
      placeholders, and progress indicators for map assets.
 */

import React from 'react';
import { Loader2, AlertTriangle } from 'lucide-react';

export interface AssetLoadingPlaceholderProps {
  assetId: string;
  type: 'marker' | 'legend' | 'background' | 'ui';
  size?: 'small' | 'medium' | 'large';
  className?: string;
  children?: React.ReactNode;
  responsive?: boolean;
}

/**
 * Placeholder for loading assets with responsive sizing
 */
export const AssetLoadingPlaceholder: React.FC<AssetLoadingPlaceholderProps> = ({
  assetId,
  type,
  size = 'medium',
  className = '',
  responsive = true
}) => {
  // Responsive size classes with touch-friendly targets
  const sizeClasses = responsive ? {
    small: 'w-6 h-6 sm:w-4 sm:h-4 md:w-5 md:h-5',
    medium: 'w-8 h-8 sm:w-6 sm:h-6 md:w-7 md:h-7 lg:w-6 lg:h-6',
    large: 'w-12 h-12 sm:w-8 sm:h-8 md:w-10 md:h-10 lg:w-8 lg:h-8'
  } : {
    small: 'w-4 h-4',
    medium: 'w-6 h-6',
    large: 'w-8 h-8'
  };

  const typeClasses = {
    marker: 'bg-gold/20 border-gold/40',
    legend: 'bg-ember/20 border-ember/40',
    background: 'bg-abyss/20 border-bone/40',
    ui: 'bg-purple/20 border-purple/40'
  };

  return (
    <div
      className={`
        ${sizeClasses[size]}
        ${typeClasses[type]}
        border-2 rounded
        flex items-center justify-center
        animate-pulse
        ${className}
      `}
      title={`Loading ${assetId} (${type})`}
    >
      <Loader2 className="w-3 h-3 text-gold" />
    </div>
  );
};

export interface AssetLoadedStateProps {
  assetId: string;
  type: 'marker' | 'legend' | 'background' | 'ui';
  isFallback?: boolean;
  className?: string;
  children?: React.ReactNode;
}

/**
 * Indicator for loaded assets
 */
export const AssetLoadedState: React.FC<AssetLoadedStateProps> = ({
  assetId,
  type,
  isFallback = false,
  className = '',
  children
}) => {
  const sizeClasses = {
    small: 'w-4 h-4',
    medium: 'w-6 h-6',
    large: 'w-8 h-8'
  };

  const typeClasses = {
    marker: 'bg-green-500/20 border-green-500/40',
    legend: 'bg-blue-500/20 border-blue-500/40',
    background: 'bg-gray-500/20 border-gray-500/40',
    ui: 'bg-purple-500/20 border-purple-500/40'
  };

  const statusClasses = isFallback ? 'opacity-60' : '';

  return (
    <div
      className={`
        ${sizeClasses.medium}
        ${typeClasses[type]}
        ${statusClasses}
        border-2 rounded
        flex items-center justify-center
        ${className}
      `}
      title={`${isFallback ? 'Using fallback' : 'Loaded'} ${assetId} (${type})`}
    >
      {children || (
        <div className="w-2 h-2 bg-green-500 rounded-full" />
      )}
    </div>
  );
};

export interface AssetFailedStateProps {
  assetId: string;
  type: 'marker' | 'legend' | 'background' | 'ui';
  error?: string;
  onRetry?: () => void;
  className?: string;
  children?: React.ReactNode;
}

/**
 * Indicator for failed assets
 */
export const AssetFailedState: React.FC<AssetFailedStateProps> = ({
  assetId,
  type,
  error,
  onRetry,
  className = '',
  children
}) => {
  const sizeClasses = {
    small: 'w-4 h-4',
    medium: 'w-6 h-6',
    large: 'w-8 h-8'
  };

  const typeClasses = {
    marker: 'bg-red-500/20 border-red-500/40',
    legend: 'bg-orange-500/20 border-orange-500/40',
    background: 'bg-gray-500/20 border-gray-500/40',
    ui: 'bg-purple-500/20 border-purple-500/40'
  };

  return (
    <div
      className={`
        ${sizeClasses.medium}
        ${typeClasses[type]}
        border-2 rounded
        flex items-center justify-center
        cursor-pointer
        hover:opacity-80
        transition-opacity
        ${className}
      `}
      title={`Failed to load ${assetId} (${type}) - ${error || 'Unknown error'}`}
      onClick={onRetry}
    >
      <AlertTriangle className="w-3 h-3 text-red-500" />
      {children}
    </div>
  );
};

type AssetStatus = 'loading' | 'loaded' | 'failed' | 'retrying' | 'fallback';

interface AssetLoadingStateInfo {
  status: AssetStatus;
  [key: string]: any;
}

export interface AssetLoadingIndicatorProps {
  loadingStates: Map<string, AssetStatus | AssetLoadingStateInfo>;
  onRetryAsset?: (assetId: string) => void;
  className?: string;
}

/**
 * Helper to extract status from either string or object
 */
const getStatus = (value: AssetStatus | AssetLoadingStateInfo): AssetStatus => {
  if (typeof value === 'string') return value;
  return value.status;
};

/**
 * Comprehensive loading indicator for multiple assets
 */
export const AssetLoadingIndicator: React.FC<AssetLoadingIndicatorProps> = ({
  loadingStates,
  onRetryAsset,
  className = ''
}) => {
  const totalAssets = loadingStates.size;
  const loadedAssets = Array.from(loadingStates.values()).filter(
    value => { const state = getStatus(value); return state === 'loaded' || state === 'fallback'; }
  ).length;
  const failedAssets = Array.from(loadingStates.values()).filter(
    value => getStatus(value) === 'failed'
  ).length;
  const loadingAssets = Array.from(loadingStates.values()).filter(value => getStatus(value) === 'loading').length;

  if (totalAssets === 0) return null;

  return (
    <div className={`p-4 bg-abyss/90 border border-gold/20 rounded-lg backdrop-blur-sm ${className}`}>
      {/* Header */}
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-bone font-wagdie">Map Assets</h3>
        <div className="text-gold text-sm">
          {loadedAssets}/{totalAssets}
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-abyss/30 rounded-full h-2 mb-4">
        <div
          className="bg-gradient-to-r from-gold to-ember h-2 rounded-full transition-all duration-500"
          style={{ width: `${(loadedAssets / totalAssets) * 100}%` }}
        />
      </div>

      {/* Status Summary */}
      <div className="grid grid-cols-3 gap-4 text-center text-sm mb-4">
        <div>
          <div className="text-green-400 font-medium">{loadedAssets}</div>
          <div className="text-mist text-xs">Loaded</div>
        </div>
        <div>
          <div className="text-amber-400 font-medium">{loadingAssets}</div>
          <div className="text-mist text-xs">Loading</div>
        </div>
        <div>
          <div className="text-red-400 font-medium">{failedAssets}</div>
          <div className="text-mist text-xs">Failed</div>
        </div>
      </div>

      {/* Individual Asset States */}
      <div className="space-y-2 max-h-32 overflow-y-auto">
        {Array.from(loadingStates.entries()).map(([assetId, value]) => {
          const state = getStatus(value);
          return (
          <div key={assetId} className="flex items-center justify-between p-2 bg-abyss/30 rounded">
            <div className="flex items-center space-x-2">
              <div className={`w-4 h-4 rounded-full border-2 ${
                state === 'loaded' ? 'bg-green-500 border-green-600' :
                state === 'fallback' ? 'bg-amber-500 border-amber-600' :
                state === 'failed' ? 'bg-red-500 border-red-600' :
                'bg-gold border-gold-600 animate-pulse'
              }`} />
              <span className="text-bone text-sm truncate">
                {assetId}
              </span>
            </div>

            <div className="flex items-center space-x-2">
              {state === 'loading' && (
                <Loader2 className="w-4 h-4 text-gold animate-spin" />
              )}
              {state === 'failed' && onRetryAsset && (
                <button
                  onClick={() => onRetryAsset(assetId)}
                  className="text-red-400 hover:text-red-300 transition-colors"
                  title={`Retry ${assetId}`}
                >
                  <AlertTriangle className="w-4 h-4" />
                </button>
              )}
              {state === 'loaded' && (
                <div className="text-green-400" title={`${assetId} loaded`}>
                  ✓
                </div>
              )}
              {state === 'fallback' && (
                <div className="text-amber-400" title={`${assetId} using fallback`}>
                  ⚠
                </div>
              )}
            </div>
          </div>
        );})}
      </div>

      {/* Actions */}
      {failedAssets > 0 && onRetryAsset && (
        <div className="flex justify-center pt-2 border-t border-gold/20">
          <button
            onClick={() => {
              // Retry all failed assets
              Array.from(loadingStates.entries())
                .filter(([_, value]) => getStatus(value) === 'failed')
                .forEach(([assetId]) => onRetryAsset(assetId));
            }}
            className="px-4 py-2 bg-gold text-abyss font-wagdie font-bold rounded-lg hover:bg-amber-600 transition-colors"
          >
            Retry All Failed
          </button>
        </div>
      )}

      {/* Completion Status */}
      {loadedAssets === totalAssets && failedAssets === 0 && (
        <div className="text-center pt-2 border-t border-gold/20">
          <div className="text-green-400 font-medium mb-1">
            ✓ All assets loaded successfully
          </div>
          <div className="text-mist text-xs">
            Map is fully operational
          </div>
        </div>
      )}
    </div>
  );
};

export interface AssetLoadingSpinnerProps {
  size?: 'small' | 'medium' | 'large';
  text?: string;
  className?: string;
  responsive?: boolean;
}

/**
 * Responsive loading spinner for assets
 */
export const AssetLoadingSpinner: React.FC<AssetLoadingSpinnerProps> = ({
  size = 'medium',
  text = 'Loading map assets...',
  className = '',
  responsive = true
}) => {
  // Responsive size classes with appropriate scaling
  const sizeClasses = responsive ? {
    small: 'w-4 h-4 sm:w-3 sm:h-3 md:w-3.5 md:h-3.5 lg:w-4 lg:h-4',
    medium: 'w-6 h-6 sm:w-5 sm:h-5 md:w-5.5 md:h-5.5 lg:w-6 lg:h-6',
    large: 'w-8 h-8 sm:w-6 sm:h-6 md:w-7 md:h-7 lg:w-8 lg:h-8'
  } : {
    small: 'w-4 h-4',
    medium: 'w-6 h-6',
    large: 'w-8 h-8'
  };

  // Responsive text sizing
  const textClasses = responsive
    ? 'text-xs sm:text-sm md:text-base lg:text-sm text-gold'
    : 'text-gold text-sm';

  return (
    <div className={`flex flex-col items-center justify-center space-y-3 ${className}`}>
      <Loader2 className={`${sizeClasses[size]} text-gold animate-spin`} />
      {text && (
        <span className={`${textClasses} text-center max-w-xs`}>
          {text}
        </span>
      )}
    </div>
  );
};

const AssetLoadingStates = {
  AssetLoadingPlaceholder,
  AssetLoadedState,
  AssetFailedState,
  AssetLoadingIndicator,
  AssetLoadingSpinner
};

export default AssetLoadingStates;