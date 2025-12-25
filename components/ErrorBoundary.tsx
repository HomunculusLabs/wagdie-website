'use client'

// ErrorBoundary Component
// Catches and displays React errors gracefully

import * as React from 'react'

interface Props {
  children: React.ReactNode
  fallback?: React.ReactNode
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void
}

interface State {
  hasError: boolean
  error?: Error
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    console.error('ErrorBoundary caught an error:', error, errorInfo)

    if (this.props.onError) {
      this.props.onError(error, errorInfo)
    }
  }

  render(): React.ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <div className="flex min-h-screen items-center justify-center bg-black p-4">
          <div className="w-full max-w-md rounded-lg border border-red-500/20 bg-red-500/5 p-6">
            <div className="mb-4 flex items-center gap-3">
              <div className="text-2xl">⚠️</div>
              <h2 className="text-xl font-bold text-red-500">Something went wrong</h2>
            </div>

            <p className="mb-4 text-sm text-gray-300">
              An error occurred while rendering this component. Please try refreshing the page.
            </p>

            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="mb-4 rounded bg-black/50 p-3">
                <summary className="cursor-pointer text-sm font-medium text-gray-400">
                  Error details
                </summary>
                <pre className="mt-2 overflow-x-auto text-xs text-red-400">
                  {this.state.error.message}
                  {'\n\n'}
                  {this.state.error.stack}
                </pre>
              </details>
            )}

            <button
              onClick={() => window.location.reload()}
              className="w-full rounded-lg bg-red-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-600"
            >
              Reload Page
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

// Simple error fallback component
export function ErrorFallback({ error, reset }: { error: Error; reset?: () => void }) {
  return (
    <div className="rounded-lg border border-red-500/20 bg-red-500/5 p-4">
      <div className="mb-2 flex items-center gap-2">
        <span className="text-lg">⚠️</span>
        <h3 className="font-semibold text-red-500">Error</h3>
      </div>
      <p className="mb-3 text-sm text-gray-300">{error.message || 'An error occurred'}</p>
      {reset && (
        <button
          onClick={reset}
          className="rounded bg-red-500 px-3 py-1 text-sm text-white hover:bg-red-600"
        >
          Try again
        </button>
      )}
    </div>
  )
}
