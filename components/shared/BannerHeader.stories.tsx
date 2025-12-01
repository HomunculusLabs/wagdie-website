
import type { Meta, StoryObj } from '@storybook/react';
import { BannerHeader } from './BannerHeader';

const meta: Meta<typeof BannerHeader> = {
    component: BannerHeader,
    title: 'Components/Shared/BannerHeader',
    tags: ['autodocs'],
    argTypes: {
        title: {
            control: 'text',
            description: 'Banner title',
        },
        subtitle: {
            control: 'text',
            description: 'Banner subtitle',
        },
    },
};

export default meta;
type Story = StoryObj<typeof BannerHeader>;

export const Default: Story = {
    args: {
        title: 'We All Gonna Die',
        subtitle: 'A dark fantasy NFT collection',
    },
};

export const WithoutSubtitle: Story = {
    args: {
        title: 'Characters',
    },
};
