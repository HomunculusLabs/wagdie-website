import type { NextResponse } from 'next/server';
import { jsonRaw, jsonRawError } from '@/lib/api/responses';
import {
  LoreCanonizationNotFoundError,
  LoreCanonizationValidationError,
} from '@/lib/services/lore-canonization-service';

export const readJsonBody = async (request: Request): Promise<unknown> => {
  try {
    return await request.json();
  } catch {
    return null;
  }
};

export const handleLoreCanonizationApiError = (
  error: unknown,
  fallbackMessage: string,
): NextResponse => {
  if (error instanceof LoreCanonizationValidationError) {
    return jsonRaw(
      { error: error.message, details: error.details },
      { status: 400 },
    );
  }

  if (error instanceof LoreCanonizationNotFoundError) {
    return jsonRawError(error.message, 404);
  }

  console.error(`${fallbackMessage}:`, error);
  return jsonRawError(fallbackMessage, 500);
};
