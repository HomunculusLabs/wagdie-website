import { z } from 'zod';
import { isAdmin } from '@/lib/auth/admin';
import { loreEvents } from '@/lib/lore/data/events';
import {
  normalizeLoreSubmissionWalletAddress,
  verifyLoreSubmissionTokenOwnership,
  type VerifyTokenOwnershipOptions,
} from '@/lib/lore/submissions/ownership';
import { parseLoreSubmissionCreateInput } from '@/lib/lore/submissions/validation';
import {
  loreSubmissionRepository,
  type LoreSubmissionAdminListFilters,
  type LoreSubmissionAdminListResult,
  type LoreSubmissionCurationUpdate,
  type LoreSubmissionRepository,
} from '@/lib/repositories/lore-submission-repository';
import type {
  CreateLoreSubmissionInput,
  LoreSubmission,
  LoreSubmissionDetailDto,
  LoreSubmissionListItemDto,
} from '@/types/lore-submission';
import type { Json } from '@/lib/database.types';
import type { CanonizationStep } from '@/lib/lore/types';

export class LoreSubmissionValidationError extends Error {
  details: string[];

  constructor(message: string, details: string[] = [message]) {
    super(message);
    this.name = 'LoreSubmissionValidationError';
    this.details = details;
  }
}

export class LoreSubmissionNotFoundError extends Error {
  constructor(message = 'Lore submission not found') {
    super(message);
    this.name = 'LoreSubmissionNotFoundError';
  }
}

export class LoreSubmissionForbiddenError extends Error {
  constructor(message = 'Not authorized to access this lore submission') {
    super(message);
    this.name = 'LoreSubmissionForbiddenError';
  }
}

export class LoreSubmissionConflictError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'LoreSubmissionConflictError';
  }
}

export class LoreSubmissionRateLimitError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'LoreSubmissionRateLimitError';
  }
}

export interface LoreSubmissionServiceOptions {
  maxSubmissionsPerWindow?: number;
  submissionWindowMs?: number;
  ownershipVerifier?: (options: VerifyTokenOwnershipOptions) => Promise<{ owns: boolean; reason: string }>;
}

export interface LoreSubmissionReviewBody {
  action: 'request_changes' | 'approve' | 'close' | 'reject' | 'admin_note';
  note?: string;
}

const DEFAULT_MAX_SUBMISSIONS_PER_WINDOW = 5;
const DEFAULT_SUBMISSION_WINDOW_MS = 60 * 60 * 1000;
const STATIC_EVENT_SLUGS = new Set(loreEvents.map((event) => event.slug));

const nullableTrimmedString = z.union([z.string().trim().min(1), z.null()]).optional();
const optionalTextArray = z.array(z.string().trim().min(1).max(120)).max(50).optional();

const curationSchema = z.object({
  curatedTitle: nullableTrimmedString,
  curatedSummary: nullableTrimmedString,
  curatedBodyMarkdown: nullableTrimmedString,
  curatedTags: z.union([z.array(z.string().trim().min(1).max(32)).max(10), z.null()]).optional(),
  seasonId: nullableTrimmedString,
  characterIds: optionalTextArray,
  locationIds: optionalTextArray,
  canonNote: nullableTrimmedString,
  canonPath: z.array(z.unknown()).max(20).optional(),
}).strict();

const reviewSchema = z.object({
  action: z.enum(['request_changes', 'approve', 'close', 'reject', 'admin_note']),
  note: z.string().trim().max(2000).optional(),
}).strict();

function normalizeAddressOrThrow(address: string): string {
  const normalized = normalizeLoreSubmissionWalletAddress(address);
  if (!normalized) {
    throw new LoreSubmissionForbiddenError('Authenticated wallet address is invalid');
  }
  return normalized;
}

function zodDetails(error: z.ZodError): string[] {
  return error.issues.map((issue) => {
    const path = issue.path.length > 0 ? `${issue.path.join('.')}: ` : '';
    return `${path}${issue.message}`;
  });
}

function parseCreateInput(body: unknown): CreateLoreSubmissionInput {
  try {
    return parseLoreSubmissionCreateInput(body);
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new LoreSubmissionValidationError('Invalid lore submission', zodDetails(error));
    }
    throw error;
  }
}

function dedupeStrings(values: string[] | undefined): string[] | undefined {
  if (!values) return undefined;
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))];
}

function toListItem(submission: LoreSubmission): LoreSubmissionListItemDto {
  return {
    id: submission.id,
    tokenId: submission.token_id,
    title: submission.curated_title ?? submission.title,
    summary: submission.curated_summary ?? submission.summary,
    status: submission.status,
    visibility: submission.visibility,
    publishedSlug: submission.published_slug,
    submittedAt: submission.submitted_at,
    updatedAt: submission.updated_at,
  };
}

