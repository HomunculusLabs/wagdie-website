# Data Model: Phaser Map & Contract Integration

**Date**: 2025-11-29
**Feature**: 011-phaser-contract-integration

## Entity Relationship Diagram

```
┌─────────────────────┐       ┌──────────────────────┐
│   WAGDIE Character  │       │   Tokens Of Concord  │
│   (ERC-721A NFT)    │       │   (ERC-1155)         │
├─────────────────────┤       ├──────────────────────┤
│ tokenId: 1-6666     │       │ tokenId: 1-43        │
│ owner: Address      │◄──────│ owner: Address       │
│ metadata: URI       │       │ balance: uint256     │
│ isInfected: bool*   │       │ type: TokenType      │
└─────────────────────┘       └──────────────────────┘
         │                              │
         │                              │
         ▼                              ▼
┌─────────────────────┐       ┌──────────────────────┐
│     Location        │       │    Transaction       │
│  (Database Entity)  │       │  (Blockchain State)  │
├─────────────────────┤       ├──────────────────────┤
│ id: string          │       │ hash: string         │
│ name: string        │       │ status: TxStatus     │
│ bounds: Coordinates │       │ type: TxType         │
│ center: Coordinate  │       │ timestamp: Date      │
│ metadata: JSON      │       │ gasUsed: bigint      │
└─────────────────────┘       └──────────────────────┘

* isInfected may be off-chain or in separate contract
```

## Core Entities

### 1. WAGDIECharacter

Represents a WAGDIE NFT (ERC-721A token).

```typescript
interface WAGDIECharacter {
  /** Token ID (1-6666) */
  tokenId: number;

  /** Current owner wallet address */
  owner: Address;

  /** Metadata URI from contract */
  tokenURI: string;

  /** Parsed metadata */
  metadata: {
    name: string;
    description: string;
    image: string;
    attributes: CharacterAttribute[];
  };

  /** Infection status (may be off-chain) */
  isInfected?: boolean;

  /** Staked location (if staked) */
  stakedLocation?: Location;

  /** Attached concords */
  concords?: ConcordToken[];
}

interface CharacterAttribute {
  trait_type: string;
  value: string | number;
}
```

### 2. ConcordToken

Represents a token from the Tokens Of Concord contract (ERC-1155).

```typescript
interface ConcordToken {
  /** Token ID within Tokens Of Concord contract */
  tokenId: number;

  /** Token type enumeration */
  type: ConcordTokenType;

  /** Display name */
  name: string;

  /** Balance held by address */
  balance: bigint;

  /** Token metadata URI */
  uri: string;
}

enum ConcordTokenType {
  STRANGE_MUSHROOM = 15,
  HER_ASH = 3,
  ARTIFICERS_CRYSTAL = 7,
  SEERS_GEM = 30,
  MONAD_CARVING = 36,
  // Additional token IDs as discovered
}
```

### 3. Location

Represents a named location on the WAGDIE map.

```typescript
interface Location {
  /** Unique identifier */
  id: string;

  /** Display name */
  name: string;

  /** Bounding box coordinates on map [topLeft, bottomRight] */
  bounds: [[number, number], [number, number]];

  /** Center point for marker placement */
  center: [number, number];

  /** Location metadata */
  metadata: {
    description?: string;
    type?: LocationType;
    isStakeable?: boolean;
  };
}

enum LocationType {
  SETTLEMENT = 'settlement',
  WILDERNESS = 'wilderness',
  DUNGEON = 'dungeon',
  LANDMARK = 'landmark',
}
```

### 4. MapMarker

Represents a marker displayed on the Phaser map.

```typescript
interface MapMarker {
  /** Unique identifier */
  id: string;

  /** Marker type determines icon and behavior */
  type: MarkerType;

  /** Display name shown in tooltip */
  name: string;

  /** Position on map (Phaser coordinates) */
  position: { x: number; y: number };

  /** Associated data (character, location, or event) */
  data: WAGDIECharacter | Location | GameEvent;

  /** Whether marker is currently visible */
  visible: boolean;
}

enum MarkerType {
  LOCATION = 'location',
  CHARACTER = 'character',
  BURN = 'burn',
  DEATH = 'death',
  FIGHT = 'fight',
}
```

