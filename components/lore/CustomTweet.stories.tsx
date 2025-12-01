
import type { Meta, StoryObj } from '@storybook/react';
import { CustomTweet } from './CustomTweet';

const meta: Meta<typeof CustomTweet> = {
    component: CustomTweet,
    title: 'Components/Lore/CustomTweet',
    tags: ['autodocs'],
    argTypes: {
        tweet: {
            control: 'object',
            description: 'Tweet data object',
        },
    },
};

export default meta;
type Story = StoryObj<typeof CustomTweet>;

const mockTweet = {
    tweet_id: '1',
    text: 'The darkness spreads... Will you survive?',
    author_username: 'WAGDIE_ETH',
    created_at: '2024-01-01T00:00:00Z',
    media_type: 'none' as const,
    media_url: null,
    video_url: null,
    engagement_count: {
        likes: 420,
        retweets: 69,
        replies: 10,
    },
    is_reply: false,
    is_retweet: false,
    fetched_at: '2024-01-01T00:00:00Z',
};

export const Default: Story = {
    args: {
        tweet: mockTweet,
    },
};

export const WithMedia: Story = {
    args: {
        tweet: {
            ...mockTweet,
            media_type: 'image' as const,
            media_url: 'https://via.placeholder.com/600x400',
        },
    },
};
