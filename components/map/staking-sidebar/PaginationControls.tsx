'use client';

import { Button } from '@/components/ui';
import type { SetPage } from '@/hooks/map/useMapStakingPanel';

interface PaginationControlsProps {
  page: number;
  totalPages: number;
  startIndex: number;
  endIndex: number;
  totalCharacters: number;
  isLoadingStatuses: boolean;
  setPage: SetPage;
}

export function PaginationControls({
  page,
  totalPages,
  startIndex,
  endIndex,
  totalCharacters,
  isLoadingStatuses,
  setPage,
}: PaginationControlsProps) {
  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-between pt-3 mt-2 border-t border-neutral-800/50">
      <span className="text-sm text-neutral-500 font-eskapade">
        Showing <span className="text-neutral-400">{startIndex + 1}-{endIndex}</span> of <span className="text-neutral-400">{totalCharacters}</span>
      </span>
      <div className="flex items-center gap-1.5">
        <Button
          variant="secondary"
          size="sm"
          onClick={() => setPage(p => Math.max(0, p - 1))}
          disabled={page === 0 || isLoadingStatuses}
          className="px-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </Button>
        <span className="text-sm text-neutral-500 font-eskapade px-2">
          {page + 1} / {totalPages}
        </span>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
          disabled={page >= totalPages - 1 || isLoadingStatuses}
          className="px-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </Button>
      </div>
    </div>
  );
}
