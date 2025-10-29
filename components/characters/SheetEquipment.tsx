/**
 * SheetEquipment Component
 * Display character equipment (weapons, armor, items, gold)
 */

'use client'

import type { Equipment } from '@/types/character'

interface SheetEquipmentProps {
  equipment: Equipment | null
  isEditMode?: boolean
}

export function SheetEquipment({ equipment, isEditMode = false }: SheetEquipmentProps) {
  const weapons = equipment?.weapons || []
  const armor = equipment?.armor || []
  const items = equipment?.items || []
  const gold = equipment?.gold || 0

  return (
    <div className="bg-midnight rounded-lg p-6">
      <h3 className="text-2xl font-bold text-bone mb-4">Equipment</h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Weapons */}
        <div>
          <h4 className="text-lg font-bold text-gold mb-2">Weapons</h4>
          {weapons.length > 0 ? (
            <ul className="list-disc list-inside text-ash">
              {weapons.map((weapon, index) => (
                <li key={index}>{weapon}</li>
              ))}
            </ul>
          ) : (
            <p className="text-mist italic">No weapons</p>
          )}
        </div>

        {/* Armor */}
        <div>
          <h4 className="text-lg font-bold text-gold mb-2">Armor</h4>
          {armor.length > 0 ? (
            <ul className="list-disc list-inside text-ash">
              {armor.map((item, index) => (
                <li key={index}>{item}</li>
              ))}
            </ul>
          ) : (
            <p className="text-mist italic">No armor</p>
          )}
        </div>

        {/* Items */}
        <div>
          <h4 className="text-lg font-bold text-gold mb-2">Items</h4>
          {items.length > 0 ? (
            <ul className="list-disc list-inside text-ash">
              {items.map((item, index) => (
                <li key={index}>{item}</li>
              ))}
            </ul>
          ) : (
            <p className="text-mist italic">No items</p>
          )}
        </div>

        {/* Gold */}
        <div>
          <h4 className="text-lg font-bold text-gold mb-2">Gold</h4>
          <p className="text-2xl font-bold text-bone">{gold} gp</p>
        </div>
      </div>
    </div>
  )
}
