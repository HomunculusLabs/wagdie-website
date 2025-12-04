# Component Contracts: Map Editor

**Feature**: 018-map-editor
**Date**: 2025-12-03

---

## AdminGate

Access control wrapper that verifies admin status.

### Props

```typescript
interface AdminGateProps {
  children: React.ReactNode
  fallback?: React.ReactNode  // Shown to non-admins
}
```

### Behavior

| State | Rendered |
|-------|----------|
| No wallet connected | Connect wallet prompt |
| Non-admin wallet | Permission denied message |
| Admin wallet | `children` |
| Loading | Loading spinner |

### Usage

```tsx
<AdminGate fallback={<AccessDenied />}>
  <MapEditorContainer />
</AdminGate>
```

---

## MapEditorContainer

Main orchestrator component for the map editor.

### Props

```typescript
interface MapEditorContainerProps {
  // No props - manages its own state
}
```

### State

```typescript
interface EditorState {
  mode: 'view' | 'create' | 'edit'
  selectedLocation: Location | null
  pendingLocation: { x: number; y: number } | null
  locations: Location[]
  isLoading: boolean
  error: string | null
}
```

### Events Emitted (to Phaser)

| Event | Payload | Description |
|-------|---------|-------------|
| `EDITOR_MODE_CHANGED` | `{ mode: string }` | Editor mode changed |
| `LOCATION_CREATED` | `Location` | New location saved |
| `LOCATION_UPDATED` | `Location` | Location updated |
| `LOCATION_DELETED` | `{ id: string }` | Location removed |

### Events Consumed (from Phaser)

| Event | Payload | Description |
|-------|---------|-------------|
| `MAP_CLICKED` | `{ x: number, y: number }` | Map canvas clicked |
| `MARKER_CLICKED` | `{ id: string }` | Existing location clicked |
| `MARKER_DRAGGED` | `{ id: string, x: number, y: number }` | Location repositioned |

---

## LocationForm

Form for creating or editing locations.

### Props

```typescript
interface LocationFormProps {
  mode: 'create' | 'edit'
  location?: Location          // Required for edit mode
  coordinates: { x: number; y: number }  // Required for create mode
  onSave: (data: CreateLocationInput | UpdateLocationInput) => Promise<void>
  onCancel: () => void
  isSubmitting: boolean
}
```

### Fields

| Field | Type | Validation | Shown |
|-------|------|------------|-------|
| Name | text input | Required, 1-200 chars | Always |
| Description | textarea | Optional, max 2000 chars | Always |
| Coordinates | readonly display | N/A | Always (non-editable in form) |

### Behavior

- Create mode: Empty form, coordinates from props
- Edit mode: Pre-filled with existing location data
- Disable submit button while `isSubmitting`
- Show validation errors inline

---

## DeleteConfirmation

Modal for confirming location deletion.

### Props

```typescript
interface DeleteConfirmationProps {
  location: Location
  stakedCount: number          // Number of staked characters
  onConfirm: () => Promise<void>
  onCancel: () => void
  isDeleting: boolean
}
```

### Behavior

| `stakedCount` | Behavior |
|---------------|----------|
| 0 | Show confirmation with "Delete" button enabled |
| > 0 | Show warning, "Delete" button disabled |

### Content

```
Are you sure you want to delete "{location.name}"?

[If stakedCount > 0]
⚠️ This location cannot be deleted because {stakedCount} characters are staked here.

[Buttons]
[Cancel] [Delete]
```

---

## EditorControls

Toolbar for switching editor modes.

### Props

```typescript
interface EditorControlsProps {
  mode: 'view' | 'create' | 'edit'
  onModeChange: (mode: 'view' | 'create') => void
  disabled: boolean
}
```

### Buttons

| Button | Action | State |
|--------|--------|-------|
| View Mode | `onModeChange('view')` | Active when `mode === 'view'` |
| Add Location | `onModeChange('create')` | Active when `mode === 'create'` |

---

## Styling Requirements

All components must follow WAGDIE theming:

```typescript
const wagdieTheme = {
  colors: {
    gold: '#d4af37',        // Primary accent
    abyss: '#1a1a1a',       // Dark background
    shadow: '#252525',      // Panel backgrounds
    bone: '#e8e8e8',        // Primary text
    mist: '#b0b0b0',        // Secondary text
    ember: '#ff6b35',       // Hover/error states
  },
  fontFamily: "'Wagdie_Fraktur_21', serif",
  borderStyle: 'border-soul-accent/60',
}
```

---

## Accessibility Requirements

| Requirement | Implementation |
|-------------|----------------|
| Keyboard navigation | All interactive elements focusable |
| Screen reader | ARIA labels on buttons and forms |
| Focus management | Focus trapped in modals |
| Color contrast | Minimum 4.5:1 ratio |
