# Storybook Developer Guide

## Overview

This guide explains how to use and extend Storybook in the wagdie-simplified project for component development and documentation.

## What is Storybook?

Storybook is a development environment for UI components. It allows you to:
- Develop components in isolation from your application
- Test component states and interactions
- Generate automatic documentation
- Browse and discover existing components

## Getting Started

### Starting Storybook

```bash
npm run storybook
```

Storybook will start on http://localhost:6006/

### Stopping Storybook

Press `Ctrl+C` in the terminal where Storybook is running.

### Building Static Storybook

```bash
npm run build-storybook
```

This creates a static build in the `storybook-static/` directory.

## Creating Component Stories

### Story File Naming

Story files must follow this pattern:
- `ComponentName.stories.tsx` - For React components
- Place the story file in the same directory as the component

Examples:
```
components/ui/
├── Button.tsx              # Component implementation
├── Button.stories.tsx      # Story file (REQUIRED)
└── index.ts                # Component exports

components/modals/
├── Modal.tsx               # Component implementation
├── Modal.stories.tsx       # Story file (REQUIRED)
└── index.ts                # Component exports
```

### Story File Structure

Every story file must include:

```typescript
import type { Meta, StoryObj } from '@storybook/react';
import { Component } from './Component';

const meta: Meta<typeof Component> = {
  component: Component,
  title: 'Category/ComponentName',
  tags: ['autodocs'],
  argTypes: {
    // Control configurations
  },
};

export default meta;
type Story = StoryObj<typeof Component>;

export const Default: Story = {
  args: {
    // Default props
  },
};

export const VariantName: Story = {
  args: {
    // Different props
  },
};
```

### Component Requirements

Your component must:
1. Be a valid React component
2. Have TypeScript interfaces for all props
3. Export the component as a named export (not default)

```typescript
export interface ButtonProps {
  variant?: 'primary' | 'secondary';
  onClick?: () => void;
  children: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({ variant, onClick, children }) => {
  // Component implementation
};
```

## Story Variants

### Basic Variants

Create different variants to showcase different use cases:

```typescript
export const Primary: Story = {
  args: {
    variant: 'primary',
    children: 'Primary Button',
  },
};

export const Secondary: Story = {
  args: {
    variant: 'secondary',
    children: 'Secondary Button',
  },
};

export const Disabled: Story = {
  args: {
    disabled: true,
    children: 'Disabled Button',
  },
};
```

### Variants with Render Functions

For components that accept children or complex props:

```typescript
export const WithChildren: Story = {
  render: (args) => (
    <Card {...args}>
      <Card.Header>Card Title</Card.Header>
      <Card.Body>Card content goes here</Card.Body>
      <Card.Footer>Card footer</Card.Footer>
    </Card>
  ),
};
```

## Interactive Controls

### ArgTypes Configuration

Configure how controls appear in the Storybook UI:

```typescript
argTypes: {
  variant: {
    control: 'select',
    options: ['primary', 'secondary', 'danger'],
    description: 'Visual style of the button',
  },
  disabled: {
    control: 'boolean',
    description: 'Whether the button is disabled',
  },
  size: {
    control: 'radio',
    options: ['sm', 'md', 'lg'],
  },
}
```

### Control Types

Common control types:
- `text` - Text input
- `number` - Number input
- `boolean` - Checkbox
- `select` - Dropdown selection
- `radio` - Radio button group
- `color` - Color picker
- `date` - Date picker
- `object` - JSON object editor
- `array` - Array editor

### Action Handlers

For event handlers:

```typescript
export const Interactive: Story = {
  args: {
    onClick: () => {
      console.log('Button clicked!');
    },
  },
  parameters: {
    docs: {
      description: {
        story: 'Click the button to trigger the onClick handler.',
      },
    },
  },
};
```

## Documentation

### JSDoc Comments

Add JSDoc to your component props for automatic documentation:

```typescript
export interface ButtonProps {
  /** Visual style variant of the button */
  variant?: 'primary' | 'secondary' | 'danger';

  /** Whether the button is disabled */
  disabled?: boolean;

  /** Click event handler */
  onClick?: () => void;

  /** Button content */
  children: React.ReactNode;
}
```

### MDX Documentation

Create rich documentation with MDX:

1. Create a file: `ComponentName.docs.mdx`
2. Import Storybook blocks:

```markdown
import { Meta, Title, Subtitle, Description, Primary, Controls, ArgsTable, Canvas } from '@storybook/blocks';
import * as ComponentStories from './ComponentName.stories';

<Meta of={ComponentStories} />

<Title>Component Name</Title>
<Subtitle>A brief description of the component</Subtitle>

<Description>
Detailed description of the component's purpose and usage.
</Description>

## Examples

<Canvas>
  <Primary />
</Canvas>

## Props

<ArgsTable of={ComponentStories} />
```

### Autodocs Tag

Always include the `autodocs` tag in your story metadata:

```typescript
const meta: Meta<typeof Component> = {
  component: Component,
  title: 'Category/Component',
  tags: ['autodocs'], // This enables automatic documentation
};
```

## Best Practices

### Story Organization

1. **Use hierarchical naming**:
   - `Components/Button` for basic components
   - `Patterns/Navigation` for design patterns
   - `Layout/Grid` for layout components

2. **Story naming convention**:
   - `Default` - Basic usage with sensible defaults
   - `Primary` - Primary variant
   - `Secondary` - Secondary variant
   - `With[Feature]` - Components with additional features
   - `[State]` - Different states (Disabled, Loading, Error)

