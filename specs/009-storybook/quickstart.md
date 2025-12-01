# Quick Start Guide: Storybook for Component Development

## Overview

This guide will get you up and running with Storybook in under 5 minutes. Storybook is a tool for developing and testing React components in isolation.

---

## Prerequisites

- Node.js 18+ installed
- Project using React 18+ and TypeScript
- Existing components directory

---

## Step 1: Install Storybook

Run the Storybook CLI init command in your project directory:

```bash
npx storybook@latest init
```

This command will:
- Install all required dependencies
- Create `.storybook/` configuration directory
- Add necessary NPM scripts to `package.json`
- Set up TypeScript configuration

### Alternative: Manual Installation

If you prefer manual control:

```bash
npm install --save-dev @storybook/react @storybook/react-vite @storybook/nextjs storybook

npm install --save-dev @storybook/addon-essentials @storybook/addon-docs @storybook/addon-interactions @storybook/addon-a11y
```

---

## Step 2: Verify Installation

Check that Storybook was installed correctly:

```bash
npx storybook doctor
```

Expected output: "✅ Storybook is set up correctly"

If you see warnings or errors, resolve them before continuing.

---

## Step 3: Start Storybook

Launch the Storybook development server:

```bash
npm run storybook
```

Expected output:
```
Local:   http://localhost:6006/
Network: use --host to expose
```

Your browser should automatically open to `http://localhost:6006/` showing the Storybook interface.

---

## Step 4: Create Your First Story

Create a story file for an existing component. Let's use a Button component as an example:

### 4.1 Create Story File

Create `components/Button/Button.stories.tsx`:

```typescript
import type { Meta, StoryObj } from '@storybook/react';
import { Button } from './Button';

const meta: Meta<typeof Button> = {
  component: Button,
  title: 'Components/Button',
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['primary', 'secondary', 'danger'],
    },
  },
};

export default meta;
type Story = StoryObj<typeof Button>;

export const Primary: Story = {
  args: {
    variant: 'primary',
    children: 'Click me',
  },
};

export const Secondary: Story = {
  args: {
    variant: 'secondary',
    children: 'Cancel',
  },
};

export const Danger: Story = {
  args: {
    variant: 'danger',
    children: 'Delete',
  },
};

export const Disabled: Story = {
  args: {
    disabled: true,
    children: 'Cannot click',
  },
};
```

### 4.2 Verify Story Appears

In the Storybook browser:
1. Click on "Components" in the left sidebar
2. Click on "Button"
3. You should see 4 stories: Primary, Secondary, Danger, Disabled
4. Click between stories to see different variants

---

## Step 5: Create Additional Stories

Repeat Step 4 for each component you want to document:

### Component with Complex Props

For a component with complex props:

```typescript
import type { Meta, StoryObj } from '@storybook/react';
import { UserCard } from './UserCard';

const meta: Meta<typeof UserCard> = {
  component: UserCard,
  title: 'Components/UserCard',
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof UserCard>;

export const Default: Story = {
  args: {
    name: 'John Doe',
    email: 'john@example.com',
    avatar: '/avatars/john.jpg',
    role: 'Developer',
  },
};

export const WithLongName: Story = {
  args: {
    name: 'Jonathan Fitzgerald McGillicuddy',
    email: 'very.long.email.address@example.com',
    avatar: '/avatars/john.jpg',
    role: 'Senior Software Engineer',
  },
};

export const Loading: Story = {
  args: {
    isLoading: true,
  },
};
```

### Component with Children

For components that accept children:

```typescript
export const WithChildren: Story = {
  render: (args) => (
    <Modal {...args}>
      <Modal.Header>Confirm Action</Modal.Header>
      <Modal.Body>Are you sure you want to delete this item?</Modal.Body>
      <Modal.Footer>
        <Button variant="secondary">Cancel</Button>
        <Button variant="danger">Delete</Button>
      </Modal.Footer>
    </Modal>
  ),
};
```

---

## Step 6: Use Interactive Controls

1. In Storybook, select any story
2. Click the "Controls" tab (if not visible, expand the sidebar)
3. Adjust props using the controls:
   - **Text inputs** for strings
   - **Select dropdowns** for enums
   - **Checkboxes** for booleans
   - **Color pickers** for color props
4. Watch the component re-render in real-time

This is great for:
- Testing different prop combinations
- Exploring edge cases
- Verifying responsive behavior

---

## Step 7: Document Your Components

### Add Component Descriptions

In your story's Meta:

```typescript
const meta: Meta<typeof Button> = {
  component: Button,
  title: 'Components/Button',
  tags: ['autodocs'],
  // Add description
  parameters: {
    docs: {
      description: {
        component: `
Button component for triggering actions or navigation.

## Features
- Multiple variants (primary, secondary, danger)
- Disabled state support
- Click event handling

## Usage
Use buttons for primary actions. Use 'primary' for main actions, 'secondary' for less important actions, and 'danger' for destructive actions.
        `,
      },
    },
  },
};
```

### Document Props

Add JSDoc comments to your component:

```typescript
interface ButtonProps {
  /** Visual style variant */
  variant?: 'primary' | 'secondary' | 'danger';

  /** Whether the button is disabled */
  disabled?: boolean;

  /** Click event handler */
  onClick?: () => void;

  /** Button content */
  children: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  disabled = false,
  onClick,
  children,
}) => {
  // Implementation
};
```

