'use client'

import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Empty } from '@/components/ui/Empty'
import type { Equipment } from '@/types/character'

// NFT format equipment type
interface NFTEquipment {
  armor?: string
  back?: string
  mask?: string
}

interface SheetEquipmentProps {
  /** Database equipment (game format with arrays) */
  equipment: Equipment | null
  /** NFT metadata equipment (single strings) */
  metadataEquipment?: NFTEquipment | null
  isEditMode?: boolean
}

function EquipmentSection({ title, items }: { title: string, items: string[] }) {
  if (items.length === 0) return null

  return (
    <div className="space-y-2">
      <h4 className="text-xs font-display  tracking-normal text-soul-accent">{title}</h4>
      <ul className="space-y-1">
        {items.map((item, index) => (
          <li key={index} className="text-neutral-400 font-body flex items-center gap-2">
            <span className="w-1 h-1 bg-soul-accent/50 rotate-45" />
            {item}
          </li>
        ))}
      </ul>
    </div>
  )
}

/**
 * T017-T020: SheetEquipment Component
 * Merges equipment from both database (game format) and NFT metadata format.
 * Filters out "None" values and shows appropriate empty state.
 */
export function SheetEquipment({ equipment, metadataEquipment }: SheetEquipmentProps) {
  let weapons: string[] = []
  let armor: string[] = []
  let items: string[] = []
  let gold = 0

  // Handle legacy prop format where equipment could be NFT format
  if (equipment) {
    if ('armor' in equipment && typeof equipment.armor === 'string') {
      // NFT format passed as equipment prop (legacy support)
      if (equipment.armor && equipment.armor !== 'None') {
        armor.push(equipment.armor)
      }
      if ('back' in equipment && typeof (equipment as unknown as NFTEquipment).back === 'string' && (equipment as unknown as NFTEquipment).back !== 'None') {
        items.push((equipment as unknown as NFTEquipment).back!)
      }
      if ('mask' in equipment && typeof (equipment as unknown as NFTEquipment).mask === 'string' && (equipment as unknown as NFTEquipment).mask !== 'None') {
        items.push((equipment as unknown as NFTEquipment).mask!)
      }
    } else {
      // Game format (arrays)
      weapons = (equipment.weapons || []).filter(w => w && w !== 'None')
      armor = (Array.isArray(equipment.armor) ? equipment.armor : []).filter(a => a && a !== 'None')
      items = (equipment.items || []).filter(i => i && i !== 'None')
      gold = equipment.gold || 0
    }
  }

  // T017: Merge in NFT metadata equipment (if provided separately)
  if (metadataEquipment) {
    if (metadataEquipment.armor && metadataEquipment.armor !== 'None' && !armor.includes(metadataEquipment.armor)) {
      armor.push(metadataEquipment.armor)
    }
    if (metadataEquipment.back && metadataEquipment.back !== 'None' && !items.includes(metadataEquipment.back)) {
      items.push(metadataEquipment.back)
    }
    if (metadataEquipment.mask && metadataEquipment.mask !== 'None' && !items.includes(metadataEquipment.mask)) {
      items.push(metadataEquipment.mask)
    }
  }

  const hasEquipment = weapons.length > 0 || armor.length > 0 || items.length > 0 || gold > 0

  return (
    <Card>
      <CardHeader>
        <CardTitle>Equipment</CardTitle>
      </CardHeader>
      <CardContent>
        {!hasEquipment ? (
          <Empty message="No equipment" />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <EquipmentSection title="Weapons" items={weapons} />
            <EquipmentSection title="Armor" items={armor} />
            <EquipmentSection title="Items" items={items} />

            {gold > 0 && (
              <div className="space-y-2">
                <h4 className="text-xs font-display  tracking-normal text-soul-accent">Gold</h4>
                <p className="text-2xl font-display text-neutral-200">{gold} <span className="text-soul-accent text-sm">gp</span></p>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

