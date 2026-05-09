import { NextRequest } from 'next/server';
import { requireAdmin, isAuthError } from '@/lib/api/auth';
import { jsonOk } from '@/lib/api/responses';
import { loreSubmissionService } from '@/lib/services/lore-submission-service';
import { handleLoreSubmissionApiError, readJsonBody } from '@/app/api/lore/submissions/shared';

type RouteContext = {
  params: Promise<{ submissionId: string }>;
};

async function getSubmissionId(context: RouteContext): Promise<string> {
  const params = await context.params;
  return params.submissionId;
}

function readOptionalNote(body: unknown): string | undefined {
  if (!body || typeof body !== 'object' || !('note' in body)) return undefined;
  const note = (body as { note?: unknown }).note;
  return typeof note === 'string' && note.trim() ? note.trim() : undefined;
}

export async function POST(request: NextRequest, context: RouteContext) {
  const auth = await requireAdmin();
  if (isAuthError(auth)) return auth;

  const body = await readJsonBody(request);
  try {
    const submission = await loreSubmissionService.decanonizeSubmission(await getSubmissionId(context), auth.address, readOptionalNote(body));
    return jsonOk(submission);
  } catch (error) {
    return handleLoreSubmissionApiError(error, 'Failed to decanonize lore submission');
  }
}
