import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { Tabs, type TabItem } from './Tabs';

const baseItems: TabItem[] = [
  {
    id: 'overview',
    label: 'Overview',
    content: (
      <div className='space-y-2 text-sm font-eskapade text-neutral-400'>
        <p>Primary signals and system health.</p>
        <p>Latency remains under control.</p>
      </div>
    ),
  },
  {
    id: 'signals',
    label: 'Signals',
    content: (
      <div className='space-y-2 text-sm font-eskapade text-neutral-400'>
        <p>Interference is low. Channel is clear.</p>
        <p>Broadcast window opens in 14 minutes.</p>
      </div>
    ),
  },
  {
    id: 'archives',
    label: 'Archives',
    content: (
      <div className='space-y-2 text-sm font-eskapade text-neutral-400'>
        <p>Archive sweep is complete.</p>
        <p>Three new files indexed.</p>
      </div>
    ),
  },
];

const itemsWithDisabled: TabItem[] = [
  ...baseItems,
  {
    id: 'restricted',
    label: 'Restricted',
    disabled: true,
    content: (
      <div className='text-sm font-eskapade text-neutral-400'>
        Restricted content cannot be viewed.
      </div>
    ),
  },
];

// Extracted component for controlled tabs story (satisfies hooks rules)
function ControlledTabsExample() {
  const [activeId, setActiveId] = React.useState('overview');
  return (
    <Tabs
      items={baseItems}
      activeId={activeId}
      onChange={setActiveId}
    />
  );
}

const meta: Meta<typeof Tabs> = {
  title: 'UI/Tabs',
  component: Tabs,
  tags: ['autodocs'],
};

export default meta;

type Story = StoryObj<typeof Tabs>;

export const Default: Story = {
  args: {
    items: baseItems,
    defaultActiveId: 'overview',
  },
};

export const WithActiveTab: Story = {
  args: {
    items: baseItems,
    defaultActiveId: 'signals',
  },
};

export const VerticalVariant: Story = {
  args: {
    items: baseItems,
    variant: 'vertical',
  },
};

export const WithDisabledTab: Story = {
  args: {
    items: itemsWithDisabled,
    defaultActiveId: 'overview',
  },
};

export const Controlled: Story = {
  render: () => <ControlledTabsExample />,
};
