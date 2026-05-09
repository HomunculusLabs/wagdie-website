import { NextResponse } from 'next/server';
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
    return NextResponse.json(
      { error: error.message, details: error.details },
      { status: 400 },
    );
  }

  if (error instanceof LoreCanonizationNotFoundError) {
    return NextResponse.json({ error: error.message }, { status: 404 });
  }

  console.error(`${fallbackMessage}:`, error);
  return NextResponse.json({ error: fallbackMessage }, { status: 500 });
};