function slugifyTitle(title: string): string {
  const slug = title
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-');

  return slug || 'community-lore';
}

function idSuffix(id: string): string {
  return id.replace(/[^a-fA-F0-9]/g, '').slice(0, 8).toLowerCase() || 'submission';
}

function publicTitle(submission: LoreSubmission): string {
  return submission.curated_title ?? submission.title;
}

function buildPublicationSnapshot(detail: LoreSubmissionDetailDto): Json {
  const { submission, links } = detail;
  return {
    title: submission.curated_title ?? submission.title,
    summary: submission.curated_summary ?? submission.summary,
    bodyMarkdown: submission.curated_body_markdown ?? submission.body_markdown,
    tags: submission.curated_tags ?? submission.tags,
    seasonId: submission.season_id,
    characterIds: submission.character_ids,
    locationIds: submission.location_ids,
    links: links.map((link) => ({
      id: link.id,
      role: link.role,
      linkType: link.link_type,
      originalUrl: link.original_url,
      normalizedUrl: link.normalized_url,
      displayTitle: link.display_title,
      platform: link.platform,
      archivedUrl: link.archived_url,
      attribution: link.attribution,
      metadata: link.metadata,
      sortOrder: link.sort_order,
    })),
    capturedAt: new Date().toISOString(),
  };
}

function requireNote(body: LoreSubmissionReviewBody, action: string): string {
  const note = body.note?.trim();
  if (!note) {
    throw new LoreSubmissionValidationError(`${action} requires a note`, [`${action} requires a note`]);
  }
  return note;
}

export class LoreSubmissionService {
  private readonly maxSubmissionsPerWindow: number;
  private readonly submissionWindowMs: number;
  private readonly ownershipVerifier: LoreSubmissionServiceOptions['ownershipVerifier'];

  constructor(
    private repository: LoreSubmissionRepository = loreSubmissionRepository,
    options: LoreSubmissionServiceOptions = {},
  ) {
    this.maxSubmissionsPerWindow = options.maxSubmissionsPerWindow ?? DEFAULT_MAX_SUBMISSIONS_PER_WINDOW;
    this.submissionWindowMs = options.submissionWindowMs ?? DEFAULT_SUBMISSION_WINDOW_MS;
    this.ownershipVerifier = options.ownershipVerifier ?? verifyLoreSubmissionTokenOwnership;
  }

  async createSubmission(body: unknown, walletAddress: string): Promise<LoreSubmissionDetailDto> {
    const submitterAddress = normalizeAddressOrThrow(walletAddress);
    const input = parseCreateInput(body);
    await this.ensureTokenOwnership(input.tokenId, submitterAddress);
    await this.ensureCreateAbuseControls(input, submitterAddress);

    return this.repository.createSubmission(input, submitterAddress);
  }

  async listForSubmitter(walletAddress: string): Promise<LoreSubmissionListItemDto[]> {
    const submitterAddress = normalizeAddressOrThrow(walletAddress);
    const submissions = await this.repository.listForSubmitter(submitterAddress);
    return submissions.map(toListItem);
  }

  async getForViewer(submissionId: string, walletAddress: string): Promise<LoreSubmissionDetailDto> {
    const viewer = normalizeAddressOrThrow(walletAddress);
    const detail = await this.repository.findDetail(submissionId);
    if (!detail) throw new LoreSubmissionNotFoundError();

    if (detail.submission.submitter_address !== viewer && !isAdmin(viewer)) {
      throw new LoreSubmissionForbiddenError();
    }

    return detail;
  }

  async reviseSubmission(submissionId: string, body: unknown, walletAddress: string): Promise<LoreSubmissionDetailDto> {
    const submitterAddress = normalizeAddressOrThrow(walletAddress);
    const existing = await this.repository.findById(submissionId);
    if (!existing) throw new LoreSubmissionNotFoundError();
    if (existing.submitter_address !== submitterAddress) throw new LoreSubmissionForbiddenError();
    if (existing.status !== 'changes_requested') {
      throw new LoreSubmissionConflictError('Only submissions with requested changes can be revised');
    }

    const input = parseCreateInput(body);
    if (input.tokenId !== existing.token_id) {
      throw new LoreSubmissionValidationError('tokenId cannot be changed during revision', [
        'tokenId cannot be changed during revision',
      ]);
    }

    await this.ensureTokenOwnership(input.tokenId, submitterAddress);
    const detail = await this.repository.reviseSubmission(submissionId, input, submitterAddress);
    if (!detail) throw new LoreSubmissionConflictError('Submission was changed before revision could be saved');
    return detail;
  }

  async listAdmin(filters: Partial<LoreSubmissionAdminListFilters>): Promise<LoreSubmissionAdminListResult> {
    return this.repository.listAdmin({
      status: filters.status,
      submitter: filters.submitter,
      query: filters.query,
      page: filters.page ?? 1,
      perPage: Math.min(Math.max(filters.perPage ?? 25, 1), 100),
    });
  }

