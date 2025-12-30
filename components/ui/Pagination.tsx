import React from 'react';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export const Pagination: React.FC<PaginationProps> = ({ currentPage, totalPages, onPageChange }) => {
  return (
    <div className="flex items-center justify-center gap-2 font-eskapade text-sm">
      <button
        onClick={() => onPageChange(Math.max(1, currentPage - 1))}
        disabled={currentPage === 1}
        className="p-2 border border-neutral-800 text-neutral-500 hover:text-soul-accent hover:border-soul-accent disabled:opacity-30 disabled:hover:text-neutral-500 disabled:hover:border-neutral-800 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-soul-accent focus-visible:ring-offset-2 focus-visible:ring-offset-soul-950"
        aria-label="Previous page"
      >
        Prev
      </button>
      
      <div className="flex items-center gap-1 px-4 text-neutral-400">
        <span className="text-soul-accent">{currentPage}</span>
        <span className="text-neutral-600">/</span>
        <span>{totalPages}</span>
      </div>

      <button
        onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
        disabled={currentPage === totalPages}
        className="p-2 border border-neutral-800 text-neutral-500 hover:text-soul-accent hover:border-soul-accent disabled:opacity-30 disabled:hover:text-neutral-500 disabled:hover:border-neutral-800 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-soul-accent focus-visible:ring-offset-2 focus-visible:ring-offset-soul-950"
        aria-label="Next page"
      >
        Next
      </button>
    </div>
  );
};
