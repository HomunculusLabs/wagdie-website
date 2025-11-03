/**
 * NoCharactersState component
 * T027 [US2] Create empty state component for users with no characters
 *
 * Displays a helpful message and call-to-action for users who don't own any WAGDIE characters
 */

import React from 'react'
import Link from 'next/link'

interface NoCharactersStateProps {
  /**
   * Optional className for custom styling
   */
  className?: string
}

export function NoCharactersState({ className = '' }: NoCharactersStateProps) {
  return (
    <div
      className={`bg-midnight/10 rounded-lg p-8 text-center ${className}`}
      data-testid="no-characters-state"
    >
      <div className="mb-4">
        <svg
          className="w-16 h-16 mx-auto text-bone/30"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
          />
        </svg>
      </div>

      <h3 className="text-xl font-bold text-bone mb-2">
        No Characters Found
      </h3>

      <p className="text-bone/70 mb-6 max-w-md mx-auto">
        You don&apos;t own any WAGDIE characters yet. Acquire characters to see them on the map and track their locations!
      </p>

      <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
        <a
          href="https://opensea.io/collection/wagdie"
          target="_blank"
          rel="noopener noreferrer"
          className="px-6 py-3 bg-gold text-abyss font-bold rounded-lg hover:bg-gold/90 transition-colors"
        >
          Get WAGDIE Characters ↗
        </a>

        <Link
          href="/characters"
          className="px-6 py-3 border border-midnight text-bone rounded-lg hover:bg-midnight/20 transition-colors"
        >
          Learn About Characters
        </Link>
      </div>

      <div className="mt-6 pt-6 border-t border-midnight/30">
        <p className="text-sm text-bone/50">
          Once you acquire characters, connect your wallet to view their locations on the world map.
        </p>
      </div>
    </div>
  )
}
