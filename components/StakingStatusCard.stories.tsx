
import type { Meta, StoryObj } from '@storybook/react';
import { StakingStatusCard } from './StakingStatusCard';

const meta: Meta<typeof StakingStatusCard> = {
  component: StakingStatusCard,
  title: 'Components/Staking/StakingStatusCard',
  tags: ['autodocs'],
  argTypes: {
    tokenId: {
      control: 'number',
      description: 'Character token ID to check staking status',
    },
    className: {
      control: 'text',
      description: 'Additional CSS classes',
    },
  },
};

export default meta;
type Story = StoryObj<typeof StakingStatusCard>;

export const Default: Story = {
  args: {
    tokenId: 1234,
  },
  parameters: {
    docs: {
      description: {
        story: 'Displays staking status for a character. Shows loading, error, or status information.',
      },
    },
  },
};

export const LoadingState: Story = {
  args: {
    tokenId: 5678,
  },
  parameters: {
    docs: {
      description: {
        story: 'Loading state while fetching staking information from the blockchain.',
      },
    },
  },
};

export const StakedCharacter: Story = {
  args: {
    tokenId: 9012,
  },
  parameters: {
    docs: {
      description: {
        story: 'Character that is currently staked at a location. Shows location details and ownership information.',
      },
    },
  },
};

export const NotStaked: Story = {
  args: {
    tokenId: 3456,
  },
  parameters: {
    docs: {
      description: {
        story: 'Character that is not staked and is held in the wallet.',
      },
    },
  },
};
