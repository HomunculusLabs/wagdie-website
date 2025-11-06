# Story File Structure Contract

## Purpose

Defines the required structure and patterns for Storybook story files in the project.

## Contract: Story File Naming Convention

### File Pattern
- `*.stories.tsx` - TypeScript React components with stories
- `*.stories.ts` - TypeScript functions/objects with stories
- `*.stories.jsx` - JavaScript React components with stories
- `*.stories.js` - JavaScript functions/objects with stories

### Location
Stories MUST be colocated with components in the same directory.

**Examples**:
```
components/
└── Button/
    ├── Button.tsx          # Component implementation
    ├── Button.stories.tsx  # Story file (REQUIRED)
    ├── Button.test.tsx     # Unit tests
    └── index.ts            # Exports

components/
└── Modal/
    ├── Modal.tsx
    ├── Modal.stories.tsx   # Story file
    └── Modal.test.tsx
```

### Component Name Matching
Story files SHOULD follow component naming but with `.stories.` infix:
- `Button.tsx` → `Button.stories.tsx`
- `UserProfileCard.tsx` → `UserProfileCard.stories.tsx`

---

## Contract: Story File Structure

### Required Imports
```typescript
import type { Meta, StoryObj } from '@storybook/react';
import { Component } from './Component';
```

### Required Meta Export
```typescript
const meta: Meta<typeof Component> = {
  component: Component,
  title: 'Category/ComponentName',
  tags: ['autodocs'], // Enables automatic documentation
  parameters: {
    // Optional: Default parameters
  },
  args: {
    // Optional: Default args for all stories
  },
  argTypes: {
    // Optional: Arg type definitions
  },
};

export default meta;
```

### Required Type Definition
```typescript
type Story = StoryObj<typeof Component>;
```

### Story Exports
```typescript
// Primary story (required)
export const Default: Story = {
  args: {
    // Component props
  },
};

// Named variations
export const Variant1: Story = {
  args: {
    // Different props
  },
};

// With render function if needed
export const WithSlots: Story = {
  render: (args) => <Component {...args}>Slot content</Component>,
};
```

---

## Contract: Story Naming Conventions

### Title Hierarchy
Use hierarchical naming with `/` separator:
- `'Components/Button'` - Top-level category
- `'Components/Form/Input'` - Nested category
- `'Patterns/Navigation'` - Alternative category

### Story Names
Use PascalCase for story names:
- `Default` - Primary/default variant
- `Primary` - Primary variant
- `Secondary` - Secondary variant
- `Disabled` - Disabled state
- `WithIcon` - Variant with additional features
- `LargeSize` - Size variant

### Tags
Use `autodocs` tag for automatic documentation:
```typescript
const meta: Meta<typeof Button> = {
  tags: ['autodocs'],
};
```

---

## Contract: Component Integration

### Props Handling
All component props MUST be typed in the component definition:
```typescript
interface ButtonProps {
  variant?: 'primary' | 'secondary';
  disabled?: boolean;
  onClick?: () => void;
  children: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({ variant, children }) => {
  // Implementation
};
```

### Args Mapping
Story args MUST match component prop names exactly:
```typescript
export const Primary: Story = {
  args: {
    variant: 'primary',  // Matches ButtonProps.variant
    disabled: false,     // Matches ButtonProps.disabled
    children: 'Click me', // Matches ButtonProps.children
  },
};
```

---

## Contract: Arg Type Definitions

### Control Types
Use appropriate control types based on prop type:

```typescript
// Boolean props
argTypes: {
  disabled: {
    control: 'boolean',
  },
}

// Enum props
argTypes: {
  variant: {
    control: 'select',
    options: ['primary', 'secondary', 'danger'],
  },
}

// String props
argTypes: {
  label: {
    control: 'text',
  },
}

// Number props
argTypes: {
  count: {
    control: 'number',
  },
}
```

### Description
Add descriptions for non-obvious props:
```typescript
argTypes: {
  loading: {
    control: 'boolean',
    description: 'Shows loading spinner and disables interaction',
  },
}
```

---

## Contract: Story Variants

### Required Stories
Every component MUST have at minimum:
1. `Default` - Basic usage with sensible defaults
2. All major variants/sizes/states

### Optional Stories
Add stories for:
- Different prop combinations
- Edge cases (empty, null, loading)
- Complex states (success, error)
- With additional features (with icon, with helper text)

### Story Organization
Group related stories logically:
```typescript
// Basic variants
export const Default: Story = { /* ... */ };
export const Primary: Story = { /* ... */ };
export const Secondary: Story = { /* ... */ };

// States
export const Disabled: Story = { /* ... */ };
export const Loading: Story = { /* ... */ };

// With features
export const WithIcon: Story = { /* ... */ };
export const FullWidth: Story = { /* ... */ };
```

---

## Contract: Advanced Patterns

### Render Functions
Use when component needs children or complex setup:
```typescript
export const WithSlots: Story = {
  render: (args) => (
    <Component {...args}>
      <Component.Header>Title</Component.Header>
      <Component.Body>Content</Component.Body>
    </Component>
  ),
};
```

### Decorators
Add decorators to wrap stories:
```typescript
import { withDesign } from 'storybook-addon-designs';

export const Default: Story = {
  decorators: [withDesign],
  parameters: {
    design: {
      type: 'figma',
      url: 'https://figma.com/file/...',
    },
  },
};
```

### Loaders
Use for async data:
```typescript
export const WithData: Story = {
  loaders: [
    async () => ({
      data: await fetch('/api/data').then(r => r.json()),
    }),
  ],
  args: {
    data: {} as any, // Will be populated by loader
  },
};
```

---

## Contract: Error Handling

### Missing Props
If component throws with missing props, provide defaults:
```typescript
export const Default: Story = {
  args: {
    requiredProp: 'Default value', // Prevent errors
  },
};
```

### Async Components
Handle async behavior:
```typescript
export const LoadingState: Story = {
  args: {
    isLoading: true,
  },
};
```

---

## Contract: Accessibility Testing

Add accessibility stories:
```typescript
export const Accessible: Story = {
  args: {
    'aria-label': 'Submit form',
    role: 'button',
  },
};
```

---

## Compliance Checklist

- [ ] Story file named `Component.stories.tsx`
- [ ] Colocated with component in same directory
- [ ] Imports: `Meta, StoryObj from '@storybook/react'`
- [ ] Exports: `meta: Meta<typeof Component>`
- [ ] Type definition: `type Story = StoryObj<typeof Component>`
- [ ] At least one story export (Default)
- [ ] Title follows `'Category/Component'` pattern
- [ ] Story name in PascalCase
- [ ] Args match component prop types
- [ ] Has `autodocs` tag
- [ ] All variants documented
- [ ] Edge cases covered

---

## Examples

See existing examples in the codebase:
- `components/Button/Button.stories.tsx`
- `components/Modal/Modal.stories.tsx`

These examples demonstrate the patterns defined in this contract.
