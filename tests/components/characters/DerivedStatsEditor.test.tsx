/**
 * Unit tests for DerivedStatsEditor component
 * T030: Verify DerivedStatsEditor hides edit controls when isOwner=false
 *
 * Test Coverage:
 * - Read-only mode for non-owners
 * - Edit mode for owners
 * - Stats display
 */

import { render, screen } from '@testing-library/react'
import { DerivedStatsEditor } from '@/components/characters/DerivedStatsEditor'

const mockStats = {
  hp: 25,
  max_hp: 30,
  ac: 15,
  speed: 30,
}

const mockStatsWithNulls = {
  hp: null,
  max_hp: null,
  ac: null,
  speed: null,
}

describe('DerivedStatsEditor', () => {
  const mockOnChange = jest.fn()

  beforeEach(() => {
    mockOnChange.mockClear()
  })

  describe('T030: Read-only mode for non-owners', () => {
    it('renders in display mode when isOwner is false', () => {
      render(
        <DerivedStatsEditor
          stats={mockStats}
          isOwner={false}
          isEditMode={false}
          onChange={mockOnChange}
        />
      )

      // Should not show "edit mode" indicator
      expect(screen.queryByText(/edit mode/i)).not.toBeInTheDocument()
    })

    it('renders in display mode when isOwner is false even if isEditMode is true', () => {
      render(
        <DerivedStatsEditor
          stats={mockStats}
          isOwner={false}
          isEditMode={true}
          onChange={mockOnChange}
        />
      )

      // Non-owners should not see edit mode
      expect(screen.queryByText(/edit mode/i)).not.toBeInTheDocument()
    })

    it('displays stats values for non-owners', () => {
      render(
        <DerivedStatsEditor
          stats={mockStats}
          isOwner={false}
          isEditMode={false}
          onChange={mockOnChange}
        />
      )

      expect(screen.getByText('25')).toBeInTheDocument() // HP
      expect(screen.getByText('/30')).toBeInTheDocument() // Max HP
      expect(screen.getByText('15')).toBeInTheDocument() // AC
      expect(screen.getByText('30')).toBeInTheDocument() // Speed
    })

    it('does not render input fields for non-owners', () => {
      const { container } = render(
        <DerivedStatsEditor
          stats={mockStats}
          isOwner={false}
          isEditMode={true}
          onChange={mockOnChange}
        />
      )

      // Should not have input elements for editing
      const inputs = container.querySelectorAll('input[type="number"]')
      expect(inputs).toHaveLength(0)
    })
  })

  describe('Edit mode for owners', () => {
    it('shows edit mode indicator when isOwner and isEditMode are true', () => {
      render(
        <DerivedStatsEditor
          stats={mockStats}
          isOwner={true}
          isEditMode={true}
          onChange={mockOnChange}
        />
      )

      expect(screen.getByText(/edit mode/i)).toBeInTheDocument()
    })

    it('shows Quick Stats header in edit mode', () => {
      render(
        <DerivedStatsEditor
          stats={mockStats}
          isOwner={true}
          isEditMode={true}
          onChange={mockOnChange}
        />
      )

      expect(screen.getByText(/Quick Stats/i)).toBeInTheDocument()
    })
  })

  describe('Stats Display', () => {
    it('shows HP label', () => {
      render(
        <DerivedStatsEditor
          stats={mockStats}
          isOwner={false}
          isEditMode={false}
          onChange={mockOnChange}
        />
      )

      expect(screen.getByText('HP')).toBeInTheDocument()
    })

    it('shows AC label', () => {
      render(
        <DerivedStatsEditor
          stats={mockStats}
          isOwner={false}
          isEditMode={false}
          onChange={mockOnChange}
        />
      )

      expect(screen.getByText('AC')).toBeInTheDocument()
    })

    it('shows Speed label with ft suffix', () => {
      render(
        <DerivedStatsEditor
          stats={mockStats}
          isOwner={false}
          isEditMode={false}
          onChange={mockOnChange}
        />
      )

      expect(screen.getByText('Speed')).toBeInTheDocument()
      expect(screen.getByText('ft')).toBeInTheDocument()
    })

    it('hides stats section when all values are null', () => {
      const { container } = render(
        <DerivedStatsEditor
          stats={mockStatsWithNulls}
          isOwner={false}
          isEditMode={false}
          onChange={mockOnChange}
        />
      )

      // Should render an empty container when all stats are null
      expect(container.querySelector('.grid')).toBeInTheDocument()
      expect(screen.queryByText('HP')).not.toBeInTheDocument()
    })
  })
})
