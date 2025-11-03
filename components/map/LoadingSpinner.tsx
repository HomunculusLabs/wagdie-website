/**
 * Loading Spinner component
 * Reusable loading indicator for async operations in map feature
 */

import React from 'react'

interface LoadingSpinnerProps {
  /**
   * Size of the spinner (small, medium, large)
   */
  size?: 'small' | 'medium' | 'large'
  /**
   * Custom message to display
   */
  message?: string
  /**
   * Optional className for custom styling
   */
  className?: string
}

const sizeClasses = {
  small: 'w-4 h-4 border-2',
  medium: 'w-8 h-8 border-3',
  large: 'w-12 h-12 border-4',
}

const textSizeClasses = {
  small: 'text-xs',
  medium: 'text-sm',
  large: 'text-base',
}

export function LoadingSpinner({ size = 'medium', message, className = '' }: LoadingSpinnerProps) {
  return (
    <div className={`flex flex-col items-center justify-center gap-2 ${className}`} data-testid="loading-spinner">
      <div
        className={`${sizeClasses[size]} border-gold/30 border-t-gold rounded-full animate-spin`}
        aria-hidden="true"
      />
      {message && (
        <p className={`text-bone/70 ${textSizeClasses[size]}`}>{message}</p>
      )}
    </div>
  )
}

/**
 * Full page loading state
 */
export function PageLoading() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="animate-pulse">
        <div className="h-10 bg-midnight/20 rounded w-1/3 mb-8" />
        <div className="h-96 bg-midnight/20 rounded-lg mb-8" />
        <div className="h-64 bg-midnight/20 rounded-lg" />
      </div>
    </div>
  )
}

/**
 * Inline loading state for buttons
 */
export function ButtonLoadingSpinner({ size = 'small' }: { size?: 'small' | 'medium' }) {
  return (
    <div
      className={`${sizeClasses[size]} border-white/30 border-t-white rounded-full animate-spin`}
      aria-hidden="true"
    />
  )
}
