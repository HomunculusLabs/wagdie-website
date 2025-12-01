
import type { Meta, StoryObj } from '@storybook/react';
import { SheetBackgroundStory } from './SheetBackgroundStory';

const meta: Meta<typeof SheetBackgroundStory> = {
    component: SheetBackgroundStory,
    title: 'Components/Character/SheetBackgroundStory',
    tags: ['autodocs'],
    argTypes: {
        story: {
            control: 'text',
            description: 'Character background story text',
        },
        isEditMode: {
            control: 'boolean',
            description: 'Whether the story is editable',
        },
        isOwner: {
            control: 'boolean',
            description: 'Whether the current user owns this character',
        },
        onChange: {
            action: 'story changed',
            description: 'Callback when story text changes',
        },
    },
};

export default meta;
type Story = StoryObj<typeof SheetBackgroundStory>;

const shortStory = `Grimwald was once a noble knight, but the curse of undeath claimed him during the Battle of Shadowfen.`;

const longStory = `Born in the frost-covered peaks of the Northern Wastes, Grimwald the Undying was once the most celebrated knight of the Silver Order. His valor was legendary, his blade swift and true.

During the Battle of Shadowfen, when the necromancer Malachar raised an army of the dead, Grimwald led the charge against the undead horde. Though he struck down countless foes, a cursed blade found its mark, and the knight fell.

But death was not the end. The curse that killed him also bound his soul to the mortal realm, transforming him into one of the very creatures he had fought against. Now, neither fully alive nor truly dead, Grimwald wanders the land seeking redemption and a way to break the curse that binds him.

His former comrades fear him, his enemies mock him, but Grimwald's determination remains unbroken. He has sworn an oath to use his cursed existence to protect the innocent and hunt down the necromancer who created him.`;

export const ViewModeWithStory: Story = {
    args: {
        story: shortStory,
        isEditMode: false,
        isOwner: true,
        onChange: () => { },
    },
};

export const ViewModeEmpty: Story = {
    args: {
        story: null,
        isEditMode: false,
        isOwner: true,
        onChange: () => { },
    },
    parameters: {
        docs: {
            description: {
                story: 'Empty story in view mode - shows prompt for owner to add story',
            },
        },
    },
};

export const ViewModeEmptyNonOwner: Story = {
    args: {
        story: null,
        isEditMode: false,
        isOwner: false,
        onChange: () => { },
    },
    parameters: {
        docs: {
            description: {
                story: 'Empty story viewed by non-owner - shows different message',
            },
        },
    },
};

export const EditModeEmpty: Story = {
    args: {
        story: null,
        isEditMode: true,
        isOwner: true,
        onChange: () => { },
    },
    parameters: {
        docs: {
            description: {
                story: 'Edit mode with empty story - shows textarea with placeholder',
            },
        },
    },
};

export const EditModeWithStory: Story = {
    args: {
        story: shortStory,
        isEditMode: true,
        isOwner: true,
        onChange: () => { },
    },
    parameters: {
        docs: {
            description: {
                story: 'Edit mode with existing story - allows editing',
            },
        },
    },
};

export const LongStory: Story = {
    args: {
        story: longStory,
        isEditMode: false,
        isOwner: true,
        onChange: () => { },
    },
    parameters: {
        docs: {
            description: {
                story: 'Long multi-paragraph story with proper formatting',
            },
        },
    },
};

export const EditModeLongStory: Story = {
    args: {
        story: longStory,
        isEditMode: true,
        isOwner: true,
        onChange: () => { },
    },
    parameters: {
        docs: {
            description: {
                story: 'Edit mode with long story - shows character count',
            },
        },
    },
};

export const NearCharacterLimit: Story = {
    args: {
        story: 'A'.repeat(4950),
        isEditMode: true,
        isOwner: true,
        onChange: () => { },
    },
    parameters: {
        docs: {
            description: {
                story: 'Story near the 5000 character limit (4950/5000)',
            },
        },
    },
};
