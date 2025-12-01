# ADR-006: Interactive Map Integration

**Date:** 2025-11-03
**Status:** Accepted
**Deciders:** Development Team

## Context

We need to integrate an interactive world map into the WAGDIE application that allows users to:
1. View an interactive map from wagdie.world
2. See their characters' current locations
3. Stake, move, and unstake characters to different locations via blockchain

## Decision

We implemented a three-layer architecture with the following characteristics:

### Architecture Layers

1. **UI Layer** (React Components)
   - Pure presentation components
   - State managed via custom hooks
   - Memoized with React.memo for performance
   - Error boundaries for graceful error handling

2. **Service Layer** (Business Logic)
   - Abstractions over data sources
   - Handles data transformation
   - Manages transaction state
   - Caching strategies

3. **Data Layer** (External Dependencies)
   - Supabase for location caching
   - Wagmi/Viem for blockchain integration
   - External Wagdie.world iframe

### Component Structure

```
components/map/
├── MapEmbed.tsx              # iframe wrapper with error handling
├── CharacterLocationList.tsx # Displays user's characters
├── LocationSelector.tsx      # Location selection modal
├── TransactionStatus.tsx     # Blockchain transaction status
├── ErrorBoundary.tsx         # React error boundary
└── LoadingSpinner.tsx        # Reusable loading states
```

### Key Technical Decisions

#### 1. Caching Strategy (React Query)
- **Locations**: 5-minute stale time (data rarely changes)
- **Character Locations**: 30-second stale time (changes frequently with staking)
- **Retry Logic**: Exponential backoff for failed requests
- **Window Focus**: Automatic refetch on window focus for fresh data

#### 2. Blockchain Integration (wagmi v2)
- Separate transaction lifecycle management
- Real-time transaction status tracking
- Optimistic updates for immediate UI feedback
- Proper error handling for failed transactions

#### 3. State Management
- Local state for UI interactions (modals, selections)
- React Query for server state (data fetching, caching)
- No global state management (Redux/Context) to reduce complexity

#### 4. Performance Optimizations
- React.memo on all major components
- useMemo for expensive calculations
- useCallback for stable function references
- Lazy loading for iframe content

#### 5. Error Handling
- React Error Boundaries for component errors
- Try-catch blocks in service layer
- User-friendly error messages
- Retry mechanisms for transient failures

## Alternatives Considered

### Alternative 1: Direct Blockchain Query
**Rejected because:**
- No built-in query interface for WagdieWorld contract
- Would require custom indexing service
- Higher complexity and infrastructure requirements

### Alternative 2: Redux for State Management
**Rejected because:**
- Unnecessary complexity for current needs
- React Query provides sufficient state management
- Additional dependency without clear benefit

### Alternative 3: Server-Side Rendering (SSR)
**Rejected because:**
- Wagmi requires client-side environment
- Interactive components need client-side anyway
- Simplification favors client-side rendering

### Alternative 4: Direct Supabase Polling
**Rejected because:**
- Wasteful for data that changes infrequently
- Caching via React Query is more efficient
- Better user experience with cached data

## Consequences

### Positive
1. **Separation of Concerns**: Clear boundaries between UI, logic, and data
2. **Testability**: Each layer can be tested independently
3. **Maintainability**: Easy to modify individual layers without affecting others
4. **Performance**: Optimized rendering and data fetching
5. **Scalability**: Easy to add new features or swap implementations

### Negative
1. **Learning Curve**: Multiple libraries to understand (React Query, wagmi)
2. **Complexity**: More files and abstractions than simple approach
3. **Dependencies**: Additional npm packages to maintain

### Neutral
1. **Client-Side Only**: Limits SEO but acceptable for authenticated features
2. **Third-Party Dependencies**: Relies on wagdie.world being accessible

## Implementation Notes

### Database Schema
Three tables in Supabase:
- `locations`: Static location data
- `character_locations`: Cached character positions
- `location_transactions`: Transaction history

### Blockchain Integration
Three contract interactions:
- `stakeWagdies()`: Initial staking
- `changeWagdieLocations()`: Moving characters
- `unstakeWagdies()`: Removing characters

### Performance Metrics
- **Time to Interactive**: < 3 seconds for map load
- **Query Cache Hit Rate**: > 90% for locations
- **Transaction Success Rate**: ~90% target
- **Component Re-renders**: Minimized via memoization

## Future Considerations

1. **Real-time Updates**: Consider WebSocket for live transaction updates
2. **Batch Operations**: Optimize for multiple character moves
3. **Offline Support**: Cache data for offline viewing
4. **Analytics**: Track staking patterns and popular locations
5. **Map Customization**: Add filters, search, favorites

## References

- [React Query Documentation](https://tanstack.com/query/latest)
- [wagmi v2 Documentation](https://wagmi.sh)
- [Next.js App Router](https://nextjs.org/docs/app)
- [Clean Architecture](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html)
