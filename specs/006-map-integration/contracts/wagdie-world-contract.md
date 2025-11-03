# WagdieWorld Smart Contract Interface

**Feature**: Interactive Map Integration
**Date**: 2025-11-03

## Contract Overview

**Network**: Ethereum Mainnet
**Contract Type**: Staking/Mapping Contract
**Standard**: ERC-721 compatible (WAGDIE NFTs)

## Contract Address

```
Mainnet: 0x[TO BE UPDATED]
Goerli: 0x[TO BE UPDATED]
```

**Note**: Contract address to be confirmed from wagdie.world documentation or team.

---

## Contract ABI

```typescript
export const wagdieWorldAbi = [
  // Read Functions
  {
    type: 'function',
    name: 'getLocation',
    stateMutability: 'view',
    inputs: [{ name: 'characterId', type: 'uint256' }],
    outputs: [
      { name: 'locationId', type: 'uint256' },
      { name: 'staked', type: 'bool' }
    ]
  },
  {
    type: 'function',
    name: 'getAllLocations',
    stateMutability: 'view',
    inputs: [],
    outputs: [
      {
        name: 'locations',
        type: 'tuple[]',
        components: [
          { name: 'id', type: 'uint256' },
          { name: 'name', type: 'string' },
          { name: 'metadata', type: 'string' }
        ]
      }
    ]
  },
  {
    type: 'function',
    name: 'ownerOf',
    stateMutability: 'view',
    inputs: [{ name: 'tokenId', type: 'uint256' }],
    outputs: [{ name: 'owner', type: 'address' }]
  },

  // Write Functions
  {
    type: 'function',
    name: 'stakeWagdies',
    stateMutability: 'nonpayable',
    inputs: [
      {
        name: 'params',
        type: 'tuple[]',
        components: [
          { name: 'wagdieId', type: 'uint256' },
          { name: 'locationId', type: 'uint256' }
        ]
      }
    ],
    outputs: []
  },
  {
    type: 'function',
    name: 'changeWagdieLocations',
    stateMutability: 'nonpayable',
    inputs: [
      {
        name: 'params',
        type: 'tuple[]',
        components: [
          { name: 'wagdieId', type: 'uint256' },
          { name: 'newLocationId', type: 'uint256' }
        ]
      }
    ],
    outputs: []
  },
  {
    type: 'function',
    name: 'unstakeWagdies',
    stateMutability: 'nonpayable',
    inputs: [
      {
        name: 'params',
        type: 'tuple[]',
        components: [
          { name: 'wagdieId', type: 'uint256' }
        ]
      }
    ],
    outputs: []
  },

  // Events
  {
    type: 'event',
    name: 'WagdieStaked',
    inputs: [
      { name: 'owner', type: 'address', indexed: true },
      { name: 'wagdieId', type: 'uint256', indexed: true },
      { name: 'locationId', type: 'uint256', indexed: false },
      { name: 'timestamp', type: 'uint256', indexed: false }
    ]
  },
  {
    type: 'event',
    name: 'WagdieLocationChanged',
    inputs: [
      { name: 'owner', type: 'address', indexed: true },
      { name: 'wagdieId', type: 'uint256', indexed: true },
      { name: 'fromLocation', type: 'uint256', indexed: false },
      { name: 'toLocation', type: 'uint256', indexed: false },
      { name: 'timestamp', type: 'uint256', indexed: false }
    ]
  },
  {
    type: 'event',
    name: 'WagdieUnstaked',
    inputs: [
      { name: 'owner', type: 'address', indexed: true },
      { name: 'wagdieId', type: 'uint256', indexed: true },
      { name: 'timestamp', type: 'uint256', indexed: false }
    ]
  }
] as const
```

---

## Function Reference

### Read Functions

#### `getLocation(uint256 characterId)`

Gets the current location of a character.

**Parameters**:
- `characterId` (uint256): Token ID of the character

**Returns**:
- `locationId` (uint256): Current location ID, 0 if not staked
- `staked` (bool): Whether character is currently staked

**Example Call**:
```typescript
const { data } = await readContract({
  address: contractAddress,
  abi: wagdieWorldAbi,
  functionName: 'getLocation',
  args: [BigInt(1234)]
})

console.log(data) // [BigInt(42), true]
```

**Gas Estimate**: ~20,000 gas

---

#### `getAllLocations()`

Gets list of all available locations.

**Parameters**: None

**Returns**:
- `locations` (tuple[]): Array of location objects with id, name, metadata

**Example Call**:
```typescript
const { data } = await readContract({
  address: contractAddress,
  abi: wagdieWorldAbi,
  functionName: 'getAllLocations'
})

console.log(data)
// [
//   { id: BigInt(1), name: 'Concord Searing', metadata: '{}' },
//   { id: BigInt(2), name: 'Forsaken Lands', metadata: '{}' }
// ]
```

**Gas Estimate**: ~100,000+ gas (expensive)

---

#### `ownerOf(uint256 tokenId)`

ERC-721 standard function to get character owner.

**Parameters**:
- `tokenId` (uint256): Token ID of the character

**Returns**:
- `owner` (address): Owner wallet address

**Gas Estimate**: ~20,000 gas

---

### Write Functions

#### `stakeWagdies(tuple[] params)`

Stake one or more characters to locations.

**Parameters**:
```typescript
params: Array<{
  wagdieId: uint256    // Character token ID
  locationId: uint256  // Target location ID
}>
```

**Requirements**:
- Caller must own all characters
- Characters must not already be staked
- Location must exist
- Sufficient gas fee required

**Emits Events**:
- `WagdieStaked` for each character

