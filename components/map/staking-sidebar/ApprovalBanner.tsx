'use client';

import { Button, Spinner } from '@/components/ui';
import type { ApprovalState } from '@/hooks/map/useMapStakingPanel';

interface ApprovalBannerProps {
  approvalState: ApprovalState;
  approvalError: string | null;
  isApproving: boolean;
  handleApprove: () => Promise<void>;
}

export function ApprovalReadyBanner() {
  return (
    <div className="rounded-lg bg-gradient-to-r from-green-500/10 to-transparent border border-green-500/20 p-3">
      <div className="flex items-center gap-2">
        <div className="w-6 h-6 rounded-full bg-green-500/20 border border-green-500/30 flex items-center justify-center shrink-0">
          <svg className="w-3.5 h-3.5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <p className="text-sm text-green-300 font-eskapade">Wallet approved — choose an unstaked character.</p>
      </div>
    </div>
  );
}

export function ApprovalBanner({
  approvalState,
  approvalError,
  isApproving,
  handleApprove,
}: ApprovalBannerProps) {
  return (
    <div className="rounded-lg bg-gradient-to-r from-soul-accent/5 to-transparent border border-soul-accent/20 p-4">
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 rounded-full bg-soul-accent/10 border border-soul-accent/30 flex items-center justify-center shrink-0">
          {(approvalState === 'idle' || approvalState === 'checking') ? (
            <Spinner size="sm" />
          ) : approvalState === 'error' ? (
            <svg className="w-4 h-4 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          ) : (
            <svg className="w-4 h-4 text-soul-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          )}
        </div>
        <div className="flex-1 min-w-0">
          {(approvalState === 'idle' || approvalState === 'checking') && (
            <>
              <p className="text-base text-neutral-300 font-eskapade">Checking approval...</p>
              <p className="text-sm text-neutral-500 font-eskapade mt-0.5">Verifying one-time staking permission</p>
            </>
          )}
          {approvalState === 'not_approved' && (
            <>
              <p className="text-base text-neutral-200 font-eskapade">Contract approval required</p>
              <p className="text-sm text-neutral-500 font-eskapade mt-0.5">Approve once, then choose a character to stake here.</p>
            </>
          )}
          {approvalState === 'error' && (
            <>
              <p className="text-base text-red-300 font-eskapade">Approval check failed</p>
              <p className="text-sm text-neutral-500 font-eskapade mt-0.5">{approvalError || 'Please try again'}</p>
            </>
          )}
        </div>
        <Button
          size="sm"
          onClick={handleApprove}
          disabled={approvalState === 'idle' || approvalState === 'checking' || isApproving}
          className="shrink-0"
        >
          {isApproving ? 'Approving…' : 'Approve'}
        </Button>
      </div>
    </div>
  );
}
