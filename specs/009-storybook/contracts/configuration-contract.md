# Configuration Contract

## Purpose

Defines the required configuration structure for Storybook integration in the project.

---

## Contract: Main Configuration (`.storybook/main.ts`)

### Required Structure
```typescript
import type { StorybookConfig } from '@storybook/react-vite';

const config: StorybookConfig = {
  stories: [
    '../components/**/*.stories.@(js|jsx|ts|tsx)',
    '../src/**/*.stories.@(js|jsx|ts|tsx)',
  ],
  addons: [
    '@storybook/addon-essentials',
    '@storybook/addon-docs',
    '@storybook/addon-interactions',
    '@storybook/addon-a11y',
  ],
  framework: {
    name: '@storybook/react-vite',
    options: {},
  },
  docs: {
    autodocs: 'tag',
  },
};

export default config;
```

### Properties

#### `stories` (Required)
Glob patterns to discover story files.
- Must include all component directories
- Supports: `*.stories.ts`, `*.stories.tsx`, `*.stories.js`, `*.stories.jsx`

#### `addons` (Required)
List of enabled Storybook addons.
- **@storybook/addon-essentials**: Core addons (controls, actions, viewport, backgrounds)
- **@storybook/addon-docs**: MDX documentation support
- **@storybook/addon-interactions**: Interaction testing
- **@storybook/addon-a11y**: Accessibility testing (recommended)

#### `framework` (Required)
Framework configuration object.
- `name`: Must be `'@storybook/react-vite'` for this project
- `options`: Framework-specific options (currently empty)

#### `docs` (Optional)
Documentation generation settings.
- `autodocs`: Set to `'tag'` to enable automatic documentation via tags

---

## Contract: Preview Configuration (`.storybook/preview.ts`)

### Required Structure
```typescript
import type { Preview } from '@storybook/react';
import '../app/globals.css'; // Import global styles

const preview: Preview = {
  parameters: {
    actions: { argTypesRegex: '^on[A-Z].*' },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/,
      },
    },
    docs: {
      toc: true, // Table of contents in docs
    },
  },
};

export default preview;
```

### Properties

#### `parameters` (Required)
Global parameters applied to all stories.

##### `actions`
Configuration for action addon.
- `argTypesRegex`: Regex to automatically detect click handlers
- Example: `'^on[A-Z].*'` matches `onClick`, `onSubmit`, etc.

##### `controls`
Configuration for controls addon.
- `matchers`: Auto-detect control types for specific patterns
  - `color`: Props matching color patterns get color picker
  - `date`: Props ending with 'Date' get date picker

##### `docs`
Documentation settings.
- `toc`: Enable table of contents in docs pages (boolean)

#### Global Styles Import
**Required**: Import global CSS in preview.ts to ensure consistent styling:
```typescript
import '../app/globals.css';
```

---

## Contract: Framework Integration

### Next.js Integration

Storybook auto-detects Next.js and configures:
- Path aliases for `/components`, `/app`, `/lib`
- Next.js Image component support
- App Router support
- Server-side rendering compatibility

### TypeScript Configuration
Storybook inherits TypeScript settings from project `tsconfig.json`:
- Must have `jsx: 'react-jsx'` or higher
- Must have `esModuleInterop: true`
- Should include component directories in `include` paths

---

## Contract: Package Dependencies

### Required Dependencies
Add to `package.json`:
```json
{
  "devDependencies": {
    "@storybook/react": "^8.0.0",
    "@storybook/react-vite": "^8.0.0",
    "@storybook/nextjs": "^8.0.0",
    "storybook": "^8.0.0"
  }
}
```

### Required Dev Dependencies
Add to `package.json`:
```json
{
  "devDependencies": {
    "@storybook/addon-essentials": "^8.0.0",
    "@storybook/addon-docs": "^8.0.0",
    "@storybook/addon-interactions": "^8.0.0",
    "@storybook/addon-a11y": "^8.0.0"
  }
}
```

