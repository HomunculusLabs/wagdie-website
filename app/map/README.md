# World Map

The Interactive Map feature allows users to explore the WAGDIE world and manage their character locations.

## User Stories

### User Story 1: Access Interactive Map (P1 - MVP)
- **Goal**: Users can access the interactive world map from navigation
- **URL**: `/map`
- **Components**: `MapEmbed`, `CharacterLocationList`

### User Story 2: View Character Locations (P2)
- **Goal**: Authenticated users can view their character locations on the map
- **Requirements**: Wallet connection
- **Components**: `CharacterLocationList`, `NoCharactersState`

### User Story 3: Stake Characters to Locations (P3)
- **Goal**: Character owners can stake/move characters via blockchain
- **Requirements**: Wallet connection, character ownership
- **Components**: `LocationSelector`, `TransactionStatus`

## Architecture

### Page Structure

```
app/map/
├── page.tsx          # Main map page
├── loading.tsx       # Loading skeleton
└── README.md         # This file
```

### Component Dependencies

```
MapPage (app/map/page.tsx)
├── MapEmbed (components/map/MapEmbed.tsx)
├── CharacterLocationList (components/map/CharacterLocationList.tsx)
│   ├── useCharacterLocation (hooks/map/useCharacterLocation.ts)
│   └── useLocations (hooks/map/useLocations.ts)
│
└── wagmi hooks
    ├── useAccount()
    └── useWriteContract()
```

### Data Flow

```
1. User navigates to /map
   ↓
2. MapPage renders with MapEmbed component
   ↓
3. MapEmbed displays iframe from wagdie.world
   ↓
4. If wallet connected:
   - CharacterLocationList renders
   - Fetches character locations via useCharacterLocation
   - Calls locationService.getCharacterLocations()
   ↓
5. LocationService queries Supabase
   ↓
6. Returns data to UI
```

## Technical Details

### Dependencies

- **Next.js 15**: App Router, Server Components
- **wagmi v2**: Blockchain state management
- **viem v2**: Ethereum interactions
- **Supabase**: Location data storage
- **RainbowKit**: Wallet connection UI

### Environment Variables

```bash
WAGDIE_WORLD_CONTRACT_ADDRESS=0x...  # Required
```

### Database Tables

- `locations`: Available map locations
- `character_locations`: Current character locations (denormalized)
- `location_transactions`: Audit trail of movements

### Success Criteria (from spec.md)

- **SC-001**: Users can access map from any page within 2 clicks
- **SC-002**: Map loads within 3 seconds
- **SC-003**: 95% accuracy for character location display
- **SC-004**: Transactions complete within 60 seconds or show errors
- **SC-005**: Map handles 100+ characters without degradation
- **SC-006**: 90% success rate for location changes
- **SC-007**: User-friendly error messages

## API Routes

No custom API routes required - uses direct Supabase client and wagmi hooks.

## Testing

### Unit Tests
- Location service functions: `tests/map/integration/`
- Component rendering: `tests/map/integration/`

### E2E Tests
- Navigation flow: `tests/map/e2e/map-user-flow.spec.ts`
- Map loading: Playwright tests

Run tests:
```bash
npm test
npm run test:e2e
```

## Development

### Setup

1. Ensure database migration is applied:
```bash
npx supabase db reset
```

2. Seed initial location data:
```sql
INSERT INTO locations (id, name) VALUES
  ('concord_searing', 'Concord Searing'),
  ('forsaken_lands', 'Forsaken Lands');
```

### Running Locally

```bash
npm run dev
# Open http://localhost:3000/map
```

## Future Enhancements

### Phase 4 (P2)
- Character location real-time updates
- Enhanced location metadata display
- Character filtering and search

### Phase 5 (P3)
- Batch staking operations
- Advanced transaction status tracking
- Location rarity visualization

### Phase 6 (Polish)
- Performance optimization for large character sets
- Advanced error recovery mechanisms
- Accessibility improvements

## Troubleshooting

### Map not loading
- Check `https://wagdie.world` is accessible
- Verify iframe has correct attributes
- Check browser console for CSP errors

### Character locations not showing
- Verify wallet is connected
- Check Supabase connection
- Ensure `character_locations` table has data

### Transaction failing
- Verify contract address is correct
- Check wallet has sufficient ETH
- Confirm character ownership

## Related Documentation

- [Feature Specification](../../specs/006-map-integration/spec.md)
- [Data Model](../../specs/006-map-integration/data-model.md)
- [WagdieWorld Contract](../../specs/006-map-integration/contracts/wagdie-world-contract.md)
- [Quick Start Guide](../../specs/006-map-integration/quickstart.md)
