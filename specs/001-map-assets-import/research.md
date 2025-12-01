# Phase 0 Research: Map Assets Import and Integration

**Date**: 2025-11-08
**Feature**: Map Assets Import and Integration
**Status**: Complete

## Asset Loading Strategies Research

### Decision: Implement Progressive Asset Loading with Fallbacks

**Rationale**: Based on the spec requirements for progressive fallbacks (placeholder → reload → default icon → error logging) and performance targets (<2s load time), a progressive loading approach provides the best balance of user experience and reliability.

**Implementation Strategy**:
1. **Critical Assets (Preload)**: Map markers (location, character, burn, death, fight icons)
2. **Non-Critical Assets (Lazy Load)**: Legend icons, staking dialog assets, wallet connection assets, border decorations
3. **Fallback Hierarchy**: Show placeholder → attempt reload → use default icon → log error

**Alternatives Considered**:
- Full preload: Would meet 2s target but increases initial bundle size
- Pure lazy loading: Better initial load time but poor user experience when assets needed suddenly
- On-demand loading: Complex to implement, inconsistent user experience

## IconFactory Enhancement Research

### Decision: Extend Existing IconFactory with Progressive Loading

**Rationale**: The existing IconFactory already handles icon creation, caching, and mobile scaling. Extending it with progressive loading maintains the existing API while adding required functionality.

**Enhancement Plan**:
1. Add asset loading state tracking to IconFactory
2. Implement retry logic with exponential backoff
3. Add default fallback icons for each asset type
4. Integrate error logging for failed loads
5. Maintain existing caching mechanism for performance

**Best Practices Applied**:
- Preserve existing IconFactory interface (backward compatibility)
- Use React hooks for loading state management
- Implement proper error boundaries for asset failures
- Cache successfully loaded assets to prevent redundant requests

## Responsive Asset Scaling Research

### Decision: Maintain Existing Mobile Scaling in IconFactory

**Rationale**: The current IconFactory already implements responsive scaling with mobileScale and minTouchSize parameters. This approach is proven and aligns with spec requirements.

**Scaling Strategy**:
- Mobile (< 768px): 1.5x scale with 44px minimum touch target
- Tablet (768px - 1024px): 1.2x scale
- Desktop (> 1024px): Original size

**Performance Considerations**:
- Generate multiple resolutions during build time if needed
- Use CSS media queries for simple scaling where possible
- Maintain aspect ratios for all icon types

## Asset Organization Research

### Decision: Flat Structure in /images/ with Type Prefixes

**Rationale**: Based on spec clarification for flat structure, using descriptive prefixes maintains organization while simplicity.

**Naming Convention**:
- Map markers: `icon_[type].png` (e.g., `icon_location.png`)
- Legend icons: `legend_[type]_[state].png` (e.g., `legend_location_on.png`)
- Staking assets: `staking_[component].png` (e.g., `staking_button.png`)
- Wallet assets: `wallet_[state].png` (e.g., `wallet_connect.png`)
- Border assets: `border_[position].png` (e.g., `border_bottom_l.png`)
- Background assets: descriptive names (e.g., `wagdiemap.png`)

## Testing Strategy Research

### Decision: Multi-Layer Testing Approach

**Rationale**: Following Constitution requirements for critical path testing with pragmatic approach.

**Testing Plan**:
1. **Unit Tests**: IconFactory functionality, asset loading logic, fallback mechanisms
2. **Integration Tests**: Map component rendering with assets, layer controls functionality
3. **E2E Tests**: Complete user flows with asset loading, responsive behavior
4. **Performance Tests**: Load time measurements, 60fps rendering with 60+ markers

**Tools**: Jest + React Testing Library for unit/integration, Playwright for E2E, Lighthouse for performance

## Error Handling Research

### Decision: Graceful Degradation with Comprehensive Logging

**Rationale**: Ensures map remains functional even with asset failures while providing visibility into issues.

**Error Handling Strategy**:
1. **Network Failures**: Show placeholder, retry with exponential backoff
2. **Missing Files**: Use default icon, log error with asset path
3. **Corrupted Assets**: Fallback to default, report corruption
4. **Loading Timeouts**: Show placeholder, allow manual retry

**Logging Approach**: Console errors for development, error reporting service for production (if available)

## Performance Optimization Research

### Decision: Optimize Critical Path with Smart Caching

**Rationale**: Meet <2s load time target while maintaining 60fps performance.

**Optimization Techniques**:
1. **Asset Preloading**: Critical map markers during app initialization
2. **Lazy Loading**: Non-critical assets when needed
3. **Caching**: Browser cache + IconFactory in-memory cache
4. **Compression**: Use WebP format where supported, fallback to PNG
5. **CDN Delivery**: Leverage Vercel's edge network for static assets

## Technology Compatibility Research

### Decision: Leverage Existing Stack with Minimal Additions

**Rationale**: Maintain simplicity principle while meeting requirements.

**Technology Stack**:
- **Core**: Next.js 15+, React 18+, TypeScript 5+ (Constitution requirements)
- **Mapping**: Leaflet 1.9+, React-Leaflet 7+ (existing implementation)
- **Styling**: Tailwind CSS (Constitution requirement)
- **Testing**: Jest, React Testing Library, Playwright (Constitution requirements)
- **Build**: Vite (if needed for asset optimization)

**No Additional Dependencies Required**: All functionality can be implemented with existing stack.

## Migration Strategy Research

### Decision: Incremental Migration with Backward Compatibility

**Rationale**: Ensure existing map functionality remains intact during asset integration.

**Migration Steps**:
1. Copy all assets to flat /images/ structure
2. Update IconFactory paths progressively
3. Test each asset type independently
4. Implement fallback mechanisms
5. Performance testing and optimization
6. Documentation updates

**Rollback Plan**: Keep old asset paths as fallback during transition period.