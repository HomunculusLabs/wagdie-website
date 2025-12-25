/**
 * CoreStatsEditor Stories
 * Groups all 6 core D&D stats with edit capability
 */

import type { Meta, StoryObj } from '@storybook/react'
import { CoreStatsEditor } from './CoreStatsEditor'

const meta: Meta<typeof CoreStatsEditor> = {
  title: 'Characters/Editors/CoreStatsEditor',
  component: CoreStatsEditor,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    backgrounds: { default: 'dark' },
  },
}

export default meta
type Story = StoryObj<typeof CoreStatsEditor>

const defaultStats = {
  str: 16,
  dex: 14,
  con: 15,
  int: 10,
  wis: 12,
  cha: 8,
}

export const DisplayMode: Story = {
  args: {
    stats: defaultStats,
    isOwner: true,
    isEditMode: false,
    onChange: () => {},
  },
}

export const EditMode: Story = {
  args: {
    stats: defaultStats,
    isOwner: true,
    isEditMode: true,
    onChange: () => {},
  },
}

export const HighStats: Story = {
  args: {
    stats: {
      str: 20,
      dex: 18,
      con: 20,
      int: 16,
      wis: 18,
      cha: 16,
    },
    isOwner: true,
    isEditMode: false,
    onChange: () => {},
  },
}

export const LowStats: Story = {
  args: {
    stats: {
      str: 3,
      dex: 6,
      con: 4,
      int: 8,
      wis: 5,
      cha: 7,
    },
    isOwner: true,
    isEditMode: false,
    onChange: () => {},
  },
}

export const NullStats: Story = {
  args: {
    stats: {
      str: null,
      dex: null,
      con: null,
      int: null,
      wis: null,
      cha: null,
    },
    isOwner: true,
    isEditMode: false,
    onChange: () => {},
  },
}

export const PartialStats: Story = {
  args: {
    stats: {
      str: 14,
      dex: null,
      con: 12,
      int: null,
      wis: 10,
      cha: null,
    },
    isOwner: true,
    isEditMode: false,
    onChange: () => {},
  },
}

export const NotOwner: Story = {
  args: {
    stats: defaultStats,
    isOwner: false,
    isEditMode: true,
    onChange: () => {},
  },
}
