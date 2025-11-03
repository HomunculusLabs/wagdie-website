# Quick Start Guide: Interactive Map Integration

**Feature**: Interactive Map Integration (006-map-integration)
**Date**: 2025-11-03
**Estimated Implementation Time**: 4-6 hours

## Prerequisites

### Required Knowledge
- TypeScript 5+
- React 18+
- Next.js 15 (App Router)
- Basic understanding of wagmi/viem for Web3
- Basic understanding of Supabase

### Development Environment
- Node.js 18+ installed
- npm/yarn/pnpm package manager
- Git for version control
- Code editor (VS Code recommended)
- MetaMask wallet (for testing)

### External Services
- WagdieWorld contract (deployed on Ethereum)
- wagdie.world service (external map)
- Supabase project (existing)

---

## Getting Started

### 1. Setup Development Environment

```bash
# Clone repository
git clone <repository-url>
cd wagdie-simplified

# Install dependencies
npm install

# Setup environment variables
cp .env.example .env.local
# Edit .env.local with required values (see Environment Variables below)

# Verify build works
npm run build
```

### 2. Environment Variables

Create `.env.local` file:

```bash
# Supabase (required - existing)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Wagmi Configuration (required - existing)
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_walletconnect_id

# WagdieWorld Contract (required - new)
# Get from wagdie.world documentation or team
WAGDIE_WORLD_CONTRACT_ADDRESS=0x...

# Optional: Map Configuration
NEXT_PUBLIC_MAP_DEFAULT_LOCATION=concord_searing
NEXT_PUBLIC_MAP_CACHE_TTL=30  # seconds
```

### 3. Database Setup

```bash
# Navigate to Supabase directory
cd supabase

# Create new migration
npx supabase migration new add_map_tables

# Edit migration file (copy from data-model.md)
# Then run:
npx supabase db reset  # for development
# or
npx supabase db push   # for production
```

### 4. Seed Initial Data

```bash
# Connect to Supabase and run:
INSERT INTO locations (id, name, description) VALUES
  ('concord_searing', 'Concord Searing', 'A place of power...'),
  ('forsaken_lands', 'Forsaken Lands', 'Where characters begin...'),
  -- Add more locations
ON CONFLICT (id) DO NOTHING;
```

---

## Development Workflow

### Step 1: Create Directory Structure

```bash
# Create directories
mkdir -p components/map
mkdir -p lib/services/map
mkdir -p hooks/map
mkdir -p types
mkdir -p tests/map/integration
mkdir -p tests/map/e2e

# Create basic README files
touch components/map/README.md
touch lib/services/map/README.md
touch hooks/map/README.md
```

### Step 2: Implement Type Definitions

**File**: `lib/types/map.ts`

```typescript
export interface Location {
  id: string
  name: string
  description?: string
  metadata?: {
    coordinates?: { x: number; y: number }
    rarity?: 'common' | 'rare' | 'legendary'
    special_properties?: string[]
  }
  created_at: string
  updated_at: string
}

export interface CharacterLocation {
  character_id: string
  location_id: string
  wallet_address: string
  transaction_hash: string
  block_number?: number
  status: 'staked' | 'unstaked' | 'pending'
  created_at: string
  updated_at: string
  location?: Location
}

// Contract types
export interface StakeWagdieParams {
  wagdieId: bigint
  locationId: bigint
}

export interface ChangeWagdieLocationParams {
  wagdieId: bigint
  newLocationId: bigint
}
```

### Step 3: Create Service Layer

**File**: `lib/services/map/locationService.ts`

