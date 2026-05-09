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

export async function GET(_request: NextRequest, context: RouteContext) {
  const auth = await requireAdmin();
  if (isAuthError(auth)) return auth;

  try {
    const submission = await loreSubmissionService.getAdminDetail(await getSubmissionId(context));
    return jsonOk(submission);
  } catch (error) {
    return handleLoreSubmissionApiError(error, 'Failed to fetch admin lore submission');
  }
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  const auth = await requireAdmin();
  if (isAuthError(auth)) return auth;

  const body = await readJsonBody(request);
  try {
    const submission = await loreSubmissionService.updateCuration(
      await getSubmissionId(context),
      body,
      auth.address,
    );
    return jsonOk(submission);
  } catch (error) {
    return handleLoreSubmissionApiError(error, 'Failed to update lore submission curation');
  }
}
