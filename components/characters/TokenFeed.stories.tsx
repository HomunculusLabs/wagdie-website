
import type { Meta, StoryObj } from '@storybook/react';
import { TokenFeed } from './TokenFeed';
import type { Character } from '@/types/character';

// Mock Next.js router
jest.mock('next/navigation', () => ({
    useRouter: () => ({
        push: (path: string) => console.log('Navigate to:', path),
    }),
}));

const meta: Meta<typeof TokenFeed> = {
    component: TokenFeed,
    title: 'Components/Character/TokenFeed',
    tags: ['autodocs'],
    argTypes: {
        characters: {
            control: 'object',
            description: 'Array of characters to display',
        },
        hasMore: {
            control: 'boolean',
            description: 'Whether there are more characters to load',
        },
        isLoading: {
            control: 'boolean',
            description: 'Whether characters are currently loading',
        },
        onLoadMore: {
            action: 'load more',
            description: 'Callback to load more characters',
        },
    },
};

export default meta;
type Story = StoryObj<typeof TokenFeed>;

const mockCharacters: Character[] = [
    {
        token_id: 1,
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
        infection_status: 'healthy',
        staking_status: 'unstaked',
        image_url: 'data:image/svg+xml,%3Csvg width="400" height="400" xmlns="http://www.w3.org/2000/svg"%3E%3Crect width="400" height="400" fill="%23334155"/%3E%3Ctext x="50%25" y="50%25" font-size="20" text-anchor="middle" dy=".3em" fill="%23a3a3a3"%3EGrimwald%3C/text%3E%3C/svg%3E',
    },
    {
        token_id: 2,
        name: 'Infected Wanderer',
        class: 'Rogue',
        level: 30,
        infection_status: 'infected',
        staking_status: 'unstaked',
        image_url: 'data:image/svg+xml,%3Csvg width="400" height="400" xmlns="http://www.w3.org/2000/svg"%3E%3Crect width="400" height="400" fill="%23991b1b"/%3E%3Ctext x="50%25" y="50%25" font-size="20" text-anchor="middle" dy=".3em" fill="%23fca5a5"%3EInfected%3C/text%3E%3C/svg%3E',
    },
    {
        token_id: 3,
        name: 'Survivor',
        class: 'Cleric',
        level: 50,
        infection_status: 'cured',
        staking_status: 'unstaked',
        image_url: 'data:image/svg+xml,%3Csvg width="400" height="400" xmlns="http://www.w3.org/2000/svg"%3E%3Crect width="400" height="400" fill="%23064e3b"/%3E%3Ctext x="50%25" y="50%25" font-size="20" text-anchor="middle" dy=".3em" fill="%2334d399"%3ESurvivor%3C/text%3E%3C/svg%3E',
    },
    {
        token_id: 4,
        name: 'Staked Guardian',
        class: 'Mage',
        level: 40,
        infection_status: 'healthy',
        staking_status: 'staked',
        image_url: 'data:image/svg+xml,%3Csvg width="400" height="400" xmlns="http://www.w3.org/2000/svg"%3E%3Crect width="400" height="400" fill="%231e3a8a"/%3E%3Ctext x="50%25" y="50%25" font-size="20" text-anchor="middle" dy=".3em" fill="%2393c5fd"%3EGuardian%3C/text%3E%3C/svg%3E',
    },
    {
        token_id: 5,
        name: 'Fresh Recruit',
        level: 1,
        infection_status: 'healthy',
        staking_status: 'unstaked',
        image_url: 'data:image/svg+xml,%3Csvg width="400" height="400" xmlns="http://www.w3.org/2000/svg"%3E%3Crect width="400" height="400" fill="%23334155"/%3E%3Ctext x="50%25" y="50%25" font-size="20" text-anchor="middle" dy=".3em" fill="%23a3a3a3"%3ERecruit%3C/text%3E%3C/svg%3E',
    },
];

export const Default: Story = {
    args: {
        characters: mockCharacters,
        hasMore: true,
        isLoading: false,
        onLoadMore: () => { },
    },
};

export const Loading: Story = {
    args: {
        characters: mockCharacters.slice(0, 2),
        hasMore: true,
        isLoading: true,
        onLoadMore: () => { },
    },
    parameters: {
        docs: {
            description: {
                story: 'Feed showing loading state while fetching more characters',
            },
        },
    },
};

export const Empty: Story = {
    args: {
        characters: [],
        hasMore: false,
        isLoading: false,
        onLoadMore: () => { },
    },
    parameters: {
        docs: {
            description: {
                story: 'Empty state when no characters match filters',
            },
        },
    },
};

export const SingleCharacter: Story = {
    args: {
        characters: [mockCharacters[0]],
        hasMore: false,
        isLoading: false,
        onLoadMore: () => { },
    },
    parameters: {
        docs: {
            description: {
                story: 'Feed with only one character',
            },
        },
    },
};

export const ManyCharacters: Story = {
    args: {
        characters: [
            ...mockCharacters,
            ...mockCharacters.map((c, i) => ({ ...c, token_id: c.token_id + 100 + i })),
            ...mockCharacters.map((c, i) => ({ ...c, token_id: c.token_id + 200 + i })),
        ],
        hasMore: true,
        isLoading: false,
        onLoadMore: () => { },
    },
    parameters: {
        docs: {
            description: {
                story: 'Feed with many characters showing responsive grid layout',
            },
        },
    },
};

export const NoMoreToLoad: Story = {
    args: {
        characters: mockCharacters,
        hasMore: false,
        isLoading: false,
        onLoadMore: () => { },
    },
    parameters: {
        docs: {
            description: {
                story: 'Feed with all characters loaded (no more to fetch)',
            },
        },
    },
};

export const Interactive: Story = {
    args: {
        characters: mockCharacters,
        hasMore: true,
        isLoading: false,
        onLoadMore: () => alert('Loading more characters...'),
    },
    parameters: {
        docs: {
            description: {
                story: 'Interactive demo - scroll to bottom to trigger load more',
            },
        },
    },
};
