import type { Meta, StoryObj } from '@storybook/react';
import { CanonizationPath } from './CanonizationPath';
import { loreStoryData } from './story-data';

const meta: Meta<typeof CanonizationPath> = {
  title: 'Components/Lore/CanonizationPath',
  component: CanonizationPath,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof CanonizationPath>;

export const CanonizingCommunityPath: Story = {
  args: {
    canon: loreStoryData.communityCanonizingEvent.canon,
    sources: loreStoryData.communityCanonizingSources,
  },
};

export const DisputedManualArchivePath: Story = {
  args: {
    canon: loreStoryData.disputedEvent.canon,
    sources: loreStoryData.disputedSources,
  },
};