  async getAdminDetail(submissionId: string): Promise<LoreSubmissionDetailDto> {
    const detail = await this.repository.findDetail(submissionId);
    if (!detail) throw new LoreSubmissionNotFoundError();
    return detail;
  }

  async updateCuration(submissionId: string, body: unknown, adminAddress: string): Promise<LoreSubmissionDetailDto> {
    const admin = normalizeAddressOrThrow(adminAddress);
    const parsed = curationSchema.safeParse(body ?? {});
    if (!parsed.success) {
      throw new LoreSubmissionValidationError('Invalid curation payload', zodDetails(parsed.error));
    }

    const updates: LoreSubmissionCurationUpdate = {
      curated_title: parsed.data.curatedTitle ?? undefined,
      curated_summary: parsed.data.curatedSummary ?? undefined,
      curated_body_markdown: parsed.data.curatedBodyMarkdown ?? undefined,
      curated_tags: parsed.data.curatedTags === undefined ? undefined : parsed.data.curatedTags,
      season_id: parsed.data.seasonId ?? undefined,
      character_ids: dedupeStrings(parsed.data.characterIds),
      location_ids: dedupeStrings(parsed.data.locationIds),
      canon_note: parsed.data.canonNote ?? undefined,
      canon_path: parsed.data.canonPath as CanonizationStep[] | undefined,
    };

    const detail = await this.repository.updateCuration(submissionId, updates, admin);
    if (!detail) throw new LoreSubmissionNotFoundError();
    return detail;
  }

  async reviewSubmission(submissionId: string, body: unknown, adminAddress: string): Promise<LoreSubmissionDetailDto> {
    const parsed = reviewSchema.safeParse(body ?? {});
    if (!parsed.success) {
      throw new LoreSubmissionValidationError('Invalid review payload', zodDetails(parsed.error));
    }

    if (parsed.data.action === 'approve') {
      return this.publishSubmission(submissionId, adminAddress, parsed.data.note);
    }

    if (parsed.data.action === 'request_changes') {
      return this.requestChanges(submissionId, adminAddress, requireNote(parsed.data, 'request_changes'));
    }

    if (parsed.data.action === 'close' || parsed.data.action === 'reject') {
      return this.closeSubmission(submissionId, adminAddress, requireNote(parsed.data, parsed.data.action));
    }

    return this.addAdminNote(submissionId, adminAddress, requireNote(parsed.data, 'admin_note'));
  }

  async publishSubmission(submissionId: string, adminAddress: string, note?: string): Promise<LoreSubmissionDetailDto> {
    const admin = normalizeAddressOrThrow(adminAddress);
    const detail = await this.getAdminDetail(submissionId);
    if (detail.submission.status !== 'submitted') {
      throw new LoreSubmissionConflictError('Only submitted lore can be published');
    }

    const slug = await this.ensurePublicationSlug(detail.submission);
    const now = new Date().toISOString();
    const result = await this.repository.updateStatusConditional(
      submissionId,
      ['submitted'],
      {
        status: 'public',
        visibility: 'public',
        published_kind: 'community',
        published_slug: slug,
        canon_status: 'community',
        canon_stage_id: 'community_recorded',
        publication_snapshot: buildPublicationSnapshot(detail),
        review_note: note ?? null,
        status_reason: null,
        last_admin_address: admin,
        reviewed_at: now,
        published_at: now,
      },
      { actorAddress: admin, action: 'publish', note: note ?? null },
    );

    if (!result) throw new LoreSubmissionConflictError('Submission was changed before it could be published');
    return result;
  }

  async canonizeSubmission(submissionId: string, adminAddress: string, note?: string): Promise<LoreSubmissionDetailDto> {
    const admin = normalizeAddressOrThrow(adminAddress);
    const now = new Date().toISOString();
    const result = await this.repository.updateStatusConditional(
      submissionId,
      ['public'],
      {
        status: 'canonized',
        visibility: 'public',
        published_kind: 'official',
        canon_status: 'canon',
        canon_stage_id: 'canonized',
        canon_note: note ?? null,
        review_note: note ?? null,
        last_admin_address: admin,
        reviewed_at: now,
        canonized_at: now,
      },
      { actorAddress: admin, action: 'canonize', note: note ?? null },
    );

    if (!result) throw new LoreSubmissionConflictError('Only public community lore can be canonized');
    return result;
  }

