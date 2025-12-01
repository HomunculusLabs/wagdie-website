import type { Meta, StoryObj } from '@storybook/react';
import { DialogMask } from './DialogMask';

const meta: Meta<typeof DialogMask> = {
    component: DialogMask,
    title: 'Components/Shared/DialogMask',
    tags: ['autodocs'],
    argTypes: {
        isOpen: {
            control: 'boolean',
            description: 'Whether the dialog is open',
        },
        onClose: {
            action: 'closed',
            description: 'Close handler for backdrop click or Escape key',
        },
        className: {
            control: 'text',
            description: 'Additional CSS classes for the dialog container',
        },
    },
};

export default meta;
type Story = StoryObj<typeof DialogMask>;

export const Open: Story = {
    args: {
        isOpen: true,
        onClose: () => { },
        children: <div className="p-6">Dialog Content</div>,
    },
};

export const Closed: Story = {
    args: {
        isOpen: false,
        onClose: () => { },
        children: <div className="p-6">Dialog Content</div>,
    },
};

export const Interactive: Story = {
    args: {
        isOpen: true,
        onClose: () => alert('Dialog closed'),
        children: (
            <div className="p-6">
                <h2 className="text-lg font-bold mb-4">Interactive Dialog</h2>
                <p>Click the backdrop or press Escape to close</p>
            </div>
        ),
    },
    parameters: {
        docs: {
            description: {
                story: 'Click the backdrop or press Escape to trigger the close action',
            },
        },
    },
};