### 5. Transaction

Represents a blockchain transaction state.

```typescript
interface Transaction {
  /** Transaction hash */
  hash: `0x${string}`;

  /** Current status */
  status: TransactionStatus;

  /** Type of operation */
  type: TransactionType;

  /** Timestamp of submission */
  submittedAt: Date;

  /** Timestamp of confirmation (if confirmed) */
  confirmedAt?: Date;

  /** Gas used (after confirmation) */
  gasUsed?: bigint;

  /** Error message (if failed) */
  error?: string;

  /** Related entity (character ID, token ID, etc.) */
  relatedEntityId?: string;
}

enum TransactionStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  FAILED = 'failed',
}

enum TransactionType {
  BURN_CORPSE = 'burn_corpse',
  SPREAD_INFECTION = 'spread_infection',
  INFECT_CHARACTER = 'infect_character',
  CURE_CHARACTER = 'cure_character',
  SEAR_CONCORD = 'sear_concord',
}
```

### 6. LayerVisibility

Controls which marker types are displayed on the map.

```typescript
interface LayerVisibility {
  locations: boolean;
  characters: boolean;
  burns: boolean;
  deaths: boolean;
  fights: boolean;
}
```

## State Management

### Wallet State

```typescript
interface WalletState {
  /** Connected wallet address */
  address: Address | null;

  /** Connection status */
  isConnected: boolean;

  /** Chain ID (1 for mainnet) */
  chainId: number | null;

  /** ETH balance */
  ethBalance: bigint;

  /** Corpse token balance */
  corpseBalance: bigint;

  /** Mushroom token balance */
  mushroomBalance: bigint;

  /** Owned WAGDIE character token IDs */
  ownedCharacters: number[];
}
```

### Transaction Queue State

```typescript
interface TransactionQueueState {
  /** Pending transactions */
  pending: Transaction[];

  /** Recently completed (last 10) */
  recent: Transaction[];

  /** Currently displayed toast */
  activeToast: Transaction | null;
}
```

## Validation Rules

### Character Operations

| Operation | Validation |
|-----------|------------|
| Cure | `msg.sender == ownerOf(tokenId)` |
| Sear | `msg.sender == ownerOf(tokenId)` AND `concordBalance > 0` |
| Infect | `msg.value >= infectionPrice` AND `mushroomBalance >= 1` |

### Token Operations

| Operation | Validation |
|-----------|------------|
| Burn Corpse | `corpseBalance >= amount` |
| Spread Infection | `mushroomBalance >= count` |
| Transfer Concord | `balanceOf(sender, tokenId) >= amount` |

## State Transitions

### Character Infection State

```
┌────────────┐    infect()     ┌────────────┐
│  HEALTHY   │ ───────────────►│  INFECTED  │
└────────────┘                 └────────────┘
      ▲                              │
      │          cure()              │
      └──────────────────────────────┘
```

### Transaction State

```
         submit()           confirm()
┌────────┐        ┌─────────┐         ┌───────────┐
│ (none) │ ──────►│ PENDING │ ───────►│ CONFIRMED │
└────────┘        └─────────┘         └───────────┘
                       │
                       │ revert()
                       ▼
                  ┌────────┐
                  │ FAILED │
                  └────────┘
```

## Data Sources

| Entity | Source | Update Frequency |
|--------|--------|------------------|
| WAGDIECharacter | Blockchain + Supabase | On-demand |
| ConcordToken | Blockchain | On-demand |
| Location | Supabase | Static |
| MapMarker | Computed from above | Real-time |
| Transaction | Blockchain events | Real-time |
| LayerVisibility | React state | User action |
