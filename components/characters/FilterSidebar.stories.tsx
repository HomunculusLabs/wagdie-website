/**
 * FilterSidebar Stories
 * Collapsible sidebar containing all character filter controls
 */

import type { Meta, StoryObj } from '@storybook/react'
import { FilterSidebar } from './FilterSidebar'
import type { OriginCount, AlignmentCount, TraitCount } from '@/types/character'

const mockOrigins: OriginCount[] = [
  { origin: 'Human', count: 1200 },
  { origin: 'Undead', count: 800 },
  { origin: 'Demon', count: 450 },
  { origin: 'Spirit', count: 320 },
]

const mockAlignments: AlignmentCount[] = [
  { alignment: 'Lawful Good', count: 500 },
  { alignment: 'Neutral Good', count: 400 },
  { alignment: 'Chaotic Good', count: 350 },
  { alignment: 'True Neutral', count: 300 },
  { alignment: 'Chaotic Evil', count: 250 },
]

const mockThe17: TraitCount[] = [
  { value: 'Luta the Beacon', count: 1 },
  { value: 'Piyu the Godling', count: 1 },
  { value: 'Child of Her', count: 1 },
]

const mockArmor: TraitCount[] = [
  { value: 'Plate Mail', count: 200 },
  { value: 'Chain Mail', count: 350 },
  { value: 'Leather Armor', count: 500 },
  { value: 'Robes', count: 280 },
]

const mockBack: TraitCount[] = [
  { value: 'Cape', count: 400 },
  { value: 'Wings', count: 150 },
  { value: 'Quiver', count: 200 },
]

const mockMask: TraitCount[] = [
  { value: 'Skull Mask', count: 180 },
  { value: 'Iron Mask', count: 220 },
  { value: 'Hood', count: 300 },
]

const meta: Meta<typeof FilterSidebar> = {
  title: 'Characters/FilterSidebar',
  component: FilterSidebar,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
  },
  decorators: [
    (Story) => (
      <div className="flex min-h-screen bg-soul-950">
        <Story />
        <div className="flex-1 p-8">
          <p className="text-neutral-400">Main content area</p>
        </div>
      </div>
    ),
  ],
}

export default meta
type Story = StoryObj<typeof FilterSidebar>

const defaultArgs = {
  currentTab: 'all' as const,
  currentSort: 'asc' as const,
  onTabChange: () => {},
  onSortChange: () => {},
  searchValue: '',
  onSearchChange: () => {},
  onClearSearch: () => {},
  hasSheetFilter: false,
  onHasSheetChange: () => {},
  hasElizaProfileFilter: false,
  onHasElizaProfileChange: () => {},
  originFilter: null,
  availableOrigins: mockOrigins,
  onOriginChange: () => {},
  originsLoading: false,
  alignmentFilter: null,
  availableAlignments: mockAlignments,
  onAlignmentChange: () => {},
  alignmentsLoading: false,
  the17Filter: null,
  availableThe17: mockThe17,
  onThe17Change: () => {},
  the17Loading: false,
  armorFilter: null,
  availableArmor: mockArmor,
  onArmorChange: () => {},
  armorLoading: false,
  backFilter: null,
  availableBack: mockBack,
  onBackChange: () => {},
  backLoading: false,
  maskFilter: null,
  availableMask: mockMask,
  onMaskChange: () => {},
  maskLoading: false,
  onClearAllFilters: () => {},
  totalCount: 6231,
}

export const Default: Story = {
  args: defaultArgs,
}

export const WithActiveFilters: Story = {
  args: {
    ...defaultArgs,
    currentTab: 'owned',
    searchValue: 'grimwald',
    hasSheetFilter: true,
    hasElizaProfileFilter: true,
    originFilter: 'Undead',
    alignmentFilter: 'Chaotic Evil',
    the17Filter: 'Luta the Beacon',
    armorFilter: 'Plate Mail',
    totalCount: 42,
  },
}

export const Loading: Story = {
  args: {
    ...defaultArgs,
    originsLoading: true,
    alignmentsLoading: true,
    the17Loading: true,
    armorLoading: true,
    backLoading: true,
    maskLoading: true,
  },
}

export const OwnedTab: Story = {
  args: {
    ...defaultArgs,
    currentTab: 'owned',
    totalCount: 12,
  },
}

export const InfectedTab: Story = {
  args: {
    ...defaultArgs,
    currentTab: 'infected',
    totalCount: 1847,
  },
}

export const DescendingSort: Story = {
  args: {
    ...defaultArgs,
    currentSort: 'desc',
  },
}

export const WithSearch: Story = {
  args: {
    ...defaultArgs,
    searchValue: 'token 1234',
  },
}
