'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import type { LoreSubmissionDetailDto } from '@/types/lore-submission';

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  details?: string | string[];
}

type ReviewAction = 'request_changes' | 'reject' | 'admin_note';

export interface LoreSubmissionReviewPanelProps {
  detail: LoreSubmissionDetailDto;
  onUpdated: (detail: LoreSubmissionDetailDto) => void;
}

async function readApiData<T>(response: Response, fallback: string): Promise<T> {
  const body = await response.json().catch(() => undefined) as ApiResponse<T> | undefined;
  if (!response.ok || !body?.success || body.data === undefined) {
    const details = Array.isArray(body?.details) ? body.details.join('\n') : body?.details;
    throw new Error(details || body?.error || fallback);
  }
  return body.data;
}

const actionLabels: Record<ReviewAction, string> = {
  request_changes: 'Request changes',
  reject: 'Close / reject',
  admin_note: 'Add admin note',
};

export function LoreSubmissionReviewPanel({ detail, onUpdated }: LoreSubmissionReviewPanelProps) {
  const [note, setNote] = useState('');
  const [busyAction, setBusyAction] = useState<ReviewAction | null>(null);
  const [error, setError] = useState<string | null>(null);

  const submitReview = async (action: ReviewAction) => {
    setBusyAction(action);
    setError(null);

    try {
      const response = await fetch(`/api/admin/lore/submissions/${encodeURIComponent(detail.submission.id)}/review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, note: note.trim() || undefined }),
      });
      const updated = await readApiData<LoreSubmissionDetailDto>(response, `Failed to ${actionLabels[action].toLowerCase()}`);
      setNote('');
      onUpdated(updated);
    } catch (reviewError) {
      setError(reviewError instanceof Error ? reviewError.message : `Failed to ${actionLabels[action].toLowerCase()}`);
    } finally {
      setBusyAction(null);
    }
  };

  const status = detail.submission.status;
  const canReviewSubmitted = status === 'submitted';
  const canClose = status === 'submitted' || status === 'changes_requested' || status === 'public';

  return (
    <section className="space-y-4 rounded-xl border border-soul-accent/20 bg-soul-shadow/70 p-5">
      <div>
        <h2 className="font-display text-xl text-soul-accent">Review actions</h2>
        <p className="mt-1 text-sm text-soul-mist/70">
Public submissions are already community lore. Use this panel to request changes, close/reject, or append an audit note.
        </p>
      </div>

      {error && <div role="alert" className="rounded border border-soul-ember/40 bg-soul-ember/10 p-3 text-sm whitespace-pre-line text-soul-ember">{error}</div>}

      <label className="block space-y-1 text-sm text-soul-mist">
        <span className="font-display uppercase tracking-wide">Review note</span>
        <textarea
          value={note}
          onChange={(event) => setNote(event.target.value)}
          rows={4}
          className="w-full rounded border border-soul-accent/20 bg-abyss/60 px-3 py-2 text-soul-bone focus:border-soul-accent focus:outline-none"
        />
      </label>

      <div className="grid gap-2 sm:grid-cols-2">
        <Button type="button" variant="secondary" onClick={() => submitReview('request_changes')} disabled={!canReviewSubmitted} isLoading={busyAction === 'request_changes'}>
          Request changes
        </Button>
        <Button type="button" variant="danger" onClick={() => submitReview('reject')} disabled={!canClose} isLoading={busyAction === 'reject'}>
          Close / reject
        </Button>
        <Button type="button" variant="secondary" onClick={() => submitReview('admin_note')} isLoading={busyAction === 'admin_note'}>
          Add note
        </Button>
      </div>
    </section>
  );
}
