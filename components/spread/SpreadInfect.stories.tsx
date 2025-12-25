import type { Meta, StoryObj } from '@storybook/react';
import { SpreadInfect } from './SpreadInfect';

const meta: Meta<typeof SpreadInfect> = {
    component: SpreadInfect,
    title: 'Components/Spread/SpreadInfect',
    tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof SpreadInfect>;

const baseArgs = {
    mushroomBalance: 25,
    corpseBalance: 10,
    mode: 'spread' as const,
    onSpread: (_amount: number) => {},
    onInfect: (_tokenId: number) => {},
    infectionPrice: '0.01',
};

export const Default: Story = {
    args: {
        ...baseArgs,
    },
};

export const InfectMode: Story = {
    args: {
        ...baseArgs,
        mode: 'infect',
    },
};

export const ZeroBalance: Story = {
    args: {
        ...baseArgs,
        mushroomBalance: 0,
        corpseBalance: 0,
    },
};
