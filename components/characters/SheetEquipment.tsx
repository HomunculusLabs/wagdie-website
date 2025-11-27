'use client'

import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components-new/Card'
import { Empty } from '@/components-new/Empty'
import type { Equipment } from '@/types/character'

interface SheetEquipmentProps {
  equipment: Equipment | null
  isEditMode?: boolean
}

function EquipmentSection({ title, items }: { title: string, items: string[] }) {
  if (items.length === 0) return null

  return (
    <div className="space-y-2">
      <h4 className="text-xs font-display uppercase tracking-widest text-soul-accent">{title}</h4>
      <ul className="space-y-1">
        {items.map((item, index) => (
          <li key={index} className="text-neutral-400 font-serif flex items-center gap-2">
            <span className="w-1 h-1 bg-soul-accent/50 rotate-45" />
            {item}
          </li>
        ))}
      </ul>
    </div>
  )
}

export function SheetEquipment({ equipment }: SheetEquipmentProps) {
  let weapons: string[] = []
  let armor: string[] = []
  let items: string[] = []
  let gold = 0

  if (equipment) {
    if ('armor' in equipment && typeof equipment.armor === 'string') {
      if (equipment.armor && equipment.armor !== 'None') {
        armor.push(equipment.armor)
      }
      if ('back' in equipment && typeof (equipment as any).back === 'string' && (equipment as any).back !== 'None') {
        items.push((equipment as any).back)
      }
      if ('mask' in equipment && typeof (equipment as any).mask === 'string' && (equipment as any).mask !== 'None') {
        items.push((equipment as any).mask)
      }
    } else {
      weapons = equipment.weapons || []
      armor = Array.isArray(equipment.armor) ? equipment.armor : []
      items = equipment.items || []
      gold = equipment.gold || 0
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
                <h4 className="text-xs font-display uppercase tracking-widest text-soul-accent">Gold</h4>
                <p className="text-2xl font-display text-neutral-200">{gold} <span className="text-soul-accent text-sm">gp</span></p>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

