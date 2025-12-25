// Alert stories
import type { Meta, StoryObj } from '@storybook/react';
import { Alert } from './Alert';

const meta: Meta<typeof Alert> = {
  title: 'UI/Alert',
  component: Alert,
  tags: ['autodocs'],
};

export default meta;

type Story = StoryObj<typeof Alert>;

export const Default: Story = {
  args: {
    title: 'System Notice',
    children: 'All systems remain stable.',
    variant: 'default',
  },
};

export const Destructive: Story = {
  args: {
    title: 'Containment Breach',
    children: 'Immediate evacuation is required.',
    variant: 'destructive',
  },
};

export const Warning: Story = {
  args: {
    title: 'Signal Degradation',
    children: 'Low interference detected on channel 9.',
    variant: 'warning',
  },
};

export const WithoutTitle: Story = {
  args: {
    children: 'Background synchronization is paused.',
    variant: 'default',
  },
};
