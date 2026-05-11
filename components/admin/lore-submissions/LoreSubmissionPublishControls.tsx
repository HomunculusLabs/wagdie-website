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

type PublishAction = 'canonize' | 'decanonize' | 'unpublish';

export interface LoreSubmissionPublishControlsProps {
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

const labels: Record<PublishAction, string> = {
  canonize: 'Canonize',
  decanonize: 'Decanonize',
  unpublish: 'Unpublish / hide',
};

export function LoreSubmissionPublishControls({ detail, onUpdated }: LoreSubmissionPublishControlsProps) {
  const [note, setNote] = useState('');
  const [busyAction, setBusyAction] = useState<PublishAction | null>(null);
  const [error, setError] = useState<string | null>(null);

  const submitAction = async (action: PublishAction) => {
    setBusyAction(action);
    setError(null);

    try {
      const response = await fetch(`/api/admin/lore/submissions/${encodeURIComponent(detail.submission.id)}/${action}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ note: note.trim() || undefined }),
      });
      const updated = await readApiData<LoreSubmissionDetailDto>(response, `Failed to ${labels[action].toLowerCase()}`);
      setNote('');
      onUpdated(updated);
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : `Failed to ${labels[action].toLowerCase()}`);
    } finally {
      setBusyAction(null);
    }
  };

  const status = detail.submission.status;

  return (
    <section className="space-y-4 rounded-xl border border-soul-accent/20 bg-soul-shadow/70 p-5">
      <div>
        <h2 className="font-display text-xl text-soul-accent">Publication controls</h2>
        <p className="mt-1 text-sm text-soul-mist/70">
          Promote public community lore to canon, decanonize it back to community, or hide public community lore.
        </p>
      </div>

      {error && <div role="alert" className="rounded border border-soul-ember/40 bg-soul-ember/10 p-3 text-sm whitespace-pre-line text-soul-ember">{error}</div>}

      <label className="block space-y-1 text-sm text-soul-mist">
        <span className="font-display uppercase tracking-wide">Action note</span>
        <textarea
          value={note}
          onChange={(event) => setNote(event.target.value)}
          rows={3}
          className="w-full rounded border border-soul-accent/20 bg-abyss/60 px-3 py-2 text-soul-bone focus:border-soul-accent focus:outline-none"
        />
      </label>

      <div className="grid gap-2 sm:grid-cols-2">
        <Button type="button" onClick={() => submitAction('canonize')} disabled={status !== 'public'} isLoading={busyAction === 'canonize'}>
          Canonize
        </Button>
        <Button type="button" variant="secondary" onClick={() => submitAction('decanonize')} disabled={status !== 'canonized'} isLoading={busyAction === 'decanonize'}>
          Decanonize
        </Button>
        <Button type="button" variant="danger" onClick={() => submitAction('unpublish')} disabled={status !== 'public'} isLoading={busyAction === 'unpublish'}>
          Unpublish / hide
        </Button>
      </div>
    </section>
  );
}
