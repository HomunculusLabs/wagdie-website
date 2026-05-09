import type { Meta, StoryObj } from '@storybook/react';
import { CanonizationPath } from './CanonizationPath';
import { loreStoryData } from './story-data';
import type { Canonization } from '@/lib/lore/types';

const meta: Meta<typeof CanonizationPath> = {
  title: 'Components/Lore/CanonizationPath',
  component: CanonizationPath,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof CanonizationPath>;

const rejectedCanon: Canonization = {
  status: 'non_canon',
  stageId: 'rejected',
  updatedAt: '2026-05-08',
  note: 'Story fixture showing a reviewed community entry that was rejected as non-canon.',
  path: [
    { stageId: 'community_recorded', status: 'complete', label: 'Community entry recorded' },
    { stageId: 'source_attributed', status: 'complete', label: 'Review & verification' },
    { stageId: 'continuity_review', status: 'blocked', label: 'Continuity review blocked' },
    { stageId: 'rejected', status: 'current', label: 'Rejected as non-canon' },
    { stageId: 'canonized', status: 'skipped', label: 'Approved as canon' },
  ],
};

export const OfficialApprovedPath: Story = {
  args: {
    canon: loreStoryData.officialEvent.canon,
    sources: loreStoryData.officialEventSources,
  },
};

export const CommunityRecordedPath: Story = {
  args: {
    canon: loreStoryData.communityRecordedEvent.canon,
    sources: loreStoryData.communityRecordedSources,
  },
};

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

export const RejectedNonCanonPath: Story = {
  args: {
    canon: rejectedCanon,
    sources: [],
  },
};
