
import type { Meta, StoryObj } from '@storybook/react';
import { CorpseBurningModal } from './CorpseBurningModal';
import { TransactionStatus } from '@/types/blockchain';

// Mock the useCorpseBurning hook
jest.mock('@/hooks/useCorpseBurning', () => ({
    useCorpseBurning: () => ({
        isBurning: false,
        isApproving: false,
        error: null,
        txHash: null,
        txStatus: TransactionStatus.IDLE,
        corpseBalance: 100n,
        mushroomBalance: 50n,
        burnCorpse: async () => { },
        checkApproval: async () => true,
        approveForBurning: async () => { },
        fetchBalances: async () => { },
    }),
}));

const meta: Meta<typeof CorpseBurningModal> = {
    component: CorpseBurningModal,
    title: 'Components/Modals/CorpseBurningModal',
    tags: ['autodocs'],
    argTypes: {
        isOpen: {
            control: 'boolean',
            description: 'Whether the modal is open',
        },
        onClose: {
            action: 'closed',
            description: 'Close modal callback',
        },
        onSuccess: {
            action: 'success',
            description: 'Success callback after burning',
        },
    },
};

export default meta;
type Story = StoryObj<typeof CorpseBurningModal>;

export const Default: Story = {
    args: {
        isOpen: true,
        onClose: () => { },
        onSuccess: () => { },
    },
};

export const Closed: Story = {
    args: {
        isOpen: false,
        onClose: () => { },
        onSuccess: () => { },
    },
    parameters: {
        docs: {
            description: {
                story: 'Modal in closed state (not visible)',
            },
        },
    },
};

export const WithHighBalance: Story = {
    args: {
        isOpen: true,
        onClose: () => { },
        onSuccess: () => { },
    },
    parameters: {
        docs: {
            description: {
                story: 'Modal showing high corpse and mushroom balances',
            },
        },
    },
};

export const Interactive: Story = {
    args: {
        isOpen: true,
        onClose: () => alert('Modal closed'),
        onSuccess: () => alert('Burn successful!'),
    },
    parameters: {
        docs: {
            description: {
                story: 'Interactive demo - enter amount and click burn button',
            },
        },
    },
};
