import type { Meta, StoryObj } from '@storybook/react';
import React from 'react';
import { AspectRatio } from './AspectRatio';

const meta: Meta<typeof AspectRatio> = {
  title: 'UI/AspectRatio',
  component: AspectRatio,
  tags: ['autodocs'],
};

export default meta;

type Story = StoryObj<typeof AspectRatio>;

const Frame = ({ label }: { label: string }) => (
  <div className='w-full h-full bg-neutral-950 border border-neutral-800 flex items-center justify-center text-neutral-400 font-eskapade text-sm tracking-wider'>
    {label}
  </div>
);

export const SixteenByNine: Story = {
  render: () => (
    <div className='max-w-xl'>
      <AspectRatio ratio={16 / 9}>
        <Frame label='16:9 Frame' />
      </AspectRatio>
    </div>
  ),
};

export const FourByThree: Story = {
  render: () => (
    <div className='max-w-lg'>
      <AspectRatio ratio={4 / 3}>
        <Frame label='4:3 Frame' />
      </AspectRatio>
    </div>
  ),
};

export const Square: Story = {
  render: () => (
    <div className='max-w-sm'>
      <AspectRatio ratio={1}>
        <Frame label='1:1 Frame' />
      </AspectRatio>
    </div>
  ),
};