Storybook will automatically generate a Props table from these JSDoc comments.

---

## Step 8: Add MDX Documentation (Optional)

Create rich documentation with MDX:

Create `components/Button/Button.docs.mdx`:

```markdown
import { Meta, Title, Subtitle, Description, Primary, Controls, ArgsTable, Stories, Canvas } from '@storybook/blocks';
import * as ButtonStories from './Button.stories';

<Meta of={ButtonStories} />

<Title>Button Component</Title>
<Subtitle>A versatile button component with multiple variants</Subtitle>

<Description>
The Button component is used for triggering actions or navigation. It supports multiple visual variants and states.
</Description>

<Canvas>
  <Primary />
</Canvas>

<Controls />

## Props

All props are documented in the controls panel above. Key props include:

- **variant**: Controls visual style (primary, secondary, danger)
- **disabled**: Disables button interaction
- **onClick**: Click event handler
- **children**: Button content

## Examples

### Secondary Button

<Canvas>
  <Secondary />
</Canvas>

### Danger Button

<Canvas>
  <Danger />
</Canvas>

### Disabled State

<Canvas>
  <Disabled />
</Canvas>

## Accessibility

- Button has proper semantic role ('button')
- Disabled state prevents keyboard interaction
- Screen readers announce button state
```

---

## Step 9: Test Storybook Build

Test that Storybook can build successfully:

```bash
npm run build-storybook
```

Expected output:
```
info => Copied 10 files
info => Starting build...
info => Output directory: /path/to/storybook-static
info ----------------------------------------
info (Build completed in 12.34s)
```

View the build:
```bash
npx http-server storybook-static -p 6006
```

---

## Step 10: Configure Git (Optional)

Add Storybook output to `.gitignore`:

```
# Storybook build output
storybook-static/
```

Commit the configuration:

```bash
git add .storybook/ package.json
git commit -m "feat: add Storybook configuration

- Install @storybook/react @storybook/react-vite
- Add .storybook/ configuration
- Add NPM scripts for storybook
- Document component story patterns"
```

---

## Common Commands Reference

| Command | Description |
|---------|-------------|
| `npm run storybook` | Start Storybook dev server (port 6006) |
| `npm run build-storybook` | Build static Storybook |
| `npx storybook@latest dev -p 3001` | Start on custom port |
| `npx storybook doctor` | Check configuration health |
| `npx storybook build --help` | View build options |
| `npx sb migrate` | Migrate Storybook versions |

---

## Troubleshooting

### Port Already in Use

```bash
Error: Port 6006 is already in use.
```

Solution: Use a different port
```bash
npm run storybook -- -p 3001
```

### Components Not Appearing

1. Check story file naming: `Component.stories.tsx`
2. Verify file location: `.stories.tsx` file in same directory as component
3. Check stories glob in `.storybook/main.ts`
4. Restart Storybook

### TypeScript Errors

```bash
Type 'string' is not assignable to type '...'
```

Solution: Ensure component props are fully typed:
```typescript
interface Props {
  label: string;  // Must be typed, not 'any'
}

export const Component: React.FC<Props> = ({ label }) => {
  // ...
};
```

### Styles Not Loading

Solution: Import global styles in `.storybook/preview.ts`:
```typescript
import '../app/globals.css';
```

---

## Next Steps

### Documentation
- Read [Storybook Docs](https://storybook.js.org/docs)
- Review [Component Story Format](https://storybook.js.org/docs/react/writing-stories/introduction)

### Advanced Features
- Add [interaction testing](https://storybook.js.org/docs/react/writing-tests/interaction-testing)
- Set up [accessibility testing](https://storybook.js.org/docs/react/writing-tests/accessibility-testing)
- Configure [design integration](https://storybook.js.org/docs/react/writing-docs/introduction#with-design-addons)

### Best Practices
- Keep stories simple and focused
- Test one aspect per story
- Use realistic data in stories
- Document edge cases
- Tag stories appropriately

---

## Example Repository Structure

After setup, your structure should look like:

```
wagdie-simplified/
├── .storybook/
│   ├── main.ts           # Storybook config
│   └── preview.ts        # Preview config
├── components/
│   ├── Button/
│   │   ├── Button.tsx
│   │   ├── Button.stories.tsx
│   │   └── index.ts
│   ├── Modal/
│   │   ├── Modal.tsx
│   │   ├── Modal.stories.tsx
│   │   └── index.ts
│   └── [other components]/
├── package.json
└── tsconfig.json
```

---

## Success Criteria

You know setup is complete when:

- [ ] `npm run storybook` starts without errors
- [ ] Storybook UI loads at http://localhost:6006/
- [ ] At least one component story is visible
- [ ] Interactive controls work (adjust props and see changes)
- [ ] `npm run build-storybook` completes successfully
- [ ] Documentation tab shows component info

🎉 **Congratulations!** You now have Storybook running and can start developing components in isolation.

---

## Need Help?

- **Storybook Docs**: https://storybook.js.org/docs
- **GitHub Issues**: Report bugs in the project repository
- **Community**: Storybook Discord and GitHub Discussions
- **Configuration**: Run `npx storybook doctor` for diagnostics
