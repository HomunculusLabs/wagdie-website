// Separator stories - to be implemented
import type { Meta, StoryObj } from '@storybook/react';
import React from 'react';
import { Separator } from './Separator';

const meta: Meta<typeof Separator> = {
  title: 'UI/Separator',
  component: Separator,
  tags: ['autodocs'],
};

export default meta;

type Story = StoryObj<typeof Separator>;

export const Horizontal: Story = {
  render: () => (
    <div className='space-y-4'>
      <div className='text-sm font-eskapade text-neutral-400'>Section One</div>
      <Separator />
      <div className='text-sm font-eskapade text-neutral-400'>Section Two</div>
    </div>
  ),
};

export const Styled: Story = {
  render: () => (
    <div className='space-y-4'>
      <div className='text-sm font-eskapade text-neutral-400'>Signal A</div>
      <Separator className='bg-soul-accent/40' />
      <div className='text-sm font-eskapade text-neutral-400'>Signal B</div>
    </div>
  ),
};
