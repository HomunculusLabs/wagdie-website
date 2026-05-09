import { getSupabaseAdmin } from '@/lib/supabase';
import {
  isLoreCanonizationPublicationStatus,
  toCanonization,
  type LoreCanonizationOverride,
  type LoreCanonizationOverrideInput,
  type LoreCanonizationOverrideSet,
  type LoreCanonizationPublicationStatus,
} from '@/lib/lore/canonization-overrides';
import type { CanonStatus, CanonizationStageId, CanonizationStep } from '@/lib/lore/types';

export interface LoreCanonizationOverrideRow {
  event_id: string;
  status: string;
  stage_id: string;
  note: string | null;
  path: unknown;
  publication_status: string;
  published_status: string | null;
  published_stage_id: string | null;
  published_note: string | null;
  published_path: unknown | null;
  updated_by: string;
  published_by: string | null;
  published_at: string | null;
  updated_at: string;
  created_at: string;
}

interface SupabaseError {
  message: string;
}

interface UpdateFilter {
  eq: (column: string, value: string) => UpdateFilter;
  select: (columns: string) => {
    single: () => Promise<{
      data: LoreCanonizationOverrideRow | null;
      error: SupabaseError | null;
    }>;
  };
}

interface LoreCanonizationTable {
  select: (columns: string) => {
    order: (column: string, options?: { ascending?: boolean }) => Promise<{
      data: LoreCanonizationOverrideRow[] | null;
      error: SupabaseError | null;
    }>;
    eq: (column: string, value: string) => {
      maybeSingle: () => Promise<{
        data: LoreCanonizationOverrideRow | null;
        error: SupabaseError | null;
      }>;
    };
  };
  upsert: (value: Record<string, unknown>, options: { onConflict: string }) => {
    select: (columns: string) => {
      single: () => Promise<{
        data: LoreCanonizationOverrideRow | null;
        error: SupabaseError | null;
      }>;
    };
  };
  update: (value: Record<string, unknown>) => UpdateFilter;
  delete: () => {
    eq: (column: string, value: string) => Promise<{ error: SupabaseError | null }>;
  };
}

const asTable = (): LoreCanonizationTable => {
  const client = getSupabaseAdmin();
  if (!client) {
    throw new Error('Supabase admin client not configured');
  }

  return client.from('lore_canonization_overrides') as unknown as LoreCanonizationTable;
};

const normalizePath = (value: unknown): CanonizationStep[] => {
  return Array.isArray(value) ? value as CanonizationStep[] : [];
};

const toOverride = (
  row: LoreCanonizationOverrideRow,
  input: LoreCanonizationOverrideInput,
  publicationStatus: LoreCanonizationPublicationStatus,
  dates: { updatedAt: string; createdAt: string; publishedAt?: string },
): LoreCanonizationOverride => ({
  eventId: row.event_id,
  canon: toCanonization(input, dates.updatedAt),
  publicationStatus,
  updatedBy: row.updated_by,
  publishedBy: row.published_by ?? undefined,
  publishedAt: dates.publishedAt,
  updatedAt: dates.updatedAt,
  createdAt: dates.createdAt,
});

const toOverrideSet = (row: LoreCanonizationOverrideRow): LoreCanonizationOverrideSet => {
  const publicationStatus: LoreCanonizationPublicationStatus = isLoreCanonizationPublicationStatus(row.publication_status)
    ? row.publication_status
    : 'draft';

  const currentInput = {
    eventId: row.event_id,
    status: row.status as CanonStatus,
    stageId: row.stage_id as CanonizationStageId,
    note: row.note ?? undefined,
    path: normalizePath(row.path),
  } satisfies LoreCanonizationOverrideInput;
  const currentOverride = toOverride(row, currentInput, publicationStatus, {
    updatedAt: row.updated_at,
    createdAt: row.created_at,
    publishedAt: publicationStatus === 'published' ? row.published_at ?? undefined : undefined,
  });

  let publishedOverride: LoreCanonizationOverride | undefined;
  if (row.published_status && row.published_stage_id && row.published_path && row.published_at) {
    publishedOverride = toOverride(row, {
      eventId: row.event_id,
      status: row.published_status as CanonStatus,
      stageId: row.published_stage_id as CanonizationStageId,
      note: row.published_note ?? undefined,
      path: normalizePath(row.published_path),
    }, 'published', {
      updatedAt: row.published_at,
      createdAt: row.created_at,
      publishedAt: row.published_at,
    });
  }

  return {
    eventId: row.event_id,
    draftOverride: publicationStatus === 'draft' ? currentOverride : undefined,
    publishedOverride: publishedOverride ?? (publicationStatus === 'published' ? currentOverride : undefined),
    override: currentOverride,
  };
};

const toUpsertRow = (
  input: LoreCanonizationOverrideInput,
  updatedBy: string,
): Record<string, unknown> => ({
  event_id: input.eventId,
  status: input.status,
  stage_id: input.stageId,
  note: input.note ?? null,
  path: input.path,
  publication_status: 'draft',
  updated_by: updatedBy,
  updated_at: new Date().toISOString(),
});

export class LoreCanonizationRepository {
  async findAll(): Promise<LoreCanonizationOverrideSet[]> {
    const { data, error } = await asTable()
      .select('*')
      .order('event_id', { ascending: true });

    if (error) {
      throw new Error(`Failed to fetch lore canonization overrides: ${error.message}`);
    }

    return (data ?? []).map(toOverrideSet);
  }

  async findByEventId(eventId: string): Promise<LoreCanonizationOverrideSet | null> {
    const { data, error } = await asTable()
      .select('*')
      .eq('event_id', eventId)
      .maybeSingle();

    if (error) {
      throw new Error(`Failed to fetch lore canonization override: ${error.message}`);
    }

    return data ? toOverrideSet(data) : null;
  }

  async upsertDraft(
    input: LoreCanonizationOverrideInput,
    updatedBy: string,
  ): Promise<LoreCanonizationOverrideSet> {
    const { data, error } = await asTable()
      .upsert(toUpsertRow(input, updatedBy), { onConflict: 'event_id' })
      .select('*')
      .single();

    if (error) {
      throw new Error(`Failed to upsert lore canonization override: ${error.message}`);
    }

    if (!data) {
      throw new Error('Failed to upsert lore canonization override: no row returned');
    }

    return toOverrideSet(data);
  }

  async publish(
    input: LoreCanonizationOverrideInput,
    adminAddress: string,
  ): Promise<LoreCanonizationOverrideSet> {
    const now = new Date().toISOString();
    const { data, error } = await asTable()
      .update({
        publication_status: 'published',
        published_status: input.status,
        published_stage_id: input.stageId,
        published_note: input.note ?? null,
        published_path: input.path,
        published_by: adminAddress,
        published_at: now,
        updated_by: adminAddress,
        updated_at: now,
      })
      .eq('event_id', input.eventId)
      .eq('publication_status', 'draft')
      .select('*')
      .single();

    if (error) {
      throw new Error(`Failed to publish lore canonization override: ${error.message}`);
    }

    if (!data) {
      throw new Error('Failed to publish lore canonization override: no row returned');
    }

    return toOverrideSet(data);
  }

  async delete(eventId: string): Promise<void> {
    const { error } = await asTable()
      .delete()
      .eq('event_id', eventId);

    if (error) {
      throw new Error(`Failed to delete lore canonization override: ${error.message}`);
    }
  }
}

export const loreCanonizationRepository = new LoreCanonizationRepository();
