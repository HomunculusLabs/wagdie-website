import { NextRequest } from 'next/server';
import { requireAuth, isAuthError } from '@/lib/api/auth';
import { jsonOk } from '@/lib/api/responses';
import { loreSubmissionService } from '@/lib/services/lore-submission-service';
import {
  applyLoreSubmissionRateLimit,
  handleLoreSubmissionApiError,
  readJsonBody,
} from '../shared';

type RouteContext = {
  params: Promise<{ submissionId: string }>;
};

async function getSubmissionId(context: RouteContext): Promise<string> {
  const params = await context.params;
  return params.submissionId;
}

export async function GET(_request: NextRequest, context: RouteContext) {
  const auth = await requireAuth();
  if (isAuthError(auth)) return auth;

  try {
    const submission = await loreSubmissionService.getForViewer(await getSubmissionId(context), auth.address);
    return jsonOk(submission);
  } catch (error) {
    return handleLoreSubmissionApiError(error, 'Failed to fetch lore submission');
  }
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  const rateLimited = applyLoreSubmissionRateLimit(request);
  if (rateLimited) return rateLimited;

  const auth = await requireAuth();
  if (isAuthError(auth)) return auth;

  const body = await readJsonBody(request);
  try {
    const submission = await loreSubmissionService.reviseSubmission(
      await getSubmissionId(context),
      body,
      auth.address,
    );
    return jsonOk(submission);
  } catch (error) {
    return handleLoreSubmissionApiError(error, 'Failed to revise lore submission');
  }
}
