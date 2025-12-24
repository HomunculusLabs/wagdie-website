# WAGDIE Design System

## Overview

This document defines the design system and component guidelines for the WAGDIE application. All components should follow these standards to ensure consistency across the codebase.

## Typography

### Font System

The application uses two custom fonts with specific use cases:

| Font Family | Usage | CSS Class |
|-------------|--------|-----------|
| **Wagdie Fraktur** (font-display) | Headings, titles, modal titles, page headers | `font-display` |
| **Eskapade Fraktur** (font-eskapade) | Body text, labels, UI elements, dropdowns, buttons | `font-eskapade` |

### Typography Rules

1. **Always use `font-display` for:**
   - Page headings (h1, h2, h3)
   - Modal titles
   - Section headers

2. **Always use `font-eskapade` for:**
   - Body text
   - UI labels
   - Button text
   - Dropdown text
   - Form labels
   - Alert messages
   - Character names (unless in a heading context)

### Font Sizes

```css
/* Tailwind Configuration */
text-xs: 0.75rem   /* 12px - Small labels, metadata */
text-sm: 0.875rem  /* 14px - Labels, secondary text */
text-md: 1rem       /* 16px - Default body text */
text-lg: 1.125rem   /* 18px - Large body, subtitles */
text-xl: 1.25rem    /* 20px - Small headings */
text-2xl: 1.5rem    /* 24px - Modal titles, character names */
```

## Color System

### Custom Theme Colors

| Color | Tailwind Class | Usage |
|-------|----------------|-------|
| Abyss | `bg-abyss`, `text-abyss` | Primary background |
| Shadow | `bg-shadow`, `text-shadow` | Secondary backgrounds |
| Blood | `bg-blood`, `text-blood` | Error states, danger actions |
| Soul Accent | `bg-soul-accent`, `text-soul-accent`, `border-soul-accent` | Primary accent, links, active states |
| Bone | `text-bone` | Primary text |
| Mist | `text-mist` | Secondary text |
| Ash | `text-ash` | Disabled states |

### Neutral Colors

Use `neutral-{n}` for backgrounds, borders, and text when custom colors aren't appropriate:
- `neutral-200` to `neutral-500` - Text hierarchy
- `neutral-700` to `neutral-900` - Borders and backgrounds
- `white/5`, `white/10`, `white/20` - Transparent overlays

## Component Guidelines

### Button Component

**Location:** `components/ui/Button.tsx`

**API:**
```typescript
interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'danger'
  size?: 'md' | 'sm' | 'icon'
  isLoading?: boolean
  disabled?: boolean
  onClick?: () => void
  children: React.ReactNode
  className?: string
}
```

**Usage Examples:**
```typescript
<Button variant="primary" onClick={handleSave} isLoading={isSaving}>
  Save
</Button>

<Button variant="secondary" onClick={handleCancel}>
  Cancel
</Button>

<Button variant="danger" onClick={handleDelete} isLoading={isDeleting}>
  Delete
</Button>

<Button size="icon" onClick={handleOpen}>
  <Icon />
</Button>
```

### Modal Component

**Location:** `components/ui/Modal.tsx`

**API:**
```typescript
interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
  footer?: React.ReactNode
  hideFooter?: boolean
  id?: string
}
```

**Usage Example:**
```typescript
<Modal isOpen={isOpen} onClose={handleClose} title="Edit Character">
  <div className="space-y-4">
    <label className="font-eskapade">Character Name</label>
    <input type="text" value={name} onChange={handleChange} />
  </div>
  <Modal.Footer>
    <Button variant="secondary" onClick={handleClose}>Cancel</Button>
    <Button variant="primary" onClick={handleSave}>Save</Button>
  </Modal.Footer>
</Modal>
```

**Features:**
- Focus trap and keyboard navigation
- Escape key to close
- Backdrop click to close
- Focus restoration on close
- ARIA attributes for accessibility
- Decorative corners with gothic theme

### Spinner Component

**Location:** `components/ui/Spinner.tsx`

**API:**
```typescript
interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  className?: string
}
```

**Usage:**
```typescript
<Spinner size="sm" />  // Small (16px)
<Spinner size="md" />  // Medium (32px) - default
<Spinner size="lg" />  // Large (48px)
```

