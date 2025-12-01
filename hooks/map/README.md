# Map Hooks

Custom React hooks for managing map feature state and interactions.

## Hooks

### useLocations
Fetches and caches available locations from Supabase.
- Cache: 5 minutes
- Returns: `UseQueryResult<Location[]>`

### useCharacterLocation
Manages character location state for a specific character.
- Cache: 30 seconds
- Returns: Location data + refetch function

### useLocationStaking
Handles blockchain transactions for staking/moving/unstaking.
- Returns: Transaction state + stake/move/unstake functions

## Usage

```tsx
import { useLocations } from '@/hooks/map/useLocations'
import { useCharacterLocation } from '@/hooks/map/useCharacterLocation'
import { useLocationStaking } from '@/hooks/map/useLocationStaking'

function MyComponent() {
  const { data: locations } = useLocations()
  const { data: charLocation } = useCharacterLocation('1234')
  const { stake, isPending, hash } = useLocationStaking()

  const handleStake = () => {
    stake({ wagdieId: 1234n, locationId: 1n })
  }

  return (
    <div>
      {isPending && 'Transaction pending...'}
      {hash && `Hash: ${hash}`}
    </div>
  )
}
```

## Architecture

Hook Patterns:
- **State Management**: Use React Query for server state
- **Blockchain State**: Use wagmi hooks for transaction state
- **Cache Strategy**: Browser cache for 30s-5min
- **Error Handling**: Return error states for UI display

## Dependencies

- `@tanstack/react-query` - Server state management
- `wagmi` - Blockchain interactions
- Custom services from `lib/services/map/`
