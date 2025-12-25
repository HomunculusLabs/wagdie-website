/**
 * LevelExperienceEditor Stories
 * Editable Level and Experience values
 */

import type { Meta, StoryObj } from '@storybook/react'
import { LevelExperienceEditor } from './LevelExperienceEditor'

const meta: Meta<typeof LevelExperienceEditor> = {
  title: 'Characters/Editors/LevelExperienceEditor',
  component: LevelExperienceEditor,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    backgrounds: { default: 'dark' },
  },
}

export default meta
type Story = StoryObj<typeof LevelExperienceEditor>

export const DisplayMode: Story = {
  args: {
    stats: { level: 5, experience: 6500 },
    characterClass: 'Warrior',
    isOwner: true,
    isEditMode: false,
    onChange: () => {},
  },
}

export const EditMode: Story = {
  args: {
    stats: { level: 5, experience: 6500 },
    characterClass: 'Warrior',
    isOwner: true,
    isEditMode: true,
    onChange: () => {},
  },
}

export const Level1: Story = {
  args: {
    stats: { level: 1, experience: 0 },
    characterClass: 'Rogue',
    isOwner: true,
    isEditMode: false,
    onChange: () => {},
  },
}

export const HighLevel: Story = {
  args: {
    stats: { level: 20, experience: 355000 },
    characterClass: 'Mage',
    isOwner: true,
    isEditMode: false,
    onChange: () => {},
  },
}

export const NoClass: Story = {
  args: {
    stats: { level: 3, experience: 2700 },
    characterClass: null,
    isOwner: true,
    isEditMode: false,
    onChange: () => {},
  },
}

export const NoExperience: Story = {
  args: {
    stats: { level: 7, experience: null },
    characterClass: 'Cleric',
    isOwner: true,
    isEditMode: false,
    onChange: () => {},
  },
}

export const NullStats: Story = {
  args: {
    stats: { level: null, experience: null },
    characterClass: null,
    isOwner: true,
    isEditMode: false,
    onChange: () => {},
  },
}

export const NotOwner: Story = {
  args: {
    stats: { level: 10, experience: 64000 },
    characterClass: 'Warrior',
    isOwner: false,
    isEditMode: true,
    onChange: () => {},
  },
}
