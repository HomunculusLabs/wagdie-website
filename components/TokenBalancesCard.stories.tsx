
import type { Meta, StoryObj } from '@storybook/react';
import { TokenBalancesCard } from './TokenBalancesCard';

const meta: Meta<typeof TokenBalancesCard> = {
  component: TokenBalancesCard,
  title: 'Components/Wallet/TokenBalancesCard',
  tags: ['autodocs'],
  argTypes: {
    className: {
      control: 'text',
      description: 'Additional CSS classes',
    },
  },
};

export default meta;
type Story = StoryObj<typeof TokenBalancesCard>;

export const Default: Story = {
  args: {
    className: '',
  },
  parameters: {
    docs: {
      description: {
        story: 'Displays ERC1155 token balances. Shows loading state, error state, or token list based on wallet connection and data.',
      },
    },
  },
};

export const WithCustomStyling: Story = {
  args: {
    className: 'max-w-md mx-auto',
  },
  name: 'With Custom Styling',
};
