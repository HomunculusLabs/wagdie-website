import type { AssetError } from '@/types/assets';

function getErrorMessage(err: unknown): string {
  if (typeof err === 'string') return err;
  if (err instanceof Error) return err.message || err.toString();

  if (typeof err === 'object' && err !== null) {
    const maybeMessage = (err as { message?: unknown }).message;
    if (typeof maybeMessage === 'string' && maybeMessage.trim()) return maybeMessage;
  }

  try {
    return JSON.stringify(err);
  } catch {
    return String(err);
  }
}

function getErrorName(err: unknown): string | null {
  if (err instanceof Error && typeof err.name === 'string') return err.name;
  if (typeof err === 'object' && err !== null) {
    const maybeName = (err as { name?: unknown }).name;
    if (typeof maybeName === 'string' && maybeName.trim()) return maybeName;
  }
  return null;
}

export function classifyAssetError(err: unknown): AssetError['errorType'] {
  const message = getErrorMessage(err).toLowerCase();
  const name = (getErrorName(err) || '').toLowerCase();

  if (message.includes('timeout') || name.includes('abort')) return 'timeout';
  if (message.includes('404') || message.includes('not found')) return 'file_not_found';
  if (message.includes('network') || message.includes('fetch') || message.includes('failed to fetch')) {
    return 'network';
  }

  return 'unknown';
}

export function buildAssetError(args: {
  assetId: string;
  error: unknown;
  retryCount: number;
  retryAttempts: number;
}): AssetError {
  const retryCount = Number.isFinite(args.retryCount) ? args.retryCount : 0;
  const retryAttempts = Number.isFinite(args.retryAttempts) ? args.retryAttempts : 0;

  return {
    assetId: args.assetId,
    errorType: classifyAssetError(args.error),
    errorMessage: getErrorMessage(args.error),
    timestamp: Date.now(),
    retryCount,
    canRetry: retryCount < retryAttempts,
  };
}