
import type { Meta, StoryObj } from '@storybook/react';
import { SpreadInfect } from './SpreadInfect';

const meta: Meta<typeof SpreadInfect> = {
    component: SpreadInfect,
    title: 'Components/Spread/SpreadInfect',
    tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof SpreadInfect>;

export const Default: Story = {
    args: {},
};
