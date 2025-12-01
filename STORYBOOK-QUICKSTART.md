# Storybook Quick Start Guide

## 🚀 Running Storybook

```bash
# Start the Storybook development server
npm run storybook

# Storybook will open at:
# http://localhost:6006 (if available)
# or http://localhost:6007 (if 6006 is in use)
```

## 📁 Story File Location

All story files are located in the `components/` directory with the naming pattern:
```
components/[ComponentPath]/[ComponentName].stories.tsx
```

Examples:
- `components/ui/Button.stories.tsx`
- `components/characters/CharacterCard.stories.tsx`
- `components/layout/Header.stories.tsx`

## 🎨 Viewing Stories

### Story Categories

Stories are organized in the sidebar under:
- **Components/**
  - **Button** - 7 stories (Primary, Secondary, Danger, Small, Large, Disabled, Interactive)
  - **Card** - 6 stories (Default, With Footer, Loading, No Padding, Complex Content, No Title)
  - **Modal** - 6 stories (Default, Small, Large, No Title, No Backdrop Close, Interactive Demo)
  - **Character/**
    - **CharacterCard** - 6 stories (Default, Infected, Cured, Staked, With Click Handler, etc.)
  - **ErrorBoundary** - 4 stories (Default, With Error, Custom Fallback, etc.)
  - **Footer** - 1 story (Default)
  - **Header** - 3 stories (Default, Mobile Menu Open, Dark Mode Toggle)
  - **Home/**
    - **HomeCard** - 3 stories (Default, External Link, Custom Styling)
  - **Layout/**
    - **Header** - 3 stories
    - **Navigation** - 3 stories (Desktop, Mobile, With Click Handler)
    - **Footer** - 1 story
  - **Ownership/**
    - **OwnershipVerificationBanner** - 3 stories
  - **Staking/**
    - **StakingStatusCard** - 4 stories
  - **Wallet/**
    - **TokenBalancesCard** - 2 stories
    - **TransactionStatus** - 6 stories (Idle, Pending, Confirming, Confirmed, Failed, Reverted)
    - **WalletButton** - 1 story

### Story Types

Each component has multiple story variants:
- **Default** - Basic usage example
- **State variants** - Loading, Error, Empty, etc.
- **Interactive** - Stories with onClick handlers for testing
- **Edge cases** - Without title, with custom styling, etc.

## 🎛️ Story Controls

### Controls Panel
- Click the "Controls" tab to interact with component props
- Adjust props in real-time to see how the component changes
- Perfect for testing different states and variants

### Actions Panel
- Click the "Actions" tab to see logged events
- Interactive stories trigger actions (alerts, console logs, etc.)

### Documentation Tab
- Click "Docs" to see auto-generated documentation
- Includes component props, descriptions, and usage examples
- All stories have `autodocs` tag enabled

## ✨ Features

### Auto-Docs
All stories include automatic documentation generation:
- Component props with types
- Story descriptions
- Usage examples
- Source code

### Interactive Testing
- Click buttons to test interactions
- Modify props in Controls panel
- See real-time updates
- Test responsive behavior

### Responsive Testing
Some stories include responsive viewport testing:
- Header stories show mobile/desktop layouts
- Navigation stories demonstrate mobile menu

## 🛠️ Adding New Stories

### Story File Template
```typescript
import type { Meta, StoryObj } from '@storybook/react';
import { YourComponent } from './YourComponent';

const meta: Meta<typeof YourComponent> = {
  component: YourComponent,
  title: 'Components/Category/YourComponent',
  tags: ['autodocs'],
  argTypes: {
    // Define controls for component props
  },
};

export default meta;
type Story = StoryObj<typeof YourComponent>;

export const Default: Story = {
  args: {
    // Default props
  },
};

export const WithState: Story = {
  args: {
    // Props for specific state
  },
};
```

### Best Practices
1. **Use autodocs tag** - Enables automatic documentation
2. **Follow naming convention** - `Components/Category/ComponentName`
3. **Create multiple variants** - Default, Loading, Error, Interactive, etc.
4. **Use realistic mock data** - Don't use placeholder data
5. **Add descriptions** - Include `parameters.docs.description` for context
6. **Include actions** - Add onClick handlers for interactive testing

## 📦 Building for Production

```bash
# Build static Storybook for deployment
npm run build-storybook

# Output will be in storybook-static/ directory
# Can be deployed to any static hosting service
```

## 🔧 Troubleshooting

### Import Errors
If you see "Failed to resolve import" errors:
1. Check that the `@/` alias is configured in `.storybook/main.ts`
2. Verify component import paths use `@/components/...` pattern
3. Restart Storybook: `pkill -f storybook && npm run storybook`

### Port Already in Use
If port 6006 is busy:
```bash
# Storybook will automatically try port 6007
# Or specify a different port:
npm run storybook -- --port 6008
```

### CSS/Import Warnings
PostCSS warnings about `@import` order are harmless and can be ignored.

## 📊 Current Status

- **14 components** have stories
- **56 individual stories** available
- **14 documentation pages** generated
- **All stories tested and working**

## 🎯 Next Steps

To add stories for remaining 40 components:
1. Identify component category
2. Create `.stories.tsx` file in component directory
3. Follow established patterns
4. Test in Storybook
5. Add to documentation

See `010-storybook-import-summary.md` for detailed component list and priority.
