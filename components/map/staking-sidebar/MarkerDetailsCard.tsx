'use client';

import Link from 'next/link';
import type { MarkerPayload, MapCharacterData, MapEventData } from '@/game/EventBus';
import { Button, Card, CardContent, CardHeader, CardTitle } from '@/components/ui';
import { isNonEmptyString, truncateAddress } from './utils';

interface MarkerDetailsCardProps {
  marker: MarkerPayload;
}

export function MarkerDetailsCard({ marker }: MarkerDetailsCardProps) {
  if (marker.type === 'character') {
    const data = marker.data as MapCharacterData;
    const tokenId = typeof data?.character_token_id === 'number' ? data.character_token_id : null;
    const characterName =
      (isNonEmptyString(data?.character_name) ? data.character_name : null) ??
      (isNonEmptyString(marker.name) ? marker.name : null) ??
      (tokenId !== null ? `Character #${tokenId}` : 'Character');

    const walletAddress = isNonEmptyString(data?.wallet_address) ? data.wallet_address : undefined;
    const locationName = isNonEmptyString(data?.location?.name) ? data.location.name : undefined;

    return (
      <Card className="bg-black/40 border border-neutral-800">
        <CardHeader className="pb-2">
          <CardTitle className="text-xs font-eskapade tracking-widest text-soul-accent">
            Character
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0 space-y-3">
          <div className="text-sm text-neutral-100 font-eskapade tracking-wide">
            {characterName}
          </div>

          <div className="grid grid-cols-1 gap-2">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs text-neutral-500 font-eskapade tracking-widest">OWNER</span>
              <span className="text-xs text-neutral-300 font-eskapade tracking-widest">
                {truncateAddress(walletAddress)}
              </span>
            </div>
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs text-neutral-500 font-eskapade tracking-widest">LOCATION</span>
              <span className="text-xs text-neutral-300 font-eskapade tracking-widest">
                {locationName ?? '—'}
              </span>
            </div>
          </div>

          {tokenId !== null && (
            <div className="pt-2 border-t border-neutral-800">
              <Link href={`/characters/${tokenId}`} className="w-full">
                <Button className="w-full" size="sm">
                  View character page
                </Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  const eventData = marker.data as MapEventData;
  const title =
    (isNonEmptyString(eventData?.title) ? eventData.title : null) ??
    (isNonEmptyString(eventData?.name) ? eventData.name : null) ??
    (isNonEmptyString(marker.name) ? marker.name : null) ??
    'Event';
  const characterTokenId =
    typeof eventData?.character_token_id === 'number' ? eventData.character_token_id : null;

  return (
    <Card className="bg-black/40 border border-neutral-800">
      <CardHeader className="pb-2">
        <CardTitle className="text-xs font-eskapade tracking-widest text-soul-accent">
          {marker.type.toUpperCase()}
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0 space-y-3">
        <div className="text-sm text-neutral-100 font-eskapade tracking-wide">
          {title}
        </div>
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs text-neutral-500 font-eskapade tracking-widest">COORDS</span>
          <span className="text-xs text-neutral-300 font-eskapade tracking-widest">
            {Math.round(marker.x)}, {Math.round(marker.y)}
          </span>
        </div>

        {characterTokenId !== null && (
          <div className="pt-2 border-t border-neutral-800">
            <Link href={`/characters/${characterTokenId}`} className="w-full">
              <Button className="w-full" size="sm">
                View Fallen Warrior
              </Button>
            </Link>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

