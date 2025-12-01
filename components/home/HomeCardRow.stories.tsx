
import type { Meta, StoryObj } from '@storybook/react';
import { HomeCardRow } from './HomeCardRow';

const meta: Meta<typeof HomeCardRow> = {
    component: HomeCardRow,
    title: 'Components/Home/HomeCardRow',
    tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof HomeCardRow>;

export const Default: Story = {
    args: {},
};
