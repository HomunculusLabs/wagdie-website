'use client';

interface StakingGuideCardProps {
  isConnected: boolean;
}

export function StakingGuideCard({ isConnected }: StakingGuideCardProps) {
  return (
    <div className="rounded-lg border border-soul-accent/20 bg-soul-accent/5 p-4">
      <div className="flex items-start gap-3">
        <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-soul-accent/30 bg-soul-accent/10">
          <svg className="h-4 w-4 text-soul-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a2 2 0 01-2.828 0l-4.243-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </div>
        <div className="space-y-1">
          <p className="font-eskapade text-base text-neutral-200">Choose a location first</p>
          <p className="text-sm leading-relaxed text-neutral-500 font-eskapade">
            Staking starts on the map. Click any location marker, then choose an unstaked character for that place.
          </p>
          <p className="text-xs leading-relaxed text-neutral-600 font-eskapade">
            {isConnected
              ? 'Your wallet is connected; pick a location to unlock the Stake Here flow.'
              : 'You can browse locations without a wallet. Connect when you are ready to manage staking.'}
          </p>
        </div>
      </div>
    </div>
  );
}

export default StakingGuideCard;
