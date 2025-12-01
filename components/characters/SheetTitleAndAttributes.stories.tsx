
import type { Meta, StoryObj } from '@storybook/react';
import { SheetTitleAndAttributes } from './SheetTitleAndAttributes';
import type { Character } from '@/types/character';

const meta: Meta<typeof SheetTitleAndAttributes> = {
    component: SheetTitleAndAttributes,
    title: 'Components/Character/SheetTitleAndAttributes',
    tags: ['autodocs'],
    argTypes: {
        character: {
            control: 'object',
            description: 'Character data with metadata and attributes',
        },
        isEditMode: {
            control: 'boolean',
            description: 'Whether the sheet is in edit mode',
        },
    },
};

export default meta;
type Story = StoryObj<typeof SheetTitleAndAttributes>;

const mockCharacterWithSheet: Character = {
    token_id: 1234,
    name: 'Grimwald the Undying',
    class: 'Warrior',
    level: 45,
    str: 18,
    dex: 14,
    con: 20,
    int: 10,
    wis: 12,
    cha: 8,
    hp: 150,
    max_hp: 180,
    ac: 18,
    speed: 30,
    infection_status: 'healthy',
    staking_status: 'unstaked',
    image_url: 'data:image/svg+xml,%3Csvg width="400" height="400" xmlns="http://www.w3.org/2000/svg"%3E%3Crect width="400" height="400" fill="%23334155"/%3E%3Ctext x="50%25" y="50%25" font-size="24" text-anchor="middle" dy=".3em" fill="%23a3a3a3"%3EGrimwald%3C/text%3E%3C/svg%3E',
    metadata: {
        name: 'Grimwald the Undying',
        image: 'ipfs://QmExample123/1234.png',
        level: 45,
        hit_points: 150,
        attributes: {
            strength: 18,
            dexterity: 14,
            constitution: 20,
            intelligence: 10,
            wisdom: 12,
            charisma: 8,
        },
    },
};

const mockCharacterInfected: Character = {
    ...mockCharacterWithSheet,
    token_id: 5678,
    name: 'Infected Wanderer',
    infection_status: 'infected',
    metadata: {
        ...mockCharacterWithSheet.metadata,
        name: 'Infected Wanderer',
    },
};

const mockCharacterCured: Character = {
    ...mockCharacterWithSheet,
    token_id: 9012,
    name: 'Survivor',
    infection_status: 'cured',
    metadata: {
        ...mockCharacterWithSheet.metadata,
        name: 'Survivor',
    },
};

const mockCharacterStaked: Character = {
    ...mockCharacterWithSheet,
    token_id: 3456,
    name: 'Staked Guardian',
    staking_status: 'staked',
    metadata: {
        ...mockCharacterWithSheet.metadata,
        name: 'Staked Guardian',
    },
};

const mockCharacterNoSheet: Character = {
    token_id: 7890,
    name: 'Fresh Character',
    level: 1,
    infection_status: 'healthy',
    staking_status: 'unstaked',
    image_url: 'data:image/svg+xml,%3Csvg width="400" height="400" xmlns="http://www.w3.org/2000/svg"%3E%3Crect width="400" height="400" fill="%23334155"/%3E%3Ctext x="50%25" y="50%25" font-size="24" text-anchor="middle" dy=".3em" fill="%23a3a3a3"%3EFresh%3C/text%3E%3C/svg%3E',
    metadata: {
        name: 'Fresh Character',
        level: 1,
    },
};

export const Default: Story = {
    args: {
        character: mockCharacterWithSheet,
        isEditMode: false,
    },
};

export const Infected: Story = {
    args: {
        character: mockCharacterInfected,
        isEditMode: false,
    },
    parameters: {
        docs: {
            description: {
                story: 'Character with infected status badge displayed',
            },
        },
    },
};

export const Cured: Story = {
    args: {
        character: mockCharacterCured,
        isEditMode: false,
    },
    parameters: {
        docs: {
            description: {
                story: 'Character with cured status badge displayed',
            },
        },
    },
};

export const Staked: Story = {
    args: {
        character: mockCharacterStaked,
        isEditMode: false,
    },
    parameters: {
        docs: {
            description: {
                story: 'Character with staked status badge displayed',
            },
        },
    },
};

export const InfectedAndStaked: Story = {
    args: {
        character: {
            ...mockCharacterInfected,
            staking_status: 'staked',
        },
        isEditMode: false,
    },
    parameters: {
        docs: {
            description: {
                story: 'Character with multiple status badges (infected and staked)',
            },
        },
    },
};

export const WithoutCharacterSheet: Story = {
    args: {
        character: mockCharacterNoSheet,
        isEditMode: false,
    },
    parameters: {
        docs: {
            description: {
                story: 'Character without full character sheet data - only shows basic info',
            },
        },
    },
};

export const HighLevelCharacter: Story = {
    args: {
        character: {
            ...mockCharacterWithSheet,
            level: 99,
            hp: 999,
            max_hp: 999,
            str: 20,
            dex: 20,
            con: 20,
            int: 20,
            wis: 20,
            cha: 20,
            metadata: {
                ...mockCharacterWithSheet.metadata,
                level: 99,
                hit_points: 999,
                attributes: {
                    strength: 20,
                    dexterity: 20,
                    constitution: 20,
                    intelligence: 20,
                    wisdom: 20,
                    charisma: 20,
                },
            },
        },
        isEditMode: false,
    },
    parameters: {
        docs: {
            description: {
                story: 'Max level character with all attributes at maximum',
            },
        },
    },
};

export const LowHealthCharacter: Story = {
    args: {
        character: {
            ...mockCharacterWithSheet,
            hp: 10,
            max_hp: 180,
        },
        isEditMode: false,
    },
    parameters: {
        docs: {
            description: {
                story: 'Character with low HP (10/180)',
            },
        },
    },
};
