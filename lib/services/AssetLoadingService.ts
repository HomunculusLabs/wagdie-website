/**
 * DEPRECATED: Compatibility shim (Phase 1 consolidation)
 *
 * This file intentionally contains no implementation.
 * Canonical implementation lives at:
 *   `@/lib/services/asset-loading-service`
 *
 * Please update imports:
 *   - from: `@/lib/services/AssetLoadingService`
 *   - to:   `@/lib/services/asset-loading-service`
 */

if (process.env.NODE_ENV !== 'production') {
  console.warn(
    '[DEPRECATED] Import from \"@/lib/services/asset-loading-service\" instead of \"@/lib/services/AssetLoadingService\". This shim will be removed after repo-wide import migration.'
  );
}

export { AssetLoadingService, getAssetLoadingService } from './asset-loading-service';