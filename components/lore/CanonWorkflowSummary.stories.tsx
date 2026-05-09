import type { Meta, StoryObj } from '@storybook/react';
import { CanonWorkflowSummary } from './CanonWorkflowSummary';
import { loreStoryData } from './story-data';

const meta: Meta<typeof CanonWorkflowSummary> = {
  title: 'Components/Lore/CanonWorkflowSummary',
  component: CanonWorkflowSummary,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof CanonWorkflowSummary>;

export const CardContinuityReview: Story = {
  args: {
    canon: loreStoryData.communityCanonizingEvent.canon,
  },
};

export const DetailApproved: Story = {
  args: {
    canon: loreStoryData.officialEvent.canon,
    variant: 'detail',
  },
};

export const DetailDisputed: Story = {
  args: {
    canon: loreStoryData.disputedEvent.canon,
    variant: 'detail',
  },
};
