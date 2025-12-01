import type { Meta, StoryObj } from '@storybook/react';
import { WalletButton } from './WalletButton';

const meta: Meta<typeof WalletButton> = {
  component: WalletButton,
  title: 'Components/Wallet/WalletButton',
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: 'Displays wallet connection status and provides connect/disconnect functionality. Shows "Connect Wallet" button when disconnected, or truncated address when connected.',
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof WalletButton>;

export const Default: Story = {
  parameters: {
    docs: {
      description: {
        story: 'Default state without wallet connection. Shows "Connect Wallet" button.',
      },
    },
  },
};
