# Research Report: Interactive Map Integration

**Date**: 2025-11-03
**Feature**: Interactive Map Integration (006-map-integration)
**Status**: ✅ COMPLETE

## Executive Summary

This research validates the implementation approach for integrating the WAGDIE interactive map feature into wagdie-simplified. Key findings confirm that a simple iframe embedding approach is viable, WagdieWorld contract integration is well-documented, and clean architecture patterns can be maintained throughout.

## Research Questions & Answers

### Q1: How to integrate wagdie.world map into Next.js app?

**Answer**: Simple iframe embedding without PostMessage communication.

**Decision**: Use `<iframe src="https://wagdie.world" />` approach
**Rationale**:
- Wagdie.world handles all map interactivity internally
- No special parameters or API required
- External service is maintained independently
- Simplest possible implementation (Simplicity First principle)

**Implementation**:
```tsx
<iframe
  src="https://wagdie.world"
  width="100%"
  height="600px"
  className="border-2 border-midnight rounded-lg"
/>
```

**Alternatives Considered**:
- Custom map integration (Leaflet/Mapbox) - rejected (reinventing wheel, added complexity)
- API-based integration - rejected (no public API available)
- PostMessage communication - unnecessary for basic display

---

### Q2: What is the WagdieWorld contract interface?

**Answer**: Well-documented contract with standard staking functions.

**Decision**: Use wagmi v2 with viem for type-safe contract integration
**Rationale**:
- Matches existing wagdie-simplified tech stack
- TypeScript support for contract calls
- Built-in error handling and transaction management
- Supports multiple wallet providers

**Contract Functions**:
```typescript
// Stake characters to locations
stakeWagdies(params: StakeWagdieParamsStruct[]): Promise<TransactionResponse>

// Move characters between locations
changeWagdieLocations(params: ChangeWagdieLocationParamsStruct[]): Promise<TransactionResponse>

// Remove character from location
unstakeWagdies(params: UnstakeWagdieParamsStruct[]): Promise<TransactionResponse>
```

**Alternatives Considered**:
- Direct ethers.js calls - rejected (less type safety, more boilerplate)
- Manual ABI JSON - rejected (wagmi provides better DX)
- Third-party libraries - rejected (unnecessary abstraction)

---

### Q3: What is the data structure for locations and character locations?

**Answer**: Locations are stored in Supabase, character locations tracked on-chain.

**Decision**: Hybrid approach - Supabase for metadata, blockchain for ownership
**Rationale**:
- Supabase provides fast queries for UI
- Blockchain is source of truth for ownership
- Allows read-only mode for non-wallet users
- Follows Web3 Pragmatism principle

**Data Model**:

**Location Entity**:
```typescript
{
  id: string;           // Unique location identifier
  name: string;         // Display name (e.g., "Concord Searing")
  description?: string; // Optional lore description
  metadata?: object;    // Optional additional data
  created_at: timestamp;
  updated_at: timestamp;
}
```

**CharacterLocation Entity**:
```typescript
{
  character_id: string;    // WAGDIE token ID
  location_id: string;     // FK to Location
  wallet_address: string;  // Owner
  transaction_hash: string; // On-chain transaction
  created_at: timestamp;
  updated_at: timestamp;
}
```

**Alternatives Considered**:
- Only blockchain storage - rejected (slow queries, poor UX)
- Only Supabase storage - rejected (centralization, trust issues)
- File-based storage - rejected (no atomic updates, scaling issues)

---

### Q4: How to synchronize character locations between blockchain and UI?

**Answer**: Cache-on-read strategy with periodic sync.

**Decision**: Poll blockchain for changes + manual refresh button + 30s browser cache
**Rationale**:
- Real-time updates not critical for this use case
- Reduces RPC calls and improves performance
- User can manually sync when needed
- Maintains decentralization while ensuring UX

**Sync Strategy**:
1. **Initial Load**: Fetch from Supabase cache (fast)
2. **Periodic Check**: Poll blockchain every 5 minutes (configurable)
3. **Manual Refresh**: User-initiated sync button
4. **Write Path**: Always write through to blockchain, update cache after confirmation
5. **Caching**: Browser cache for 30 seconds, Supabase cache for 5 minutes