  async decanonizeSubmission(submissionId: string, adminAddress: string, note?: string): Promise<LoreSubmissionDetailDto> {
    const admin = normalizeAddressOrThrow(adminAddress);
    const now = new Date().toISOString();
    const result = await this.repository.updateStatusConditional(
      submissionId,
      ['canonized'],
      {
        status: 'public',
        visibility: 'public',
        published_kind: 'community',
        canon_status: 'community',
        canon_stage_id: 'community_recorded',
        canon_note: note ?? null,
        review_note: note ?? null,
        last_admin_address: admin,
        reviewed_at: now,
        canonized_at: null,
      },
      { actorAddress: admin, action: 'decanonize', note: note ?? null },
    );

    if (!result) throw new LoreSubmissionConflictError('Only canonized lore can be decanonized');
    return result;
  }

  async unpublishSubmission(submissionId: string, adminAddress: string, note?: string): Promise<LoreSubmissionDetailDto> {
    const admin = normalizeAddressOrThrow(adminAddress);
    const now = new Date().toISOString();
    const result = await this.repository.updateStatusConditional(
      submissionId,
      ['public'],
      {
        status: 'closed',
        visibility: 'hidden',
        status_reason: note ?? 'Unpublished by admin',
        review_note: note ?? null,
        last_admin_address: admin,
        reviewed_at: now,
        closed_at: now,
      },
      { actorAddress: admin, action: 'hide', note: note ?? null },
    );

    if (!result) throw new LoreSubmissionConflictError('Only public community lore can be unpublished');
    return result;
  }

  private async requestChanges(submissionId: string, adminAddress: string, note: string): Promise<LoreSubmissionDetailDto> {
    const admin = normalizeAddressOrThrow(adminAddress);
    const now = new Date().toISOString();
    const result = await this.repository.updateStatusConditional(
      submissionId,
      ['submitted'],
      {
        status: 'changes_requested',
        visibility: 'pending',
        review_note: note,
        status_reason: note,
        last_admin_address: admin,
        reviewed_at: now,
      },
      { actorAddress: admin, action: 'request_changes', note },
    );

    if (!result) throw new LoreSubmissionConflictError('Only submitted lore can receive change requests');
    return result;
  }

  private async closeSubmission(submissionId: string, adminAddress: string, note: string): Promise<LoreSubmissionDetailDto> {
    const admin = normalizeAddressOrThrow(adminAddress);
    const now = new Date().toISOString();
    const result = await this.repository.updateStatusConditional(
      submissionId,
      ['submitted', 'changes_requested', 'public'],
      {
        status: 'closed',
        visibility: 'hidden',
        review_note: note,
        status_reason: note,
        last_admin_address: admin,
        reviewed_at: now,
        closed_at: now,
      },
      { actorAddress: admin, action: 'close', note },
    );

    if (!result) throw new LoreSubmissionConflictError('Submission cannot be closed from its current status');
    return result;
  }

  private async addAdminNote(submissionId: string, adminAddress: string, note: string): Promise<LoreSubmissionDetailDto> {
    const admin = normalizeAddressOrThrow(adminAddress);
    const existing = await this.getAdminDetail(submissionId);
    await this.repository.addReview({
      submissionId,
      actorAddress: admin,
      action: 'admin_note',
      fromStatus: existing.submission.status,
      toStatus: existing.submission.status,
      note,
    });

    return this.getAdminDetail(submissionId);
  }

  private async ensureTokenOwnership(tokenId: string, walletAddress: string): Promise<void> {
    const ownership = await this.ownershipVerifier!({ tokenId, walletAddress });
    if (!ownership.owns) {
      throw new LoreSubmissionForbiddenError(`Wallet does not own token ${tokenId} (${ownership.reason})`);
    }
  }

  private async ensureCreateAbuseControls(input: CreateLoreSubmissionInput, submitterAddress: string): Promise<void> {
    const duplicate = await this.repository.findOpenBySubmitterAndToken(submitterAddress, input.tokenId);
    if (duplicate) {
      throw new LoreSubmissionConflictError(`An active lore submission already exists for token ${input.tokenId}`);
    }

    const since = new Date(Date.now() - this.submissionWindowMs).toISOString();
    const recentCount = await this.repository.countRecentBySubmitter(submitterAddress, since);
    if (recentCount >= this.maxSubmissionsPerWindow) {
      throw new LoreSubmissionRateLimitError('Too many lore submissions from this wallet. Please try again later.');
    }
  }

  private async ensurePublicationSlug(submission: LoreSubmission): Promise<string> {
    const baseSlug = slugifyTitle(publicTitle(submission));
    if (!STATIC_EVENT_SLUGS.has(baseSlug) && !await this.repository.slugExists(baseSlug, submission.id)) {
      return baseSlug;
    }

    const suffixed = `${baseSlug}-${idSuffix(submission.id)}`;
    if (!STATIC_EVENT_SLUGS.has(suffixed) && !await this.repository.slugExists(suffixed, submission.id)) {
      return suffixed;
    }

    throw new LoreSubmissionConflictError(`Could not mint a unique slug for '${baseSlug}'`);
  }
}

export const loreSubmissionService = new LoreSubmissionService();
