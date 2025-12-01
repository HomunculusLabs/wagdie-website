import type { Meta, StoryObj } from '@storybook/react';
import { UserDropdown } from './UserDropdown';

const meta: Meta<typeof UserDropdown> = {
    component: UserDropdown,
    title: 'Components/Wallet/UserDropdown',
    tags: ['autodocs'],
    argTypes: {
        address: {
            control: 'text',
            description: 'Ethereum address to display',
        },
    },
};

export default meta;
type Story = StoryObj<typeof UserDropdown>;

export const Default: Story = {
    args: {
        address: '0x1234567890123456789012345678901234567890',
    },
};

export const ShortAddress: Story = {
    args: {
        address: '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd',
    },
};
