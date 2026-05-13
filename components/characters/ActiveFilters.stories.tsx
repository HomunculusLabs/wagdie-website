/**
 * ActiveFilters Stories
 * Displays currently active filters with removal options
 */

import type { Meta, StoryObj } from '@storybook/react'
import { ActiveFilters } from './ActiveFilters'

const meta: Meta<typeof ActiveFilters> = {
  title: 'Characters/ActiveFilters',
  component: ActiveFilters,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    backgrounds: { default: 'dark' },
  },
}

export default meta
type Story = StoryObj<typeof ActiveFilters>

const defaultHandlers = {
  onRemoveFilter: () => {},
  onClearAll: () => {},
}

export const SingleFilter: Story = {
  args: {
    filters: {
      hasSheet: true,
      hasElizaProfile: false,
      origin: null,
      alignment: null,
      armor: null,
      back: null,
      mask: null,
      search: null,
      tab: 'all',
    },
    ...defaultHandlers,
  },
}

export const MultipleFilters: Story = {
  args: {
    filters: {
      hasSheet: true,
      hasElizaProfile: true,
      origin: 'Undead',
      alignment: 'Chaotic Evil',
      armor: null,
      back: null,
      mask: null,
      search: null,
      tab: 'owned',
    },
    ...defaultHandlers,
  },
}

export const AllFiltersActive: Story = {
  args: {
    filters: {
      hasSheet: true,
      hasElizaProfile: true,
      origin: 'Demon',
      alignment: 'Lawful Good',
      armor: 'Plate Mail',
      back: 'Cape',
      mask: 'Skull Mask',
      search: 'grimwald',
      tab: 'infected',
    },
    ...defaultHandlers,
  },
}

export const SearchOnly: Story = {
  args: {
    filters: {
      hasSheet: false,
      hasElizaProfile: false,
      origin: null,
      alignment: null,
      armor: null,
      back: null,
      mask: null,
      search: 'token 1234',
      tab: 'all',
    },
    ...defaultHandlers,
  },
}

export const EquipmentFilters: Story = {
  args: {
    filters: {
      hasSheet: false,
      hasElizaProfile: false,
      origin: null,
      alignment: null,
      armor: 'Chain Mail',
      back: 'Wings',
      mask: 'Iron Mask',
      search: null,
      tab: 'all',
    },
    ...defaultHandlers,
  },
}

export const NoFilters: Story = {
  args: {
    filters: {
      hasSheet: false,
      hasElizaProfile: false,
      origin: null,
      alignment: null,
      armor: null,
      back: null,
      mask: null,
      search: null,
      tab: 'all',
    },
    ...defaultHandlers,
  },
}
