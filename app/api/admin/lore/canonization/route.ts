import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin, isAuthError } from '@/lib/api/auth';
import { loreCanonizationService } from '@/lib/services/lore-canonization-service';
import { handleLoreCanonizationApiError } from './shared';

export async function GET(_request: NextRequest) {
  const auth = await requireAdmin();
  if (isAuthError(auth)) return auth;

  try {
    const events = await loreCanonizationService.listAdminRecords();
    return NextResponse.json({ events, count: events.length });
  } catch (error) {
    return handleLoreCanonizationApiError(error, 'Failed to fetch lore canonization overrides');
  }
}
