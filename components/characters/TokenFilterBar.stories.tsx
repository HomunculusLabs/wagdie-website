
import type { Meta, StoryObj } from '@storybook/react';
import { TokenFilterBar } from './TokenFilterBar';
import type { CharacterFilterTab, SortOrder } from '@/types/character';

const meta: Meta<typeof TokenFilterBar> = {
    component: TokenFilterBar,
    title: 'Components/Character/TokenFilterBar',
    tags: ['autodocs'],
    argTypes: {
        currentTab: {
            control: 'select',
            options: ['all', 'owned', 'infected', 'cured', 'staked'],
            description: 'Currently active filter tab',
        },
        currentSort: {
            control: 'select',
            options: ['asc', 'desc'],
            description: 'Current sort order',
        },
        onTabChange: {
            action: 'tab changed',
            description: 'Callback when filter tab changes',
        },
        onSortChange: {
            action: 'sort changed',
            description: 'Callback when sort order changes',
        },
    },
};

export default meta;
type Story = StoryObj<typeof TokenFilterBar>;

export const AllCharacters: Story = {
    args: {
        currentTab: 'all',
        currentSort: 'asc',
        onTabChange: () => { },
        onSortChange: () => { },
    },
};

export const OwnedCharacters: Story = {
    args: {
        currentTab: 'owned',
        currentSort: 'asc',
        onTabChange: () => { },
        onSortChange: () => { },
    },
    parameters: {
        docs: {
            description: {
                story: 'Filter showing only owned characters',
            },
        },
    },
};

export const InfectedCharacters: Story = {
    args: {
        currentTab: 'infected',
        currentSort: 'asc',
        onTabChange: () => { },
        onSortChange: () => { },
    },
    parameters: {
        docs: {
            description: {
                story: 'Filter showing only infected characters',
            },
        },
    },
};

export const CuredCharacters: Story = {
    args: {
        currentTab: 'cured',
        currentSort: 'asc',
        onTabChange: () => { },
        onSortChange: () => { },
    },
    parameters: {
        docs: {
            description: {
                story: 'Filter showing only cured characters',
            },
        },
    },
};

export const StakedCharacters: Story = {
    args: {
        currentTab: 'staked',
        currentSort: 'asc',
        onTabChange: () => { },
        onSortChange: () => { },
    },
    parameters: {
        docs: {
            description: {
                story: 'Filter showing only staked characters',
            },
        },
    },
};

export const SortDescending: Story = {
    args: {
        currentTab: 'all',
        currentSort: 'desc',
        onTabChange: () => { },
        onSortChange: () => { },
    },
    parameters: {
        docs: {
            description: {
                story: 'Filter with descending sort order (high to low token ID)',
            },
        },
    },
};

export const Interactive: Story = {
    args: {
        currentTab: 'all',
        currentSort: 'asc',
        onTabChange: (tab: CharacterFilterTab) => alert(`Filter changed to: ${tab}`),
        onSortChange: (sort: SortOrder) => alert(`Sort changed to: ${sort}`),
    },
    parameters: {
        docs: {
            description: {
                story: 'Interactive demo - click tabs and sort button to see actions',
            },
        },
    },
};
