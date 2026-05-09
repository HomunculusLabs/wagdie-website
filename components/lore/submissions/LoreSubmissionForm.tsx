'use client';

import { useEffect, useMemo, useState, type FormEvent } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { useAuth } from '@/hooks/useAuth';
import { useOwnedCharacters } from '@/hooks/useOwnedCharacters';
import type { LoreSubmissionDetailDto, LoreSubmissionLink } from '@/types/lore-submission';
import { MarkdownEditor } from './MarkdownEditor';
import {
  SourceUrlListEditor,
  type EditableSubmissionLink,
} from './SourceUrlListEditor';

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  details?: string | string[];
}

export interface LoreSubmissionFormInitialValues {
  tokenId?: string;
  title?: string;
  summary?: string;
  bodyMarkdown?: string;
  tags?: string[];
  links?: EditableSubmissionLink[];
}

export interface LoreSubmissionFormProps {
  mode?: 'create' | 'revise';
  submissionId?: string;
  initialValues?: LoreSubmissionFormInitialValues;
  onSubmitted?: (detail: LoreSubmissionDetailDto) => void;
}

const defaultLink = (): EditableSubmissionLink => ({
  url: '',
  role: 'source_media',
  displayTitle: '',
  archivedUrl: '',
  attribution: '',
});

export function linksToEditableLinks(links: LoreSubmissionLink[]): EditableSubmissionLink[] {
  const editable = links.map((link) => ({
    url: link.original_url || link.normalized_url,
    role: link.role,
    displayTitle: link.display_title ?? '',
    archivedUrl: link.archived_url ?? '',
    attribution: link.attribution ?? '',
  }));

  return editable.length > 0 ? editable : [defaultLink()];
}

function tagsFromText(value: string): string[] {
  return value
    .split(/[\n,]/)
    .map((tag) => tag.trim())
    .filter(Boolean);
}

function cleanLinks(links: EditableSubmissionLink[]) {
  return links
    .filter((link) => link.url.trim().length > 0)
    .map((link) => ({
      url: link.url.trim(),
      role: link.role,
      displayTitle: link.displayTitle?.trim() || undefined,
      archivedUrl: link.archivedUrl?.trim() || undefined,
      attribution: link.attribution?.trim() || undefined,
    }));
}

async function readApiResponse<T>(response: Response, fallback: string): Promise<T> {
  let body: ApiResponse<T> | undefined;
  try {
    body = await response.json() as ApiResponse<T>;
  } catch {
    body = undefined;
  }

  if (!response.ok || !body?.success) {
    const details = Array.isArray(body?.details)
      ? body.details.join('\n')
      : body?.details;
    throw new Error(details || body?.error || fallback);
  }

  if (body.data === undefined) {
    throw new Error(fallback);
  }

  return body.data;
}

