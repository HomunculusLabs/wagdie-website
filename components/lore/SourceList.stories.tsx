import type { Meta, StoryObj } from '@storybook/react';
import { SourceList } from './SourceList';
import { loreStoryData } from './story-data';

const archivedOnlySource = loreStoryData.allSources.find(
  (source) => source.id === 'source-community-map-submission',
)!;

const disputedManualSource = loreStoryData.disputedSources[0];

const meta: Meta<typeof SourceList> = {
  title: 'Components/Lore/SourceList',
  component: SourceList,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof SourceList>;

export const OfficialAndCommunitySources: Story = {
  args: {
    sources: [...loreStoryData.officialEventSources, ...loreStoryData.communityCanonizingSources],
  },
};

export const ArchivedAndManualOnlySources: Story = {
  args: {
    sources: [archivedOnlySource, disputedManualSource],
  },
};
