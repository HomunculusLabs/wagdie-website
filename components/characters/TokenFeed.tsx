/**
 * TokenFeed Component
 * Grid of character cards with infinite scroll support
 */

'use client'

import React, { useEffect } from 'react';
import { CharacterCard } from './CharacterCard'
import { InfiniteScroll } from '@/components/shared/InfiniteScroll'
import type { Character } from '@/types/character'
import { useRouter } from 'next/navigation'

interface TokenFeedProps {
  characters: Character[]
  hasMore: boolean
  isLoading: boolean
  onLoadMore: () => void
  className?: string
}

export function TokenFeed({
  characters,
  hasMore,
  isLoading,
  onLoadMore,
  className = ''
}: TokenFeedProps) {
  const router = useRouter()

  useEffect(() => {
    console.log('TokenFeed: Manual fetch check starting...');
    fetch('/api/characters?perPage=5')
      .then(res => {
        console.log('TokenFeed: Manual fetch status:', res.status);
        return res.json();
      })
      .then(data => console.log('TokenFeed: Manual fetch data:', data))
      .catch(err => console.error('TokenFeed: Manual fetch error:', err));
  }, []);

  const handleCharacterClick = (tokenId: number) => {
    router.push(`/characters/${tokenId}`)
  }

  if (characters.length === 0 && !isLoading) {
    return (
      <div className="text-center py-20">
        <p className="text-xl text-ash">No characters found</p>
        <p className="text-sm text-mist mt-2">Try adjusting your filters</p>
      </div>
    )
  }

  return (
    <InfiniteScroll
      hasMore={hasMore}
      isLoading={isLoading}
      onLoadMore={onLoadMore}
      className={className}
    >
      {/* Responsive Grid: 1 col mobile, 2 col tablet, 5 col desktop */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
        {characters.filter(character => character && character.token_id).map((character) => (
          <CharacterCard
            key={character.token_id}
            character={character}
            onClick={handleCharacterClick}
          />
        ))}
      </div>
    </InfiniteScroll>
  )
}
