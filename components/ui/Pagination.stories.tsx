// Pagination stories
import type { Meta, StoryObj } from '@storybook/react';
import { Pagination } from './Pagination';

const meta: Meta<typeof Pagination> = {
  title: 'UI/Pagination',
  component: Pagination,
  tags: ['autodocs'],
};

export default meta;

type Story = StoryObj<typeof Pagination>;

const handlePageChange = (_page: number) => {};

export const Default: Story = {
  args: {
    currentPage: 3,
    totalPages: 8,
    onPageChange: handlePageChange,
  },
};

export const FirstPage: Story = {
  args: {
    currentPage: 1,
    totalPages: 8,
    onPageChange: handlePageChange,
  },
};

export const LastPage: Story = {
  args: {
    currentPage: 8,
    totalPages: 8,
    onPageChange: handlePageChange,
  },
};

export const ManyPages: Story = {
  args: {
    currentPage: 12,
    totalPages: 24,
    onPageChange: handlePageChange,
  },
};
