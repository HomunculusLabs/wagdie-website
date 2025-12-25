// Empty stories - to be implemented
import type { Meta, StoryObj } from '@storybook/react';
import React from 'react';
import { Empty } from './Empty';

const meta: Meta<typeof Empty> = {
  title: 'UI/Empty',
  component: Empty,
  tags: ['autodocs'],
};

export default meta;

type Story = StoryObj<typeof Empty>;

const SignalIcon = (
  <svg xmlns='http://www.w3.org/2000/svg' width='48' height='48' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='1' strokeLinecap='round' strokeLinejoin='round'>
    <path d='M4 20l16-16' />
    <path d='M7 17l10-10' />
    <path d='M10 14l4-4' />
    <circle cx='12' cy='12' r='10' />
  </svg>
);

export const Default: Story = {
  args: {
    message: 'No transmissions detected.',
  },
};

export const WithCustomIcon: Story = {
  args: {
    message: 'Signal lost. Recalibrate the antenna.',
    icon: SignalIcon,
  },
};

export const StyledContainer: Story = {
  args: {
    message: 'Search returned no results.',
    className: 'bg-neutral-950/70',
  },
};
