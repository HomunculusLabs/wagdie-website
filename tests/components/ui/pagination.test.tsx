import { fireEvent, render, screen } from '@testing-library/react';
import { Pagination } from '@/components/ui/Pagination';

function renderPagination(currentPage: number, totalPages: number, onChange = jest.fn()) {
  render(<Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={onChange} />);
  return { onChange };
}

function visibleNumbers(): number[] {
  return Array.from(screen.queryAllByRole('button'))
    .map((b) => b.getAttribute('aria-label'))
    .filter((label): label is string => Boolean(label?.startsWith('Page ')))
    .map((label) => Number(label.replace('Page ', '')));
}

function ellipsisCount(): number {
  return screen.queryAllByText('…').length;
}

describe('Pagination', () => {
  it('shows every page when total is small enough to skip ellipses', () => {
    renderPagination(1, 5);
    expect(visibleNumbers()).toEqual([1, 2, 3, 4, 5]);
    expect(ellipsisCount()).toBe(0);
  });

  it('windows pages near the start with a trailing ellipsis', () => {
    renderPagination(1, 27);
    expect(visibleNumbers()).toEqual([1, 2, 3, 27]);
    expect(ellipsisCount()).toBe(1);
  });

  it('windows pages near the end with a leading ellipsis', () => {
    renderPagination(27, 27);
    expect(visibleNumbers()).toEqual([1, 25, 26, 27]);
    expect(ellipsisCount()).toBe(1);
  });

  it('shows leading and trailing ellipses around a middle page', () => {
    renderPagination(14, 27);
    expect(visibleNumbers()).toEqual([1, 13, 14, 15, 27]);
    expect(ellipsisCount()).toBe(2);
  });

  it('disables PREV on the first page and NEXT on the last page', () => {
    const { onChange, ...rest } = { onChange: jest.fn() };
    render(<Pagination currentPage={1} totalPages={5} onPageChange={onChange} />);
    const prev = screen.getByRole('button', { name: /previous page/i });
    const next = screen.getByRole('button', { name: /next page/i });
    expect(prev).toBeDisabled();
    expect(next).not.toBeDisabled();
  });

  it('flags the current page with aria-current', () => {
    renderPagination(3, 5);
    const current = screen.getByRole('button', { name: 'Page 3' });
    expect(current).toHaveAttribute('aria-current', 'page');
  });

  it('calls onPageChange with the clicked page number', () => {
    const onChange = jest.fn();
    render(<Pagination currentPage={3} totalPages={5} onPageChange={onChange} />);
    fireEvent.click(screen.getByRole('button', { name: 'Page 5' }));
    expect(onChange).toHaveBeenCalledWith(5);
  });
});
