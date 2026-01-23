export function toError(error: unknown, fallbackMessage = 'Unexpected error'): Error {
  if (error instanceof Error) return error;
  if (typeof error === 'string') return new Error(error);
  return new Error(fallbackMessage);
}