import React from 'react';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  /** Number of page links to show on each side of the current page. Defaults to 1. */
  siblingCount?: number;
}

const ELLIPSIS = 'ellipsis' as const;
type PageItem = number | typeof ELLIPSIS;

/**
 * Build the windowed page list: a fixed-width center window (`2*siblingCount+1`
 * pages) that slides inward at edges so the visible count stays consistent.
 * First and last pages are always shown; gaps become ellipses.
 *
 * Example (siblingCount=1):
 *   total=27, current=1   →  1 2 3 … 27
 *   total=27, current=14  →  1 … 13 14 15 … 27
 *   total=27, current=27  →  1 … 25 26 27
 */
function buildPageItems(currentPage: number, totalPages: number, siblingCount: number): PageItem[] {
  if (totalPages <= 1) return [1];

  // If every page would fit without ellipses, just enumerate.
  // Budget: first + last + window + 2 ellipses == 2*siblingCount + 5.
  if (totalPages <= 2 * siblingCount + 5) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  // Center the window on currentPage, then slide inward if it falls off either edge.
  let windowStart = currentPage - siblingCount;
  let windowEnd = currentPage + siblingCount;
  if (windowStart < 1) {
    windowEnd += 1 - windowStart;
    windowStart = 1;
  }
  if (windowEnd > totalPages) {
    windowStart -= windowEnd - totalPages;
    windowEnd = totalPages;
  }

  const items: PageItem[] = [];
  if (windowStart > 1) {
    items.push(1);
    if (windowStart > 2) items.push(ELLIPSIS);
  }
  for (let p = windowStart; p <= windowEnd; p++) items.push(p);
  if (windowEnd < totalPages) {
    if (windowEnd < totalPages - 1) items.push(ELLIPSIS);
    items.push(totalPages);
  }

  return items;
}

const buttonBase =
  'min-w-[2.25rem] h-9 px-2 border border-midnight-light/50 text-mist hover:text-soul-accent hover:border-soul-accent disabled:opacity-20 disabled:cursor-not-allowed transition-all duration-300 focus:outline-none focus-visible:ring-1 focus-visible:ring-soul-accent';

export const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  onPageChange,
  siblingCount = 1,
}) => {
  const items = buildPageItems(currentPage, totalPages, siblingCount);

  return (
    <nav aria-label="Pagination" className="flex items-center justify-center gap-2 font-eskapade text-sm">
      <button
        type="button"
        onClick={() => onPageChange(Math.max(1, currentPage - 1))}
        disabled={currentPage === 1}
        className={buttonBase}
        aria-label="Previous page"
      >
        PREV
      </button>

      {items.map((item, index) =>
        item === ELLIPSIS ? (
          <span
            key={`ellipsis-${index}`}
            className="min-w-[2.25rem] h-9 flex items-center justify-center text-mist/40 select-none"
            aria-hidden="true"
          >
            …
          </span>
        ) : (
          <button
            key={item}
            type="button"
            onClick={() => onPageChange(item)}
            aria-label={`Page ${item}`}
            aria-current={item === currentPage ? 'page' : undefined}
            className={`${buttonBase} ${
              item === currentPage
                ? 'border-soul-accent text-soul-accent bg-soul-accent/10'
                : ''
            }`}
          >
            {item}
          </button>
        )
      )}

      <button
        type="button"
        onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
        disabled={currentPage === totalPages}
        className={buttonBase}
        aria-label="Next page"
      >
        NEXT
      </button>
    </nav>
  );
};
