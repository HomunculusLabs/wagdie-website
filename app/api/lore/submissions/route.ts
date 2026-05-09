import { NextRequest } from 'next/server';
import { requireAuth, isAuthError } from '@/lib/api/auth';
import { jsonCreated, jsonOk } from '@/lib/api/responses';
import { loreSubmissionService } from '@/lib/services/lore-submission-service';
import {
  applyLoreSubmissionRateLimit,
  handleLoreSubmissionApiError,
  readJsonBody,
} from './shared';

export async function GET(_request: NextRequest) {
  const auth = await requireAuth();
  if (isAuthError(auth)) return auth;

  try {
    const submissions = await loreSubmissionService.listForSubmitter(auth.address);
    return jsonOk({ submissions });
  } catch (error) {
    return handleLoreSubmissionApiError(error, 'Failed to list lore submissions');
  }
}

export async function POST(request: NextRequest) {
  const rateLimited = applyLoreSubmissionRateLimit(request);
  if (rateLimited) return rateLimited;

  const auth = await requireAuth();
  if (isAuthError(auth)) return auth;

  const body = await readJsonBody(request);
  try {
    const submission = await loreSubmissionService.createSubmission(body, auth.address);
    return jsonCreated(submission);
  } catch (error) {
    return handleLoreSubmissionApiError(error, 'Failed to create lore submission');
  }
}
