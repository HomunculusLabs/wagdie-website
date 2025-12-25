import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { ErrorBoundary, ErrorFallback } from './ErrorBoundary';

const meta: Meta<typeof ErrorBoundary> = {
  component: ErrorBoundary,
  title: 'Components/ErrorBoundary',
  tags: ['autodocs'],
  argTypes: {
    children: {
      control: 'text',
      description: 'Content to render inside the boundary',
    },
    fallback: {
      control: 'text',
      description: 'Custom error fallback component',
    },
    onError: {
      action: 'error caught',
      description: 'Error handler callback',
    },
  },
};

export default meta;
type Story = StoryObj<typeof ErrorBoundary>;

export const Default: Story = {
  args: {
    children: <div className="p-4 bg-green-500/20 text-green-500">This content renders without errors</div>,
  },
};

export const WithError: Story = {
  args: {
    children: <div>This will cause an error</div>,
  },
  render: () => {
    // Simulate an error by throwing during render
    throw new Error('Test error for ErrorBoundary story');
  },
  parameters: {
    docs: {
      description: {
        story: 'This story demonstrates the ErrorBoundary catching a render error and displaying the fallback UI.',
      },
    },
  },
};

export const WithCustomFallback: Story = {
  args: {
    children: <div>This content will error</div>,
    fallback: (
      <div className="rounded-lg border border-yellow-500/20 bg-yellow-500/5 p-4">
        <div className="mb-2 flex items-center gap-2">
          <span className="text-lg">⚡</span>
          <h3 className="font-semibold text-yellow-500">Custom Error UI</h3>
        </div>
        <p className="mb-3 text-sm text-gray-300">A custom error message was provided</p>
      </div>
    ),
  },
  render: () => {
    throw new Error('Custom fallback test');
  },
};

// Standalone ErrorFallback story with its own meta
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const _errorFallbackMeta: Meta<typeof ErrorFallback> = {
  component: ErrorFallback,
  title: 'Components/ErrorFallback',
  tags: ['autodocs'],
};

type ErrorFallbackStory = StoryObj<typeof ErrorFallback>;

export const ErrorFallbackComponent: ErrorFallbackStory = {
  args: {
    error: new Error('Example error message'),
    reset: () => alert('Reset clicked!'),
  },
  parameters: {
    docs: {
      description: {
        story: 'ErrorFallback is a simple component for displaying error messages with optional reset functionality.',
      },
    },
  },
};
