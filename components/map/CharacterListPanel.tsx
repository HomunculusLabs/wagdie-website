'use client';

import { useState, memo } from 'react';
import type { CharacterLocation } from '@/lib/types/map';

interface CharacterListPanelProps {
  characters: CharacterLocation[];
  connectedWallet: string | null;
  onCharacterSelect?: (character: CharacterLocation) => void;
  onClose?: () => void;
}

const CharacterListPanelComponent = function CharacterListPanelComponent({
  characters,
  connectedWallet,
  onCharacterSelect,
  onClose: _onClose,
}: CharacterListPanelProps) {
  const [selectedCharacter, setSelectedCharacter] = useState<number | null>(null);

  if (!connectedWallet) {
    return (
      <div className="bg-shadow border border-gold rounded-lg p-4 max-w-sm">
        <div className="text-center">
          <h3 className="font-wagdie text-gold text-lg font-bold mb-2">
            Your Characters
          </h3>
          <p className="font-wagdie text-mist text-sm mb-3">
            Connect your wallet to view your characters
          </p>
          <div className="w-16 h-16 mx-auto mb-3 bg-midnight rounded-full flex items-center justify-center">
            <svg
              className="w-8 h-8 text-gold"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
              />
            </svg>
          </div>
        </div>
      </div>
    );
  }

  // Filter to only show characters owned by the connected wallet
  const userCharacters = characters.filter(
    (char) => char.wallet_address.toLowerCase() === connectedWallet.toLowerCase()
  );

  if (userCharacters.length === 0) {
    return (
      <div className="bg-shadow border border-gold rounded-lg p-4 max-w-sm">
        <div className="text-center">
          <h3 className="font-wagdie text-gold text-lg font-bold mb-2">
            Your Characters
          </h3>
          <p className="font-wagdie text-mist text-sm mb-3">
            No characters found for this wallet
          </p>
          <div className="w-16 h-16 mx-auto mb-3 bg-midnight rounded-full flex items-center justify-center">
            <svg
              className="w-8 h-8 text-gold"
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
          <p className="font-wagdie text-ash text-xs">
            Browse OpenSea to acquire WAGDIE characters
          </p>
        </div>
      </div>
    );
  }

  const handleCharacterClick = (character: CharacterLocation) => {
    setSelectedCharacter(character.character_token_id);
    if (onCharacterSelect) {
      onCharacterSelect(character);
    }
  };

  const getStatusColor = (status: string) => {
    return status === 'confirmed' ? 'text-poison' :
           status === 'pending' ? 'text-ember' : 'text-mist';
  };

  return (
    <div
      className="bg-shadow border-2 border-gold rounded-lg p-3 sm:p-4 max-w-full sm:max-w-sm shadow-2xl"
      role="region"
      aria-label="Character list panel"
    >
      {/* Header */}
      <div className="flex justify-between items-center mb-3 sm:mb-4">
        <h3 className="font-wagdie text-gold text-base sm:text-lg font-bold tracking-wide">
          Your Characters
        </h3>
        <div className="text-xs font-wagdie text-mist bg-midnight px-2 py-1 rounded" aria-label={`${userCharacters.length} characters`}>
          {userCharacters.length}
        </div>
      </div>

      {/* Character List */}
      <div
        className="space-y-2 max-h-[60vh] sm:max-h-96 overflow-y-auto pr-1 sm:pr-2"
        role="list"
        aria-label="Your characters"
      >
        {userCharacters.map((character) => (
          <button
            key={character.character_token_id}
            onClick={() => handleCharacterClick(character)}
            className={`w-full text-left p-2 sm:p-3 rounded-lg border-2 transition-all min-h-[44px] focus:ring-2 focus:ring-gold focus:ring-offset-2 focus:ring-offset-abyss ${
              selectedCharacter === character.character_token_id
                ? 'border-gold bg-gold/10'
                : 'border-midnight bg-midnight hover:border-gold/50'
            }`}
            role="listitem"
            aria-label={`Character ${character.character_token_id}, status ${character.status}`}
            aria-describedby={`character-${character.character_token_id}-details`}
          >
            {/* Character Header */}
            <div className="flex justify-between items-start mb-1 sm:mb-2">
              <div className="font-wagdie text-bone font-bold text-sm sm:text-base">
                Character #{character.character_token_id}
              </div>
              <div className={`text-xs font-wagdie font-semibold ${getStatusColor(character.status)}`} aria-label={`Status: ${character.status}`}>
                {character.status}
              </div>
            </div>

            {/* Location */}
            <div className="flex items-center gap-2 mb-1 sm:mb-2">
              <svg
                className="w-3 h-3 sm:w-4 sm:h-4 text-mist flex-shrink-0"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
              <span className="font-wagdie text-xs sm:text-sm text-mist truncate">
                {character.location?.name || 'Unknown Location'}
              </span>
            </div>

            {/* Hidden details for screen readers */}
            <div id={`character-${character.character_token_id}-details`} className="sr-only">
              <div>Location: {character.location?.name || 'Unknown'}</div>
              <div>Wallet: {character.wallet_address.slice(0, 6)}...{character.wallet_address.slice(-4)}</div>
              <div>Status: {character.status}</div>
              {selectedCharacter === character.character_token_id && <div>Selected - Center on Map</div>}
            </div>

            {/* Wallet */}
            <div className="flex items-center gap-2">
              <svg
                className="w-3 h-3 sm:w-4 sm:h-4 text-mist flex-shrink-0"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                />
              </svg>
              <span className="font-wagdie text-xs text-ash truncate">
                {character.wallet_address.slice(0, 6)}...
                {character.wallet_address.slice(-4)}
              </span>
            </div>

            {/* Focus Indicator */}
            {selectedCharacter === character.character_token_id && (
              <div className="mt-2 text-center">
                <div className="inline-block px-2 py-1 bg-gold/20 border border-gold rounded text-xs font-wagdie text-gold">
                  Clicked - Center on Map
                </div>
              </div>
            )}
          </button>
        ))}
      </div>

      {/* Footer */}
      <div className="mt-3 sm:mt-4 pt-2 sm:pt-3 border-t border-midnight">
        <p className="font-wagdie text-xs text-ash text-center">
          Tap a character to focus the map on their location
        </p>
      </div>
    </div>
  );
}

// Memoize the component to prevent unnecessary re-renders
export const CharacterListPanel = memo(CharacterListPanelComponent);
