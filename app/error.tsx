/**
 * Error Boundary
 * Catches component errors and provides reset functionality
 */

'use client'

import { useEffect } from 'react'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Error boundary caught:', error)
  }, [error])

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <h2 className="text-4xl font-bold text-bone mb-4">Something went wrong!</h2>
        <p className="text-ash mb-6">
          An unexpected error occurred. Please try again.
        </p>

        {error.message && (
          <div className="bg-midnight border border-shadow rounded p-4 mb-6">
            <p className="text-sm text-mist font-mono break-all">{error.message}</p>
          </div>
        )}

        <div className="flex gap-4 justify-center">
          <button
            onClick={reset}
            className="px-6 py-3 bg-gold text-abyss font-bold rounded hover:bg-yellow-500 transition-colors"
          >
            Try Again
          </button>
          <a
            href="/"
            className="px-6 py-3 bg-midnight text-ash border border-shadow rounded hover:text-bone transition-colors"
          >
            Go Home
          </a>
        </div>
      </div>
    </div>
  )
}