### Installation Command
```bash
npm install --save-dev @storybook/react @storybook/react-vite @storybook/nextjs storybook
npm install --save-dev @storybook/addon-essentials @storybook/addon-docs @storybook/addon-interactions @storybook/addon-a11y
```

---

## Contract: NPM Scripts

Add scripts to `package.json`:
```json
{
  "scripts": {
    "storybook": "storybook dev -p 6006",
    "build-storybook": "storybook build"
  }
}
```

### Script Commands

#### `storybook`
- Runs Storybook in development mode
- Starts on port 6006 (configurable with `-p` flag)
- Supports hot module replacement (HMR)
- Automatically detects and loads story files

#### `build-storybook`
- Builds static Storybook site
- Outputs to `storybook-static/` directory
- Can be deployed to static hosting (out of scope per clarifications)

---

## Contract: Git Ignore

Add to `.gitignore`:
```
# Storybook build outputs
storybook-static/

# Vite cache
.vite/
```

---

## Contract: Environment Configuration

### Port Configuration
Default port: 6006 (configurable)

To use different port:
```bash
storybook dev -p 3001
```

### Host Configuration
Bind to specific host (default: localhost):
```bash
storybook dev --host 0.0.0.0  # Allow external access (not recommended)
```

### Debug Configuration
Enable debug mode:
```bash
DEBUG=storybook:* storybook dev
```

---

## Contract: Performance Configuration

### Vite Configuration
Storybook uses Vite with automatic optimization:
- No manual Vite config required
- Uses project `vite.config.ts` if present
- Automatic code splitting
- Tree shaking enabled

### Bundle Analysis
Analyze Storybook bundle size:
```bash
npm run build-storybook
npx http-server storybook-static -p 6006
```

---

## Contract: Error Handling Configuration

### Storybook Error Display
- Errors shown in browser console
- Also displayed in Storybook UI panel
- Stack traces preserved for debugging
- Failed stories don't crash entire Storybook

### Build Errors
- Compilation errors prevent build
- Clear error messages with file locations
- TypeScript errors included in build output

---

## Contract: Customization Limits

### Keep Minimal (Per Constitution)
Following "Simplicity First" principle:
- DO use automatic configuration where possible
- DO use sensible defaults
- DON'T create custom webpack configs
- DON'T add unnecessary addons
- DON'T customize build process

### Acceptable Customizations
- Add/remove addons based on need
- Import global styles
- Configure controls matching
- Set default parameters

### Prohibited Customizations
- Custom webpack builds
- Custom Vite configurations (unless necessary)
- Complex decorator chains
- Custom addon development

---

## Contract: Configuration Validation

### Check Configuration
```bash
npx storybook doctor
```

This command:
- Validates dependencies
- Checks for common configuration issues
- Suggests fixes for problems
- Verifies TypeScript setup

### Type Check
```bash
npx tsc --noEmit
```

Ensure TypeScript configuration is valid before running Storybook.

---

## Configuration Files Location

All Storybook configuration files MUST be in `.storybook/` directory at project root:
```
wagdie-simplified/
├── .storybook/
│   ├── main.ts       # Main configuration
│   └── preview.ts    # Preview configuration
├── components/
├── app/
└── package.json
```

---

## Compliance Checklist

- [ ] `.storybook/main.ts` exists and exports valid config
- [ ] `.storybook/preview.ts` exists and exports valid preview
- [ ] `stories` patterns include all component directories
- [ ] Required addons installed: `@storybook/addon-essentials`
- [ ] Framework set to `'@storybook/react-vite'`
- [ ] Global styles imported in preview.ts
- [ ] Package.json has `storybook` and `build-storybook` scripts
- [ ] All dependencies installed
- [ ] `.gitignore` includes `storybook-static/`
- [ ] Configuration tested with `storybook doctor`

---

## Examples

### Minimal Configuration
See `.storybook/main.ts` and `.storybook/preview.ts` in project root.

### Testing Configuration
```bash
npm run storybook  # Should start without errors
```

### Building Documentation
```bash
npm run build-storybook  # Should complete successfully
```
