import { NextRequest } from 'next/server';
import { requireAdmin, isAuthError } from '@/lib/api/auth';
import { jsonOk } from '@/lib/api/responses';
import { parsePositiveIntParam } from '@/lib/api/params';
import { loreSubmissionStatuses, type LoreSubmissionStatus } from '@/types/lore-submission';
import { loreSubmissionService } from '@/lib/services/lore-submission-service';
import { handleLoreSubmissionApiError } from '@/app/api/lore/submissions/shared';

function parseStatus(value: string | null): LoreSubmissionStatus | undefined {
  if (!value) return undefined;
  return (loreSubmissionStatuses as readonly string[]).includes(value) ? value as LoreSubmissionStatus : undefined;
}

export async function GET(request: NextRequest) {
  const auth = await requireAdmin();
  if (isAuthError(auth)) return auth;

  const url = new URL(request.url);
  try {
    const result = await loreSubmissionService.listAdmin({
      status: parseStatus(url.searchParams.get('status')),
      submitter: url.searchParams.get('submitter')?.trim().toLowerCase() || undefined,
      query: url.searchParams.get('query')?.trim() || undefined,
      page: parsePositiveIntParam(url.searchParams.get('page'), { defaultValue: 1, min: 1 }) ?? 1,
      perPage: parsePositiveIntParam(url.searchParams.get('perPage'), { defaultValue: 25, min: 1, max: 100 }) ?? 25,
    });
    return jsonOk(result);
  } catch (error) {
    return handleLoreSubmissionApiError(error, 'Failed to list admin lore submissions');
  }
}
