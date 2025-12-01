import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { SheetMenuBar } from './SheetMenuBar';

// Mock Next.js router
const mockRouter = {
    push: (path: string) => console.log('Navigate to:', path),
};

jest.mock('next/navigation', () => ({
    useRouter: () => mockRouter,
}));

const meta: Meta<typeof SheetMenuBar> = {
    component: SheetMenuBar,
    title: 'Components/Character/SheetMenuBar',
    tags: ['autodocs'],
    argTypes: {
        tokenId: {
            control: 'number',
            description: 'Character token ID',
        },
        isOwner: {
            control: 'boolean',
            description: 'Whether the current user owns this character',
        },
        isEditMode: {
            control: 'boolean',
            description: 'Whether the sheet is in edit mode',
        },
        isSaving: {
            control: 'boolean',
            description: 'Whether the sheet is currently saving',
        },
        onEditToggle: {
            action: 'edit toggled',
            description: 'Toggle edit mode',
        },
        onSave: {
            action: 'save clicked',
            description: 'Save changes',
        },
        onRollNew: {
            action: 'roll new clicked',
            description: 'Roll new character stats',
        },
    },
    decorators: [
        (Story) => (
            <div style={{ minHeight: '100px' }}>
                <Story />
            </div>
        ),
    ],
};

export default meta;
type Story = StoryObj<typeof SheetMenuBar>;

export const OwnerViewMode: Story = {
    args: {
        tokenId: 1234,
        isOwner: true,
        isEditMode: false,
        isSaving: false,
        onEditToggle: () => { },
        onSave: () => { },
        onRollNew: () => { },
    },
    parameters: {
        docs: {
            description: {
                story: 'Owner viewing their character - shows Edit and Roll New buttons',
            },
        },
    },
};

export const OwnerEditMode: Story = {
    args: {
        tokenId: 1234,
        isOwner: true,
        isEditMode: true,
        isSaving: false,
        onEditToggle: () => { },
        onSave: () => { },
        onRollNew: () => { },
    },
    parameters: {
        docs: {
            description: {
                story: 'Owner editing their character - shows Save and Cancel buttons',
            },
        },
    },
};

export const OwnerSaving: Story = {
    args: {
        tokenId: 1234,
        isOwner: true,
        isEditMode: true,
        isSaving: true,
        onEditToggle: () => { },
        onSave: () => { },
        onRollNew: () => { },
    },
    parameters: {
        docs: {
            description: {
                story: 'Owner saving changes - Save button shows loading state',
            },
        },
    },
};

export const NonOwnerView: Story = {
    args: {
        tokenId: 1234,
        isOwner: false,
        isEditMode: false,
        isSaving: false,
        onEditToggle: () => { },
        onSave: () => { },
        onRollNew: () => { },
    },
    parameters: {
        docs: {
            description: {
                story: 'Non-owner viewing character - only shows Back and Animated buttons',
            },
        },
    },
};

export const Interactive: Story = {
    args: {
        tokenId: 5678,
        isOwner: true,
        isEditMode: false,
        isSaving: false,
        onEditToggle: () => alert('Edit mode toggled!'),
        onSave: () => alert('Saving changes...'),
        onRollNew: () => alert('Rolling new stats...'),
    },
    parameters: {
        docs: {
            description: {
                story: 'Interactive demo - click buttons to see actions',
            },
        },
    },
};
