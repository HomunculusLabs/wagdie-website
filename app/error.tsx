/**
 * Error Boundary
 * Catches component errors and provides reset functionality
 */

'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui'

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
    <div className="min-h-screen flex items-center justify-center px-4 bg-soul-950">
      <div className="text-center max-w-md">
        <h2 className="text-h2 font-display text-neutral-200 mb-4">Something went wrong!</h2>
        <p className="text-body text-neutral-500 font-eskapade mb-6">
          An unexpected error occurred. Please try again.
        </p>

        {error.message && (
          <div className="bg-black/40 border border-neutral-800 p-4 mb-6">
            <p className="text-sm text-neutral-400 font-mono break-all">{error.message}</p>
          </div>
        )}

        <div className="flex gap-4 justify-center">
          <Button onClick={reset}>
            Try Again
          </Button>
          <Button
            variant="secondary"
            onClick={() => window.location.href = '/'}
          >
            Go Home
          </Button>
        </div>
      </div>
    </div>
  )
}
