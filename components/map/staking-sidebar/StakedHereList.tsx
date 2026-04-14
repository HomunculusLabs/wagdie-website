'use client';

import Link from 'next/link';
import type { CharacterWithLocation } from '@/lib/repositories/character-repository';
import { Button } from '@/components/ui';
import { getCharacterImage, getCharacterName } from './utils';

interface StakedHereListProps {
  stakedHere: CharacterWithLocation[];
  effectiveWallet?: string;
  activeTokenId: number | null;
  isUnstaking: boolean;
  isLoadingStatuses: boolean;
  handleUnstake: (tokenId: number) => Promise<void>;
}

export function StakedHereList({
  stakedHere,
  effectiveWallet,
  activeTokenId,
  isUnstaking,
  isLoadingStatuses,
  handleUnstake,
}: StakedHereListProps) {
  if (stakedHere.length === 0) {
    return (
      <div className="flex flex-col items-center py-8 text-center">
        <div className="w-14 h-14 rounded-full bg-neutral-900/50 border border-neutral-800/50 flex items-center justify-center mb-4">
          <svg className="w-6 h-6 text-neutral-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </div>
        <p className="text-base text-neutral-500 font-eskapade">No characters staked</p>
        <p className="text-sm text-neutral-600 font-eskapade mt-1">Be the first to claim this location</p>
      </div>
    );
  }

  return (
    <div className="space-y-2 max-h-[calc(100vh-280px)] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-neutral-700 scrollbar-track-transparent">
      {stakedHere.map((row) => {
        const image = getCharacterImage(row);
        const name = getCharacterName(row);
        const effectiveOwner = row.staker_address ?? row.owner_address;
        const isOwned = effectiveWallet && effectiveOwner?.toLowerCase() === effectiveWallet.toLowerCase();
        const isRowBusy = activeTokenId === row.token_id;

        return (
          <div
            key={row.token_id}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 ${
              isOwned
                ? 'bg-gradient-to-r from-soul-accent/8 to-transparent border border-soul-accent/25'
                : 'bg-neutral-900/30 border border-neutral-800/60 hover:border-neutral-700 hover:bg-neutral-900/50'
            }`}
          >
            <Link
              href={`/characters/${row.token_id}`}
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
              {isOwned && (
                <div className="flex items-center gap-1 mt-0.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-soul-accent animate-pulse" />
                  <span className="text-xs text-soul-accent/70 font-eskapade tracking-wider">YOURS</span>
                </div>
              )}
            </div>

            <div className="shrink-0 flex gap-2">
              {isOwned ? (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => handleUnstake(row.token_id)}
                  disabled={isRowBusy || isUnstaking || isLoadingStatuses}
                  isLoading={isRowBusy && isUnstaking}
                >
                  Unstake
                </Button>
              ) : (
                <Link href={`/characters/${row.token_id}`}>
                  <Button variant="secondary" size="sm">
                    View
                  </Button>
                </Link>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