export function LoreSubmissionForm({
  mode = 'create',
  submissionId,
  initialValues,
  onSubmitted,
}: LoreSubmissionFormProps) {
  const auth = useAuth();
  const ownedCharacters = useOwnedCharacters(auth.address, {
    enabled: Boolean(auth.address && auth.isAuthenticated),
    perPage: 200,
    sort: 'asc',
  });

  const [tokenId, setTokenId] = useState(initialValues?.tokenId ?? '');
  const [title, setTitle] = useState(initialValues?.title ?? '');
  const [summary, setSummary] = useState(initialValues?.summary ?? '');
  const [bodyMarkdown, setBodyMarkdown] = useState(initialValues?.bodyMarkdown ?? '');
  const [tagsText, setTagsText] = useState((initialValues?.tags ?? []).join(', '));
  const [links, setLinks] = useState<EditableSubmissionLink[]>(initialValues?.links ?? [defaultLink()]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    if (mode === 'revise' || tokenId || ownedCharacters.characters.length === 0) return;
    setTokenId(String(ownedCharacters.characters[0].token_id));
  }, [mode, ownedCharacters.characters, tokenId]);

  const ownedTokenIds = useMemo(() => (
    ownedCharacters.characters.map((character) => String(character.token_id))
  ), [ownedCharacters.characters]);

  const submitLabel = mode === 'revise' ? 'Resubmit changes' : 'Submit lore';

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();

    if (!auth.isAuthenticated) {
      setError('Connect and sign in with your wallet before submitting.');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const endpoint = mode === 'revise'
        ? `/api/lore/submissions/${encodeURIComponent(submissionId ?? '')}`
        : '/api/lore/submissions';
      const response = await fetch(endpoint, {
        method: mode === 'revise' ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tokenId: tokenId.trim(),
          title: title.trim(),
          summary: summary.trim(),
          bodyMarkdown,
          tags: tagsFromText(tagsText),
          links: cleanLinks(links),
        }),
      });

      const detail = await readApiResponse<LoreSubmissionDetailDto>(
        response,
        mode === 'revise' ? 'Failed to revise lore submission' : 'Failed to create lore submission',
      );

      setSuccessMessage(mode === 'revise'
        ? 'Changes resubmitted for admin review.'
        : 'Lore submitted for admin review.');
      onSubmitted?.(detail);

      if (mode === 'create') {
        setTitle('');
        setSummary('');
        setBodyMarkdown('');
        setTagsText('');
        setLinks([defaultLink()]);
      }
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Failed to submit lore.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!auth.isConnected) {
    return (
      <section className="rounded-xl border border-soul-accent/20 bg-soul-shadow/70 p-8 text-center">
        <h2 className="font-display text-2xl text-soul-accent">Wallet required</h2>
        <p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-soul-mist/75">
          Community lore submissions are wallet-gated. Connect the wallet that owns the token you want to write for.
        </p>
        <Button type="button" onClick={auth.connect} isLoading={auth.isAuthenticating} className="mt-6">
          Connect Wallet
        </Button>
      </section>
    );
  }

  if (!auth.isAuthenticated) {
    return (
      <section className="rounded-xl border border-soul-accent/20 bg-soul-shadow/70 p-8 text-center">
        <h2 className="font-display text-2xl text-soul-accent">Sign in to continue</h2>
        <p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-soul-mist/75">
          Sign a wallet message to create a session before sending lore to the review queue.
        </p>
        {auth.error && <p className="mt-3 text-sm text-soul-ember">{auth.error.message}</p>}
        <Button type="button" onClick={auth.authenticate} isLoading={auth.isAuthenticating} className="mt-6">
          Sign wallet message
        </Button>
      </section>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 rounded-xl border border-soul-accent/20 bg-soul-shadow/70 p-5 md:p-7">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-soul-accent/10 pb-4">
        <div>
          <h2 className="font-display text-2xl text-soul-accent">
            {mode === 'revise' ? 'Revise community lore' : 'Submit community lore'}
          </h2>
          <p className="mt-2 text-sm leading-6 text-soul-mist/75">
            Authenticated as <span className="font-mono text-soul-bone">{auth.address}</span>. Ownership is checked again by the server.
          </p>
        </div>
        <Link href="/lore/submissions" className="text-sm font-display text-soul-accent hover:text-soul-bone">
          My submissions
        </Link>
      </div>

      {error && (
        <div role="alert" className="rounded border border-soul-ember/40 bg-soul-ember/10 p-3 text-sm whitespace-pre-line text-soul-ember">
          {error}
        </div>
      )}
      {successMessage && (
        <div role="status" className="rounded border border-emerald-400/40 bg-emerald-500/10 p-3 text-sm text-emerald-200">
          {successMessage}
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-[240px_minmax(0,1fr)]">
        <label className="space-y-1 text-sm text-soul-mist">
          <span className="font-display uppercase tracking-wide">Token ID</span>
          {ownedTokenIds.length > 0 ? (
            <select
              value={tokenId}
              onChange={(event) => setTokenId(event.target.value)}
              disabled={isSubmitting || mode === 'revise'}
              className="w-full rounded border border-soul-accent/20 bg-abyss/60 px-3 py-2 text-soul-bone focus:border-soul-accent focus:outline-none"
            >
              {ownedTokenIds.map((id) => (
                <option key={id} value={id}>Token #{id}</option>
              ))}
            </select>
          ) : (
            <input
              value={tokenId}
              onChange={(event) => setTokenId(event.target.value)}
              disabled={isSubmitting || mode === 'revise'}
              placeholder="666"
              className="w-full rounded border border-soul-accent/20 bg-abyss/60 px-3 py-2 text-soul-bone placeholder:text-soul-mist/40 focus:border-soul-accent focus:outline-none"
            />
          )}
          {ownedCharacters.isLoading && <span className="flex items-center gap-2 text-xs"><Spinner size="sm" /> Loading owned tokens…</span>}
          {ownedCharacters.error && <span className="text-xs text-soul-ember">Could not load owned tokens. Manual entry will still be checked by the server.</span>}
        </label>

        <label className="space-y-1 text-sm text-soul-mist">
          <span className="font-display uppercase tracking-wide">Title</span>
          <input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            disabled={isSubmitting}
            maxLength={120}
            className="w-full rounded border border-soul-accent/20 bg-abyss/60 px-3 py-2 text-soul-bone focus:border-soul-accent focus:outline-none"
          />
        </label>
      </div>

      <label className="block space-y-1 text-sm text-soul-mist">
        <span className="font-display uppercase tracking-wide">Summary</span>
        <textarea
          value={summary}
          onChange={(event) => setSummary(event.target.value)}
          disabled={isSubmitting}
          rows={4}
          maxLength={500}
          className="w-full rounded border border-soul-accent/20 bg-abyss/60 px-3 py-2 text-soul-bone focus:border-soul-accent focus:outline-none"
        />
      </label>

      <MarkdownEditor value={bodyMarkdown} onChange={setBodyMarkdown} disabled={isSubmitting} />

      <label className="block space-y-1 text-sm text-soul-mist">
        <span className="font-display uppercase tracking-wide">Tags</span>
        <input
          value={tagsText}
          onChange={(event) => setTagsText(event.target.value)}
          disabled={isSubmitting}
          placeholder="pilgrimage, searing, oath"
          className="w-full rounded border border-soul-accent/20 bg-abyss/60 px-3 py-2 text-soul-bone placeholder:text-soul-mist/40 focus:border-soul-accent focus:outline-none"
        />
        <span className="text-xs text-soul-mist/60">Comma or newline separated, max 10 tags.</span>
      </label>

      <SourceUrlListEditor links={links} onChange={setLinks} disabled={isSubmitting} />

      <div className="flex flex-wrap justify-end gap-3 border-t border-soul-accent/10 pt-4">
        <Button type="submit" isLoading={isSubmitting} disabled={cleanLinks(links).length === 0}>
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}
