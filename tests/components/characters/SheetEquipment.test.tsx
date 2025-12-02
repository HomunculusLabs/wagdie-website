/**
 * Unit tests for SheetEquipment component
 * T015: Write unit test for SheetEquipment handling of NFT format equipment
 * T016: Write unit test for filtering "None" values from equipment display
 *
 * Test Coverage:
 * - NFT format equipment handling
 * - Game format equipment handling
 * - "None" value filtering
 * - Empty state display
 * - Gold/currency display
 */

import { render, screen } from '@testing-library/react'
import { SheetEquipment } from '@/components/characters/SheetEquipment'
import type { Equipment } from '@/types/character'

// Game format equipment (arrays)
const mockGameEquipment: Equipment = {
  weapons: ['Bone Sword', 'Dagger'],
  armor: ['Chainmail'],
  items: ['Health Potion', 'Torch'],
  gold: 150,
}

// NFT format equipment (single strings)
const mockNFTEquipment = {
  armor: 'Leather Armor',
  back: 'Cloak of Shadows',
  mask: 'Skull Mask',
}

// NFT format with "None" values
const mockNFTEquipmentWithNone = {
  armor: 'None',
  back: 'None',
  mask: 'Bone Mask',
}

// All "None" values
const mockNFTEquipmentAllNone = {
  armor: 'None',
  back: 'None',
  mask: 'None',
}

// Empty equipment
const mockEmptyEquipment: Equipment = {
  weapons: [],
  armor: [],
  items: [],
  gold: 0,
}

describe('SheetEquipment', () => {
  describe('T015: NFT Format Equipment Handling', () => {
    it('renders NFT format armor', () => {
      render(<SheetEquipment equipment={mockNFTEquipment as Equipment} />)
      expect(screen.getByText('Leather Armor')).toBeInTheDocument()
    })

    it('renders NFT format back item in items section', () => {
      render(<SheetEquipment equipment={mockNFTEquipment as Equipment} />)
      expect(screen.getByText('Cloak of Shadows')).toBeInTheDocument()
    })

    it('renders NFT format mask in items section', () => {
      render(<SheetEquipment equipment={mockNFTEquipment as Equipment} />)
      expect(screen.getByText('Skull Mask')).toBeInTheDocument()
    })

    it('renders section headers correctly', () => {
      render(<SheetEquipment equipment={mockNFTEquipment as Equipment} />)
      expect(screen.getByText('Equipment')).toBeInTheDocument()
      expect(screen.getByText('Armor')).toBeInTheDocument()
      expect(screen.getByText('Items')).toBeInTheDocument()
    })
  })

  describe('T016: Filtering "None" Values', () => {
    it('filters out "None" armor value', () => {
      render(<SheetEquipment equipment={mockNFTEquipmentWithNone as Equipment} />)
      expect(screen.queryByText('None')).not.toBeInTheDocument()
    })

    it('keeps valid equipment items when mixed with "None"', () => {
      render(<SheetEquipment equipment={mockNFTEquipmentWithNone as Equipment} />)
      expect(screen.getByText('Bone Mask')).toBeInTheDocument()
    })

    it('shows empty state when all values are "None"', () => {
      render(<SheetEquipment equipment={mockNFTEquipmentAllNone as Equipment} />)
      expect(screen.getByText(/No equipment/i)).toBeInTheDocument()
    })
  })

  describe('Game Format Equipment Handling', () => {
    it('renders game format weapons array', () => {
      render(<SheetEquipment equipment={mockGameEquipment} />)
      expect(screen.getByText('Bone Sword')).toBeInTheDocument()
      expect(screen.getByText('Dagger')).toBeInTheDocument()
    })

    it('renders game format armor array', () => {
      render(<SheetEquipment equipment={mockGameEquipment} />)
      expect(screen.getByText('Chainmail')).toBeInTheDocument()
    })

    it('renders game format items array', () => {
      render(<SheetEquipment equipment={mockGameEquipment} />)
      expect(screen.getByText('Health Potion')).toBeInTheDocument()
      expect(screen.getByText('Torch')).toBeInTheDocument()
    })

    it('renders gold when present', () => {
      render(<SheetEquipment equipment={mockGameEquipment} />)
      expect(screen.getByText('150')).toBeInTheDocument()
      expect(screen.getByText('gp')).toBeInTheDocument()
    })

    it('renders section headers for game format', () => {
      render(<SheetEquipment equipment={mockGameEquipment} />)
      expect(screen.getByText('Weapons')).toBeInTheDocument()
      expect(screen.getByText('Armor')).toBeInTheDocument()
      expect(screen.getByText('Items')).toBeInTheDocument()
      expect(screen.getByText('Gold')).toBeInTheDocument()
    })
  })

  describe('Empty State', () => {
    it('shows empty message when equipment is null', () => {
      render(<SheetEquipment equipment={null} />)
      expect(screen.getByText(/No equipment/i)).toBeInTheDocument()
    })

    it('shows empty message when equipment arrays are empty', () => {
      render(<SheetEquipment equipment={mockEmptyEquipment} />)
      expect(screen.getByText(/No equipment/i)).toBeInTheDocument()
    })

    it('does not render section headers when equipment is empty', () => {
      render(<SheetEquipment equipment={null} />)
      expect(screen.queryByText('Weapons')).not.toBeInTheDocument()
      expect(screen.queryByText('Armor')).not.toBeInTheDocument()
      expect(screen.queryByText('Items')).not.toBeInTheDocument()
      expect(screen.queryByText('Gold')).not.toBeInTheDocument()
    })
  })

  describe('Gold Display', () => {
    it('does not show gold section when gold is 0', () => {
      const equipmentNoGold: Equipment = {
        ...mockGameEquipment,
        gold: 0,
      }
      render(<SheetEquipment equipment={equipmentNoGold} />)
      expect(screen.queryByText('Gold')).not.toBeInTheDocument()
    })

    it('shows gold section when gold is greater than 0', () => {
      render(<SheetEquipment equipment={mockGameEquipment} />)
      expect(screen.getByText('Gold')).toBeInTheDocument()
    })
  })
})
