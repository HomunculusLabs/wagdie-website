// Typography stories - to be implemented
import type { Meta, StoryObj } from '@storybook/react';
import React from 'react';
import { Heading, Text, Blockquote } from './Typography';

const meta: Meta<typeof Heading> = {
  title: 'UI/Typography',
  component: Heading,
  tags: ['autodocs'],
};

export default meta;

type Story = StoryObj<typeof Heading>;

export const Headings: Story = {
  render: () => (
    <div className='space-y-3'>
      <Heading level={1}>Heading Level 1</Heading>
      <Heading level={2}>Heading Level 2</Heading>
      <Heading level={3}>Heading Level 3</Heading>
      <Heading level={4}>Heading Level 4</Heading>
    </div>
  ),
};

export const TextVariants: Story = {
  render: () => (
    <div className='space-y-2'>
      <Text variant='body'>Body text for primary narrative.</Text>
      <Text variant='body-sm'>Body small for compact layouts.</Text>
      <Text variant='caption'>Caption metadata and timestamps.</Text>
      <Text variant='tiny'>Tiny labels for micro UI.</Text>
      <Text variant='body' muted>
        Muted body copy for secondary notes.
      </Text>
    </div>
  ),
};

export const BlockquoteExample: Story = {
  render: () => (
    <Blockquote cite='Archive 07'>
      The echo does not fade. It learns the shape of the room.
    </Blockquote>
  ),
};
