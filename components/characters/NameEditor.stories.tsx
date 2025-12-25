/**
 * NameEditor Stories
 * Inline name editor for character names with validation
 */

import type { Meta, StoryObj } from '@storybook/react'
import { NameEditor } from './NameEditor'

const meta: Meta<typeof NameEditor> = {
  title: 'Characters/Editors/NameEditor',
  component: NameEditor,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    backgrounds: { default: 'dark' },
  },
  argTypes: {
    name: { control: 'text' },
    isOwner: { control: 'boolean' },
    isEditMode: { control: 'boolean' },
  },
}

export default meta
type Story = StoryObj<typeof NameEditor>

export const DisplayMode: Story = {
  args: {
    name: 'Grimwald the Undying',
    isOwner: true,
    isEditMode: false,
    onChange: () => {},
  },
}

export const EditMode: Story = {
  args: {
    name: 'Grimwald the Undying',
    isOwner: true,
    isEditMode: true,
    onChange: () => {},
  },
}

export const EmptyName: Story = {
  args: {
    name: '',
    isOwner: true,
    isEditMode: false,
    onChange: () => {},
  },
}

export const EditModeEmpty: Story = {
  args: {
    name: '',
    isOwner: true,
    isEditMode: true,
    onChange: () => {},
  },
}

export const NotOwner: Story = {
  args: {
    name: 'Grimwald the Undying',
    isOwner: false,
    isEditMode: true,
    onChange: () => {},
  },
}

export const LongName: Story = {
  args: {
    name: 'Sir Bartholomew Cornelius Ravenshadow III, Guardian of the Eternal Flame',
    isOwner: true,
    isEditMode: false,
    onChange: () => {},
  },
}
