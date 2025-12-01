import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { Card } from './Card';
import { Button } from '../ui/Button';

const meta: Meta<typeof Card> = {
  component: Card,
  title: 'Components/Card',
  tags: ['autodocs'],
  argTypes: {
    title: {
      control: 'text',
      description: 'Card title',
    },
    isLoading: {
      control: 'boolean',
      description: 'Whether the card is in a loading state',
    },
    padded: {
      control: 'boolean',
      description: 'Whether the card has padding',
    },
  },
};

export default meta;
type Story = StoryObj<typeof Card>;

export const Default: Story = {
  args: {
    title: 'Card Title',
    children: <p>This is the card content area.</p>,
  },
};

export const WithFooter: Story = {
  args: {
    title: 'Card with Footer',
    children: <p>Main content goes here</p>,
    footer: (
      <div className="flex justify-end gap-2">
        <Button size="sm" variant="secondary">
          Cancel
        </Button>
        <Button size="sm" variant="primary">
          Save
        </Button>
      </div>
    ),
  },
};

export const Loading: Story = {
  args: {
    isLoading: true,
    title: 'Loading Card',
    children: <p>Content is loading...</p>,
  },
};

export const NoPadding: Story = {
  args: {
    padded: false,
    children: (
      <div className="p-0">
        <img
          alt="Placeholder"
          className="w-full h-48 object-cover rounded-t-lg"
          src="data:image/svg+xml,%3Csvg width='400' height='200' xmlns='http://www.w3.org/2000/svg'%3E%3Crect width='400' height='200' fill='%23e5e7eb'/%3E%3Ctext x='50%25' y='50%25' font-size='24' text-anchor='middle' dy='.3em' fill='%236b7280'%3EImage Placeholder%3C/text%3E%3C/svg%3E"
        />
        <div className="p-4">
          <h3 className="font-semibold mb-2">Card with Image</h3>
          <p>No padding card example</p>
        </div>
      </div>
    ),
  },
};

export const ComplexContent: Story = {
  args: {
    title: 'User Profile Card',
    children: (
      <div>
        <div className="flex items-center gap-4 mb-4">
          <div className="w-16 h-16 bg-gray-300 rounded-full"></div>
          <div>
            <h4 className="font-semibold">John Doe</h4>
            <p className="text-gray-600 text-sm">Software Developer</p>
          </div>
        </div>
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-gray-500">📧</span>
            <span className="text-sm">john.doe@example.com</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-gray-500">📍</span>
            <span className="text-sm">San Francisco, CA</span>
          </div>
        </div>
      </div>
    ),
  },
};

export const NoTitle: Story = {
  args: {
    children: (
      <p>This card has no title, just content.</p>
    ),
  },
};
