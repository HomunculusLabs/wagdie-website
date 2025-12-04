# Hook Contracts: Map Editor

**Feature**: 018-map-editor
**Date**: 2025-12-03

---

## useMapEditor

Main state management hook for the map editor.

### Signature

```typescript
function useMapEditor(): {
  // State
  mode: 'view' | 'create' | 'edit'
  locations: Location[]
  selectedLocation: Location | null
  pendingCoordinates: { x: number; y: number } | null
  isLoading: boolean
  isSaving: boolean
  error: string | null

  // Actions
  setMode: (mode: 'view' | 'create') => void
  selectLocation: (id: string | null) => void
  setPendingCoordinates: (coords: { x: number; y: number } | null) => void
  createLocation: (input: CreateLocationInput) => Promise<void>
  updateLocation: (id: string, input: UpdateLocationInput) => Promise<void>
  deleteLocation: (id: string) => Promise<void>
  refreshLocations: () => Promise<void>
}
```

### State Machine

```
      ┌─────────────────────────────────────┐
      │                                     │
      ▼                                     │
  ┌──────┐    click map    ┌────────┐      │
  │ VIEW │ ─────────────► │ CREATE │       │
  └──────┘                 └────────┘       │
      │                        │            │
      │ click marker           │ save/cancel│
      ▼                        ▼            │
  ┌──────┐                 ┌──────┐         │
  │ EDIT │ ─────────────► │ VIEW │ ────────┘
  └──────┘   save/cancel   └──────┘
```

### Error Handling

- API errors are caught and stored in `error` state
- `error` is cleared on next successful operation
- Toast notifications triggered for user feedback

---

## useAdminAuth

Hook for checking admin authentication status.

### Signature

```typescript
function useAdminAuth(): {
  isConnected: boolean
  isAdmin: boolean
  isLoading: boolean
  address: string | null
  connect: () => Promise<void>
  disconnect: () => void
}
```

### Integration

Uses existing `useAccount` from wagmi and `isAdmin` from `lib/auth/admin.ts`.

```typescript
import { useAccount } from 'wagmi'
import { isAdmin } from '@/lib/auth/admin'

function useAdminAuth() {
  const { address, isConnected } = useAccount()
  const adminStatus = isConnected && address ? isAdmin(address) : false

  return {
    isConnected,
    isAdmin: adminStatus,
    isLoading: false,
    address: address ?? null,
    connect: /* from RainbowKit */,
    disconnect: /* from wagmi */,
  }
}
```

---

## useLocationApi

Low-level API hook for location CRUD operations.

### Signature

```typescript
function useLocationApi(): {
  getAll: () => Promise<Location[]>
  getById: (id: string) => Promise<Location>
  create: (input: CreateLocationInput) => Promise<Location>
  update: (id: string, input: UpdateLocationInput) => Promise<Location>
  remove: (id: string) => Promise<void>
  checkStakedCharacters: (id: string) => Promise<number>
}
```

### Implementation Notes

- Uses `fetch` with credentials for session cookies
- Throws errors on non-2xx responses
- Parses JSON responses and extracts data

```typescript
async function create(input: CreateLocationInput): Promise<Location> {
  const response = await fetch('/api/locations', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(input),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to create location')
  }

  const { data } = await response.json()
  return data
}
```

---

## usePhaserEvents

Hook for bidirectional communication with Phaser game.

### Signature

```typescript
function usePhaserEvents(handlers: {
  onMapClick?: (coords: { x: number; y: number }) => void
  onMarkerClick?: (id: string) => void
  onMarkerDrag?: (id: string, coords: { x: number; y: number }) => void
}): {
  emitModeChange: (mode: 'view' | 'create' | 'edit') => void
  emitLocationCreated: (location: Location) => void
  emitLocationUpdated: (location: Location) => void
  emitLocationDeleted: (id: string) => void
}
```

### Event Bus Integration

```typescript
import { EventBus, MapEvents } from '@/game/EventBus'

function usePhaserEvents(handlers) {
  useEffect(() => {
    if (handlers.onMapClick) {
      EventBus.on('MAP_CLICKED', handlers.onMapClick)
    }
    // ... register other handlers

    return () => {
      EventBus.off('MAP_CLICKED', handlers.onMapClick)
      // ... unregister handlers
    }
  }, [handlers])

  return {
    emitModeChange: (mode) => EventBus.emit('EDITOR_MODE_CHANGED', { mode }),
    // ... other emitters
  }
}
```

---

## Hook Dependencies

```
┌─────────────────┐
│  useMapEditor   │
├─────────────────┤
│ - useLocationApi│
│ - usePhaserEvents│
│ - useState      │
│ - useCallback   │
└─────────────────┘

┌─────────────────┐
│  useAdminAuth   │
├─────────────────┤
│ - useAccount    │ (wagmi)
│ - isAdmin       │ (lib/auth)
└─────────────────┘

┌─────────────────┐
│ usePhaserEvents │
├─────────────────┤
│ - EventBus      │ (game)
│ - useEffect     │
└─────────────────┘
```
