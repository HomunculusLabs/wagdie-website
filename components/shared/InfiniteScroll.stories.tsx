import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { InfiniteScroll } from './InfiniteScroll';

const meta: Meta<typeof InfiniteScroll> = {
    component: InfiniteScroll,
    title: 'Components/Shared/InfiniteScroll',
    tags: ['autodocs'],
    argTypes: {
        hasMore: {
            control: 'boolean',
            description: 'Whether there are more items to load',
        },
        isLoading: {
            control: 'boolean',
            description: 'Whether currently loading',
        },
        onLoadMore: {
            action: 'load more',
            description: 'Callback to load more items',
        },
    },
};

export default meta;
type Story = StoryObj<typeof InfiniteScroll>;

const sampleItems = Array.from({ length: 20 }, (_, i) => (
    <div key={i} className="p-4 border border-neutral-800 mb-2">
        Item {i + 1}
    </div>
));

export const Default: Story = {
    args: {
        hasMore: true,
        isLoading: false,
        onLoadMore: () => { },
        children: sampleItems,
    },
};

export const Loading: Story = {
    args: {
        hasMore: true,
        isLoading: true,
        onLoadMore: () => { },
        children: sampleItems.slice(0, 10),
    },
};

export const NoMore: Story = {
    args: {
        hasMore: false,
        isLoading: false,
        onLoadMore: () => { },
        children: sampleItems,
    },
    parameters: {
        docs: {
            description: {
                story: 'All items loaded - no more to fetch',
            },
        },
    },
};
