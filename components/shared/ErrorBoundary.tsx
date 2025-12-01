'use client';

/**
 * Error Boundary Component
 *
 * Catches and displays errors in the React component tree.
 * Prevents entire application from crashing on component errors.
 * Includes WAGDIE-themed UI with retry functionality.
 */

import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null,
    };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[ErrorBoundary] Map error caught:', error, errorInfo);

    this.setState({
      errorInfo,
    });

    // Call optional error handler
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  private handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  private handleReload = () => {
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Enhanced WAGDIE-themed error UI
      return (
        <div className="flex items-center justify-center h-screen bg-abyss p-4">
          <div className="max-w-lg w-full bg-shadow border-2 border-gold rounded-lg p-6 shadow-2xl">
            {/* Error Icon */}
            <div className="flex justify-center mb-4">
              <div className="w-20 h-20 bg-midnight rounded-full flex items-center justify-center border-2 border-gold">
                <svg
                  className="w-10 h-10 text-gold"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
              </div>
            </div>

            {/* Error Title */}
            <h2 className="font-wagdie text-gold text-2xl font-bold text-center mb-3 tracking-wide">
              Map Loading Error
            </h2>

            {/* Error Description */}
            <p className="font-wagdie text-bone text-base mb-4 text-center">
              Something went wrong while loading the WAGDIE world map.
            </p>

            {/* Error Details (collapsible) */}
            {this.state.error && (
              <details className="mb-4 bg-midnight rounded p-3 border border-gold/30">
                <summary className="font-wagdie text-mist text-sm cursor-pointer hover:text-bone transition-colors">
                  Error Details (click to expand)
                </summary>
                <div className="mt-2 font-mono text-xs text-ash overflow-auto max-h-40">
                  <div className="mb-2">
                    <strong className="text-gold">Error:</strong>{' '}
                    <span className="text-bone">{this.state.error.message}</span>
                  </div>
                  {this.state.error.stack && (
                    <div>
                      <strong className="text-gold">Stack:</strong>
                      <pre className="mt-1 whitespace-pre-wrap text-mist">
                        {this.state.error.stack}
                      </pre>
                    </div>
                  )}
                </div>
              </details>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={this.handleRetry}
                className="flex-1 px-4 py-3 bg-gold text-abyss font-wagdie font-bold rounded-lg hover:bg-ember transition-all tracking-wide border-2 border-gold"
              >
                Try Again
              </button>
              <button
                onClick={this.handleReload}
                className="flex-1 px-4 py-3 bg-midnight text-bone font-wagdie font-bold rounded-lg hover:bg-shadow transition-all tracking-wide border-2 border-midnight"
              >
                Reload Page
              </button>
            </div>

            {/* Help Text */}
            <p className="font-wagdie text-ash text-xs mt-4 text-center">
              If this problem persists, try refreshing the page or contact support.
            </p>

            {/* Debug Info */}
            {process.env.NODE_ENV === 'development' && this.state.errorInfo && (
              <details className="mt-4 bg-abyss rounded p-3 border border-gold/30">
                <summary className="font-wagdie text-mist text-xs cursor-pointer hover:text-bone transition-colors">
                  Component Stack (Development Only)
                </summary>
                <pre className="mt-2 font-mono text-xs text-ash overflow-auto max-h-40 whitespace-pre-wrap">
                  {this.state.errorInfo.componentStack}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Higher-order component for wrapping components with error boundary
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<Props, 'children'>
) {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </ErrorBoundary>
  );

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;

  return WrappedComponent;
}

// Hook for manual error reporting
export function useErrorHandler() {
  return (error: Error, errorInfo?: ErrorInfo) => {
    console.error('[useErrorHandler] Manual error:', error, errorInfo);

    // In production, you might want to send this to an error reporting service
    // e.g., Sentry, LogRocket, etc.
    if (typeof window !== 'undefined' && (window as any).Sentry) {
      (window as any).Sentry.captureException(error, {
        extra: errorInfo,
      });
    }
  };
}
