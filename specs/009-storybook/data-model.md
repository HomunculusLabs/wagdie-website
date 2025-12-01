# Data Model: Storybook Component Documentation System

## Entity Overview

This document describes the data structures and entities used by Storybook for component documentation and development. Storybook is a metadata-driven system - no persistent database is required.

---

## Entity: Component Story

**Purpose**: Defines how a component should be rendered and tested in isolation

**Fields**:
- `id` (string): Unique identifier generated from file path
- `title` (string): Hierarchical name for navigation (e.g., "Components/Button")
- `name` (string): Story name for display (e.g., "Primary", "Disabled")
- `component` (React.ComponentType): The component to render
- `args` (Record<string, any>): Default props for the story
- `argTypes` (Record<string, ArgType>): Type definitions for interactive controls
- `parameters` (StoryParameters): Configuration for how story renders
- `decorators` (Decorator[]): Wrapper components that wrap the story
- `loaders` (Loader[]): Async functions to fetch data before rendering
- `tags` (string[]): Tags for filtering and organization

**Validation**:
- `title` must be non-empty string
- `component` must be valid React component
- `args` keys must match component prop names

**Example**:
```typescript
const meta: Meta<typeof Button> = {
  component: Button,
  title: 'Components/Button',
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof Button>;

export const Primary: Story = {
  args: {
    label: 'Click me',
    variant: 'primary',
  },
};
```

---

## Entity: Story Parameters

**Purpose**: Configuration object that controls story rendering and behavior

**Fields**:
- `layout` (string): Layout mode ('centered', 'fullscreen', 'padded', 'none')
- `controls` (ControlConfig): Configuration for controls addon
- `docs` (DocsConfig): Documentation generation settings
- `backgrounds` (BackgroundConfig): Background color configuration
- `viewport` (ViewportConfig): Viewport settings for responsive testing
- `actions` (ActionsConfig): Action handling configuration

**Validation**:
- `layout` must be one of: 'centered', 'fullscreen', 'padded', 'none'

---

## Entity: Arg Type

**Purpose**: Defines how a prop should be displayed and controlled in Storybook

**Fields**:
- `name` (string): Name of the prop
- `type` (string): Type name or TypeScript type string
- `control` (ControlConfig): Control type ('text', 'number', 'boolean', 'select', 'radio', 'color', 'date', etc.)
- `options` (any[]): Available options for select/radio controls
- `mapping` (Record<string, any>): Custom mapping for values
- `description` (string): Human-readable description
- `table` (TableConfig): How to display in prop table
- `if` (Condition): Conditional display logic

**Validation**:
- `control` must be one of: 'text', 'number', 'boolean', 'color', 'date', 'select', 'object', 'array', 'radio', 'check', 'range'

**Example**:
```typescript
export const Primary: Story = {
  args: { label: 'Click me' },
  argTypes: {
    variant: {
      control: 'select',
      options: ['primary', 'secondary', 'danger'],
      description: 'Visual style variant',
    },
  },
};
```

---

## Entity: Component Documentation

**Purpose**: Rich documentation for a component including usage examples

**Fields**:
- `title` (string): Component name
- `description` (string): Markdown description of component purpose and usage
- `props` (PropDoc[]): Documentation for each prop
- `usage` (CodeExample[]): Usage examples with code and descriptions
- `notes` (string[]): Important notes and caveats
- `changelog` (ChangelogEntry[]): Version history

**Example** (MDX format):
```markdown
<Meta of={Button} title="Components/Button" />

# Button

Used to trigger actions or navigate. Supports multiple variants and states.

## Usage

```tsx
<Button variant="primary">Click me</Button>
```

## Props

- `variant`: Visual style variant (primary | secondary | danger)
- `disabled`: Whether the button is disabled
- `onClick`: Click event handler
```

---

## Entity: Story Configuration

**Purpose**: Global configuration for Storybook instance

**Fields** (in `.storybook/main.ts`):
- `stories` (string[]): Glob patterns for finding story files
- `addons` (Addon[]): List of enabled addons
- `framework` (FrameworkConfig): Framework-specific configuration
- `docs` (DocsConfig): Global documentation settings
- `staticDirs` (string[]): Static file directories to serve

**Fields** (in `.storybook/preview.ts`):
- `parameters` (GlobalParameters): Global parameters applied to all stories
- `decorators` (Decorator[]): Global decorators applied to all stories
- `globalTypes` (GlobalTypes): Global args/types available to all stories

**Example**:
```typescript
// .storybook/main.ts
const config: StorybookConfig = {
  stories: ['../src/**/*.stories.@(js|jsx|ts|tsx)'],
  addons: [
    '@storybook/addon-essentials',
    '@storybook/addon-docs',
  ],
  framework: {
    name: '@storybook/react-vite',
    options: {},
  },
};
```

---

## Entity: Decorator

**Purpose**: Wrapper component that adds context or styling around a story

**Fields**:
- `name` (string): Decorator name
- `component` (React.ComponentType): Wrapper component
- `parameters` (any): Configuration parameters

**Example**:
```typescript
export const WithTheme = (Story) => (
  <ThemeProvider theme="dark">
    <Story />
  </ThemeProvider>
);
```

---

## Entity: Loader

**Purpose**: Async function that fetches data before a story renders

**Fields**:
- `name` (string): Loader name
- `load` (Function): Async function that returns data
- `mappedStoryName` (string): Name of story to attach loaded data to

**Example**:
```typescript
export const WithData = {
  loaders: [
    async () => ({
      user: await fetchUser('/api/user/1'),
    }),
  ],
};
```

---

## Relationships

### Story → Component (1:1)
Each story is tied to exactly one component and demonstrates a specific variation or state of that component.

### Component → Stories (1:many)
A component can have multiple stories showcasing different props, states, or use cases.

### Story → Args (1:many)
Each story has a set of args (props) that configure how the component renders.

### Story → ArgTypes (1:many)
Each story defines argTypes to describe how controls should appear for each prop.

### Story → Decorators (many:many)
Stories can use decorators to add context, styling, or wrapper components.

### Component → Documentation (1:1)
Each component can have documentation describing usage, props, and examples.

### Config → Global Parameters (1:many)
Global configuration defines parameters that apply to all stories.

---

## Data Flow

1. **Story Discovery**: Storybook scans for `.stories.tsx` files based on configured glob patterns
2. **Type Analysis**: TypeScript types are analyzed to generate argTypes automatically
3. **Documentation Generation**: Props documentation is generated from TypeScript interfaces
4. **Runtime Rendering**: Stories render with args applied and controls displayed
5. **Hot Reload**: Changes to story files trigger re-renders via Vite HMR

---

## Persistence

**Storage Method**: File system
**Persistence Location**:
- Story files: `.stories.tsx` colocated with components
- Configuration: `.storybook/main.ts`, `.storybook/preview.ts`
- Generated docs: Build-time only, not persisted

**No Database Required**: Storybook is entirely file-based, no database or persistent data storage needed.

---

## Validation Rules

1. All component props must be explicitly typed (TypeScript)
2. Story files must export `Meta` and `StoryObj` types
3. Component imports must be valid React components
4. Story args must match component prop types
5. Control types must be compatible with prop types

---

## Performance Considerations

- Stories are loaded on-demand (lazy loading)
- Type checking cached by TypeScript compiler
- HMR keeps component state during updates
- Large component libraries can be organized with tags for filtering
