'use client';

import { memo } from 'react';
import type { Location, CharacterLocation } from '@/lib/types/map';

interface MapPopupProps {
  data: Location | CharacterLocation | null;
  type: 'location' | 'character' | 'burn' | 'death' | 'fight';
  onClose?: () => void;
  connectedWallet?: string | null; // Connected wallet address for ownership check
}

const MapPopupComponent = function MapPopup({ data, type, onClose, connectedWallet }: MapPopupProps) {
  if (!data) return null;

  const isLocation = type === 'location';
  const isCharacter = type === 'character';

  let title = '';
  let description = '';
  let details: Array<{ label: string; value: string | number | React.ReactNode }> = [];
  let actions: Array<{ label: string; onClick: () => void; variant: 'primary' | 'secondary' | 'success'; disabled?: boolean }> = [];
  let ownershipBadge: React.ReactNode = null;

  if (isLocation) {
    const location = data as Location;
    title = location.name;
    description = location.description || 'A location in the WAGDIE world';
    details = [
      { label: 'Area', value: location.metadata.area || 'Unknown' },
      { label: 'Type', value: location.metadata.properties?.terrain || 'Unknown' },
      { label: 'Difficulty', value: location.metadata.properties?.difficulty || 'Unknown' },
    ];

    if (location.character_locations && location.character_locations.length > 0) {
      details.push({
        label: 'Characters Staked',
        value: (
          <span className="text-gold font-bold">
            {location.character_locations.length}
          </span>
        ),
      });
    }

    actions = [
      {
        label: 'Stake Character',
        onClick: () => console.log('Stake character to', location.name),
        variant: 'primary',
        disabled: !connectedWallet,
      },
      {
        label: 'View Details',
        onClick: () => console.log('View details for', location.name),
        variant: 'secondary',
      },
    ];
  } else if (isCharacter) {
    const charLocation = data as CharacterLocation;
    title = `Character #${charLocation.character_token_id}`;
    description = 'A WAGDIE character';

    // Check if this character is owned by the connected wallet
    const isOwnedByUser = connectedWallet &&
      connectedWallet.toLowerCase() === charLocation.wallet_address.toLowerCase();

    // Show ownership badge if user owns this character
    if (isOwnedByUser) {
      ownershipBadge = (
        <div className="inline-flex items-center gap-1 bg-gold/20 border border-gold rounded-full px-2 py-1 mb-2">
          <div className="w-2 h-2 bg-gold rounded-full animate-pulse"></div>
          <span className="text-gold text-xs font-wagdie font-bold">YOUR CHARACTER</span>
        </div>
      );
    }

    const statusColor = charLocation.status === 'confirmed' ? 'text-poison' :
                       charLocation.status === 'pending' ? 'text-ember' : 'text-mist';

    details = [
      { label: 'Token ID', value: `#${charLocation.character_token_id}` },
      { label: 'Location', value: charLocation.location?.name || 'Unknown' },
      { label: 'Status', value: <span className={statusColor}>{charLocation.status}</span> },
      { label: 'Wallet', value: `${charLocation.wallet_address.slice(0, 6)}...${charLocation.wallet_address.slice(-4)}` },
    ];

    // Different actions based on ownership
    if (isOwnedByUser) {
      actions = [
        {
          label: 'View Character',
          onClick: () => console.log('View character', charLocation.character_token_id),
          variant: 'success',
        },
        {
          label: 'Unstake',
          onClick: () => console.log('Unstake character', charLocation.character_token_id),
          variant: 'primary',
        },
      ];
    } else {
      actions = [
        {
          label: 'View Character',
          onClick: () => console.log('View character', charLocation.character_token_id),
          variant: 'secondary',
          disabled: !connectedWallet,
        },
        {
          label: 'Stake Here',
          onClick: () => console.log('Stake to this location', charLocation.location?.name),
          variant: 'primary',
          disabled: !connectedWallet,
        },
      ];
    }
  }

  return (
    <div className="bg-abyss border-2 border-gold rounded-lg p-4 shadow-xl max-w-sm">
      {/* Header */}
      <div className="flex justify-between items-start mb-3">
        <h3 className="font-wagdie text-gold text-lg font-bold">{title}</h3>
        {onClose && (
          <button
            onClick={onClose}
            className="text-mist hover:text-bone transition-colors"
            aria-label="Close popup"
          >
            ✕
          </button>
        )}
      </div>

      {/* Ownership Badge */}
      {ownershipBadge}

      {/* Description */}
      {description && (
        <p className="font-wagdie text-bone text-sm mb-3">{description}</p>
      )}

      {/* Details */}
      <div className="bg-shadow rounded p-3 mb-3">
        <h4 className="font-wagdie text-bone text-sm font-semibold mb-2">Details</h4>
        <div className="space-y-1">
          {details.map((detail, index) => (
            <div key={index} className="flex justify-between items-center">
              <span className="font-wagdie text-mist text-xs">{detail.label}:</span>
              <span className="font-wagdie text-bone text-xs font-semibold">{detail.value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        {actions.map((action, index) => (
          <button
            key={index}
            onClick={action.onClick}
            disabled={action.disabled}
            className={`flex-1 py-2 px-3 rounded font-wagdie text-xs transition-all ${
              action.disabled
                ? 'opacity-50 cursor-not-allowed bg-midnight text-mist'
                : action.variant === 'primary'
                  ? 'bg-gold text-abyss hover:bg-ember'
                  : action.variant === 'success'
                    ? 'bg-poison text-bone hover:bg-poison/80'
                    : 'bg-midnight text-bone hover:bg-shadow border border-midnight'
            }`}
          >
            {action.label}
          </button>
        ))}
      </div>

      {/* Wallet Connection Prompt */}
      {isCharacter && !connectedWallet && (
        <div className="mt-2 text-center">
          <p className="text-xs text-ash font-wagdie">Connect wallet to manage characters</p>
        </div>
      )}
    </div>
  );
}

// Memoize the component to prevent unnecessary re-renders
export const MapPopup = memo(MapPopupComponent);
