import type { Meta, StoryObj } from '@storybook/react';
import { DialogBurnCorpseApproval } from './DialogBurnCorpseApproval';

const meta: Meta<typeof DialogBurnCorpseApproval> = {
    component: DialogBurnCorpseApproval,
    title: 'Components/Spread/DialogBurnCorpseApproval',
    tags: ['autodocs'],
    argTypes: {
        isOpen: {
            control: 'boolean',
            description: 'Whether the dialog is open',
        },
        onClose: {
            action: 'closed',
            description: 'Close callback',
        },
        onConfirm: {
            action: 'confirmed',
            description: 'Confirm burn callback (receives amount)',
        },
        availableCorpses: {
            control: 'number',
            description: 'Number of corpses available to burn',
        },
    },
};

export default meta;
type Story = StoryObj<typeof DialogBurnCorpseApproval>;

export const Default: Story = {
    args: {
        isOpen: true,
        onClose: () => { },
        onConfirm: () => { },
        availableCorpses: 5,
    },
};

export const SingleCorpse: Story = {
    args: {
        isOpen: true,
        onClose: () => { },
        onConfirm: () => { },
        availableCorpses: 1,
    },
};

export const Interactive: Story = {
    args: {
        isOpen: true,
        onClose: () => alert('Closed!'),
        onConfirm: (amount) => alert(`Burning ${amount} corpses!`),
        availableCorpses: 10,
    },
};
