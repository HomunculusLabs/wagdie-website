'use client'

/**
 * CharacterEquipmentTab Component
 * Displays the character's equipment and inventory.
 * Extracted from page.tsx to reduce complexity.
 */

import { SheetEquipment } from '@/components/characters/SheetEquipment'

interface CharacterEquipmentTabProps {
  equipment: any
  metadataEquipment: any
  isEditMode: boolean
}

export function CharacterEquipmentTab({
  equipment,
  metadataEquipment,
  isEditMode,
}: CharacterEquipmentTabProps) {
  return (
    <SheetEquipment
      equipment={equipment}
      metadataEquipment={metadataEquipment}
      isEditMode={isEditMode}
    />
  )
}