```typescript
import { createClient } from '@/lib/supabase'
import type { Location, CharacterLocation } from '@/types/map'

const supabase = createClient()

export async function getLocations(): Promise<Location[]> {
  const { data, error } = await supabase
    .from('locations')
    .select('*')
    .order('name')

  if (error) throw error
  return data || []
}

export async function getCharacterLocations(
  walletAddress: string
): Promise<CharacterLocation[]> {
  const { data, error } = await supabase
    .from('character_locations')
    .select(`
      *,
      location:locations(*)
    `)
    .eq('wallet_address', walletAddress.toLowerCase())
    .eq('status', 'staked')

  if (error) throw error
  return data || []
}

export async function refreshCharacterLocation(
  characterId: string
): Promise<CharacterLocation> {
  // TODO: Implement blockchain sync
  // Query WagdieWorld contract for latest data
  // Update Supabase cache
  // Return updated data
  throw new Error('Not implemented yet')
}
```

### Step 4: Create Wagmi Contract Integration

**File**: `lib/services/map/wagdieWorldContract.ts`

```typescript
import { createConfig, http } from 'wagmi'
import { mainnet } from 'wagmi/chains'
import { parseEther } from 'viem'

// Contract ABI (simplified - get full ABI from wagdie.world)
export const wagdieWorldAbi = [
  {
    type: 'function',
    name: 'stakeWagdies',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'params', type: 'tuple[]' }
    ],
    outputs: []
  },
  {
    type: 'function',
    name: 'changeWagdieLocations',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'params', type: 'tuple[]' }
    ],
    outputs: []
  },
  {
    type: 'function',
    name: 'unstakeWagdies',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'params', type: 'tuple[]' }
    ],
    outputs: []
  }
] as const

export function getWagdieWorldContract() {
  const contractAddress = process.env.WAGDIE_WORLD_CONTRACT_ADDRESS
  if (!contractAddress) {
    throw new Error('WAGDIE_WORLD_CONTRACT_ADDRESS not configured')
  }

  return {
    address: contractAddress as `0x${string}`,
    abi: wagdieWorldAbi
  }
}
```

### Step 5: Create Custom Hooks

**File**: `hooks/map/useLocations.ts`

```typescript
import { useQuery } from '@tanstack/react-query'
import { getLocations } from '@/lib/services/map/locationService'

export function useLocations() {
  return useQuery({
    queryKey: ['locations'],
    queryFn: getLocations,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000,   // 10 minutes
  })
}
```

**File**: `hooks/map/useCharacterLocation.ts`

```typescript
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useAccount } from 'wagmi'
import { getCharacterLocations } from '@/lib/services/map/locationService'

export function useCharacterLocation(characterId?: string) {
  const { address } = useAccount()
  const queryClient = useQueryClient()

  const query = useQuery({
    queryKey: ['character-locations', address, characterId],
    queryFn: async () => {
      if (!address || !characterId) return null
      const locations = await getCharacterLocations(address)
      return locations.find(loc => loc.character_id === characterId)
    },
    enabled: Boolean(address && characterId),
    staleTime: 30 * 1000, // 30 seconds
  })

  const refetch = () => {
    queryClient.invalidateQueries({
      queryKey: ['character-locations', address]
    })
  }

  return {
    ...query,
    refetch
  }
}
```

### Step 6: Create UI Components

**File**: `components/map/MapEmbed.tsx`

```tsx
export function MapEmbed() {
  return (
    <div className="w-full h-[600px] border-2 border-midnight rounded-lg overflow-hidden">
      <iframe
        src="https://wagdie.world"
        width="100%"
        height="100%"
        className="w-full h-full"
        title="WAGDIE World Map"
        loading="lazy"
      />
    </div>
  )
}
```

### Step 7: Create Map Page

**File**: `app/map/page.tsx`

```tsx
import { MapEmbed } from '@/components/map/MapEmbed'
import { CharacterLocationList } from '@/components/map/CharacterLocationList'
import { useAccount } from 'wagmi'

export default function MapPage() {
  const { address, isConnected } = useAccount()

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold mb-8">World Map</h1>

      <MapEmbed />

      {isConnected && (
        <div className="mt-8">
          <h2 className="text-2xl font-bold mb-4">Your Characters</h2>
          <CharacterLocationList />
        </div>
      )}
    </div>
  )
}
```

### Step 8: Add Navigation Link

**File**: `components/layout/Navigation.tsx`

