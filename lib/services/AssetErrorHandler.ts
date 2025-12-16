/**
 * DEPRECATED: Compatibility shim (Phase 1 consolidation)
 *
 * This file intentionally contains no implementation.
 * Canonical implementation lives at:
 *   `@/lib/services/asset-error-handler`
 *
 * Please update imports:
 *   - from: `@/lib/services/AssetErrorHandler`
 *   - to:   `@/lib/services/asset-error-handler`
 */

if (process.env.NODE_ENV !== 'production') {
  console.warn(
    '[DEPRECATED] Import from \"@/lib/services/asset-error-handler\" instead of \"@/lib/services/AssetErrorHandler\". This shim will be removed after repo-wide import migration.'
  );
}

export { AssetErrorHandler, getAssetErrorHandler } from './asset-error-handler';
export type { AssetErrorHandlerOptions } from './asset-error-handler';