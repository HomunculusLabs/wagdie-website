/* eslint-disable @typescript-eslint/no-explicit-any */
import { getSupabaseAdmin } from '@/lib/supabase';
import type {
  CreateLoreSubmissionInput,
  LoreSubmission,
  LoreSubmissionDetailDto,
  LoreSubmissionLink,
  LoreSubmissionReview,
  LoreSubmissionReviewAction,
  LoreSubmissionStatus,
  NormalizedLoreSubmissionLinkInput,
} from '@/types/lore-submission';
import type { Json } from '@/lib/database.types';
import type { CanonStatus, CanonizationStageId, CanonizationStep } from '@/lib/lore/types';

export interface LoreSubmissionAdminListFilters {
  status?: LoreSubmissionStatus;
  submitter?: string;
  query?: string;
  page: number;
  perPage: number;
}

export interface LoreSubmissionAdminListResult {
  submissions: LoreSubmission[];
  total: number;
  page: number;
  perPage: number;
}

export interface LoreSubmissionCurationUpdate {
  curated_title?: string | null;
  curated_summary?: string | null;
  curated_body_markdown?: string | null;
  curated_tags?: string[] | null;
  season_id?: string | null;
  character_ids?: string[];
  location_ids?: string[];
  canon_note?: string | null;
  canon_path?: CanonizationStep[];
}

export interface LoreSubmissionStatusUpdate {
  status?: LoreSubmissionStatus;
  review_note?: string | null;
  status_reason?: string | null;
  last_admin_address?: string | null;
  published_slug?: string | null;
  visibility?: LoreSubmission['visibility'];
  published_kind?: LoreSubmission['published_kind'];
  canon_status?: CanonStatus;
  canon_stage_id?: CanonizationStageId;
  canon_note?: string | null;
  canon_path?: CanonizationStep[];
  publication_snapshot?: Json | null;
  reviewed_at?: string | null;
  published_at?: string | null;
  canonized_at?: string | null;
  closed_at?: string | null;
}

export interface LoreSubmissionReviewInput {
  submissionId: string;
  actorAddress: string;
  action: LoreSubmissionReviewAction;
  fromStatus: LoreSubmissionStatus | null;
  toStatus: LoreSubmissionStatus;
  note?: string | null;
}

type SupabaseError = { message: string; code?: string };
type UntypedQuery = Record<string, any>;
type UntypedSupabaseClient = { from: (table: string) => UntypedQuery };

const SUBMISSION_COLUMNS = '*';
const LINK_COLUMNS = '*';
const REVIEW_COLUMNS = '*';

function getClient(): UntypedSupabaseClient {
  const client = getSupabaseAdmin();
  if (!client) {
    throw new Error('Supabase admin client not configured');
  }

  return client as unknown as UntypedSupabaseClient;
}

function normalizeArray<T>(value: T[] | null | undefined): T[] {
  return Array.isArray(value) ? value : [];
}

function normalizeCanonPath(value: unknown): CanonizationStep[] {
  return Array.isArray(value) ? value as CanonizationStep[] : [];
}

function toSubmission(row: any): LoreSubmission {
  return {
    id: row.id,
    submitter_address: row.submitter_address,
    token_id: row.token_id,
    title: row.title,
    summary: row.summary,
    body_markdown: row.body_markdown,
    tags: normalizeArray(row.tags),
    curated_title: row.curated_title ?? null,
    curated_summary: row.curated_summary ?? null,
    curated_body_markdown: row.curated_body_markdown ?? null,
    curated_tags: row.curated_tags ?? null,
    season_id: row.season_id ?? null,
    character_ids: normalizeArray(row.character_ids),
    location_ids: normalizeArray(row.location_ids),
    status: row.status,
    review_note: row.review_note ?? null,
    status_reason: row.status_reason ?? null,
    last_admin_address: row.last_admin_address ?? null,
    published_slug: row.published_slug ?? null,
    visibility: row.visibility,
    published_kind: row.published_kind ?? null,
    canon_status: row.canon_status,
    canon_stage_id: row.canon_stage_id,
    canon_note: row.canon_note ?? null,
    canon_path: normalizeCanonPath(row.canon_path),
    publication_snapshot: row.publication_snapshot ?? null,
    created_at: row.created_at,
    updated_at: row.updated_at,
    submitted_at: row.submitted_at,
    reviewed_at: row.reviewed_at ?? null,
    published_at: row.published_at ?? null,
    canonized_at: row.canonized_at ?? null,
    closed_at: row.closed_at ?? null,
  };
}

