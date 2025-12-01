import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { Button } from './Button';

const meta: Meta<typeof Button> = {
  component: Button,
  title: 'Components/Button',
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['primary', 'secondary', 'danger'],
      description: 'Visual style variant of the button',
    },
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
      description: 'Size of the button',
    },
    disabled: {
      control: 'boolean',
      description: 'Whether the button is disabled',
    },
  },
};

export default meta;
type Story = StoryObj<typeof Button>;

export const Primary: Story = {
  args: {
    variant: 'primary',
    children: 'Primary Button',
  },
};

export const Secondary: Story = {
  args: {
    variant: 'secondary',
    children: 'Secondary Button',
  },
};

export const Danger: Story = {
  args: {
    variant: 'danger',
    children: 'Danger Button',
  },
};

export const Small: Story = {
  args: {
    size: 'sm',
    children: 'Small Button',
  },
};

export const Large: Story = {
  args: {
    size: 'lg',
    children: 'Large Button',
  },
};

export const Disabled: Story = {
  args: {
    disabled: true,
    children: 'Disabled Button',
  },
};

export const Interactive: Story = {
  args: {
    variant: 'primary',
    children: 'Click Me',
    onClick: () => {
      console.log('Button clicked!');
      alert('Button was clicked!');
    },
  },
  parameters: {
    // Story-level interaction testing configuration
    docs: {
      description: {
        story: 'Interactive story demonstrating onClick handler. Use the Controls panel to test different props, then interact with the button.',
      },
    },
  },
};

export const GothicPrimary: Story = {
  name: 'Gothic Primary',
  args: {
    variant: 'primary',
    children: 'summon forth',
  },
  parameters: {
    docs: {
      description: {
        story: 'Gothic fantasy themed primary button with gold accents and shadow effects',
      },
    },
  },
};

export const GothicDanger: Story = {
  name: 'Gothic Danger',
  args: {
    variant: 'danger',
    children: 'cast death curse',
  },
  parameters: {
    docs: {
      description: {
        story: 'Gothic fantasy themed danger button with blood red coloring',
      },
    },
  },
};

export const AllGothicVariants: Story = {
  name: 'All Gothic Variants',
  render: () => (
    <div className="flex gap-4 flex-wrap">
      <Button variant="primary">summon forth</Button>
      <Button variant="secondary">observe</Button>
      <Button variant="danger">cast death curse</Button>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Collection of all gothic-themed button variants',
      },
    },
  },
};
