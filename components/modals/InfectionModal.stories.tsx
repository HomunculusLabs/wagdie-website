
import type { Meta, StoryObj } from '@storybook/react';
import { InfectionModal } from './InfectionModal';
import { TransactionStatus } from '@/types/blockchain';

// Mock the useSpread hook
jest.mock('@/hooks/useSpread', () => ({
    useSpread: () => ({
        isSpreading: false,
        error: null,
        txHash: null,
        txStatus: TransactionStatus.IDLE,
        infectionPrice: 10000000000000000n, // 0.01 ETH
        ethBalance: 1000000000000000000n, // 1 ETH
        infectWagdie: async () => { },
        spreadInfections: async () => { },
        fetchInfectionPrice: async () => { },
        fetchEthBalance: async () => { },
    }),
}));

const meta: Meta<typeof InfectionModal> = {
    component: InfectionModal,
    title: 'Components/Modals/InfectionModal',
    tags: ['autodocs'],
    argTypes: {
        mode: {
            control: 'select',
            options: ['specific', 'random'],
            description: 'Infection mode',
        },
        tokenId: {
            control: 'number',
            description: 'Token ID (for specific mode)',
        },
        tokenName: {
            control: 'text',
            description: 'Token name (for specific mode)',
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
            description: 'Success callback after infection',
        },
    },
};

export default meta;
type Story = StoryObj<typeof InfectionModal>;

export const SpecificCharacter: Story = {
    args: {
        mode: 'specific',
        tokenId: 1234n,
        tokenName: 'Grimwald',
        isOpen: true,
        onClose: () => { },
        onSuccess: () => { },
    },
};

export const RandomInfection: Story = {
    args: {
        mode: 'random',
        isOpen: true,
        onClose: () => { },
        onSuccess: () => { },
    },
    parameters: {
        docs: {
            description: {
                story: 'Random infection mode - infect multiple random characters',
            },
        },
    },
};

export const Closed: Story = {
    args: {
        mode: 'specific',
        tokenId: 1234n,
        tokenName: 'Grimwald',
        isOpen: false,
        onClose: () => { },
        onSuccess: () => { },
    },
};

export const Interactive: Story = {
    args: {
        mode: 'random',
        isOpen: true,
        onClose: () => alert('Modal closed'),
        onSuccess: () => alert('Infection spread!'),
    },
    parameters: {
        docs: {
            description: {
                story: 'Interactive demo - enter quantity and click spread button',
            },
        },
    },
};
