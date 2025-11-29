import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { TransactionStatus } from './TransactionStatus';
import { TransactionStatus as TxStatus } from '@/types/blockchain';

const meta: Meta<typeof TransactionStatus> = {
  component: TransactionStatus,
  title: 'Components/Wallet/TransactionStatus',
  tags: ['autodocs'],
  argTypes: {
    status: {
      control: 'select',
      options: Object.values(TxStatus),
      description: 'Transaction status state',
    },
    hash: {
      control: 'text',
      description: 'Transaction hash',
    },
    error: {
      control: 'text',
      description: 'Error message if transaction failed',
    },
    confirmations: {
      control: 'number',
      description: 'Current confirmation count',
    },
    requiredConfirmations: {
      control: 'number',
      description: 'Required confirmations',
    },
    className: {
      control: 'text',
      description: 'Additional CSS classes',
    },
  },
};

export default meta;
type Story = StoryObj<typeof TransactionStatus>;

export const Idle: Story = {
  args: {
    status: TxStatus.IDLE,
    hash: undefined,
  },
};

export const Pending: Story = {
  args: {
    status: TxStatus.PENDING,
    hash: '0x1234...5678',
  },
};

export const Confirming: Story = {
  args: {
    status: TxStatus.CONFIRMING,
    hash: '0x1234...5678',
    confirmations: 3,
    requiredConfirmations: 5,
  },
};

export const Confirmed: Story = {
  args: {
    status: TxStatus.SUCCESS,
    hash: '0x1234...5678',
    confirmations: 5,
    requiredConfirmations: 5,
  },
};

export const Failed: Story = {
  args: {
    status: TxStatus.ERROR,
    hash: '0x1234...5678',
    error: 'Transaction reverted: insufficient funds',
  },
};

export const Reverted: Story = {
  args: {
    status: TxStatus.ERROR,
    hash: '0x1234...5678',
    error: 'Execution reverted',
  },
};