3. **Logical grouping**:
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
   export const WithTooltip: Story = { /* ... */ };
   ```

### Story Content

1. **Keep stories simple**: Each story should test one aspect
2. **Use realistic data**: Avoid "Lorem ipsum" or fake data
3. **Test edge cases**: Empty states, loading states, error states
4. **Document props**: Add descriptions for non-obvious props
5. **Show variations**: Demonstrate different prop combinations

### Component Props

1. **Always type props**: Use TypeScript interfaces
2. **Provide defaults**: Make sensible defaults for optional props
3. **Document edge cases**: Explain when props might be undefined
4. **Keep interfaces stable**: Avoid breaking changes to public APIs

## Testing Components

### Interactive Testing

1. Open a story in Storybook
2. Use the Controls panel to modify props
3. Verify the component renders correctly
4. Test interactions (clicks, hovers, etc.)
5. Try different prop combinations

### Visual Regression Testing

To add visual regression testing:

1. Install `@storybook/addon-storyshots`:
   ```bash
   npm install --save-dev @storybook/addon-storyshots
   ```

2. Configure in `.storybook/main.ts`:
   ```typescript
   addons: [
     '@storybook/addon-essentials',
     '@storybook/addon-storyshots',
   ],
   ```

3. Create `src/storybook.test.ts`:
   ```typescript
   import initStoryshots from '@storybook/addon-storyshots';
   initStoryshots();
   ```

### Accessibility Testing

Storybook includes accessibility testing via `@storybook/addon-a11y`:

1. Open a story
2. Click the "Accessibility" tab in the addon panel
3. Check for violations
4. Review the element tree for accessibility issues

## Troubleshooting

### Stories Not Appearing

Check:
1. Story file is named `*.stories.tsx`
2. File is in same directory as component
3. Meta and Story exports are correct
4. Storybook is restarted: `Ctrl+C` and `npm run storybook`

### TypeScript Errors

Check:
1. Component has TypeScript interfaces
2. Props in stories match component prop types
3. tsconfig.json includes the components directory

### Build Errors

Check:
1. All dependencies are installed: `npm install`
2. TypeScript compilation passes: `npm run type-check`
3. No syntax errors in component or stories

### Controls Not Working

Check:
1. Prop is defined in component TypeScript interface
2. ArgTypes configuration is correct
3. Control type matches prop type

## Advanced Features

### Decorators

Decorators wrap stories to provide context:

```typescript
export const WithTheme: Story = {
  decorators: [
    (Story) => (
      <ThemeProvider theme="dark">
        <Story />
      </ThemeProvider>
    ),
  ],
};
```

### Global Decorators

Add in `.storybook/preview.ts`:

```typescript
export const decorators = [
  (Story) => (
    <div style={{ padding: '20px' }}>
      <Story />
    </div>
  ),
];
```

### Loaders

Fetch data before rendering:

```typescript
export const WithData: Story = {
  loaders: [
    async () => ({
      user: await fetch('/api/user').then(r => r.json()),
    }),
  ],
};
```

### Parameters

Configure story behavior:

```typescript
export const StoryName: Story = {
  args: { /* ... */ },
  parameters: {
    docs: {
      description: {
        story: 'Story description',
      },
    },
    backgrounds: {
      default: 'dark',
    },
  },
};
```

## Performance Tips

### Optimize Loading

1. Use lazy loading for large component libraries
2. Organize stories by feature
3. Use tags to filter stories

### Hot Module Replacement

1. Storybook supports HMR by default
2. Changes to stories update immediately
3. Component state is preserved during updates

## Integration with CI/CD

### Storybook in GitHub Actions

```yaml
name: Storybook
on: [push, pull_request]
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 18
      - run: npm install
      - run: npm run build-storybook
      - run: npm run storybook-test
```

### Storybook Deployment

Deploy static Storybook to:
- Vercel: Connect GitHub repo, build command: `npm run build-storybook`
- Netlify: Build command: `npm run build-storybook`, publish directory: `storybook-static`
- GitHub Pages: Use `@storybook/cli` deployment

## Resources

- [Storybook Documentation](https://storybook.js.org/docs)
- [Component Story Format](https://storybook.js.org/docs/react/writing-stories/introduction)
- [Storybook Tutorials](https://storybook.js.org/tutorials/)
- [Design System Checklist](https://storybook.js.org/docs/react/writing-docs/documentation-pages#design-system-checklist)

## Quick Reference

### Common Commands

```bash
npm run storybook          # Start Storybook dev server
npm run build-storybook    # Build static Storybook
npx storybook@latest init  # Initialize Storybook
npx storybook@latest dev   # Start Storybook
npx storybook@latest build # Build Storybook
```

### Story File Template

```typescript
import type { Meta, StoryObj } from '@storybook/react';
import { Component } from './Component';

const meta: Meta<typeof Component> = {
  component: Component,
  title: 'Category/Component',
  tags: ['autodocs'],
  argTypes: {
    // Configure controls
  },
};

export default meta;
type Story = StoryObj<typeof Component>;

export const Default: Story = {
  args: {
    // Default props
  },
};
```

### Checklist for New Stories

- [ ] Story file named `Component.stories.tsx`
- [ ] Colocated with component
- [ ] Meta export with component, title, tags
- [ ] StoryObj type defined
- [ ] At least one story export
- [ ] Props are typed
- [ ] Args match component prop types
- [ ] Has `autodocs` tag
- [ ] Variants tested (default, states, edge cases)
- [ ] Documentation added (JSDoc or MDX)
- [ ] Works with Controls panel
- [ ] Storybook builds successfully

## Support

If you have questions or issues:
1. Check this guide
2. Review [Storybook documentation](https://storybook.js.org/docs)
3. Ask in the project team chat
4. Open an issue in the project repository
