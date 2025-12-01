
import type { Meta, StoryObj } from '@storybook/react';
import { SheetEquipment } from './SheetEquipment';
import type { Equipment } from '@/types/character';

const meta: Meta<typeof SheetEquipment> = {
    component: SheetEquipment,
    title: 'Components/Character/SheetEquipment',
    tags: ['autodocs'],
    argTypes: {
        equipment: {
            control: 'object',
            description: 'Equipment data (weapons, armor, items, gold)',
        },
        isEditMode: {
            control: 'boolean',
            description: 'Whether the sheet is in edit mode',
        },
    },
};

export default meta;
type Story = StoryObj<typeof SheetEquipment>;

const fullEquipment: Equipment = {
    weapons: ['Longsword +2', 'Shortbow', 'Dagger'],
    armor: ['Plate Mail', 'Shield +1', 'Helmet of Valor'],
    items: ['Healing Potion x3', 'Rope (50ft)', 'Torch x5', 'Rations (7 days)'],
    gold: 1250,
};

const partialEquipment: Equipment = {
    weapons: ['Rusty Sword'],
    armor: ['Leather Armor'],
    items: [],
    gold: 50,
};

const wealthyEquipment: Equipment = {
    weapons: ['Legendary Blade of Souls'],
    armor: ['Enchanted Plate Armor', 'Cloak of Protection'],
    items: ['Ring of Regeneration', 'Amulet of Health', 'Bag of Holding'],
    gold: 99999,
};

const legacyFormatEquipment = {
    armor: 'Plate Mail',
    back: 'Cloak of Shadows',
    mask: 'Mask of the Undying',
} as any;

export const Default: Story = {
    args: {
        equipment: fullEquipment,
        isEditMode: false,
    },
};

export const Empty: Story = {
    args: {
        equipment: null,
        isEditMode: false,
    },
    parameters: {
        docs: {
            description: {
                story: 'Character with no equipment - shows empty state',
            },
        },
    },
};

export const PartialEquipment: Story = {
    args: {
        equipment: partialEquipment,
        isEditMode: false,
    },
    parameters: {
        docs: {
            description: {
                story: 'Character with minimal equipment and low gold',
            },
        },
    },
};

export const WealthyAdventurer: Story = {
    args: {
        equipment: wealthyEquipment,
        isEditMode: false,
    },
    parameters: {
        docs: {
            description: {
                story: 'High-level character with legendary items and lots of gold',
            },
        },
    },
};

export const WeaponsOnly: Story = {
    args: {
        equipment: {
            weapons: ['Greatsword', 'Crossbow', 'War Hammer'],
            armor: [],
            items: [],
            gold: 0,
        },
        isEditMode: false,
    },
    parameters: {
        docs: {
            description: {
                story: 'Character with only weapons equipped',
            },
        },
    },
};

export const ArmorOnly: Story = {
    args: {
        equipment: {
            weapons: [],
            armor: ['Chain Mail', 'Gauntlets', 'Boots of Speed'],
            items: [],
            gold: 0,
        },
        isEditMode: false,
    },
    parameters: {
        docs: {
            description: {
                story: 'Character with only armor equipped',
            },
        },
    },
};

export const ItemsOnly: Story = {
    args: {
        equipment: {
            weapons: [],
            armor: [],
            items: ['Potion of Healing', 'Scroll of Fireball', 'Wand of Magic Missiles'],
            gold: 0,
        },
        isEditMode: false,
    },
    parameters: {
        docs: {
            description: {
                story: 'Character with only consumable items',
            },
        },
    },
};

export const GoldOnly: Story = {
    args: {
        equipment: {
            weapons: [],
            armor: [],
            items: [],
            gold: 5000,
        },
        isEditMode: false,
    },
    parameters: {
        docs: {
            description: {
                story: 'Character with only gold, no equipment',
            },
        },
    },
};

export const LegacyFormat: Story = {
    args: {
        equipment: legacyFormatEquipment,
        isEditMode: false,
    },
    parameters: {
        docs: {
            description: {
                story: 'Equipment in legacy format (armor/back/mask as strings)',
            },
        },
    },
};