```tsx
import Link from 'next/link'

export function Navigation() {
  return (
    <nav className="flex gap-6">
      <Link href="/">Home</Link>
      <Link href="/characters">Characters</Link>
      <Link href="/map">World Map</Link> {/* Add this line */}
      <Link href="/lore">Lore</Link>
      <Link href="/spread">Spread</Link>
    </nav>
  )
}
```

---

## Testing

### Unit Tests

**File**: `tests/map/integration/locationService.test.ts`

```typescript
import { getLocations } from '@/lib/services/map/locationService'
import { createClient } from '@/lib/supabase'

// Mock Supabase
jest.mock('@/lib/supabase', () => ({
  createClient: jest.fn()
}))

describe('locationService', () => {
  it('fetches locations successfully', async () => {
    const mockData = [
      { id: 'loc1', name: 'Test Location' }
    ]

    const mockSupabase = {
      from: jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          order: jest.fn().mockResolvedValue({ data: mockData, error: null })
        })
      })
    }

    ;(createClient as jest.Mock).mockReturnValue(mockSupabase)

    const locations = await getLocations()
    expect(locations).toEqual(mockData)
  })
})
```

### Integration Tests

**File**: `tests/map/integration/map-page.test.tsx`

```tsx
import { render, screen } from '@testing-library/react'
import { MapPage } from '@/app/map/page'
import { WagmiConfig } from 'wagmi'

// Mock wagmi
jest.mock('wagmi', () => ({
  useAccount: jest.fn().mockReturnValue({
    address: '0x123...',
    isConnected: true
  })
}))

describe('MapPage', () => {
  it('renders the map', () => {
    render(<MapPage />)
    expect(screen.getByTitle('WAGDIE World Map')).toBeInTheDocument()
  })

  it('shows character list when wallet connected', () => {
    render(<MapPage />)
    expect(screen.getByText('Your Characters')).toBeInTheDocument()
  })
})
```

### E2E Tests

**File**: `tests/map/e2e/map-user-flow.spec.ts`

```typescript
import { test, expect } from '@playwright/test'

test.describe('Map Feature', () => {
  test('can view map', async ({ page }) => {
    await page.goto('/map')
    await expect(page.locator('iframe[title="WAGDIE World Map"]')).toBeVisible()
  })

  test('can navigate to map from home', async ({ page }) => {
    await page.goto('/')
    await page.click('text=World Map')
    await expect(page).toHaveURL('/map')
  })
})
```

Run tests:
```bash
npm test
# or
npm run test:watch
# or
npm run test:e2e
```

---

## Common Issues & Solutions

### Issue 1: WagdieWorld Contract Not Found

**Error**: `WAGDIE_WORLD_CONTRACT_ADDRESS not configured`

**Solution**:
1. Check environment variables are loaded
2. Verify `.env.local` file exists
3. Restart dev server after adding env vars
4. Get contract address from team/wagdie.world docs

### Issue 2: Type Errors with bigint

**Error**: `Type 'bigint' is not assignable to type 'number'`

**Solution**:
- Use `bigint` for token IDs from blockchain
- Convert to string when storing in Supabase
- Use `BigInt()` constructor when reading from Supabase

```typescript
// In contract interaction
const tokenId = BigInt(characterId)

// In Supabase storage
const characterId = tokenId.toString()
```

### Issue 3: iframe Not Loading

**Error**: Blank iframe or CORS error

**Solution**:
- Check `https://wagdie.world` is accessible
- Verify iframe has correct attributes
- Check browser console for CSP errors
- Ensure domain allows iframe embedding

### Issue 4: Transaction Fails

**Error**: `Transaction reverted` or `Insufficient funds`

**Solution**:
1. Check wallet has sufficient ETH for gas
2. Verify contract address is correct
3. Check token ID exists and is owned by wallet
4. Verify location ID is valid
5. Check network (mainnet vs testnet)

### Issue 5: Locations Not Showing

**Error**: Empty locations list

**Solution**:
1. Verify database migration ran successfully
2. Check locations table has data
3. Verify RLS policies allow SELECT
4. Check Supabase connection
5. Review network tab for API errors

