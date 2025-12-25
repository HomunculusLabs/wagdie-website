import type { Meta, StoryObj } from '@storybook/react';
import { OwnershipVerificationBanner, OwnershipBadge, OwnershipStatusText } from './OwnershipVerificationBanner';

const meta: Meta<typeof OwnershipVerificationBanner> = {
  component: OwnershipVerificationBanner,
  title: 'Components/Ownership/OwnershipVerificationBanner',
  tags: ['autodocs'],
  argTypes: {
    tokenId: {
      control: 'number',
      description: 'Character token ID',
    },
    className: {
      control: 'text',
      description: 'Additional CSS classes',
    },
  },
};

export default meta;
type Story = StoryObj<typeof OwnershipVerificationBanner>;

export const Default: Story = {
  args: {
    tokenId: 1234n,
  },
  parameters: {
    docs: {
      description: {
        story: 'Default banner state. Displays loading or appropriate status based on wallet connection.',
      },
    },
  },
};

export const OwnershipBadgeDemo: Story = {
  render: () => (
    <div className="space-y-4">
      <div className="relative">
        <div className="w-32 h-32 bg-gray-800 rounded-lg flex items-center justify-center">
          <span className="text-gray-600">Character Image</span>
        </div>
        <div className="absolute top-2 right-2">
          <OwnershipBadge tokenId={1234n} />
        </div>
      </div>
      <p className="text-sm text-gray-400">Compact badge for character cards</p>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'OwnershipBadge component for use on character cards. Small compact badge showing ownership status.',
      },
    },
  },
};

export const OwnershipStatusTextDemo: Story = {
  render: () => (
    <div className="space-y-4">
      <div>
        <OwnershipStatusText tokenId={1234n} />
      </div>
      <div>
        <OwnershipStatusText tokenId={5678n} />
      </div>
      <div>
        <OwnershipStatusText tokenId={9012n} />
      </div>
    </div>
  ),
  name: 'OwnershipStatusText',
  parameters: {
    docs: {
      description: {
        story: 'Inline ownership status text for use within other components.',
      },
    },
  },
};
