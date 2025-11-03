# Map Services

This directory contains business logic and external service integrations for the map feature.

## Services

### locationService.ts
Supabase operations for locations and character locations:
- `getLocations()` - Fetch all available locations
- `getCharacterLocations(walletAddress)` - Get character's current locations
- `refreshCharacterLocation(characterId)` - Sync with blockchain

### wagdieWorldContract.ts
WagdieWorld smart contract integration:
- `stakeWagdies()` - Stake characters to locations
- `changeWagdieLocations()` - Move characters between locations
- `unstakeWagdies()` - Unstake characters

## Architecture

Clean Architecture Service Layer:
- **Purpose**: Encapsulate business logic and external integrations
- **Dependencies**: Supabase client, wagmi/viem for blockchain
- **Output**: Type-safe data for UI components
- **Error Handling**: Throw errors that UI can catch and display

## Usage

```typescript
import { getCharacterLocations } from '@/lib/services/map/locationService'
import { wagdieWorldContract } from '@/lib/services/map/wagdieWorldContract'

// Fetch character locations
const locations = await getCharacterLocations(walletAddress)

// Stake character via blockchain
const txHash = await wagdieWorldContract.stakeWagdies([
  { wagdieId: 1234n, locationId: 1n }
])
```

## Data Flow

```
UI Component
    ↓ (calls)
Service Function
    ↓ (queries)
Supabase / Blockchain
    ↓ (returns)
Typed Data
    ↓ (renders)
UI Component
```
