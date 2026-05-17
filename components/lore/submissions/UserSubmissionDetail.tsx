'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { MarkdownPreview } from './MarkdownPreview';
import { useAuth } from '@/hooks/useAuth';
import { apiClient } from '@/lib/api/client';
import type { LoreSubmissionDetailDto } from '@/types/lore-submission';
import { LoreSubmissionForm, linksToEditableLinks } from './LoreSubmissionForm';
import { SubmissionStatusBadge } from './SubmissionStatusBadge';

function formatDate(value: string | null) {
  if (!value) return '—';
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(value));
}

export interface UserSubmissionDetailProps {
  submissionId: string;
}

export function UserSubmissionDetail({ submissionId }: UserSubmissionDetailProps) {
  const auth = useAuth();
  const [detail, setDetail] = useState<LoreSubmissionDetailDto | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showRevisionForm, setShowRevisionForm] = useState(false);

  useEffect(() => {
    if (!auth.isAuthenticated) return;

    let mounted = true;
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await apiClient.getEnvelope<LoreSubmissionDetailDto>(`/api/lore/submissions/${encodeURIComponent(submissionId)}`, {
          cache: 'no-store',
          fallbackMessage: 'Failed to load submission',
        });
        if (mounted) setDetail(data);
      } catch (loadError) {
        if (mounted) setError(loadError instanceof Error ? loadError.message : 'Failed to load submission');
      } finally {
        if (mounted) setLoading(false);
      }
    };

    load();
    return () => {
      mounted = false;
    };
  }, [auth.isAuthenticated, submissionId]);

  if (!auth.isConnected) {
    return (
      <section className="rounded-xl border border-soul-accent/20 bg-soul-shadow/70 p-8 text-center">
        <h2 className="font-display text-2xl text-soul-accent">Connect wallet</h2>
        <p className="mt-3 text-sm text-soul-mist/75">Connect the submitter wallet or an admin wallet to view this submission.</p>
        <Button type="button" onClick={auth.connect} className="mt-6">Connect Wallet</Button>
      </section>
    );
  }

  if (auth.isHydrating) {
    return (
      <section className="rounded-xl border border-soul-accent/20 bg-soul-shadow/70 p-8 text-center">
        <h2 className="font-display text-2xl text-soul-accent">Checking wallet session</h2>
        <p className="mt-3 text-sm text-soul-mist/75">Looking for an existing wallet session.</p>
      </section>
    );
  }

  if (!auth.isAuthenticated) {
    return (
      <section className="rounded-xl border border-soul-accent/20 bg-soul-shadow/70 p-8 text-center">
        <h2 className="font-display text-2xl text-soul-accent">Sign in required</h2>
        <p className="mt-3 text-sm text-soul-mist/75">Sign a message to view this private submission.</p>
        {auth.error && <p className="mt-3 text-sm text-soul-ember">{auth.error.message}</p>}
        <Button type="button" onClick={() => auth.authenticate({ force: true })} isLoading={auth.isAuthenticating} className="mt-6">
          Sign wallet message
        </Button>
      </section>
    );
  }

  if (loading) {
    return <div className="flex min-h-48 items-center justify-center"><Spinner /></div>;
  }

  if (error) {
    return <div role="alert" className="rounded border border-soul-ember/40 bg-soul-ember/10 p-4 text-sm text-soul-ember">{error}</div>;
  }

  if (!detail) return null;

  const { submission, links, reviews } = detail;
  const displayTitle = submission.curated_title ?? submission.title;
  const displaySummary = submission.curated_summary ?? submission.summary;
  const displayBody = submission.curated_body_markdown ?? submission.body_markdown;
  const displayTags = submission.curated_tags ?? submission.tags;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link href="/lore/submissions" className="text-sm font-display text-soul-accent hover:text-soul-bone">← My submissions</Link>
        <SubmissionStatusBadge status={submission.status} visibility={submission.visibility} />
      </div>

      <article className="rounded-xl border border-soul-accent/20 bg-soul-shadow/70 p-5 md:p-7">
        <div className="border-b border-soul-accent/10 pb-4">
          <p className="text-xs uppercase tracking-wide text-soul-mist/60">Token #{submission.token_id} · submitted {formatDate(submission.submitted_at)}</p>
          <h1 className="mt-2 font-display text-3xl text-soul-accent">{displayTitle}</h1>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-soul-mist/80">{displaySummary}</p>
          {submission.review_note && (
            <div className="mt-4 rounded border border-amber-400/40 bg-amber-500/10 p-3 text-sm text-amber-100">
              Admin note: {submission.review_note}
            </div>
          )}
        </div>

        <div className="mt-5 rounded-lg border border-soul-accent/15 bg-abyss/50 p-4">
          <MarkdownPreview markdown={displayBody} />
        </div>

        {displayTags.length > 0 && (
          <div className="mt-5 flex flex-wrap gap-2">
            {displayTags.map((tag) => (
              <span key={tag} className="rounded-full border border-soul-accent/20 px-2.5 py-1 text-xs text-soul-mist">#{tag}</span>
            ))}
          </div>
        )}
      </article>

      {submission.status === 'changes_requested' && (
        <section className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-display text-2xl text-soul-accent">Revise requested changes</h2>
            <Button type="button" size="sm" variant="secondary" onClick={() => setShowRevisionForm((value) => !value)}>
              {showRevisionForm ? 'Hide form' : 'Revise now'}
            </Button>
          </div>
          {showRevisionForm && (
            <LoreSubmissionForm
              mode="revise"
              submissionId={submission.id}
              initialValues={{
                tokenId: submission.token_id,
                title: submission.title,
                summary: submission.summary,
                bodyMarkdown: submission.body_markdown,
                tags: submission.tags,
                links: linksToEditableLinks(links),
              }}
              onSubmitted={(nextDetail) => {
                setDetail(nextDetail);
                setShowRevisionForm(false);
              }}
            />
          )}
        </section>
      )}

      <section className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-soul-accent/20 bg-soul-shadow/70 p-5">
          <h2 className="font-display text-xl text-soul-accent">Submitted links</h2>
          <div className="mt-4 space-y-3">
            {links.map((link) => (
              <a
                key={link.id}
                href={link.normalized_url}
                target="_blank"
                rel="noreferrer"
                className="block rounded border border-soul-accent/15 bg-abyss/50 p-3 text-sm hover:border-soul-accent/50"
              >
                <span className="font-display text-soul-bone">{link.display_title || link.platform || link.link_type}</span>
                <span className="mt-1 block break-all text-soul-mist/70">{link.normalized_url}</span>
                <span className="mt-2 block text-xs uppercase tracking-wide text-soul-mist/50">{link.role} · {link.link_type}</span>
              </a>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-soul-accent/20 bg-soul-shadow/70 p-5">
          <h2 className="font-display text-xl text-soul-accent">Review history</h2>
          <div className="mt-4 space-y-3">
            {reviews.map((review) => (
              <div key={review.id} className="rounded border border-soul-accent/10 bg-abyss/40 p-3 text-sm">
                <div className="flex flex-wrap justify-between gap-2 text-soul-mist/60">
                  <span className="font-display uppercase tracking-wide text-soul-bone">{review.action}</span>
                  <span>{formatDate(review.created_at)}</span>
                </div>
                {review.note && <p className="mt-2 text-soul-mist/80">{review.note}</p>}
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
