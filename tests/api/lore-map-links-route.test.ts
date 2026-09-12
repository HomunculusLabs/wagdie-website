/**
 * @jest-environment node
 */

import { NextRequest, NextResponse } from 'next/server';
import { GET, POST } from '@/app/api/lore/map-links/route';
import { requireAdmin } from '@/lib/api/auth';
import { getSupabaseAdmin } from '@/lib/supabase';

jest.mock('@/lib/api/auth', () => ({
  requireAdmin: jest.fn(),
  isAuthError: (result: unknown) => result instanceof NextResponse,
}));

jest.mock('@/lib/supabase', () => ({
  getSupabaseAdmin: jest.fn(),
}));

const adminAddress = '0xAdmin';

const linkRow = {
  id: 'link-1',
  lore_location_slug: 'ash-orchard',
  map_location_id: '80.11.black-bell-toll',
  created_by: adminAddress,
  created_at: '2026-05-09T00:00:00.000Z',
};

/** Minimal untyped-supabase-style client answering per table. */
function makeClient(tables: Record<string, Record<string, unknown>>) {
  return {
    from: jest.fn((table: string) => {
      const config = tables[table];
      if (!config) throw new Error(`Unexpected table ${table}`);
      return config.builder ?? {};
    }),
  };
}

describe('lore map-links API route', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (requireAdmin as jest.Mock).mockResolvedValue({ address: adminAddress });
  });

  it('lists all links without a slug filter', async () => {
    const maybeAwaited = {
      data: [linkRow, { ...linkRow, id: 'link-2', lore_location_slug: 'crows-den' }],
      error: null,
    };
    const query = {
      select: jest.fn(() => query),
      eq: jest.fn(() => query),
      then: (resolve: (value: unknown) => void) => resolve(maybeAwaited),
    };
    (getSupabaseAdmin as jest.Mock).mockReturnValue(makeClient({
      lore_map_links: { builder: query },
    }));

    const response = await GET(new NextRequest('http://localhost/api/lore/map-links'));

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      success: true,
      data: {
        links: [
          {
            id: 'link-1',
            loreLocationSlug: 'ash-orchard',
            mapLocationId: '80.11.black-bell-toll',
            createdBy: adminAddress,
            createdAt: '2026-05-09T00:00:00.000Z',
          },
          {
            id: 'link-2',
            loreLocationSlug: 'crows-den',
            mapLocationId: '80.11.black-bell-toll',
            createdBy: adminAddress,
            createdAt: '2026-05-09T00:00:00.000Z',
          },
        ],
      },
    });
  });

  it('filters by lore slug when provided', async () => {
    const maybeAwaited = { data: [linkRow], error: null };
    const query = {
      select: jest.fn(() => query),
      eq: jest.fn((column: string, value: string) => {
        expect([column, value]).toEqual(['lore_location_slug', 'ash-orchard']);
        return query;
      }),
      then: (resolve: (value: unknown) => void) => resolve(maybeAwaited),
    };
    (getSupabaseAdmin as jest.Mock).mockReturnValue(makeClient({
      lore_map_links: { builder: query },
    }));

    const response = await GET(new NextRequest('http://localhost/api/lore/map-links?slug=ash-orchard'));

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      success: true,
      data: {
        links: [
          {
            id: 'link-1',
            loreLocationSlug: 'ash-orchard',
            mapLocationId: '80.11.black-bell-toll',
            createdBy: adminAddress,
            createdAt: '2026-05-09T00:00:00.000Z',
          },
        ],
      },
    });
  });

  it('requires admin and validates the payload before touching the database', async () => {
    const response = await POST(new NextRequest('http://localhost/api/lore/map-links', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ loreLocationSlug: '', mapLocationId: '80.11.black-bell-toll' }),
    }));

    expect(response.status).toBe(400);
    expect(getSupabaseAdmin).not.toHaveBeenCalled();
  });

  it('rejects non-admin POSTs before any database access', async () => {
    (requireAdmin as jest.Mock).mockResolvedValueOnce(
      NextResponse.json({ error: 'Admin access required' }, { status: 403 }),
    );

    const response = await POST(new NextRequest('http://localhost/api/lore/map-links', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ loreLocationSlug: 'ash-orchard', mapLocationId: '80.11.black-bell-toll' }),
    }));

    expect(response.status).toBe(403);
    expect(getSupabaseAdmin).not.toHaveBeenCalled();
  });

  it('returns 404 when the referenced map location does not exist', async () => {
    const locationMaybeSingle = jest.fn(async () => ({ data: null, error: null }));
    const locationQuery = {
      select: jest.fn(() => locationQuery),
      eq: jest.fn(() => locationQuery),
      maybeSingle: locationMaybeSingle,
    };
    (getSupabaseAdmin as jest.Mock).mockReturnValue(makeClient({
      locations: { builder: locationQuery },
    }));

    const response = await POST(new NextRequest('http://localhost/api/lore/map-links', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ loreLocationSlug: 'ash-orchard', mapLocationId: '99.99.missing' }),
    }));

    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toMatchObject({
      error: 'Map location "99.99.missing" does not exist',
    });
  });

  it('upserts the link scoped to the lore slug and stamps the admin wallet', async () => {
    const locationMaybeSingle = jest.fn(async () => ({
      data: { id: '80.11.black-bell-toll', name: 'Black Bell Toll' },
      error: null,
    }));
    const locationQuery = {
      select: jest.fn(() => locationQuery),
      eq: jest.fn(() => locationQuery),
      maybeSingle: locationMaybeSingle,
    };

    const upsertValues: Array<{ values: Record<string, unknown>; options: unknown }> = [];
    const single = jest.fn(async () => ({ data: linkRow, error: null }));
    const linkQuery = {
      select: jest.fn(() => linkQuery),
      eq: jest.fn(() => linkQuery),
      upsert: jest.fn((values: Record<string, unknown>, options: unknown) => {
        upsertValues.push({ values, options });
        return linkQuery;
      }),
      single,
    };
    (getSupabaseAdmin as jest.Mock).mockReturnValue(makeClient({
      locations: { builder: locationQuery },
      lore_map_links: { builder: linkQuery },
    }));

    const response = await POST(new NextRequest('http://localhost/api/lore/map-links', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ loreLocationSlug: 'ash-orchard', mapLocationId: '80.11.black-bell-toll' }),
    }));

    expect(response.status).toBe(201);
    expect(upsertValues).toEqual([{
      values: {
        lore_location_slug: 'ash-orchard',
        map_location_id: '80.11.black-bell-toll',
        created_by: adminAddress,
      },
      options: { onConflict: 'lore_location_slug' },
    }]);
    await expect(response.json()).resolves.toEqual({
      success: true,
      data: {
        id: 'link-1',
        loreLocationSlug: 'ash-orchard',
        mapLocationId: '80.11.black-bell-toll',
        createdBy: adminAddress,
        createdAt: '2026-05-09T00:00:00.000Z',
      },
    });
  });
});
