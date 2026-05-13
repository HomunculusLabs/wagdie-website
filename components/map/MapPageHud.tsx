'use client';

interface MapPageHudProps {
  mapReady: boolean;
  isSidebarOpen: boolean;
  isConnected: boolean;
  walletAddress?: string;
  locationsCount: number;
  stakedCount: number;
  onOpenStaking: () => void;
}

function shortAddress(address?: string): string {
  if (!address) return '';
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}

export function MapPageHud({
  mapReady,
  isSidebarOpen,
  isConnected,
  walletAddress,
  locationsCount,
  stakedCount,
  onOpenStaking,
}: MapPageHudProps) {
  if (!mapReady || isSidebarOpen) return null;

  return (
    <div className="pointer-events-none absolute bottom-4 left-4 z-30 max-w-[min(22rem,calc(100vw-2rem))]">
      <details className="group sm:hidden pointer-events-none rounded-lg border border-neutral-800 bg-black/85 shadow-xl backdrop-blur-sm">
        <summary className="pointer-events-auto cursor-pointer list-none px-3 py-2 font-eskapade text-xs tracking-widest text-soul-accent">
          Map Guide
        </summary>
        <div className="space-y-3 border-t border-neutral-800 px-3 py-3">
          <MapHudContent
            isConnected={isConnected}
            walletAddress={walletAddress}
            locationsCount={locationsCount}
            stakedCount={stakedCount}
            onOpenStaking={onOpenStaking}
          />
        </div>
      </details>

      <div className="hidden sm:block pointer-events-none rounded-xl border border-neutral-800/80 bg-black/80 p-4 shadow-xl backdrop-blur-sm">
        <MapHudContent
          isConnected={isConnected}
          walletAddress={walletAddress}
          locationsCount={locationsCount}
          stakedCount={stakedCount}
          onOpenStaking={onOpenStaking}
        />
      </div>
    </div>
  );
}

function MapHudContent({
  isConnected,
  walletAddress,
  locationsCount,
  stakedCount,
  onOpenStaking,
}: Omit<MapPageHudProps, 'mapReady' | 'isSidebarOpen'>) {
  return (
    <div className="space-y-3">
      <div>
        <p className="font-eskapade text-xs tracking-[0.2em] text-soul-accent">WAGDIE World</p>
        <p className="mt-1 text-sm leading-relaxed text-neutral-400">
          Click a location to inspect who is staked there. Connect a wallet to see your characters on the map.
        </p>
      </div>

      <div className="flex flex-wrap gap-2 text-xs font-eskapade text-neutral-500">
        <span className="rounded border border-neutral-800 bg-neutral-950/70 px-2 py-1">
          {locationsCount} location{locationsCount === 1 ? '' : 's'}
        </span>
        <span className="rounded border border-neutral-800 bg-neutral-950/70 px-2 py-1">
          {stakedCount} staked
        </span>
        {isConnected && walletAddress && (
          <span className="rounded border border-soul-accent/30 bg-soul-accent/10 px-2 py-1 text-soul-accent">
            {shortAddress(walletAddress)}
          </span>
        )}
      </div>

      <button
        type="button"
        onClick={onOpenStaking}
        className="pointer-events-auto w-full rounded border border-soul-accent/40 bg-soul-accent/10 px-3 py-2 text-left font-eskapade text-sm text-soul-accent transition-colors hover:bg-soul-accent/20"
      >
        Select a location before staking →
      </button>
    </div>
  );
}

export default MapPageHud;
