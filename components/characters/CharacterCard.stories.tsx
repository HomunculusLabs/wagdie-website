import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { CharacterCard } from './CharacterCard';

const meta: Meta<typeof CharacterCard> = {
  component: CharacterCard,
  title: 'Components/Character/CharacterCard',
  tags: ['autodocs'],
  argTypes: {
    character: {
      control: 'object',
      description: 'Character data object',
    },
    onClick: {
      action: 'character clicked',
      description: 'Click handler for the character card',
    },
    className: {
      control: 'text',
      description: 'Additional CSS classes',
    },
  },
};

export default meta;
type Story = StoryObj<typeof CharacterCard>;

const mockCharacter = {
  token_id: 1234,
  name: 'Zombie King',
  class: 'Warrior' as const,
  level: 45,
  owner_address: '0x1234567890123456789012345678901234567890',
  experience: 10000,
  str: 18,
  dex: 16,
  con: 20,
  int: 12,
  wis: 14,
  cha: 10,
  hp: 150,
  max_hp: 150,
  ac: 16,
  speed: 30,
  background_story: null,
  equipment: null,
  location_id: null,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
  image_url: 'data:image/svg+xml,%3Csvg width="400" height="400" xmlns="http://www.w3.org/2000/svg"%3E%3Crect width="400" height="400" fill="%23334155"/%3E%3Ctext x="50%25" y="50%25" font-size="24" text-anchor="middle" dy=".3em" fill="%23a3a3a3"%3ECharacter Image%3C/text%3E%3C/svg%3E',
  infection_status: 'healthy' as const,
  staking_status: 'unstaked' as const,
};

const infectedCharacter = {
  ...mockCharacter,
  token_id: 5678,
  name: 'Infected Wanderer',
  infection_status: 'infected' as const,
};

const curedCharacter = {
  ...mockCharacter,
  token_id: 9012,
  name: 'Survivor',
  infection_status: 'cured' as const,
};

const stakedCharacter = {
  ...mockCharacter,
  token_id: 3456,
  name: 'Staked Guardian',
  staking_status: 'staked' as const,
};

export const Default: Story = {
  args: {
    character: mockCharacter,
  },
  decorators: [
    (Story) => (
      <div style={{ width: '300px' }}>
        <Story />
      </div>
    ),
  ],
};

export const Infected: Story = {
  args: {
    character: infectedCharacter,
  },
  decorators: [
    (Story) => (
      <div style={{ width: '300px' }}>
        <Story />
      </div>
    ),
  ],
};

export const Cured: Story = {
  args: {
    character: curedCharacter,
  },
  decorators: [
    (Story) => (
      <div style={{ width: '300px' }}>
        <Story />
      </div>
    ),
  ],
};

export const Staked: Story = {
  args: {
    character: stakedCharacter,
  },
  decorators: [
    (Story) => (
      <div style={{ width: '300px' }}>
        <Story />
      </div>
    ),
  ],
};

export const WithClickHandler: Story = {
  args: {
    character: mockCharacter,
    onClick: (tokenId) => {
      alert(`Character ${tokenId} clicked!`);
    },
  },
  parameters: {
    docs: {
      description: {
        story: 'Interactive story demonstrating onClick handler. Click the card to trigger the action.',
      },
    },
  },
  decorators: [
    (Story) => (
      <div style={{ width: '300px' }}>
        <Story />
      </div>
    ),
  ],
};

export const WithoutName: Story = {
  args: {
    character: {
      ...mockCharacter,
      name: undefined,
      token_id: 9999,
    },
  },
  decorators: [
    (Story) => (
      <div style={{ width: '300px' }}>
        <Story />
      </div>
    ),
  ],
};

export const AllStatesCombined: Story = {
  args: {
    character: {
      ...infectedCharacter,
      staking_status: 'staked' as const,
    },
  },
  name: 'Infected and Staked',
  decorators: [
    (Story) => (
      <div style={{ width: '300px' }}>
        <Story />
      </div>
    ),
  ],
};
