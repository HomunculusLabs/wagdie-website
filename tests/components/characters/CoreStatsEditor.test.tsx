/**
 * Unit tests for CoreStatsEditor component
 * T008: Write unit test for CoreStatsEditor display-when-data-exists logic
 * T027: Write unit test for read-only mode rendering when isOwner is false
 *
 * Test Coverage:
 * - Stats display when data exists
 * - Read-only mode for non-owners
 * - Edit mode for owners
 */

import { render, screen } from '@testing-library/react'
import { CoreStatsEditor } from '@/components/characters/CoreStatsEditor'

// Mock stats with all values
const mockStatsWithValues = {
  str: 16,
  dex: 14,
  con: 12,
  int: 10,
  wis: 8,
  cha: 6,
}

// Mock stats with null values
const mockStatsWithNulls = {
  str: null,
  dex: null,
  con: null,
  int: null,
  wis: null,
  cha: null,
}

// Mock stats with some values
const mockStatsPartial = {
  str: 10,
  dex: null,
  con: 12,
  int: null,
  wis: null,
  cha: null,
}

describe('CoreStatsEditor', () => {
  const mockOnChange = jest.fn()

  beforeEach(() => {
    mockOnChange.mockClear()
  })

  describe('T008: Display when data exists', () => {
    it('displays all stat values when provided', () => {
      render(
        <CoreStatsEditor
          stats={mockStatsWithValues}
          isOwner={false}
          isEditMode={false}
          onChange={mockOnChange}
        />
      )

      // Check all stat labels are present
      expect(screen.getByText('STR')).toBeInTheDocument()
      expect(screen.getByText('DEX')).toBeInTheDocument()
      expect(screen.getByText('CON')).toBeInTheDocument()
      expect(screen.getByText('INT')).toBeInTheDocument()
      expect(screen.getByText('WIS')).toBeInTheDocument()
      expect(screen.getByText('CHA')).toBeInTheDocument()

      // Check values are displayed
      expect(screen.getByText('16')).toBeInTheDocument() // STR
      expect(screen.getByText('14')).toBeInTheDocument() // DEX
      expect(screen.getByText('12')).toBeInTheDocument() // CON
      expect(screen.getByText('10')).toBeInTheDocument() // INT
      expect(screen.getByText('8')).toBeInTheDocument()  // WIS
      expect(screen.getByText('6')).toBeInTheDocument()  // CHA
    })

    it('displays 0 for null stat values in display mode', () => {
      render(
        <CoreStatsEditor
          stats={mockStatsWithNulls}
          isOwner={false}
          isEditMode={false}
          onChange={mockOnChange}
        />
      )

      // Null values should display as 0
      const zeroValues = screen.getAllByText('0')
      expect(zeroValues).toHaveLength(6)
    })

    it('displays Attributes header', () => {
      render(
        <CoreStatsEditor
          stats={mockStatsWithValues}
          isOwner={false}
          isEditMode={false}
          onChange={mockOnChange}
        />
      )

      expect(screen.getByText('Attributes')).toBeInTheDocument()
    })

    it('displays stat grid in display mode', () => {
      const { container } = render(
        <CoreStatsEditor
          stats={mockStatsWithValues}
          isOwner={false}
          isEditMode={false}
          onChange={mockOnChange}
        />
      )

      // Should render a grid with stat entries
      const grid = container.querySelector('.grid')
      expect(grid).toBeInTheDocument()
      // Each stat has its own box
      expect(grid?.children.length).toBe(6)
    })
  })

  describe('T027: Read-only mode for non-owners', () => {
    it('renders in display mode when isOwner is false', () => {
      render(
        <CoreStatsEditor
          stats={mockStatsWithValues}
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
        <CoreStatsEditor
          stats={mockStatsWithValues}
          isOwner={false}
          isEditMode={true}
          onChange={mockOnChange}
        />
      )

      // Non-owners should not see edit mode regardless of isEditMode
      expect(screen.queryByText(/edit mode/i)).not.toBeInTheDocument()
    })

    it('does not render input fields for non-owners', () => {
      const { container } = render(
        <CoreStatsEditor
          stats={mockStatsWithValues}
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
        <CoreStatsEditor
          stats={mockStatsWithValues}
          isOwner={true}
          isEditMode={true}
          onChange={mockOnChange}
        />
      )

      expect(screen.getByText(/edit mode/i)).toBeInTheDocument()
    })

    it('shows valid range hint in edit mode', () => {
      render(
        <CoreStatsEditor
          stats={mockStatsWithValues}
          isOwner={true}
          isEditMode={true}
          onChange={mockOnChange}
        />
      )

      expect(screen.getByText(/Valid range:/i)).toBeInTheDocument()
    })
  })

  describe('Custom className', () => {
    it('applies custom className', () => {
      const { container } = render(
        <CoreStatsEditor
          stats={mockStatsWithValues}
          isOwner={false}
          isEditMode={false}
          onChange={mockOnChange}
          className="custom-class"
        />
      )

      expect(container.firstChild).toHaveClass('custom-class')
    })
  })
})
