// Layout stories - to be implemented
import type { Meta, StoryObj } from '@storybook/react';
import React from 'react';
import { Layout } from './Layout';
import { Heading, Text } from './Typography';

const meta: Meta<typeof Layout> = {
  title: 'UI/Layout',
  component: Layout,
  tags: ['autodocs'],
};

export default meta;

type Story = StoryObj<typeof Layout>;

export const Default: Story = {
  render: () => (
    <Layout>
      <div className='space-y-6'>
        <Heading level={2}>Mission Console</Heading>
        <Text>
          The layout component frames route content with the soul vignette
          and center-aligned column structure.
        </Text>
        <div className='p-4 border border-neutral-800 bg-black/40'>
          <Text variant='body-sm'>Primary content surface</Text>
        </div>
      </div>
    </Layout>
  ),
};

export const WithSections: Story = {
  render: () => (
    <Layout>
      <div className='space-y-8'>
        <section className='space-y-3'>
          <Heading level={3}>Status</Heading>
          <Text variant='body-sm'>All channels synchronized.</Text>
        </section>
        <section className='grid gap-4 md:grid-cols-2'>
          <div className='p-4 border border-neutral-800 bg-black/30'>
            <Text variant='caption'>Module A</Text>
            <Text variant='body-sm'>Calibration complete.</Text>
          </div>
          <div className='p-4 border border-neutral-800 bg-black/30'>
            <Text variant='caption'>Module B</Text>
            <Text variant='body-sm'>Awaiting signal input.</Text>
          </div>
        </section>
      </div>
    </Layout>
  ),
};
