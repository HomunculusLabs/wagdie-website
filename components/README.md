# Components Organization

This directory contains all React components for the WAGDIE application, organized by feature/page.

## Directory Structure

```
components/
├── layout/          # Site-wide layout components
│   ├── Header.tsx            # Top navigation bar with wallet connection
│   ├── Footer.tsx            # Site footer
│   └── Navigation.tsx        # Mobile menu drawer
│
├── wallet/          # Wallet connection components
│   ├── WalletButton.tsx      # RainbowKit connect button
│   └── UserDropdown.tsx      # User account menu
│
├── home/            # Home page components
│   ├── VideoPlayer.tsx       # Intro video with poster
│   ├── HomeCard.tsx          # Content card component
│   └── HomeCardRow.tsx       # Card container with title
│
├── characters/      # Character browsing and detail components
│   ├── TokenFilterBar.tsx            # Filter controls (all/owned/infected/etc.)
│   ├── TokenFeed.tsx                 # Character grid with infinite scroll
│   ├── CharacterCard.tsx             # Single character card
│   ├── SheetMenuBar.tsx              # Character sheet header/actions
│   ├── SheetTitleAndAttributes.tsx   # Stats display (STR/DEX/CON/etc.)
│   ├── SheetBackgroundStory.tsx      # Editable character story
│   └── SheetEquipment.tsx            # Equipment display
│
├── lore/            # Lore/tweet feed components
│   ├── TweetFilterBar.tsx    # Tweet filter controls
│   └── CustomTweet.tsx        # Tweet card with media support
│
├── spread/          # Infection mechanics components
│   ├── DialogSpreadingApproval.tsx   # ERC1155 approval modal
│   ├── DialogBurnCorpseApproval.tsx  # Burn confirmation modal
│   └── SpreadInfect.tsx              # Main spread interface
│
├── shared/          # Reusable UI components
│   ├── BannerHeader.tsx      # Page title banner
│   ├── DialogMask.tsx        # Modal overlay
│   └── InfiniteScroll.tsx    # Pagination wrapper
│
└── providers.tsx    # React context providers (existing)
```

## Component Guidelines

### Naming Conventions

- **PascalCase** for component files and exports
- **Descriptive names** that reflect purpose (e.g., `TokenFilterBar` not `FilterBar`)
- **Feature prefix** when needed (e.g., `SheetMenuBar` for character sheet menu)

### Component Types

1. **Page Components** - Located in `app/` directory (Next.js App Router)
2. **Feature Components** - Specific to a page/feature (e.g., `characters/`, `lore/`)
3. **Layout Components** - Site-wide structure (e.g., `layout/Header.tsx`)
4. **Shared Components** - Reusable across features (e.g., `shared/BannerHeader.tsx`)

### Props Pattern

All components should have explicit TypeScript interfaces:

```typescript
interface MyComponentProps {
  title: string
  description?: string
  onAction: () => void
}

export function MyComponent({ title, description, onAction }: MyComponentProps) {
  // Component implementation
}
```

### File Organization

- **One component per file** (except small helper components)
- **Co-locate types** with component when used only there
- **Shared types** go in `types/` directory
- **Component tests** co-located as `ComponentName.test.tsx`

### Data Flow

Components should follow clean architecture:

1. **Pages** (`app/`) fetch data via Server Components or API routes
2. **Feature Components** receive data as props (no direct DB access)
3. **Services** (`lib/services/`) handle business logic and data access
4. **Shared Components** are purely presentational

### Styling

- **Tailwind CSS** utility classes for styling
- **Mobile-first** responsive design
- **Dark mode** support where applicable

## Adding New Components

1. **Determine category**: Which feature does it belong to?
2. **Create file**: `components/[category]/ComponentName.tsx`
3. **Define props**: TypeScript interface for all props
4. **Implement**: Follow existing patterns in similar components
5. **Document**: Add JSDoc comments for complex components
6. **Test**: Add tests for critical paths (see constitution Principle V)

## Examples

### Feature Component Example

```typescript
// components/characters/CharacterCard.tsx
interface CharacterCardProps {
  character: Character
  onClick?: (tokenId: number) => void
}

export function CharacterCard({ character, onClick }: CharacterCardProps) {
  return (
    <div onClick={() => onClick?.(character.token_id)}>
      <img src={character.image_url} alt={character.name} />
      <h3>{character.name}</h3>
      <p>Level {character.level}</p>
    </div>
  )
}
```

### Shared Component Example

```typescript
// components/shared/BannerHeader.tsx
interface BannerHeaderProps {
  title: string
  subtitle?: string
}

export function BannerHeader({ title, subtitle }: BannerHeaderProps) {
  return (
    <header className="bg-gray-900 text-white p-4">
      <h1 className="text-3xl font-bold">{title}</h1>
      {subtitle && <p className="text-gray-400">{subtitle}</p>}
    </header>
  )
}
```

## Related Documentation

- **Types**: See `types/` directory for shared TypeScript interfaces
- **Services**: See `lib/services/` for business logic
- **API Routes**: See `app/api/` for backend endpoints
- **Pages**: See `app/` for page implementations

## Questions?

See `specs/003-page-wireframes/quickstart.md` for implementation guidance and examples.