**Implementation Flow**:
```
User View Map
    ↓
Check browser cache (< 30s old?)
    ↓ Yes → Display cached data
    ↓ No
Fetch from Supabase (< 5 min old?)
    ↓ Yes → Display + cache in browser
    ↓ No
Query blockchain directly
    ↓
Update Supabase cache
    ↓
Display to user
```

**Alternatives Considered**:
- WebSocket real-time - rejected (over-engineered, extra infrastructure)
- GraphQL subscriptions - rejected (not in tech stack, complexity)
- Server-sent events - rejected (requires persistent connection)

---

### Q5: What error handling and loading states are needed?

**Answer**: User-friendly states for all async operations.

**Decision**: Comprehensive UX patterns following existing wagdie patterns
**Rationale**:
- Crypto UX is already challenging
- Clear feedback reduces support burden
- Matches Web3 Pragmatism principle
- Improves task completion rates

**Required States**:

**Loading States**:
- Map loading: Skeleton shimmer for iframe
- Location fetch: Spinner with "Loading locations..."
- Transaction pending: "Traveling..." with animated character
- Transaction confirmed: Success toast
- Transaction failed: Error toast with retry option

**Error States**:
- Wallet not connected: Prompt to connect with CTA
- Map service unavailable: Fallback message + retry button
- Transaction failed: Error toast + explanation
- Network error: Retry mechanism with exponential backoff

**Empty States**:
- No characters owned: "Acquire WAGDIE characters to see them on the map"
- No locations available: "New locations appearing soon..."
- Character not staked: "Enter the Forsaken Lands" CTA

**Alternatives Considered**:
- Generic error messages - rejected (not actionable)
- No loading states - rejected (poor UX, confusion)
- Blocking modals - rejected (interrupts map viewing)

---

## Technology Stack Validation

### Next.js 15 App Router ✅
- **Status**: Fully supported
- **Routing**: `/map` page created as `app/map/page.tsx`
- **Loading States**: `loading.tsx` for map loading
- **SEO**: Static generation possible (map is mostly static content)

### wagmi v2 + viem v2 ✅
- **Status**: Production ready
- **Contract Integration**: Full TypeScript support
- **Wallet Support**: MetaMask, WalletConnect, Coinbase Wallet
- **Transaction Management**: Built-in pending/confirmed states

### Supabase ✅
- **Status**: Existing infrastructure ready
- **Tables**: Can reuse existing character tables
- **Real-time**: Optional, not required for this feature
- **Type Safety**: Auto-generated TypeScript types

### Tailwind CSS ✅
- **Status**: Already configured
- **Responsive**: Mobile-first breakpoints
- **Dark Mode**: Respects `className="dark"` on html
- **Components**: Can use existing design system

## Implementation Risks & Mitigation

### Risk 1: External Service Dependency (wagdie.world)
**Impact**: Medium
**Mitigation**:
- Monitor service availability
- Implement graceful fallback
- Clear error messaging if service down
- Consider hosting backup/static version if critical

### Risk 2: Blockchain Congestion
**Impact**: High (user experience)
**Mitigation**:
- Clear gas fee estimates before transaction
- Queue transactions with status updates
- Provide "speed up" options if supported
- Document expected wait times

### Risk 3: Data Consistency (on-chain vs cache)
**Impact**: Medium
**Mitigation**:
- Blockchain as source of truth
- Regular sync jobs
- User-initiated refresh
- Clear indicators of data freshness

### Risk 4: Wallet Connection Failures
**Impact**: High (blocks core functionality)
**Mitigation**:
- Multiple wallet provider options
- Clear error messages
- Fallback to read-only mode
- Troubleshooting guide in docs

## Next Steps

1. ✅ Architecture validation complete
2. ✅ Technology choices validated
3. ✅ Data model designed
4. ⏳ Implementation planning (`/speckit.tasks`)
5. ⏳ Development (create components, hooks, services)
6. ⏳ Testing (integration + e2e)
7. ⏳ Documentation (README + ADR)

## References

- WagdieWorld Contract: `~/projects/web/src/typechain-types/`
- Original Implementation: `~/projects/web/src/features/characters/components/sheet/SheetInteractiveMap.tsx`
- Location Hook: `~/projects/web/src/features/characters/hooks/use-locations.ts`
- wagdie-simplified Constitution: `.specify/memory/constitution.md`
- Feature Specification: `./spec.md`

---

**Research Completed**: 2025-11-03
**Confidence Level**: High (90%+)
**Ready for Implementation**: Yes
