import type { Meta, StoryObj } from '@storybook/react';
import { SearingModal } from './SearingModal';
import { TransactionStatus } from '@/types/blockchain';

const hookMocks = {
    useSearing: {
        isSearing: false,
        isApproving: false,
        error: null,
        txHash: null,
        txStatus: TransactionStatus.IDLE,
        searConcords: async () => { },
        checkApproval: async () => true,
        approveForSearing: async () => { },
    },
    useTokenBalances: {
        balances: {
            CONCORD: {
                balance: 10n,
                symbol: 'CONCORD',
            },
        },
        isLoading: false,
        error: null,
        refetch: async () => { },
    },
};

const meta: Meta<typeof SearingModal> = {
    component: SearingModal,
    title: 'Components/Modals/SearingModal',
    tags: ['autodocs'],
    argTypes: {
        wagdieId: {
            control: 'number',
            description: 'WAGDIE token ID',
        },
        wagdieName: {
            control: 'text',
            description: 'WAGDIE character name',
        },
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
            description: 'Success callback after searing',
        },
    },
};

export default meta;
type Story = StoryObj<typeof SearingModal>;

export const Default: Story = {
    args: {
        wagdieId: 1234,
        wagdieName: 'Grimwald the Undying',
        isOpen: true,
        onClose: () => { },
        onSuccess: () => { },
    },
    parameters: {
        hookMocks,
    },
};

export const Closed: Story = {
    args: {
        wagdieId: 1234,
        wagdieName: 'Grimwald the Undying',
        isOpen: false,
        onClose: () => { },
        onSuccess: () => { },
    },
    parameters: {
        hookMocks,
    },
};

export const Interactive: Story = {
    args: {
        wagdieId: 5678,
        wagdieName: 'Shadow Walker',
        isOpen: true,
        onClose: () => alert('Modal closed'),
        onSuccess: () => alert('Concords seared!'),
    },
    parameters: {
        hookMocks,
        docs: {
            description: {
                story: 'Interactive demo - enter Concord ID and click sear button',
            },
        },
    },
};
