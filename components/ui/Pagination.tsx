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
        className="px-3 py-1 border border-midnight-light/50 text-mist hover:text-soul-accent hover:border-soul-accent disabled:opacity-20 disabled:cursor-not-allowed transition-all duration-300 focus:outline-none focus-visible:ring-1 focus-visible:ring-soul-accent"
        aria-label="Previous page"
      >
        PREV
      </button>
      
      <div className="flex items-center gap-2 px-6 text-mist border-x border-midnight-light/20">
        <span className="text-soul-accent font-display">{currentPage}</span>
        <span className="text-mist/30">/</span>
        <span className="text-ash">{totalPages}</span>
      </div>

      <button
        onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
        disabled={currentPage === totalPages}
        className="px-3 py-1 border border-midnight-light/50 text-mist hover:text-soul-accent hover:border-soul-accent disabled:opacity-20 disabled:cursor-not-allowed transition-all duration-300 focus:outline-none focus-visible:ring-1 focus-visible:ring-soul-accent"
        aria-label="Next page"
      >
        NEXT
      </button>
    </div>
  );
};
