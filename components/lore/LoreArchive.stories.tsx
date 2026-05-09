import type { Meta, StoryObj } from '@storybook/react';
import { LoreArchive } from './LoreArchive';
import { loreStoryData } from './story-data';

const meta: Meta<typeof LoreArchive> = {
  title: 'Components/Lore/LoreArchive',
  component: LoreArchive,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof LoreArchive>;

export const Default: Story = {
  args: {
    items: [loreStoryData.officialEvent, loreStoryData.communityCanonizingEvent],
    filters: {},
    seasons: loreStoryData.seasons,
    locations: loreStoryData.locations,
    characters: loreStoryData.characters,
  },
};

export const EmptyFilteredState: Story = {
  args: {
    items: [],
    filters: {
      character: 'ghost-archivist',
      canonStatus: 'canonizing',
      keyword: 'nonexistent altar',
    },
    seasons: loreStoryData.seasons,
    locations: loreStoryData.locations,
    characters: loreStoryData.characters,
  },
};
