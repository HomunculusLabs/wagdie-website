
import type { Meta, StoryObj } from '@storybook/react';
import { CureModal } from './CureModal';
import { TransactionStatus } from '@/types/blockchain';

// Mock the useCure hook
jest.mock('@/hooks/useCure', () => ({
    useCure: () => ({
        isCuring: false,
        error: null,
        txHash: null,
        txStatus: TransactionStatus.IDLE,
        cureStatus: {
            canCure: true,
            hasEnoughMushrooms: true,
            mushroomBalance: 10n,
            mushroomsRequired: 1n,
            isMintingEnabled: true,
        },
        cureCharacter: async () => { },
        fetchCureStatus: async () => { },
    }),
}));

const meta: Meta<typeof CureModal> = {
    component: CureModal,
    title: 'Components/Modals/CureModal',
    tags: ['autodocs'],
    argTypes: {
        characterId: {
            control: 'number',
            description: 'Character token ID',
        },
        characterName: {
            control: 'text',
            description: 'Character name',
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
            description: 'Success callback after curing',
        },
    },
};

export default meta;
type Story = StoryObj<typeof CureModal>;

export const Default: Story = {
    args: {
        characterId: 1234,
        characterName: 'Infected Wanderer',
        isOpen: true,
        onClose: () => { },
        onSuccess: () => { },
    },
};

export const Closed: Story = {
    args: {
        characterId: 1234,
        characterName: 'Infected Wanderer',
        isOpen: false,
        onClose: () => { },
        onSuccess: () => { },
    },
};

export const Interactive: Story = {
    args: {
        characterId: 5678,
        characterName: 'Grimwald the Cursed',
        isOpen: true,
        onClose: () => alert('Modal closed'),
        onSuccess: () => alert('Character cured!'),
    },
    parameters: {
        docs: {
            description: {
                story: 'Interactive demo - click cure button to see action',
            },
        },
    },
};
