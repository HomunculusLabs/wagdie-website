import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { HomeCard } from './HomeCard';

const meta: Meta<typeof HomeCard> = {
  component: HomeCard,
  title: 'Components/Home/HomeCard',
  tags: ['autodocs'],
  argTypes: {
    title: {
      control: 'text',
      description: 'Card title',
    },
    description: {
      control: 'text',
      description: 'Card description text',
    },
    imageSrc: {
      control: 'text',
      description: 'Image source URL',
    },
    href: {
      control: 'text',
      description: 'Link destination',
    },
    isExternal: {
      control: 'boolean',
      description: 'Whether the link opens in a new tab',
    },
    className: {
      control: 'text',
      description: 'Additional CSS classes',
    },
  },
};

export default meta;
type Story = StoryObj<typeof HomeCard>;

const mockImage = 'data:image/svg+xml,%3Csvg width="600" height="400" xmlns="http://www.w3.org/2000/svg"%3E%3Crect width="600" height="400" fill="%23334155"/%3E%3Ctext x="50%25" y="50%25" font-size="32" text-anchor="middle" dy=".3em" fill="%23a3a3a3"%3EImage Placeholder%3C/text%3E%3C/svg%3E';

export const Default: Story = {
  args: {
    title: 'Explore the World Map',
    description: 'Discover characters and locations in the WAGDIE universe',
    imageSrc: mockImage,
    href: '/map',
  },
};

export const ExternalLink: Story = {
  args: {
    title: 'Visit OpenSea',
    description: 'View and trade WAGDIE NFTs on the marketplace',
    imageSrc: mockImage,
    href: 'https://opensea.io/collection/we-are-all-going-to-die',
    isExternal: true,
  },
};

export const CustomStyling: Story = {
  args: {
    title: 'Character Gallery',
    description: 'Browse your character collection',
    imageSrc: mockImage,
    href: '/characters',
    className: 'max-w-md',
  },
  name: 'With Custom Styling',
};

export const GothicDarkTales: Story = {
  name: 'Gothic - Dark Tales',
  args: {
    title: 'Dark Tales',
    description: 'Bequathed by the abyss, these stories haunt the realm',
    imageSrc: mockImage,
    href: '/lore',
  },
  parameters: {
    docs: {
      description: {
        story: 'Gothic fantasy themed card for dark storytelling content',
      },
    },
  },
};

export const GothicCharacterSheets: Story = {
  name: 'Gothic - Character Sheets',
  args: {
    title: 'Character Sheets',
    description: 'Forge your destiny in the depths of perdition',
    imageSrc: mockImage,
    href: '/characters',
  },
  parameters: {
    docs: {
      description: {
        story: 'Gothic fantasy themed card for character management',
      },
    },
  },
};

export const GothicAllVariants: Story = {
  name: 'All Gothic Variants',
  render: () => (
    <div className="space-y-8 max-w-4xl">
      <div>
        <h3 className="text-bone font-display text-lg mb-4 tracking-wide ">Explore the Realm</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <HomeCard
            title="dark tales"
            description="Bequathed by the abyss, these stories haunt the realm"
            imageSrc={mockImage}
            href="/lore"
          />
          <HomeCard
            title="character sheets"
            description="Forge your destiny in the depths of perdition"
            imageSrc={mockImage}
            href="/characters"
          />
        </div>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Collection of all gothic-themed HomeCard variants',
      },
    },
    backgrounds: {
      default: 'dark',
    },
  },
};
