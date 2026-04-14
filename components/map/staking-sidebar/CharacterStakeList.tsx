'use client';

import Link from 'next/link';
import { Button } from '@/components/ui';
import type { StakableCharacter } from '@/hooks/map/useMapStakingPanel';
import { getCharacterImage, getCharacterName } from './utils';

interface CharacterStakeListProps {
  allCharacters: StakableCharacter[];
  activeTokenId: number | null;
  isStaking: boolean;
  isUnstaking: boolean;
  isLoadingStatuses: boolean;
  canStakeNow: boolean;
  handleStake: (tokenId: number) => Promise<void>;
  handleUnstake: (tokenId: number) => Promise<void>;
}

export function CharacterStakeList({
  allCharacters,
  activeTokenId,
  isStaking,
  isUnstaking,
  isLoadingStatuses,
  canStakeNow,
  handleStake,
  handleUnstake,
}: CharacterStakeListProps) {
  if (allCharacters.length === 0) {
    return (
      <div className="flex flex-col items-center py-8 text-center">
        <div className="w-14 h-14 rounded-full bg-neutral-900/50 border border-neutral-800/50 flex items-center justify-center mb-4">
          <svg className="w-6 h-6 text-neutral-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
        </div>
        <p className="text-base text-neutral-400 font-eskapade mb-1">No characters found</p>
        <p className="text-sm text-neutral-600 font-eskapade">Your WAGDIE NFTs will appear here</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {allCharacters.map((character) => {
        const image = getCharacterImage(character);
        const name = getCharacterName(character);
        const isRowBusy = activeTokenId === character.token_id;
        const isStaked = character.isStaked;

        return (
          <div
            key={character.token_id}
            className={`
              flex items-center gap-3 px-3 py-2.5 rounded-lg
              transition-all duration-200
              ${isStaked
                ? 'bg-gradient-to-r from-soul-accent/8 to-transparent border border-soul-accent/25 shadow-[inset_0_1px_0_rgba(200,170,110,0.1)]'
                : 'bg-neutral-900/30 border border-neutral-800/60 hover:border-neutral-700 hover:bg-neutral-900/50'
              }
            `}
          >
            <Link
              href={`/characters/${character.token_id}`}
              className="w-11 h-11 rounded-lg bg-neutral-900 overflow-hidden shrink-0 border border-neutral-800 hover:border-soul-accent/50 transition-all group"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={image}
                alt={name}
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                onError={(e) => {
                  const img = e.currentTarget;
                  img.onerror = null;
                  img.src = '/images/placeholder-character.svg';
                }}
              />
            </Link>

            <div className="min-w-0 flex-1">
              <div className="truncate text-base text-neutral-200 font-eskapade">
                {name}
              </div>
              {isStaked && (
                <div className="flex items-center gap-1 mt-0.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-soul-accent animate-pulse" />
                  <span className="text-xs text-soul-accent/70 font-eskapade tracking-wider">STAKED</span>
                </div>
              )}
            </div>

            <div className="shrink-0">
              {isStaked ? (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => handleUnstake(character.token_id)}
                  disabled={isRowBusy || isUnstaking || isLoadingStatuses}
                  isLoading={isRowBusy && isUnstaking}
                >
                  Unstake
                </Button>
              ) : (
                <Button
                  size="sm"
                  onClick={() => handleStake(character.token_id)}
                  disabled={!canStakeNow || isRowBusy || isLoadingStatuses}
                  isLoading={isRowBusy && isStaking}
                >
                  Stake
                </Button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
