# Map Components

This directory contains UI components for the interactive map feature.

## Components

### MapEmbed
iframe wrapper component for the WAGDIE world map.

### CharacterLocationList
Displays user's characters with their current locations.

### LocationSelector
Modal component for selecting a new location to stake characters.

### TransactionStatus
Shows blockchain transaction progress and status.

### NoCharactersState
Empty state for users without characters.

## Usage

```tsx
import { MapEmbed } from '@/components/map/MapEmbed'
import { CharacterLocationList } from '@/components/map/CharacterLocationList'

export default function MapPage() {
  return (
    <>
      <MapEmbed />
      <CharacterLocationList />
    </>
  )
}
```

## Architecture

These components follow the Clean Architecture pattern:
- **UI Layer**: Pure React components with no business logic
- **Props**: Receive data via props, use custom hooks for state
- **Styling**: Tailwind CSS classes
- **Dependencies**: Only depend on custom hooks and types
