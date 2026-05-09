'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { useAuth } from '@/hooks/useAuth';
import type { LoreSubmissionListItemDto } from '@/types/lore-submission';
import { SubmissionStatusBadge } from './SubmissionStatusBadge';

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  details?: string | string[];
}

async function readApiData<T>(response: Response, fallback: string): Promise<T> {
  const body = await response.json().catch(() => undefined) as ApiResponse<T> | undefined;
  if (!response.ok || !body?.success || body.data === undefined) {
    throw new Error(body?.error || fallback);
  }
  return body.data;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(value));
}

export function UserSubmissionsList() {
  const auth = useAuth();
  const [submissions, setSubmissions] = useState<LoreSubmissionListItemDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!auth.isAuthenticated) return;

    let mounted = true;
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch('/api/lore/submissions', { cache: 'no-store' });
        const data = await readApiData<{ submissions: LoreSubmissionListItemDto[] }>(response, 'Failed to load submissions');
        if (mounted) setSubmissions(data.submissions);
      } catch (loadError) {
        if (mounted) setError(loadError instanceof Error ? loadError.message : 'Failed to load submissions');
      } finally {
        if (mounted) setLoading(false);
      }
    };

    load();
    return () => {
      mounted = false;
    };
  }, [auth.isAuthenticated]);

  if (!auth.isConnected) {
    return (
      <section className="rounded-xl border border-soul-accent/20 bg-soul-shadow/70 p-8 text-center">
        <h2 className="font-display text-2xl text-soul-accent">Connect wallet</h2>
        <p className="mt-3 text-sm text-soul-mist/75">Use the wallet that submitted your community lore.</p>
        <Button type="button" onClick={auth.connect} className="mt-6">Connect Wallet</Button>
      </section>
    );
  }

  if (!auth.isAuthenticated) {
    return (
      <section className="rounded-xl border border-soul-accent/20 bg-soul-shadow/70 p-8 text-center">
        <h2 className="font-display text-2xl text-soul-accent">Sign in required</h2>
        <p className="mt-3 text-sm text-soul-mist/75">Sign a message to view your private submission queue.</p>
        {auth.error && <p className="mt-3 text-sm text-soul-ember">{auth.error.message}</p>}
        <Button type="button" onClick={auth.authenticate} isLoading={auth.isAuthenticating} className="mt-6">
          Sign wallet message
        </Button>
      </section>
    );
  }

  if (loading) {
    return <div className="flex min-h-48 items-center justify-center"><Spinner /></div>;
  }

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-soul-mist/70">Wallet: <span className="font-mono text-soul-bone">{auth.address}</span></p>
        <Link href="/lore/submit" className="rounded border border-soul-accent/40 px-4 py-2 font-display text-sm text-soul-accent hover:border-soul-accent hover:text-soul-bone">
          New submission
        </Link>
      </div>

      {error && <div role="alert" className="rounded border border-soul-ember/40 bg-soul-ember/10 p-3 text-sm text-soul-ember">{error}</div>}

      {submissions.length === 0 ? (
        <div className="rounded-xl border border-soul-accent/20 bg-soul-shadow/70 p-8 text-center">
          <h2 className="font-display text-xl text-soul-bone">No submissions yet</h2>
          <p className="mt-2 text-sm text-soul-mist/70">Write the first chronicle for a token you own.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {submissions.map((submission) => (
            <Link
              key={submission.id}
              href={`/lore/submissions/${submission.id}`}
              className="group rounded-xl border border-soul-accent/15 bg-soul-shadow/70 p-5 transition-colors hover:border-soul-accent/50"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="font-display text-xl text-soul-accent group-hover:text-soul-bone">{submission.title}</h2>
                  <p className="mt-1 text-xs uppercase tracking-wide text-soul-mist/60">Token #{submission.tokenId} · submitted {formatDate(submission.submittedAt)}</p>
                </div>
                <SubmissionStatusBadge status={submission.status} visibility={submission.visibility} />
              </div>
              <p className="mt-3 line-clamp-2 text-sm leading-6 text-soul-mist/75">{submission.summary}</p>
              {submission.publishedSlug && (
                <p className="mt-3 text-xs text-soul-accent/80">Published slug: {submission.publishedSlug}</p>
              )}
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}
