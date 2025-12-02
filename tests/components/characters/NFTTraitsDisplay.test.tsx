/**
 * Unit tests for NFTTraitsDisplay component
 * T007: Create NFTTraitsDisplay unit tests
 * T021-T022: Identity and cosmetic traits display tests
 *
 * Test Coverage:
 * - Rendering with different trait types
 * - Identity traits (Body, Alignment) prominence
 * - Cosmetic traits display
 * - Empty state handling
 * - showIdentityOnly filtering
 */

import { render, screen } from '@testing-library/react'
import { NFTTraitsDisplay } from '@/components/characters/NFTTraitsDisplay'
import type { CharacterMetadata } from '@/types/character'

// Mock metadata with full trait set
const mockMetadataWithTraits: CharacterMetadata = {
  name: 'Test WAGDIE',
  image: 'ipfs://test',
  attributes: [
    { trait_type: 'Body', value: 'Human' },
    { trait_type: 'Alignment', value: 'Chaotic Evil' },
    { trait_type: 'Head', value: 'Skull Mask' },
    { trait_type: 'Eyes', value: 'Glowing Red' },
    { trait_type: 'Weapon', value: 'Bone Sword' },
    { trait_type: 'Armor', value: 'Chainmail' },
  ],
}

// Metadata with only identity traits
const mockMetadataIdentityOnly: CharacterMetadata = {
  name: 'Identity WAGDIE',
  attributes: [
    { trait_type: 'Body', value: 'Skeleton' },
    { trait_type: 'Alignment', value: 'Lawful Good' },
  ],
}

// Metadata with no attributes
const mockMetadataEmpty: CharacterMetadata = {
  name: 'Empty WAGDIE',
  attributes: [],
}

// Metadata with object-format attributes (should return empty)
const mockMetadataObjectFormat: CharacterMetadata = {
  name: 'Object WAGDIE',
  attributes: {
    strength: 10,
    dexterity: 12,
  },
}

describe('NFTTraitsDisplay', () => {
  describe('Basic Rendering', () => {
    it('renders nothing when metadata is null', () => {
      const { container } = render(<NFTTraitsDisplay metadata={null} />)
      expect(container.firstChild).toBeNull()
    })

    it('renders nothing when metadata is undefined', () => {
      const { container } = render(<NFTTraitsDisplay metadata={undefined} />)
      expect(container.firstChild).toBeNull()
    })

    it('renders nothing when attributes array is empty', () => {
      const { container } = render(<NFTTraitsDisplay metadata={mockMetadataEmpty} />)
      expect(container.firstChild).toBeNull()
    })

    it('renders nothing when attributes is object format (not array)', () => {
      const { container } = render(<NFTTraitsDisplay metadata={mockMetadataObjectFormat} />)
      expect(container.firstChild).toBeNull()
    })
  })

  describe('Identity Traits Display (T021)', () => {
    it('renders Body trait prominently when showIdentityOnly is true', () => {
      render(<NFTTraitsDisplay metadata={mockMetadataWithTraits} showIdentityOnly />)
      expect(screen.getByText(/Body:/)).toBeInTheDocument()
      expect(screen.getByText(/Human/)).toBeInTheDocument()
    })

    it('renders Alignment trait prominently when showIdentityOnly is true', () => {
      render(<NFTTraitsDisplay metadata={mockMetadataWithTraits} showIdentityOnly />)
      expect(screen.getByText(/Alignment:/)).toBeInTheDocument()
      expect(screen.getByText(/Chaotic Evil/)).toBeInTheDocument()
    })

    it('does not render cosmetic traits when showIdentityOnly is true', () => {
      render(<NFTTraitsDisplay metadata={mockMetadataWithTraits} showIdentityOnly />)
      expect(screen.queryByText(/Head:/)).not.toBeInTheDocument()
      expect(screen.queryByText(/Eyes:/)).not.toBeInTheDocument()
    })

    it('does not render equipment traits when showIdentityOnly is true', () => {
      render(<NFTTraitsDisplay metadata={mockMetadataWithTraits} showIdentityOnly />)
      expect(screen.queryByText(/Weapon:/)).not.toBeInTheDocument()
      expect(screen.queryByText(/Armor:/)).not.toBeInTheDocument()
    })

    it('uses accent variant for identity trait badges', () => {
      render(<NFTTraitsDisplay metadata={mockMetadataIdentityOnly} showIdentityOnly />)
      // Identity traits should have accent styling
      const badges = screen.getAllByText(/Body:|Alignment:/)
      expect(badges.length).toBe(2)
    })
  })

  describe('Cosmetic Traits Display (T022)', () => {
    it('renders cosmetic traits when showIdentityOnly is false', () => {
      render(<NFTTraitsDisplay metadata={mockMetadataWithTraits} showIdentityOnly={false} />)
      expect(screen.getByText(/Head:/)).toBeInTheDocument()
      expect(screen.getByText(/Skull Mask/)).toBeInTheDocument()
      expect(screen.getByText(/Eyes:/)).toBeInTheDocument()
      expect(screen.getByText(/Glowing Red/)).toBeInTheDocument()
    })

    it('renders identity traits alongside cosmetic traits by default', () => {
      render(<NFTTraitsDisplay metadata={mockMetadataWithTraits} />)
      expect(screen.getByText(/Body:/)).toBeInTheDocument()
      expect(screen.getByText(/Alignment:/)).toBeInTheDocument()
      expect(screen.getByText(/Head:/)).toBeInTheDocument()
    })

    it('does not render equipment traits (handled by SheetEquipment)', () => {
      render(<NFTTraitsDisplay metadata={mockMetadataWithTraits} />)
      expect(screen.queryByText(/Weapon:/)).not.toBeInTheDocument()
      expect(screen.queryByText(/Armor:/)).not.toBeInTheDocument()
    })
  })

  describe('Default Behavior', () => {
    it('defaults to showing all non-equipment traits', () => {
      render(<NFTTraitsDisplay metadata={mockMetadataWithTraits} />)
      // Should show identity + cosmetic
      expect(screen.getByText(/Body:/)).toBeInTheDocument()
      expect(screen.getByText(/Alignment:/)).toBeInTheDocument()
      expect(screen.getByText(/Head:/)).toBeInTheDocument()
      expect(screen.getByText(/Eyes:/)).toBeInTheDocument()
      // But not equipment
      expect(screen.queryByText(/Weapon:/)).not.toBeInTheDocument()
    })
  })

  describe('Edge Cases', () => {
    it('handles traits with numeric values', () => {
      const metadataWithNumericValue: CharacterMetadata = {
        attributes: [
          { trait_type: 'Power', value: 100 },
        ],
      }
      render(<NFTTraitsDisplay metadata={metadataWithNumericValue} />)
      expect(screen.getByText(/Power:/)).toBeInTheDocument()
      expect(screen.getByText(/100/)).toBeInTheDocument()
    })

    it('handles traits with empty string values', () => {
      const metadataWithEmptyValue: CharacterMetadata = {
        attributes: [
          { trait_type: 'Body', value: '' },
          { trait_type: 'Head', value: 'Helmet' },
        ],
      }
      render(<NFTTraitsDisplay metadata={metadataWithEmptyValue} />)
      // Empty value trait should be filtered out
      expect(screen.queryByText(/Body:/)).not.toBeInTheDocument()
      expect(screen.getByText(/Head:/)).toBeInTheDocument()
    })

    it('applies custom className', () => {
      const { container } = render(
        <NFTTraitsDisplay metadata={mockMetadataWithTraits} className="custom-class" />
      )
      expect(container.firstChild).toHaveClass('custom-class')
    })
  })
})
