
import type { Meta, StoryObj } from '@storybook/react';
import { Navigation } from './Navigation';

const meta: Meta<typeof Navigation> = {
  component: Navigation,
  title: 'Components/Layout/Navigation',
  tags: ['autodocs'],
  argTypes: {
    className: {
      control: 'text',
      description: 'Additional CSS classes',
    },
    isMobile: {
      control: 'boolean',
      description: 'Whether to render in mobile layout',
    },
    onNavClick: {
      action: 'navigation clicked',
      description: 'Click handler for navigation items',
    },
  },
};

export default meta;
type Story = StoryObj<typeof Navigation>;

export const Desktop: Story = {
  args: {
    className: 'flex gap-6',
    isMobile: false,
  },
  parameters: {
    docs: {
      description: {
        story: 'Desktop horizontal navigation layout. Links highlight based on current path.',
      },
    },
  },
};

export const Mobile: Story = {
  args: {
    isMobile: true,
  },
  parameters: {
    viewport: {
      defaultViewport: 'mobile1',
    },
    docs: {
      description: {
        story: 'Mobile vertical navigation layout. Stack layout for smaller screens.',
      },
    },
  },
};

export const WithClickHandler: Story = {
  args: {
    onNavClick: () => alert('Navigation item clicked!'),
  },
  parameters: {
    docs: {
      description: {
        story: 'Interactive story demonstrating onClick handler. Click any nav item to trigger the action.',
      },
    },
  },
};