function toLink(row: any): LoreSubmissionLink {
  return {
    id: row.id,
    submission_id: row.submission_id,
    role: row.role,
    link_type: row.link_type,
    original_url: row.original_url,
    normalized_url: row.normalized_url,
    display_title: row.display_title ?? null,
    platform: row.platform ?? null,
    author: row.author ?? null,
    published_at: row.published_at ?? null,
    archived_url: row.archived_url ?? null,
    attribution: row.attribution ?? null,
    preservation_note: row.preservation_note ?? null,
    metadata: row.metadata ?? {},
    sort_order: row.sort_order ?? 0,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

function toReview(row: any): LoreSubmissionReview {
  return {
    id: row.id,
    submission_id: row.submission_id,
    actor_address: row.actor_address,
    action: row.action,
    from_status: row.from_status ?? null,
    to_status: row.to_status,
    note: row.note ?? null,
    created_at: row.created_at,
  };
}

function throwOnError(error: SupabaseError | null, context: string): void {
  if (error) {
    throw new Error(`${context}: ${error.message}`);
  }
}

function linkInsertRows(submissionId: string, links: NormalizedLoreSubmissionLinkInput[]): Record<string, unknown>[] {
  return links.map((link, index) => ({
    submission_id: submissionId,
    role: link.role,
    link_type: link.linkType,
    original_url: link.originalUrl,
    normalized_url: link.normalizedUrl,
    display_title: link.displayTitle ?? null,
    platform: link.platform ?? null,
    archived_url: link.archivedUrl ?? null,
    attribution: link.attribution ?? null,
    metadata: link.metadata,
    sort_order: index,
  }));
}

export class LoreSubmissionRepository {
  async createSubmission(input: CreateLoreSubmissionInput, submitterAddress: string): Promise<LoreSubmissionDetailDto> {
    const client = getClient();
    const now = new Date().toISOString();
    const { data, error } = await client
      .from('lore_submissions')
      .insert({
        submitter_address: submitterAddress,
        token_id: input.tokenId,
        title: input.title,
        summary: input.summary,
        body_markdown: input.bodyMarkdown,
        tags: input.tags,
        character_ids: input.characterIds,
        location_ids: input.locationIds,
        submitted_at: now,
      })
      .select(SUBMISSION_COLUMNS)
      .single();

    throwOnError(error, 'Failed to create lore submission');
    if (!data) throw new Error('Failed to create lore submission: no row returned');

    const submission = toSubmission(data);
    const links = await this.replaceLinks(submission.id, input.links);
    const review = await this.addReview({
      submissionId: submission.id,
      actorAddress: submitterAddress,
      action: 'submit',
      fromStatus: null,
      toStatus: 'submitted',
      note: null,
    });

    return { submission, links, reviews: [review] };
  }

  async findById(submissionId: string): Promise<LoreSubmission | null> {
    const { data, error } = await getClient()
      .from('lore_submissions')
      .select(SUBMISSION_COLUMNS)
      .eq('id', submissionId)
      .maybeSingle();

    throwOnError(error, 'Failed to fetch lore submission');
    return data ? toSubmission(data) : null;
  }

  async findDetail(submissionId: string): Promise<LoreSubmissionDetailDto | null> {
    const submission = await this.findById(submissionId);
    if (!submission) return null;

    const [links, reviews] = await Promise.all([
      this.listLinks(submissionId),
      this.listReviews(submissionId),
    ]);

    return { submission, links, reviews };
  }

  async listForSubmitter(submitterAddress: string): Promise<LoreSubmission[]> {
    const { data, error } = await getClient()
      .from('lore_submissions')
      .select(SUBMISSION_COLUMNS)
      .eq('submitter_address', submitterAddress)
      .order('created_at', { ascending: false });

    throwOnError(error, 'Failed to list lore submissions');
    return (data ?? []).map(toSubmission);
  }

  async listPublishedForEffectiveLore(): Promise<LoreSubmissionDetailDto[]> {
    const { data, error } = await getClient()
      .from('lore_submissions')
      .select(SUBMISSION_COLUMNS)
      .eq('visibility', 'public')
      .in('status', ['public', 'canonized'])
      .not('published_slug', 'is', null)
      .order('published_at', { ascending: true });

    throwOnError(error, 'Failed to list published lore submissions');

    const submissions: LoreSubmission[] = (data ?? []).map(toSubmission);
    return Promise.all(submissions.map(async (submission: LoreSubmission) => ({
      submission,
      links: await this.listLinks(submission.id),
      reviews: [],
    })));
  }

  async listAdmin(filters: LoreSubmissionAdminListFilters): Promise<LoreSubmissionAdminListResult> {
    const from = (filters.page - 1) * filters.perPage;
    const to = from + filters.perPage - 1;
    let query = getClient()
      .from('lore_submissions')
      .select(SUBMISSION_COLUMNS, { count: 'exact' })
      .order('submitted_at', { ascending: false })
      .range(from, to);

    if (filters.status) query = query.eq('status', filters.status);
    if (filters.submitter) query = query.eq('submitter_address', filters.submitter);
    if (filters.query) {
      const escaped = filters.query.replace(/[%_]/g, (char) => `\\${char}`);
      query = query.or(`title.ilike.%${escaped}%,summary.ilike.%${escaped}%,token_id.eq.${escaped}`);
    }

    const { data, error, count } = await query;
    throwOnError(error, 'Failed to list admin lore submissions');

    return {
      submissions: (data ?? []).map(toSubmission),
      total: count ?? 0,
      page: filters.page,
      perPage: filters.perPage,
    };
  }

  async countRecentBySubmitter(submitterAddress: string, sinceIso: string): Promise<number> {
    const { error, count } = await getClient()
      .from('lore_submissions')
      .select('id', { count: 'exact', head: true })
      .eq('submitter_address', submitterAddress)
      .gte('created_at', sinceIso);

    throwOnError(error, 'Failed to count recent lore submissions');
    return count ?? 0;
  }

  async findOpenBySubmitterAndToken(submitterAddress: string, tokenId: string): Promise<LoreSubmission | null> {
    const { data, error } = await getClient()
      .from('lore_submissions')
      .select(SUBMISSION_COLUMNS)
      .eq('submitter_address', submitterAddress)
      .eq('token_id', tokenId)
      .neq('status', 'closed')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    throwOnError(error, 'Failed to find existing lore submission');
    return data ? toSubmission(data) : null;
  }

  async slugExists(slug: string, excludeSubmissionId?: string): Promise<boolean> {
    let query = getClient()
      .from('lore_submissions')
      .select('id')
      .eq('published_slug', slug)
      .limit(1);

    if (excludeSubmissionId) query = query.neq('id', excludeSubmissionId);

    const { data, error } = await query;
    throwOnError(error, 'Failed to check lore submission slug');
    return Boolean(data?.length);
  }

  async updateCuration(
    submissionId: string,
    updates: LoreSubmissionCurationUpdate,
    adminAddress: string,
  ): Promise<LoreSubmissionDetailDto | null> {
    const existing = await this.findById(submissionId);
    if (!existing) return null;

    const now = new Date().toISOString();
    const { data, error } = await getClient()
      .from('lore_submissions')
      .update({
        ...updates,
        last_admin_address: adminAddress,
        reviewed_at: now,
      })
      .eq('id', submissionId)
      .select(SUBMISSION_COLUMNS)
      .maybeSingle();

    throwOnError(error, 'Failed to update lore submission curation');
    if (!data) return null;

    await this.addReview({
      submissionId,
      actorAddress: adminAddress,
      action: 'curate',
      fromStatus: existing.status,
      toStatus: existing.status,
      note: null,
    });

    return this.findDetail(submissionId);
  }

  async updateStatusConditional(
    submissionId: string,
    expectedStatuses: LoreSubmissionStatus[],
    updates: LoreSubmissionStatusUpdate,
    review: Omit<LoreSubmissionReviewInput, 'submissionId' | 'fromStatus' | 'toStatus'>,
  ): Promise<LoreSubmissionDetailDto | null> {
    const now = new Date().toISOString();
    const query = getClient()
      .from('lore_submissions')
      .update(updates)
      .eq('id', submissionId)
      .in('status', expectedStatuses)
      .select(SUBMISSION_COLUMNS);

    const { data, error } = await query.maybeSingle();
    throwOnError(error, 'Failed to update lore submission status');
    if (!data) return null;

    const submission = toSubmission(data);
    await this.addReview({
      submissionId,
      actorAddress: review.actorAddress,
      action: review.action,
      fromStatus: expectedStatuses.length === 1 ? expectedStatuses[0] : null,
      toStatus: submission.status,
      note: review.note ?? null,
    });

    if (updates.reviewed_at === undefined && review.action !== 'submit' && review.action !== 'resubmit') {
      await getClient()
        .from('lore_submissions')
        .update({ reviewed_at: now })
        .eq('id', submissionId);
    }

    return this.findDetail(submissionId);
  }

  async reviseSubmission(
    submissionId: string,
    input: CreateLoreSubmissionInput,
    actorAddress: string,
  ): Promise<LoreSubmissionDetailDto | null> {
    const now = new Date().toISOString();
    const { data, error } = await getClient()
      .from('lore_submissions')
      .update({
        title: input.title,
        summary: input.summary,
        body_markdown: input.bodyMarkdown,
        tags: input.tags,
        character_ids: input.characterIds,
        location_ids: input.locationIds,
        status: 'submitted',
        visibility: 'pending',
        review_note: null,
        status_reason: null,
        submitted_at: now,
      })
      .eq('id', submissionId)
      .eq('status', 'changes_requested')
      .eq('submitter_address', actorAddress)
      .select(SUBMISSION_COLUMNS)
      .maybeSingle();

    throwOnError(error, 'Failed to revise lore submission');
    if (!data) return null;

    const links = await this.replaceLinks(submissionId, input.links);
    await this.addReview({
      submissionId,
      actorAddress,
      action: 'resubmit',
      fromStatus: 'changes_requested',
      toStatus: 'submitted',
      note: null,
    });

    return {
      submission: toSubmission(data),
      links,
      reviews: await this.listReviews(submissionId),
    };
  }

  async listLinks(submissionId: string): Promise<LoreSubmissionLink[]> {
    const { data, error } = await getClient()
      .from('lore_submission_links')
      .select(LINK_COLUMNS)
      .eq('submission_id', submissionId)
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: true });

    throwOnError(error, 'Failed to list lore submission links');
    return (data ?? []).map(toLink);
  }

  async replaceLinks(submissionId: string, links: NormalizedLoreSubmissionLinkInput[]): Promise<LoreSubmissionLink[]> {
    const client = getClient();
    const deleteResult = await client
      .from('lore_submission_links')
      .delete()
      .eq('submission_id', submissionId);
    throwOnError(deleteResult.error, 'Failed to replace lore submission links');

    if (links.length === 0) return [];

    const { data, error } = await client
      .from('lore_submission_links')
      .insert(linkInsertRows(submissionId, links))
      .select(LINK_COLUMNS)
      .order('sort_order', { ascending: true });

    throwOnError(error, 'Failed to insert lore submission links');
    return (data ?? []).map(toLink);
  }

  async listReviews(submissionId: string): Promise<LoreSubmissionReview[]> {
    const { data, error } = await getClient()
      .from('lore_submission_reviews')
      .select(REVIEW_COLUMNS)
      .eq('submission_id', submissionId)
      .order('created_at', { ascending: true });

    throwOnError(error, 'Failed to list lore submission reviews');
    return (data ?? []).map(toReview);
  }

  async addReview(input: LoreSubmissionReviewInput): Promise<LoreSubmissionReview> {
    const { data, error } = await getClient()
      .from('lore_submission_reviews')
      .insert({
        submission_id: input.submissionId,
        actor_address: input.actorAddress,
        action: input.action,
        from_status: input.fromStatus,
        to_status: input.toStatus,
        note: input.note ?? null,
      })
      .select(REVIEW_COLUMNS)
      .single();

    throwOnError(error, 'Failed to write lore submission review');
    if (!data) throw new Error('Failed to write lore submission review: no row returned');
    return toReview(data);
  }
}

export const loreSubmissionRepository = new LoreSubmissionRepository();
