/**
 * SheetTitleAndAttributes Component
 * Display character image, name, class, and D&D-style attributes (STR/DEX/CON/INT/WIS/CHA)
 */

'use client'

import Image from 'next/image'
import type { Character } from '@/types/character'

interface SheetTitleAndAttributesProps {
  character: Character
  isEditMode?: boolean
}

export function SheetTitleAndAttributes({ character, isEditMode = false }: SheetTitleAndAttributesProps) {
  const attributes = [
    { label: 'STR', value: character.str },
    { label: 'DEX', value: character.dex },
    { label: 'CON', value: character.con },
    { label: 'INT', value: character.int },
    { label: 'WIS', value: character.wis },
    { label: 'CHA', value: character.cha },
  ]

  return (
    <div className="bg-midnight rounded-lg p-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Left: Character Image */}
        <div className="relative aspect-square rounded-lg overflow-hidden border-2 border-gold">
          <Image
            src={character.image_url || '/images/placeholder-character.png'}
            alt={character.name || `Character #${character.token_id}`}
            fill
            className="object-cover"
            priority
          />
        </div>

        {/* Right: Character Info */}
        <div className="flex flex-col justify-between">
          {/* Name and Class */}
          <div>
            <h1 className="text-4xl font-bold text-bone mb-2">
              {character.name || `Character #${character.token_id}`}
            </h1>
            <p className="text-xl text-ash mb-4">
              {character.class ? `${character.class} • Level ${character.level}` : 'Unknown Class'}
            </p>

            {/* Combat Stats */}
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="text-center">
                <p className="text-sm text-mist">HP</p>
                <p className="text-2xl font-bold text-gold">
                  {character.hp}/{character.max_hp}
                </p>
              </div>
              <div className="text-center">
                <p className="text-sm text-mist">AC</p>
                <p className="text-2xl font-bold text-gold">{character.ac}</p>
              </div>
              <div className="text-center">
                <p className="text-sm text-mist">Speed</p>
                <p className="text-2xl font-bold text-gold">{character.speed} ft</p>
              </div>
            </div>
          </div>

          {/* Attributes */}
          <div>
            <h3 className="text-lg font-bold text-bone mb-3">Attributes</h3>
            <div className="grid grid-cols-6 gap-2">
              {attributes.map((attr) => (
                <div
                  key={attr.label}
                  className="bg-shadow rounded p-3 text-center"
                >
                  <p className="text-xs text-mist mb-1">{attr.label}</p>
                  <p className="text-xl font-bold text-bone">{attr.value}</p>
                  {/* Progress bar */}
                  <div className="mt-2 bg-abyss rounded-full h-1 overflow-hidden">
                    <div
                      className="bg-gold h-full transition-all"
                      style={{ width: `${(attr.value / 20) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Status Badges */}
          <div className="flex gap-2 mt-4">
            {character.infection_status === 'infected' && (
              <span className="px-3 py-1 bg-red-600 text-white text-sm font-bold rounded">
                INFECTED
              </span>
            )}
            {character.infection_status === 'cured' && (
              <span className="px-3 py-1 bg-green-600 text-white text-sm font-bold rounded">
                CURED
              </span>
            )}
            {character.staking_status === 'staked' && (
              <span className="px-3 py-1 bg-blue-600 text-white text-sm font-bold rounded">
                STAKED
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
