import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { Modal } from './Modal';
import { Button } from '../ui/Button';

const meta: Meta<typeof Modal> = {
  component: Modal,
  title: 'Components/Modal',
  tags: ['autodocs'],
  argTypes: {
    isOpen: {
      control: 'boolean',
      description: 'Whether the modal is open',
    },
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg', 'xl'],
      description: 'Size of the modal',
    },
    title: {
      control: 'text',
      description: 'Modal title',
    },
    onClose: {
      action: 'closed',
      description: 'Close button click handler',
    },
  },
};

export default meta;
type Story = StoryObj<typeof Modal>;

export const Default: Story = {
  args: {
    isOpen: true,
    title: 'Modal Title',
    children: (
      <div>
        <p className="mb-4">This is the modal content area.</p>
        <div className="flex gap-2 justify-end">
          <Button variant="secondary">Cancel</Button>
          <Button variant="primary">Confirm</Button>
        </div>
      </div>
    ),
  },
};

export const Small: Story = {
  args: {
    isOpen: true,
    size: 'sm',
    title: 'Small Modal',
    children: <p>Small modal content</p>,
  },
};

export const Large: Story = {
  args: {
    isOpen: true,
    size: 'lg',
    title: 'Large Modal',
    children: (
      <div>
        <p className="mb-4">This is a large modal with more content.</p>
        <div className="space-y-4">
          <div>
            <h3 className="font-semibold mb-2">Section 1</h3>
            <p>Additional content here</p>
          </div>
          <div>
            <h3 className="font-semibold mb-2">Section 2</h3>
            <p>More content</p>
          </div>
        </div>
      </div>
    ),
  },
};

export const NoTitle: Story = {
  args: {
    isOpen: true,
    title: '',
    children: <p>Modal without a title</p>,
  },
};

export const NoBackdropClose: Story = {
  args: {
    isOpen: true,
    title: 'Modal without backdrop close',
    children: (
      <div>
        <p className="mb-4">This modal cannot be closed by clicking the backdrop.</p>
        <div className="flex gap-2 justify-end">
          <Button onClick={() => {}} variant="secondary">
            Close
          </Button>
        </div>
      </div>
    ),
  },
};

export const InteractiveDemo: Story = {
  args: {
    isOpen: true,
    title: 'Interactive Modal Demo',
    children: (
      <div>
        <p className="mb-4">
          This interactive story demonstrates:
        </p>
        <ul className="list-disc ml-6 mb-4 space-y-2">
          <li>Use the Controls panel to toggle isOpen prop</li>
          <li>Click the X button to trigger onClose action</li>
          <li>Try different modal sizes</li>
          <li>Modify the title in the Controls panel</li>
        </ul>
        <div className="flex gap-2 justify-end">
          <Button variant="secondary">Cancel</Button>
          <Button variant="primary">Confirm</Button>
        </div>
      </div>
    ),
  },
  parameters: {
    docs: {
      description: {
        story: 'Interactive demonstration of modal functionality. Use the Controls panel to modify props and test interactions.',
      },
    },
  },
};
