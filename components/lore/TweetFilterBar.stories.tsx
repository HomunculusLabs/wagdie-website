import type { Meta, StoryObj } from '@storybook/react';
import { TweetFilterBar } from './TweetFilterBar';

const meta: Meta<typeof TweetFilterBar> = {
    component: TweetFilterBar,
    title: 'Components/Lore/TweetFilterBar',
    tags: ['autodocs'],
    argTypes: {
        currentTab: {
            control: 'select',
            options: ['all', 'text', 'video'],
            description: 'Current tab filter',
        },
        currentSort: {
            control: 'select',
            options: ['asc', 'desc'],
            description: 'Sort order',
        },
        translationEnabled: {
            control: 'boolean',
            description: 'Translation toggle state',
        },
        onTabChange: {
            action: 'tab changed',
            description: 'Tab change callback',
        },
        onSortChange: {
            action: 'sort changed',
            description: 'Sort change callback',
        },
        onTranslationToggle: {
            action: 'translation toggled',
            description: 'Translation toggle callback',
        },
    },
};

export default meta;
type Story = StoryObj<typeof TweetFilterBar>;

export const Default: Story = {
    args: {
        currentTab: 'all',
        currentSort: 'desc',
        translationEnabled: false,
        onTabChange: () => { },
        onSortChange: () => { },
        onTranslationToggle: () => { },
    },
};

export const VideoFilter: Story = {
    args: {
        currentTab: 'video',
        currentSort: 'desc',
        translationEnabled: false,
        onTabChange: () => { },
        onSortChange: () => { },
        onTranslationToggle: () => { },
    },
};

export const WithTranslation: Story = {
    args: {
        currentTab: 'all',
        currentSort: 'desc',
        translationEnabled: true,
        onTabChange: () => { },
        onSortChange: () => { },
        onTranslationToggle: () => { },
    },
};
