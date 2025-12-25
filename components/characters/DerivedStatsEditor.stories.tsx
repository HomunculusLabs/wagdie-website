/**
 * DerivedStatsEditor Stories
 * Editable derived stats: HP, Max HP, AC, Speed
 */

import type { Meta, StoryObj } from '@storybook/react'
import { DerivedStatsEditor } from './DerivedStatsEditor'

const meta: Meta<typeof DerivedStatsEditor> = {
  title: 'Characters/Editors/DerivedStatsEditor',
  component: DerivedStatsEditor,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    backgrounds: { default: 'dark' },
  },
}

export default meta
type Story = StoryObj<typeof DerivedStatsEditor>

const defaultStats = {
  hp: 45,
  max_hp: 52,
  ac: 16,
  speed: 30,
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

export const FullHealth: Story = {
  args: {
    stats: {
      hp: 52,
      max_hp: 52,
      ac: 18,
      speed: 35,
    },
    isOwner: true,
    isEditMode: false,
    onChange: () => {},
  },
}

export const LowHealth: Story = {
  args: {
    stats: {
      hp: 5,
      max_hp: 52,
      ac: 16,
      speed: 30,
    },
    isOwner: true,
    isEditMode: false,
    onChange: () => {},
  },
}

export const OverhealedWarning: Story = {
  args: {
    stats: {
      hp: 60,
      max_hp: 52,
      ac: 16,
      speed: 30,
    },
    isOwner: true,
    isEditMode: true,
    onChange: () => {},
  },
}

export const PartialStats: Story = {
  args: {
    stats: {
      hp: 30,
      max_hp: null,
      ac: 14,
      speed: null,
    },
    isOwner: true,
    isEditMode: false,
    onChange: () => {},
  },
}

export const NullStats: Story = {
  args: {
    stats: {
      hp: null,
      max_hp: null,
      ac: null,
      speed: null,
    },
    isOwner: true,
    isEditMode: false,
    onChange: () => {},
  },
}

export const HighAC: Story = {
  args: {
    stats: {
      hp: 80,
      max_hp: 80,
      ac: 22,
      speed: 40,
    },
    isOwner: true,
    isEditMode: false,
    onChange: () => {},
  },
}
