// Card stories - to be implemented
import type { Meta, StoryObj } from '@storybook/react';
import React from 'react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from './Card';

const meta: Meta<typeof Card> = {
  title: 'UI/Card',
  component: Card,
  tags: ['autodocs'],
};

export default meta;

type Story = StoryObj<typeof Card>;

export const Basic: Story = {
  render: () => (
    <Card className='max-w-md'>
      <CardHeader>
        <CardTitle>Echo Log</CardTitle>
        <CardDescription>Recent transmissions from the field.</CardDescription>
      </CardHeader>
      <CardContent>
        <p className='text-sm text-neutral-400 font-eskapade'>
          Signal is stable. Ambient noise reduced. Awaiting further directives.
        </p>
      </CardContent>
    </Card>
  ),
};

export const Full: Story = {
  render: () => (
    <Card className='max-w-md'>
      <CardHeader>
        <CardTitle>Staking Status</CardTitle>
        <CardDescription>Track the state of your active character.</CardDescription>
      </CardHeader>
      <CardContent className='space-y-3'>
        <div className='flex items-center justify-between text-sm font-eskapade text-neutral-400'>
          <span>Active</span>
          <span className='text-soul-accent'>Yes</span>
        </div>
        <div className='flex items-center justify-between text-sm font-eskapade text-neutral-400'>
          <span>Yield</span>
          <span>2.4%</span>
        </div>
      </CardContent>
      <CardFooter className='justify-end gap-2'>
        <button className='px-3 py-1.5 text-xs border border-neutral-700 text-neutral-400 hover:text-neutral-200'>
          Details
        </button>
        <button className='px-3 py-1.5 text-xs border border-soul-accent/50 text-soul-accent'>
          Claim
        </button>
      </CardFooter>
    </Card>
  ),
};

export const Stacked: Story = {
  render: () => (
    <div className='grid gap-4 md:grid-cols-2'>
      <Card>
        <CardHeader>
          <CardTitle>Ledger</CardTitle>
          <CardDescription>Inventory overview.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className='flex items-center justify-between text-sm font-eskapade text-neutral-400'>
            <span>Relics</span>
            <span>12</span>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Ward</CardTitle>
          <CardDescription>Sanctuary integrity.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className='h-2 w-full bg-neutral-900 border border-neutral-800'>
            <div className='h-full w-2/3 bg-soul-accent/60' />
          </div>
        </CardContent>
      </Card>
    </div>
  ),
};