**Example Call**:
```typescript
import { parseEther } from 'viem'

const { hash } = await writeContract({
  address: contractAddress,
  abi: wagdieWorldAbi,
  functionName: 'stakeWagdies',
  args: [
    [
      { wagdieId: BigInt(1234), locationId: BigInt(1) },
      { wagdieId: BigInt(5678), locationId: BigInt(2) }
    ]
  ]
})
```

**Gas Estimate**: ~120,000 gas per character

---

#### `changeWagdieLocations(tuple[] params)`

Move one or more characters from their current locations to new ones.

**Parameters**:
```typescript
params: Array<{
  wagdieId: uint256      // Character token ID
  newLocationId: uint256 // Target location ID
}>
```

**Requirements**:
- Caller must own all characters
- Characters must already be staked
- New location must exist
- Cannot move to same location

**Emits Events**:
- `WagdieLocationChanged` for each character

**Gas Estimate**: ~100,000 gas per character

---

#### `unstakeWagdies(tuple[] params)`

Unstake one or more characters from their current locations.

**Parameters**:
```typescript
params: Array<{
  wagdieId: uint256  // Character token ID
}>
```

**Requirements**:
- Caller must own all characters
- Characters must be staked

**Emits Events**:
- `WagdieUnstaked` for each character

**Gas Estimate**: ~80,000 gas per character

---

## Event Reference

### WagdieStaked

Emitted when a character is staked to a location.

```typescript
{
  owner: "0xabc...123",        // Address who staked
  wagdieId: 1234n,             // Token ID
  locationId: 42n,             // Location ID
  timestamp: 1640995200n       // Unix timestamp
}
```

### WagdieLocationChanged

Emitted when a character moves between locations.

```typescript
{
  owner: "0xabc...123",        // Address who moved
  wagdieId: 1234n,             // Token ID
  fromLocation: 1n,            // Previous location
  toLocation: 42n,             // New location
  timestamp: 1640995200n       // Unix timestamp
}
```

### WagdieUnstaked

Emitted when a character is unstaked.

```typescript
{
  owner: "0xabc...123",        // Address who unstaked
  wagdieId: 1234n,             // Token ID
  timestamp: 1640995200n       // Unix timestamp
}
```

---

## Error Codes

Contract may revert with following errors:

| Error | Cause |
|-------|-------|
| `NotOwner()` | Caller doesn't own the character |
| `AlreadyStaked()` | Character already staked |
| `NotStaked()` | Character not currently staked |
| `InvalidLocation()` | Location doesn't exist |
| `SameLocation()` | Trying to move to same location |
| `InsufficientGas()` | Not enough gas provided |
| `TransferFailed()` | Internal transfer failed |

---

## Integration with wagmi

### Setup

```typescript
import { createConfig, http } from 'wagmi'
import { mainnet } from 'wagmi/chains'

const config = createConfig({
  chains: [mainnet],
  transports: {
    [mainnet.id]: http()
  }
})

const contractAddress = process.env.WAGDIE_WORLD_CONTRACT_ADDRESS as `0x${string}`
```

### Read Example

```typescript
import { useReadContract } from 'wagmi'
import { wagdieWorldAbi } from '@/lib/contracts/wagdie-world'

export function useCharacterLocation(characterId: bigint) {
  return useReadContract({
    address: contractAddress,
    abi: wagdieWorldAbi,
    functionName: 'getLocation',
    args: [characterId]
  })
}
```

### Write Example

```typescript
import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi'

export function useStakeCharacter() {
  const { writeContract, data: hash } = useWriteContract()
  const { isLoading: isPending, isSuccess } = useWaitForTransactionReceipt({ hash })

  const stake = (characterId: bigint, locationId: bigint) => {
    writeContract({
      address: contractAddress,
      abi: wagdieWorldAbi,
      functionName: 'stakeWagdies',
      args: [[{ wagdieId: characterId, locationId }]]
    })
  }

  return { stake, hash, isPending, isSuccess }
}
```

---

## Gas Optimization Tips

1. **Batch Operations**: Stake/move multiple characters in single transaction
2. **Gas Estimation**: Use `useEstimateGas` hook before sending
3. **Queue Transactions**: Don't send if already pending
4. **Price Monitoring**: Show current gas price to user
5. **Confirmation Blocks**: Wait 1-2 blocks before updating UI

---

## Security Considerations

1. **Owner Verification**: Always verify wallet owns character before transaction
2. **Location Validation**: Validate location exists before sending
3. **Double-Spend Prevention**: Track pending transactions client-side
4. **Reorg Handling**: Wait for confirmations before updating state
5. **Event Listening**: Subscribe to events for real-time updates

---

## Testing

### Mainnet Fork Testing

```typescript
import { parseEther } from 'viem'
import { testnet } from 'wagmi/chains'

const config = createConfig({
  chains: [testnet],
  // ... setup with fork URL
})

// Test stake transaction
test('stakes character successfully', async () => {
  const result = await writeContract({
    address: contractAddress,
    abi: wagdieWorldAbi,
    functionName: 'stakeWagdies',
    args: [[{ wagdieId: 1234n, locationId: 1n }]]
  })

  expect(result.hash).toMatch(/^0x/)
})
```

---

## Monitoring

### Event Listeners

```typescript
import { createPublicClient } from 'viem'
import { mainnet } from 'viem/chains'

const client = createPublicClient({
  chain: mainnet,
  transport: http()
})

// Listen for staking events
const unwatch = client.watchContractEvent({
  address: contractAddress,
  abi: wagdieWorldAbi,
  eventName: 'WagdieStaked',
  onLogs(logs) {
    logs.forEach(log => {
      console.log('Wagdie staked:', log.args)
    })
  }
})
```

---

**Status**: ✅ Contract Interface Defined
**Next Step**: Integrate with wagmi in application
**Verification**: Test on testnet before mainnet deployment
