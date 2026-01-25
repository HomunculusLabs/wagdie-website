'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { getSupabase } from '@/lib/supabase'
import { CHARACTERS_TABLE } from '@/lib/db/tables'
import { getLocalImagePath, getCharacterImageFallback } from '@/lib/utils/image'
import { lockBodyScroll, unlockBodyScroll } from '@/lib/utils/bodyScrollLock'

interface SearchResult {
  token_id: number
  name: string | null
  metadata: {
    name?: string
    image?: string
  } | null
}

interface HeaderSearchProps {
  isOpen: boolean
  onClose: () => void
}

/**
 * HeaderSearch Component
 * A modal search overlay for quick character lookup from anywhere in the app.
 * Supports keyboard navigation (Escape to close, Enter to select, arrows to navigate).
 */
export function HeaderSearch({ isOpen, onClose }: HeaderSearchProps) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  // Lock body scroll when open
  useEffect(() => {
    if (isOpen) {
      lockBodyScroll('header-search')
      inputRef.current?.focus()
    } else {
      unlockBodyScroll('header-search')
      setQuery('')
      setResults([])
      setSelectedIndex(0)
    }
    return () => unlockBodyScroll('header-search')
  }, [isOpen])

  // Debounced search
  useEffect(() => {
    if (!query.trim()) {
      setResults([])
      return
    }

    const timer = setTimeout(async () => {
      setIsLoading(true)
      try {
        const supabase = getSupabase()
        if (!supabase) {
          console.warn('Supabase client not initialized')
          setResults([])
          setIsLoading(false)
          return
        }

        const searchTerm = query.trim()
        // Check if search is a number (token ID search)
        const tokenIdSearch = parseInt(searchTerm, 10)
        const isTokenId = !isNaN(tokenIdSearch) && tokenIdSearch > 0

        let queryBuilder = supabase
          .from(CHARACTERS_TABLE)
          .select('token_id, name, metadata')

        if (isTokenId) {
          // Search by token ID - exact match
          queryBuilder = queryBuilder.eq('token_id', tokenIdSearch)
        } else {
          // Search by name in metadata (case-insensitive)
          queryBuilder = queryBuilder.ilike('metadata->>name', `%${searchTerm}%`)
        }

        const { data, error } = await queryBuilder.limit(8)

        if (error) {
          console.error('Supabase search error:', error.message, error.code, error.details)
          setResults([])
          return
        }
        setResults(data || [])
      } catch (err) {
        console.error('Search error:', err instanceof Error ? err.message : err)
        setResults([])
      } finally {
        setIsLoading(false)
      }
    }, 200)

    return () => clearTimeout(timer)
  }, [query])

  const handleSelectCharacter = useCallback((tokenId: number) => {
    onClose()
    router.push(`/characters/${tokenId}`)
  }, [onClose, router])

  // Handle keyboard navigation
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose()
    } else if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIndex(prev => Math.min(prev + 1, results.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIndex(prev => Math.max(prev - 1, 0))
    } else if (e.key === 'Enter' && results.length > 0) {
      e.preventDefault()
      handleSelectCharacter(results[selectedIndex].token_id)
    }
  }, [results, selectedIndex, onClose, handleSelectCharacter])

  const handleGoToCharacters = useCallback(() => {
    onClose()
    router.push(`/characters${query ? `?search=${encodeURIComponent(query)}` : ''}`)
  }, [onClose, router, query])

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-[60] bg-black/80 backdrop-blur-sm"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Quick character search"
    >
      <div
        className="fixed inset-x-4 top-24 md:inset-x-auto md:left-1/2 md:-translate-x-1/2 md:w-full md:max-w-lg bg-soul-950 border border-neutral-800"
        onClick={e => e.stopPropagation()}
      >
        {/* Search Input */}
        <div className="relative border-b border-neutral-800">
          <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
            <svg
              className="w-5 h-5 text-neutral-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value)
              setSelectedIndex(0)
            }}
            onKeyDown={handleKeyDown}
            placeholder="Search characters by name or token ID..."
            className="w-full bg-transparent py-4 pl-12 pr-12 text-base font-eskapade text-bone placeholder-neutral-600 focus:outline-none"
            aria-label="Search characters"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="absolute inset-y-0 right-12 flex items-center px-2 text-neutral-500 hover:text-neutral-300 transition-colors"
              aria-label="Clear search"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
          <button
            onClick={onClose}
            className="absolute inset-y-0 right-0 flex items-center pr-4 text-neutral-500 hover:text-neutral-300 transition-colors"
            aria-label="Close search"
          >
            <kbd className="hidden md:inline-flex px-2 py-1 bg-neutral-800 text-neutral-400 text-xs font-mono rounded">
              ESC
            </kbd>
          </button>
        </div>

        {/* Results */}
        <div className="max-h-80 overflow-y-auto">
          {isLoading && (
            <div className="flex items-center justify-center py-8">
              <div className="w-6 h-6 border-2 border-soul-accent/30 border-t-soul-accent rounded-full animate-spin" />
            </div>
          )}

          {!isLoading && query && results.length === 0 && (
            <div className="py-8 text-center">
              <p className="text-neutral-500 font-eskapade text-sm">
                No characters found for &quot;{query}&quot;
              </p>
            </div>
          )}

          {!isLoading && results.length > 0 && (
            <ul role="listbox" aria-label="Search results">
              {results.map((result, index) => {
                const name = result.metadata?.name || result.name || `Character #${result.token_id}`
                const imageUrl = getLocalImagePath(result.token_id)
                const fallbackImage = getCharacterImageFallback(result.metadata?.image)

                return (
                  <li
                    key={result.token_id}
                    role="option"
                    aria-selected={index === selectedIndex}
                  >
                    <button
                      onClick={() => handleSelectCharacter(result.token_id)}
                      onMouseEnter={() => setSelectedIndex(index)}
                      className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${
                        index === selectedIndex
                          ? 'bg-soul-accent/10 text-soul-accent'
                          : 'text-neutral-300 hover:bg-neutral-800/50'
                      }`}
                    >
                      <div className="relative w-10 h-10 bg-neutral-900 flex-shrink-0">
                        <Image
                          src={imageUrl}
                          alt={name}
                          fill
                          sizes="40px"
                          className="object-cover [image-rendering:pixelated]"
                          unoptimized
                          onError={(e) => {
                            const target = e.target as HTMLImageElement
                            target.src = fallbackImage || '/images/placeholder.png'
                          }}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-eskapade text-sm truncate lowercase">
                          {name.toLowerCase()}
                        </p>
                        <p className="text-xs text-neutral-500">
                          #{result.token_id}
                        </p>
                      </div>
                      {index === selectedIndex && (
                        <kbd className="hidden md:inline-flex px-2 py-1 bg-neutral-800 text-neutral-400 text-xs font-mono rounded">
                          Enter
                        </kbd>
                      )}
                    </button>
                  </li>
                )
              })}
            </ul>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-neutral-800 px-4 py-3 flex items-center justify-between">
          <p className="text-xs text-neutral-500 font-eskapade">
            {results.length > 0
              ? `${results.length} result${results.length !== 1 ? 's' : ''}`
              : 'Type to search'
            }
          </p>
          <button
            onClick={handleGoToCharacters}
            className="text-xs text-soul-accent hover:text-soul-accent/80 font-eskapade transition-colors"
          >
            Browse all characters
          </button>
        </div>
      </div>
    </div>
  )
}

/**
 * SearchButton Component
 * Trigger button for the header search modal
 */
interface SearchButtonProps {
  onClick: () => void
  className?: string
}

export function SearchButton({ onClick, className = '' }: SearchButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center justify-center w-11 h-11 text-neutral-500 hover:text-soul-accent transition-colors ${className}`}
      aria-label="Search characters"
      title="Search characters (Ctrl+K)"
    >
      <svg
        className="w-5 h-5"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>
    </button>
  )
}
