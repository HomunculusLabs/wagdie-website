import { Button } from '@/components/ui/Button';
import type { SearingSyncState } from './searing-sync-state';

interface SearingOffchainStatusProps {
  state: SearingSyncState;
  onRetry?: () => void | Promise<void>;
  isRetrying?: boolean;
}

export function SearingOffchainStatus({
  state,
  onRetry,
  isRetrying = false,
}: SearingOffchainStatusProps) {
  if (state.status === 'idle') return null;

  const styles = {
    syncing: 'border-blue-500/20 bg-blue-500/5 text-blue-300',
    completed: 'border-emerald-500/20 bg-emerald-500/5 text-emerald-300',
    pending: 'border-yellow-500/20 bg-yellow-500/5 text-yellow-300',
    completed_without_image: 'border-orange-500/20 bg-orange-500/5 text-orange-300',
    failed: 'border-orange-500/20 bg-orange-500/5 text-orange-300',
  } as const;

  const title = {
    syncing: 'Syncing seared artwork…',
    completed: 'Seared artwork synced',
    pending: 'On-chain searing confirmed; artwork sync pending',
    completed_without_image: 'Seared event synced; artwork URL missing',
    failed: 'On-chain searing confirmed; artwork sync failed',
  }[state.status];

  const message = state.message ?? (
    state.status === 'syncing'
      ? 'The transaction succeeded. Now materializing the seared image and character metadata.'
      : state.status === 'completed'
        ? 'The seared character image and metadata were updated successfully.'
        : state.status === 'completed_without_image'
          ? 'The chain event is confirmed, but the materialized seared image URL was not returned. Retry off-chain sync to repair it.'
          : 'The transaction is not failed. You can retry the off-chain sync later.'
  );

  return (
    <div className={`rounded-lg border p-4 ${styles[state.status]}`}>
      <p className="text-sm font-eskapade">{title}</p>
      <p className="mt-1 text-xs font-eskapade opacity-80">{message}</p>
      {(state.status === 'pending' || state.status === 'completed_without_image' || state.status === 'failed') && onRetry && (
        <Button
          type="button"
          variant="secondary"
          size="sm"
          isLoading={isRetrying}
          disabled={isRetrying}
          onClick={onRetry}
          className="mt-3"
        >
          Retry off-chain sync
        </Button>
      )}
    </div>
  );
}
