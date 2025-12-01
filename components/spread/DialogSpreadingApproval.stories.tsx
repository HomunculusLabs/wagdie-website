import type { Meta, StoryObj } from '@storybook/react';
import { DialogSpreadingApproval } from './DialogSpreadingApproval';

const meta: Meta<typeof DialogSpreadingApproval> = {
    component: DialogSpreadingApproval,
    title: 'Components/Spread/DialogSpreadingApproval',
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
        onApprove: {
            action: 'approved',
            description: 'Approve callback',
        },
        contractAddress: {
            control: 'text',
            description: 'Contract address to approve',
        },
    },
};

export default meta;
type Story = StoryObj<typeof DialogSpreadingApproval>;

export const Default: Story = {
    args: {
        isOpen: true,
        onClose: () => { },
        onApprove: () => { },
        contractAddress: '0x1234567890abcdef1234567890abcdef12345678',
    },
};

export const Interactive: Story = {
    args: {
        isOpen: true,
        onClose: () => alert('Closed!'),
        onApprove: () => alert('Approved!'),
        contractAddress: '0xabcdef1234567890abcdef1234567890abcdef12',
    },
};
