import type { SearingApprovalStatus } from '@/lib/services/blockchain/searing';
import { Button } from '@/components/ui/Button';

interface SearingApprovalPanelProps {
  approvalStatus: SearingApprovalStatus | null;
  isApproving?: boolean;
  onApprove: () => void | Promise<void>;
}

function ApprovalLine({ label, approved }: { label: string; approved: boolean }) {
  return (
    <p className="flex items-center justify-between gap-3 text-xs text-yellow-100/80 font-eskapade">
      <span>{label}</span>
      <span className={approved ? 'text-emerald-400' : 'text-yellow-300'}>
        {approved ? 'approved' : 'needed'}
      </span>
    </p>
  );
}

export function SearingApprovalPanel({
  approvalStatus,
  isApproving = false,
  onApprove,
}: SearingApprovalPanelProps) {
  if (approvalStatus?.isFullyApproved) {
    return (
      <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-4">
        <p className="text-sm text-emerald-400 font-eskapade">Searing contract access approved.</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-yellow-500/20 bg-yellow-500/5 p-4">
      <p className="mb-3 text-sm text-yellow-400 font-eskapade">
        Before searing, approve the Searing contract to use your WAGDIE and Concord tokens.
      </p>
      <div className="mb-3 space-y-1">
        <ApprovalLine label="WAGDIE approval" approved={approvalStatus?.isWagdieApproved ?? false} />
        <ApprovalLine label="Concord approval" approved={approvalStatus?.isConcordApproved ?? false} />
      </div>
      <Button
        onClick={onApprove}
        disabled={isApproving}
        isLoading={isApproving}
        variant="danger"
        className="w-full"
      >
        Approve Contract
      </Button>
    </div>
  );
}
