'use client';

interface NoCharactersStateProps {
  onConnectWallet?: () => void;
}

export function NoCharactersState({ onConnectWallet }: NoCharactersStateProps) {
  return (
    <div className="flex items-center justify-center h-screen bg-abyss">
      <div className="text-center max-w-md p-8">
        {/* Icon */}
        <div className="mb-6">
          <div className="inline-block w-24 h-24 bg-midnight rounded-full flex items-center justify-center border-2 border-gold">
            <svg
              className="w-12 h-12 text-mist"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
              />
            </svg>
          </div>
        </div>

        {/* Title (keep ornamental) */}
        <h2 className="font-display text-gold text-3xl font-bold mb-3 tracking-wide">
          No Characters Found
        </h2>

        {/* Description (UI font) */}
        <p className="font-eskapade text-bone text-base mb-2">
          You don&apos;t have any WAGDIE characters yet.
        </p>
        <p className="font-eskapade text-mist text-sm mb-6">
          Acquire characters to see them on the map and participate in the WAGDIE world.
        </p>

        {/* Action Buttons (UI font) */}
        <div className="flex flex-col gap-3">
          <button
            onClick={() => window.open('https://opensea.io/collection/wagdie', '_blank')}
            className="px-6 py-3 bg-gold text-abyss font-bold rounded hover:bg-ember transition-colors font-eskapade tracking-wide"
          >
            Browse Characters on OpenSea
          </button>
          {onConnectWallet && (
            <button
              onClick={onConnectWallet}
              className="px-6 py-3 bg-midnight text-bone border border-gold rounded hover:bg-shadow transition-colors font-eskapade tracking-wide"
            >
              Connect Wallet First
            </button>
          )}
        </div>

        {/* Helper Text (UI font) */}
        <p className="font-eskapade text-ash text-xs mt-4">
          Characters you acquire will automatically appear on the map at their staked locations.
        </p>
      </div>
    </div>
  );
}
