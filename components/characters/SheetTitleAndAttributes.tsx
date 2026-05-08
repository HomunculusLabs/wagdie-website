'use client'

import React, { useEffect, useMemo, useState } from 'react';
import Image from 'next/image'
import { Card, CardContent } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { ProgressBar } from '@/components/ui/ProgressBar'
import type { Character } from '@/types/character'
import { getCharacterImageDisclosure, getCharacterImageFallback } from '@/lib/utils/image'

interface SheetTitleAndAttributesProps {
  character: Character
  isEditMode?: boolean
}

export function SheetTitleAndAttributes({ character }: SheetTitleAndAttributesProps) {
  const infectionStatus = character.infection_status ?? (character.infected ? 'infected' : 'healthy')
  const imageDisclosure = useMemo(
    () => getCharacterImageDisclosure(character.token_id, character.metadata, character.image_url, {
      infectionStatus,
      isInfected: character.infected,
    }),
    [character.token_id, character.metadata, character.image_url, character.infected, infectionStatus]
  )
  const imageCandidates = imageDisclosure.candidates
  const [imageUrl, setImageUrl] = useState(() => imageDisclosure.primaryUrl)

  const name = character.metadata?.name || character.name || `character #${character.token_id}`

  useEffect(() => {
    setImageUrl(imageDisclosure.primaryUrl)
  }, [imageDisclosure.primaryUrl])

  const handleImageError = () => {
    setImageUrl((current) => {
      const currentIndex = imageCandidates.indexOf(current)
      return imageCandidates[currentIndex + 1] || current || getCharacterImageFallback()
    })
  }
  const level = character.metadata?.level || character.level || 1
  const hp = character.metadata?.hit_points || character.hp
  const maxHp = character.max_hp

  let attrs = { str: 0, dex: 0, con: 0, int: 0, wis: 0, cha: 0 }

  if (character.metadata?.attributes) {
    if (Array.isArray(character.metadata.attributes)) {
      attrs = { str: 0, dex: 0, con: 0, int: 0, wis: 0, cha: 0 }
    } else {
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
    <Card>
      <CardContent className="p-0">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-0">
          {/* Left: Character Image */}
          <div className="relative aspect-square overflow-hidden border-r border-neutral-800">
            <Image
              src={imageUrl}
              alt={name}
              fill
              sizes="(max-width: 768px) 100vw, 50vw"
              className="object-cover grayscale-[30%] contrast-110"
              priority
              unoptimized
              onError={handleImageError}
            />
            <div className="absolute inset-0 bg-black/40" />

            {/* Status Badges */}
            <div className="absolute bottom-4 left-4 flex gap-2">
              {character.infection_status === 'infected' && (
                <Badge variant="default" className="bg-red-900/80 border-red-700 text-red-400">Infected</Badge>
              )}
              {character.infection_status === 'cured' && (
                <Badge variant="default" className="bg-emerald-900/80 border-emerald-700 text-emerald-400">Cured</Badge>
              )}
              {imageDisclosure.hasSearedImage && (
                <span title={imageDisclosure.isSearedImageHiddenByInfection ? 'Seared art generated; infected art remains primary' : undefined}>
                  <Badge variant="accent">Seared</Badge>
                </span>
              )}
              {character.staking_status === 'staked' && (
                <Badge variant="accent">Staked</Badge>
              )}
            </div>
          </div>

          {/* Right: Character Info */}
          <div className="flex flex-col p-6">
            {/* Name and Class */}
            <div className="mb-6">
              <h1 className="text-3xl font-display tracking-wider text-bone mb-2 lowercase">
                {name?.toLowerCase()}
              </h1>
              <p className="text-sm font-display tracking-widest text-soul-accent lowercase">
                {character.class ? `${character.class.toLowerCase()} • level ${level}` : `level ${level}`}
              </p>
            </div>

            {/* Combat Stats */}
            {hasCharacterSheet && hp !== undefined && (
              <div className="grid grid-cols-3 gap-4 mb-6 pb-6 border-b border-neutral-800">
                <div className="text-center">
                  <p className="text-[10px] font-display tracking-widest text-mist mb-1 lowercase">hp</p>
                  <p className="text-2xl font-display text-soul-accent">
                    {hp}<span className="text-neutral-500 text-sm">{maxHp ? `/${maxHp}` : ''}</span>
                  </p>
                </div>
                {character.ac !== undefined && (
                  <div className="text-center">
                    <p className="text-[10px] font-display tracking-widest text-mist mb-1 lowercase">ac</p>
                    <p className="text-2xl font-display text-neutral-200">{character.ac}</p>
                  </div>
                )}
                {character.speed !== undefined && (
                  <div className="text-center">
                    <p className="text-[10px] font-display tracking-widest text-mist mb-1 lowercase">speed</p>
                    <p className="text-2xl font-display text-neutral-200">{character.speed}<span className="text-neutral-500 text-sm"> ft</span></p>
                  </div>
                )}
              </div>
            )}

            {/* Attributes */}
            {hasCharacterSheet && (
              <div className="flex-1">
                <h3 className="text-xs font-display tracking-widest text-mist mb-4 lowercase">attributes</h3>
                <div className="grid grid-cols-3 gap-3">
                  {attributes.map((attr) => (
                    <div
                      key={attr.label}
                      className="bg-black/40 border border-neutral-800 p-3 text-center"
                    >
                      <p className="text-[10px] font-display tracking-widest text-mist mb-1 lowercase">{attr.label.toLowerCase()}</p>
                      <p className="text-xl font-display text-neutral-200">{attr.value}</p>
                      <div className="mt-2">
                        <ProgressBar value={attr.value} max={20} showValue={false} variant="souls" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