---

## API Reference

### Service Functions

#### `getLocations(): Promise<Location[]>`
- **Returns**: Array of all available locations
- **Cache**: 5 minutes (Supabase cache)
- **Error**: Throws if Supabase error

#### `getCharacterLocations(walletAddress): Promise<CharacterLocation[]>`
- **Param**: `walletAddress` - Ethereum address
- **Returns**: Array of character locations for wallet
- **Cache**: 30 seconds (browser cache)
- **Error**: Throws if Supabase error

#### `refreshCharacterLocation(characterId): Promise<CharacterLocation>`
- **Param**: `characterId` - WAGDIE token ID
- **Returns**: Updated character location
- **Side Effect**: Syncs with blockchain, updates Supabase cache
- **Error**: Throws if sync fails

### Contract Functions

#### `stakeWagdies(params: StakeWagdieParams[]): Promise<TransactionResponse>`
- **Param**: `params` - Array of { wagdieId, locationId }
- **Returns**: Transaction response
- **Gas**: ~100k-200k per character
- **Error**: Reverts if already staked or location invalid

#### `changeWagdieLocations(params: ChangeWagdieLocationParams[]): Promise<TransactionResponse>`
- **Param**: `params` - Array of { wagdieId, newLocationId }
- **Returns**: Transaction response
- **Gas**: ~80k-150k per character
- **Error**: Reverts if not staked or location invalid

#### `unstakeWagdies(params: UnstakeWagdieParams[]): Promise<TransactionResponse>`
- **Param**: `params` - Array of { wagdieId }
- **Returns**: Transaction response
- **Gas**: ~60k-100k per character
- **Error**: Reverts if not staked

---

## Performance Optimization

### Caching Strategy

```
1. Browser Cache (30s)
   ↓ miss
2. React Query (30s stale time)
   ↓ miss
3. Supabase Cache (5min)
   ↓ miss
4. Database Query
   ↓ if different from blockchain
5. Blockchain Query
   ↓
6. Update Supabase
   ↓
7. Return to user
```

### Recommendations

1. **Batch Operations**: Stake/unstake multiple characters in one transaction
2. **Pagination**: If >100 characters, paginate location queries
3. **Lazy Loading**: Load character details on demand
4. **Image Optimization**: Compress location images if any
5. **Code Splitting**: Lazy load map components

---

## Deployment

### Development
```bash
npm run dev
# Open http://localhost:3000/map
```

### Staging
```bash
npm run build
npm run start
# Deploy to Vercel or preferred platform
```

### Production Checklist

- [ ] Environment variables configured
- [ ] Database migration applied
- [ ] Initial location data seeded
- [ ] Contract address verified
- [ ] Tests passing
- [ ] Build successful
- [ ] Performance verified (<3s load)
- [ ] Mobile responsive
- [ ] Error handling tested
- [ ] Documentation updated

---

## Additional Resources

### Documentation
- [WagdieWorld Contract Docs](./contracts/)
- [Feature Specification](./spec.md)
- [Research Report](./research.md)
- [Data Model](./data-model.md)

### External Links
- [wagdie.world](https://wagdie.world)
- [wagmi Docs](https://wagmi.sh)
- [viem Docs](https://viem.sh)
- [Supabase Docs](https://supabase.com/docs)
- [Next.js Docs](https://nextjs.org/docs)

### Community
- [WAGDIE Discord](https://discord.gg/wagdie)
- [GitHub Issues](link-to-repo/issues)
- [WAGDIE Twitter](https://twitter.com/WAGDIE_ETH)

---

## Support

If you encounter issues:

1. Check this quick start guide
2. Review feature specification
3. Check test files for examples
4. Open GitHub issue with:
   - Error message
   - Steps to reproduce
   - Environment details
   - Screenshots if applicable

---

**Status**: ✅ Ready for Implementation
**Estimated Time**: 4-6 hours for full feature
**Confidence**: High (based on validated research)