**Standard Loading States:**
1. **Inline loading:** Use `<Spinner size="sm" />` in buttons, dropdowns
2. **Full-screen loading:** Create a LoadingOverlay component
3. **Section loading:** Use `<Spinner size="md" />` in a centered container

## Accessibility Standards

### All Interactive Elements Must Have:

1. **Buttons:**
   - `aria-label` for icon-only buttons
   - Proper focus states (always use `focus:` classes)
   - Clear disabled states (`disabled` attribute + visual feedback)

2. **Modals:**
   - Use the `Modal` component (includes ARIA and focus management)
   - `role="dialog"`, `aria-modal="true"`
   - Escape key to close
   - Focus trap

3. **Dropdowns:**
   - `role="listbox"` for the menu
   - `role="option"` for items
   - `aria-haspopup="listbox"`, `aria-expanded` for trigger
   - Keyboard navigation (Arrow keys, Enter, Escape)

4. **Forms:**
   - Labels for all inputs (`<label>` with `for` or `aria-label`)
   - Error messages with `aria-live` regions
   - Proper validation states

### Touch Targets

- **Minimum:** 44px × 44px for mobile touch targets
- Use `min-h-[44px]` for small buttons/links
- Add padding to meet this requirement

## Responsive Design

### Breakpoints (Tailwind)

- `sm`: 640px
- `md`: 768px
- `lg`: 1024px
- `xl`: 1280px

### Mobile-First Approach

```tsx
className="p-4 md:p-6 lg:p-8"
```

### Responsive Patterns

1. **Navigation:** Hamburger menu on mobile, horizontal links on desktop
2. **Grids:** 1 column mobile, 2-3 columns tablet, 3-4 columns desktop
3. **Modals:** Full-screen on mobile, centered dialog on desktop

## State Management

### Transaction State

**Standard Hook:** `useBlockchainTransaction`

Use this hook for all blockchain transaction state management instead of manual implementation.

```typescript
const {
  execute,
  isLoading,
  error,
  txHash,
  txStatus,
  reset
} = useBlockchainTransaction({
  executeTransaction: async () => {
    return await contract.write(...)
  }
})
```

### Loading States

**Patterns:**
1. **Page loading:** Use Suspense boundaries or page-level loaders
2. **Data loading:** Use React Query's `isLoading` state
3. **Action loading:** Use component's `isLoading` prop (Button, Spinner)
4. **Form submission:** Use `isLoading` on submit button

### Error States

**Patterns:**
1. **Page errors:** Use ErrorBoundary component
2. **Form errors:** Display inline error messages below fields
3. **Action errors:** Display Alert component with error message
4. **Transaction errors:** Use TransactionStatus component

## Component Export Patterns

**Standard Pattern:**
```typescript
export const Button = React.memo<ButtonProps>((props) => {
  // implementation
})

Button.displayName = 'Button'
```

**Do NOT use:**
- `React.FC` for functional components (use direct function exports)
- Named exports after definition (use inline export)
- Default exports (always use named exports)

## Styling Rules

1. **Always use Tailwind CSS** for styling
2. **Avoid inline styles** except for:
   - Dynamic values (e.g., `style={{ width: '100%' }}`)
   - Animation delays (can be extracted to CSS)
3. **Use semantic color classes** from the custom theme
4. **Maintain consistent spacing** using Tailwind's spacing scale (4px increments)
5. **Use semantic HTML** elements (button, not div with onClick)

## Testing Requirements

All components must have:
1. Unit tests for core functionality
2. Accessibility tests (axe-core)
3. Snapshot tests for UI consistency
4. Tests for all interactive states (hover, focus, disabled)

## Component Documentation

Each component file should include:
1. JSDoc comment describing the component's purpose
2. Props interface with descriptions
3. Usage examples in comments or Storybook stories
4. Accessibility notes if applicable

## Migration Checklist

When refactoring components:
- [ ] Update to use standard Button component
- [ ] Update to use standard Modal component
- [ ] Use Spinner component for loading states
- [ ] Apply font classes correctly (`font-display` vs `font-eskapade`)
- [ ] Ensure proper ARIA attributes
- [ ] Test keyboard navigation
- [ ] Test on mobile (44px touch targets)
- [ ] Update tests if needed
- [ ] Update component documentation

## References

- Tailwind Config: `tailwind.config.ts`
- Global Styles: `app/globals.css`
- Component Directory: `components/ui/`
- Shared Components: `components/shared/`
