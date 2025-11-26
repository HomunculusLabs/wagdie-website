/**
 * SheetTitleAndAttributes Component
 * Display character image, name, class, and D&D-style attributes (STR/DEX/CON/INT/WIS/CHA)
 */

'use client'

import React from 'react';
import Image from 'next/image'
import type { Character } from '@/types/character'

interface SheetTitleAndAttributesProps {
  character: Character
  isEditMode?: boolean
}

export function SheetTitleAndAttributes({ character, isEditMode = false }: SheetTitleAndAttributesProps) {
  // Extract data from metadata if available
  const name = character.metadata?.name || character.name || `Character #${character.token_id}`
  const imageUrl = character.metadata?.image?.replace('ipfs://', 'https://ipfs.io/ipfs/') || character.image_url || '/images/placeholder-character.png'
  const level = character.metadata?.level || character.level || 1
  const hp = character.metadata?.hit_points || character.hp
  const maxHp = character.max_hp

  // Extract attributes from metadata (could be array or object format)
  let attrs = { str: 0, dex: 0, con: 0, int: 0, wis: 0, cha: 0 }

  if (character.metadata?.attributes) {
    if (Array.isArray(character.metadata.attributes)) {
      // NFT format - ignore for now, no character sheet data
      attrs = { str: 0, dex: 0, con: 0, int: 0, wis: 0, cha: 0 }
    } else {
      // Character sheet format
      const metaAttrs = character.metadata.attributes
      attrs = {
        str: metaAttrs.strength || character.str || 0,
        dex: metaAttrs.dexterity || character.dex || 0,
        con: metaAttrs.constitution || character.con || 0,
        int: metaAttrs.intelligence || character.int || 0,
        wis: metaAttrs.wisdom || character.wis || 0,
        cha: metaAttrs.charisma || character.cha || 0,
      }
    }
  } else {
    // Use direct fields if no metadata
    attrs = {
      str: character.str || 0,
      dex: character.dex || 0,
      con: character.con || 0,
      int: character.int || 0,
      wis: character.wis || 0,
      cha: character.cha || 0,
    }
  }

  const attributes = [
    { label: 'STR', value: attrs.str },
    { label: 'DEX', value: attrs.dex },
    { label: 'CON', value: attrs.con },
    { label: 'INT', value: attrs.int },
    { label: 'WIS', value: attrs.wis },
    { label: 'CHA', value: attrs.cha },
  ]

  const hasCharacterSheet = attrs.str > 0 || attrs.dex > 0 || attrs.con > 0

  return (
    <div className="bg-midnight rounded-lg p-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Left: Character Image */}
        <div className="relative aspect-square rounded-lg overflow-hidden border-2 border-gold">
          <Image
            src={imageUrl}
            alt={name}
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
              {name}
            </h1>
            <p className="text-xl text-ash mb-4">
              {character.class ? `${character.class} • Level ${level}` : `Level ${level}`}
            </p>

            {/* Combat Stats - only show if character has sheet data */}
            {hasCharacterSheet && hp !== undefined && (
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="text-center">
                  <p className="text-sm text-mist">HP</p>
                  <p className="text-2xl font-bold text-gold">
                    {hp}{maxHp ? `/${maxHp}` : ''}
                  </p>
                </div>
                {character.ac !== undefined && (
                  <div className="text-center">
                    <p className="text-sm text-mist">AC</p>
                    <p className="text-2xl font-bold text-gold">{character.ac}</p>
                  </div>
                )}
                {character.speed !== undefined && (
                  <div className="text-center">
                    <p className="text-sm text-mist">Speed</p>
                    <p className="text-2xl font-bold text-gold">{character.speed} ft</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Attributes - only show if character has sheet data */}
          {hasCharacterSheet && (
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
          )}

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

