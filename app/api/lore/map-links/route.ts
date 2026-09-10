import { z } from 'zod';
import { NextRequest } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';
import { jsonOk, jsonCreated, jsonBadRequest, jsonNotFound, jsonServerError } from '@/lib/api/responses';
import { requireAdmin, isAuthError } from '@/lib/api/auth';

/**
 * Lore ↔ map location links.
 *
 * GET  /api/lore/map-links?slug=<lore-slug>  → all links, or the link for one lore slug
 * POST /api/lore/map-links                  → upsert a link (admin only)
 *     body: { loreLocationSlug, mapLocationId }
 *
 * NOTE: like the lore-submission repository, this route uses an untyped
 * query surface because lore_map_links postdates lib/database.types.ts.
 */

type UntypedMaybeSingle = Promise<{ data: unknown; error: { message: string } | null }>;
type UntypedResult = { data: unknown; error: { message: string } | null };
type UntypedQuery = {
  select: (columns: string) => UntypedQuery;
  eq: (column: string, value: string) => UntypedQuery;
  maybeSingle: () => UntypedMaybeSingle;
  single: () => UntypedMaybeSingle;
} & Promise<UntypedResult>;
type UntypedInsertQuery = UntypedQuery & {
  upsert: (values: Record<string, unknown>, options?: { onConflict?: string }) => UntypedQuery;
};
type UntypedClient = { from: (table: string) => UntypedInsertQuery };

function getAdminClient(): UntypedClient {
  const client = getSupabaseAdmin();
  if (!client) throw new Error('Supabase admin client not configured');
  return client as unknown as UntypedClient;
}

const upsertSchema = z.object({
  loreLocationSlug: z.string().trim().min(1).max(160),
  mapLocationId: z.string().trim().min(1).max(160),
});

interface LoreMapLinkRow {
  id: string;
  lore_location_slug: string;
  map_location_id: string;
  created_by: string;
  created_at: string;
}

function toLink(row: unknown) {
  const record = row as LoreMapLinkRow;
  return {
    id: record.id,
    loreLocationSlug: record.lore_location_slug,
    mapLocationId: record.map_location_id,
    createdBy: record.created_by,
    createdAt: record.created_at,
  };
}

export async function GET(request: NextRequest) {
  try {
    const slug = request.nextUrl.searchParams.get('slug');
    const client = getAdminClient();

    let query: UntypedQuery = client
      .from('lore_map_links')
      .select('id, lore_location_slug, map_location_id, created_by, created_at');

    if (slug) {
      query = query.eq('lore_location_slug', slug);
    }

    const { data, error } = await query;
    if (error) {
      return jsonServerError('Failed to fetch lore map links', new Error(error.message));
    }

    return jsonOk({ links: (Array.isArray(data) ? data : []).map(toLink) });
  } catch (error) {
    return jsonServerError('Failed to fetch lore map links', error);
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireAdmin();
  if (isAuthError(auth)) return auth;

  try {
    const body = await request.json().catch(() => null);
    const parsed = upsertSchema.safeParse(body);
    if (!parsed.success) {
      return jsonBadRequest('Invalid lore map link', parsed.error.issues.map((issue) => issue.message));
    }

    const client = getAdminClient();

    // Verify the map location exists before linking.
    const { data: location, error: locationError } = await client
      .from('locations')
      .select('id, name')
      .eq('id', parsed.data.mapLocationId)
      .maybeSingle();

    if (locationError) {
      return jsonServerError('Failed to validate map location', new Error(locationError.message));
    }
    if (!location) {
      return jsonNotFound(`Map location "${parsed.data.mapLocationId}" does not exist`);
    }

    const { data, error } = await client
      .from('lore_map_links')
      .upsert(
        {
          lore_location_slug: parsed.data.loreLocationSlug,
          map_location_id: parsed.data.mapLocationId,
          created_by: auth.address,
        },
        { onConflict: 'lore_location_slug' },
      )
      .select('id, lore_location_slug, map_location_id, created_by, created_at')
      .single();

    if (error) {
      return jsonServerError('Failed to save lore map link', new Error(error.message));
    }

    return jsonCreated(toLink(data));
  } catch (error) {
    return jsonServerError('Failed to save lore map link', error);
  }
}
