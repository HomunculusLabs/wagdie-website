/**
 * MapEmbed component
 * T013 [P] [US1] Create MapEmbed component
 *
 * Renders an iframe containing the WAGDIE world map
 * Simple iframe embedding approach - no special parameters or PostMessage
 */

import React, { useState, useCallback } from 'react'

interface MapEmbedProps {
  /**
   * Optional className for custom styling
   */
  className?: string
  /**
   * Optional height value (default: 600px)
   */
  height?: string | number
}

const MapEmbedComponent = ({ className = '', height = 600 }: MapEmbedProps) => {
  const heightValue = typeof height === 'number' ? `${height}px` : height
  const [hasError, setHasError] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  const handleIframeError = useCallback(() => {
    setHasError(true)
    setIsLoading(false)
  }, [])

  const handleIframeLoad = useCallback(() => {
    setIsLoading(false)
  }, [])

  const retry = useCallback(() => {
    setHasError(false)
    setIsLoading(true)
    // Force iframe reload by toggling the key
  }, [])

  // Add timeout to show error state if iframe doesn't load within 10 seconds
  React.useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (isLoading) {
        setHasError(true)
        setIsLoading(false)
      }
    }, 10000) // 10 seconds timeout

    return () => clearTimeout(timeoutId)
  }, [isLoading])

  if (hasError) {
    return (
      <div
        className={`w-full border-2 border-red-500/30 bg-red-500/5 rounded-lg p-8 flex flex-col items-center justify-center ${className}`}
        style={{ height: heightValue }}
        data-testid="map-error"
      >
        <svg
          className="w-16 h-16 text-red-400/50 mb-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
          />
        </svg>
        <h3 className="text-lg font-bold text-bone mb-2">Map Service Unavailable</h3>
        <p className="text-sm text-bone/70 text-center mb-4 max-w-md">
          The interactive map service at wagdie.world is currently offline or unavailable.
        </p>
        <p className="text-sm text-bone/70 text-center mb-4 max-w-md">
          <a
            href="https://wagdie.world"
            target="_blank"
            rel="noopener noreferrer"
            className="text-gold hover:underline"
          >
            Try opening wagdie.world in a new tab
          </a>
        </p>
        <button
          onClick={retry}
          className="px-4 py-2 bg-midnight text-bone rounded-lg hover:bg-midnight/80 transition-colors"
        >
          Retry
        </button>
      </div>
    )
  }

  return (
    <div
      className={`w-full border-2 border-midnight rounded-lg overflow-hidden relative ${className}`}
      style={{ height: heightValue }}
      data-testid="map-embed"
    >
      {isLoading && (
        <div className="absolute inset-0 bg-abyss flex items-center justify-center z-10" data-testid="map-loading">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-gold/30 border-t-gold rounded-full animate-spin mx-auto mb-4" />
            <p className="text-bone/70">Loading interactive map...</p>
          </div>
        </div>
      )}
      <iframe
        src="https://wagdie.world"
        width="100%"
        height="100%"
        className="w-full h-full"
        title="WAGDIE World Map"
        loading="lazy"
        frameBorder="0"
        onError={handleIframeError}
        onLoad={handleIframeLoad}
        aria-label="Interactive WAGDIE world map"
      />
    </div>
  )
}

// Memoize the component to prevent unnecessary re-renders
export const MapEmbed = React.memo(MapEmbedComponent)
