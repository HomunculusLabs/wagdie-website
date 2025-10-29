# WAGDIE Simplified - Clean Architecture

This document describes the refactored clean architecture implementation following Uncle Bob's Clean Architecture principles.

## Architecture Overview

The application follows a layered architecture with clear separation of concerns:

```
┌─────────────────────────────────────────────────────┐
│         Presentation Layer (UI/Components)          │
│  - React Components (pages, components)             │
│  - Pure presentation logic                          │
│  - No business logic or direct API calls            │
└─────────────────┬───────────────────────────────────┘
                  │ uses
┌─────────────────▼───────────────────────────────────┐
│       Application Layer (Custom Hooks)              │
│  - useCharacters, useTweets, useAuth                │
│  - React Query integration                          │
│  - State management                                 │
│  - Orchestration of business logic                  │
└─────────────────┬───────────────────────────────────┘
                  │ uses
┌─────────────────▼───────────────────────────────────┐
│         Domain Layer (Services/Types)               │
│  - CharacterService, TweetService                   │
│  - Business rules and validation                    │
│  - Entity types and interfaces                      │
└─────────────────┬───────────────────────────────────┘
                  │ uses
┌─────────────────▼───────────────────────────────────┐
│     Infrastructure Layer (Repositories/API)         │
│  - CharacterRepository, TweetRepository             │
│  - API Client (fetch wrapper)                       │
│  - Database access (Supabase)                       │
│  - External integrations (wagmi, RainbowKit)        │
└─────────────────────────────────────────────────────┘
```

## Directory Structure

```
wagdie-simplified/
├── app/                        # Next.js App Router (Presentation)
│   ├── characters/            # Character pages
│   ├── lore/                  # Lore page
│   ├── spread/                # Infection mechanics
│   └── api/                   # API routes (thin controllers)
│
├── components/                 # React components (Presentation)
│   ├── characters/
│   ├── lore/
│   ├── spread/
│   ├── layout/
│   └── shared/
│
├── hooks/                      # Custom React hooks (Application)
│   ├── useCharacters.ts       # Character data with React Query
│   ├── useCharacterDetail.ts  # Single character CRUD
│   ├── useTweets.ts           # Tweet feed with infinite scroll
│   ├── useAuth.ts             # SIWE authentication
│   ├── useWallet.ts           # Wallet connection abstraction
│   └── useContractWrite.ts    # Blockchain operations
│
├── lib/                        # Core business logic
│   ├── services/              # Domain services
│   │   ├── character-service.ts
│   │   ├── tweet-service.ts
│   │   └── wallet-service.ts
│   │
│   ├── repositories/          # Infrastructure (Data access)
│   │   ├── character-repository.ts
│   │   ├── tweet-repository.ts
│   │   └── index.ts
│   │
│   ├── api/                   # API client layer
│   │   ├── client.ts          # Type-safe fetch wrapper
│   │   ├── endpoints.ts       # API endpoint definitions
│   │   └── index.ts
│   │
│   └── auth/                  # Authentication utilities
│       ├── siwe.ts
│       └── session.ts
│
└── types/                      # TypeScript type definitions
    ├── character.ts
    ├── tweet.ts
    └── wallet.ts
```

## Layer Responsibilities

### 1. Presentation Layer (`app/`, `components/`)

**Responsibility**: Render UI and handle user interactions

**Rules**:
- Components should be as "dumb" as possible
- No business logic
- No direct API calls or data fetching
- Use custom hooks for all data needs
- Props should be simple, serializable data

**Example**:
```typescript
// app/characters/page.tsx
export default function CharactersPage() {
  const { characters, hasMore, fetchNextPage } = useCharacters({ tab, sort })

  return <TokenFeed characters={characters} onLoadMore={fetchNextPage} />
}
```

### 2. Application Layer (`hooks/`)

**Responsibility**: Orchestrate application logic and state management

**Rules**:
- Custom hooks wrap business logic
- Integrate with React Query for caching/state
- Handle side effects (data fetching, mutations)
- Provide clean interface to components
- No direct database or external API access

**Example**:
```typescript
// hooks/useCharacters.ts
export function useCharacters(options: UseCharactersOptions) {
  return useInfiniteQuery({
    queryKey: ['characters', options],
    queryFn: ({ pageParam = 1 }) =>
      api.characters.getCharacters({ ...options, page: pageParam }),
    staleTime: 5 * 60 * 1000,
  })
}
```

### 3. Domain Layer (`lib/services/`, `types/`)

**Responsibility**: Business logic, rules, and entity definitions

**Rules**:
- Services contain business rules
- Use repositories for data access (dependency injection)
- Independent of frameworks and UI
- Testable without external dependencies
- Define entity types and interfaces

**Example**:
```typescript
// lib/services/character-service.ts
export class CharacterService {
  constructor(private repository: ICharacterRepository) {}

  async getCharacters(filters: CharacterFilters) {
    // Business logic can go here (validation, transformation, etc.)
    return this.repository.findMany(filters)
  }

  async isOwner(tokenId: number, walletAddress: string): boolean {
    const character = await this.repository.findById(tokenId)
    return character?.owner_address.toLowerCase() === walletAddress.toLowerCase()
  }
}
```

### 4. Infrastructure Layer (`lib/repositories/`, `lib/api/`)

**Responsibility**: External integrations and data access

**Rules**:
- Repositories abstract database access
- API client abstracts HTTP calls
- Implements interfaces defined in domain layer
- Only layer that directly touches external services
- Swappable implementations

**Example**:
```typescript
// lib/repositories/character-repository.ts
export class CharacterRepository implements ICharacterRepository {
  async findMany(filters: CharacterFilters): Promise<CharactersResponse> {
    // Direct Supabase access - isolated to this layer
    let query = supabase.from('characters').select('*')
    // ... apply filters
    return { characters, hasMore, totalCount }
  }
}
```

## Key Patterns

### 1. Repository Pattern

Repositories provide an abstraction over data storage:

```typescript
// Interface (Domain layer)
export interface ICharacterRepository {
  findMany(filters: CharacterFilters): Promise<CharactersResponse>
  findById(tokenId: number): Promise<Character | null>
  update(tokenId: number, updates: Partial<Character>): Promise<Character | null>
}

// Implementation (Infrastructure layer)
export class CharacterRepository implements ICharacterRepository {
  // Supabase implementation
}

// Usage (Domain layer)
export class CharacterService {
  constructor(private repository: ICharacterRepository) {}
  // Service uses interface, not concrete implementation
}
```

**Benefits**:
- Easy to test (mock repositories)
- Can swap databases without changing business logic
- Clear separation of concerns

### 2. API Client Pattern

Centralized API communication with type safety:

```typescript
// lib/api/client.ts
export class ApiClient {
  async get<T>(endpoint: string, config?: RequestConfig): Promise<T>
  async post<T>(endpoint: string, body?: any): Promise<T>
  // ... other methods
}

// lib/api/endpoints.ts
export const api = {
  characters: {
    getCharacters: (filters) => apiClient.get<CharactersResponse>('/characters', { params: filters }),
    getCharacter: (id) => apiClient.get<Character>(`/characters/${id}`),
  },
  // ... other endpoints
}
```

**Benefits**:
- Type-safe API calls
- Centralized error handling
- Easy to add interceptors (auth, logging)
- DRY principle

### 3. Custom Hooks with React Query

Data fetching hooks with built-in caching:

```typescript
export function useCharacters(options: UseCharactersOptions) {
  return useInfiniteQuery({
    queryKey: ['characters', options],
    queryFn: ({ pageParam }) => api.characters.getCharacters({ ...options, page: pageParam }),
    getNextPageParam: (lastPage) => lastPage.hasMore ? nextPage : undefined,
    staleTime: 5 * 60 * 1000, // 5 minutes cache
  })
}
```

**Benefits**:
- Automatic caching and revalidation
- Loading/error states handled
- Background refetching
- Optimistic updates
- Reusable across components

### 4. Dependency Injection

Services receive dependencies through constructor:

```typescript
// Service with injected repository
export class CharacterService {
  constructor(private repository: ICharacterRepository) {}
}

// Singleton instance with concrete implementation
export const characterService = new CharacterService(characterRepository)
```

**Benefits**:
- Testable (inject mocks)
- Flexible (swap implementations)
- Clear dependencies

## Data Flow Examples

### Example 1: Fetching Characters

```
User clicks "Load More"
        ↓
Component calls fetchNextPage() (from useCharacters hook)
        ↓
Hook triggers React Query with next page
        ↓
Query function calls api.characters.getCharacters()
        ↓
API client makes GET /api/characters?page=2
        ↓
API route calls characterService.getCharacters()
        ↓
Service calls repository.findMany()
        ↓
Repository queries Supabase
        ↓
Data flows back up through layers
        ↓
React Query caches result
        ↓
Component re-renders with new data
```

### Example 2: Updating Character

```
User saves character story
        ↓
Component calls updateCharacter.mutateAsync() (from useUpdateCharacter hook)
        ↓
Hook triggers mutation with React Query
        ↓
Mutation calls api.characters.updateCharacter()
        ↓
API client makes PATCH /api/characters/:id
        ↓
API route validates ownership, calls characterService.updateCharacter()
        ↓
Service calls repository.update()
        ↓
Repository updates Supabase
        ↓
Mutation succeeds
        ↓
React Query invalidates cache
        ↓
Component auto-refetches fresh data
```

## Testing Strategy

### Unit Tests

**Domain Layer** (Services):
```typescript
describe('CharacterService', () => {
  it('should check ownership correctly', async () => {
    const mockRepo: ICharacterRepository = {
      findById: jest.fn().mockResolvedValue({
        token_id: 1,
        owner_address: '0x123'
      })
    }
    const service = new CharacterService(mockRepo)

    const isOwner = await service.isOwner(1, '0x123')
    expect(isOwner).toBe(true)
  })
})
```

**Benefits**: No external dependencies, fast tests

### Integration Tests

**Infrastructure Layer** (Repositories):
```typescript
describe('CharacterRepository', () => {
  it('should fetch characters from database', async () => {
    const repo = new CharacterRepository()
    const result = await repo.findMany({ tab: 'all', page: 1 })
    expect(result.characters).toBeInstanceOf(Array)
  })
})
```

**Benefits**: Test actual database interactions

### E2E Tests

**Presentation Layer** (Components):
```typescript
describe('CharactersPage', () => {
  it('should display characters and load more', async () => {
    render(<CharactersPage />)
    await waitFor(() => expect(screen.getByText('Character #1')).toBeInTheDocument())

    fireEvent.click(screen.getByText('Load More'))
    await waitFor(() => expect(screen.getByText('Character #51')).toBeInTheDocument())
  })
})
```

**Benefits**: Test complete user flows

## Migration Guide

### Before (Inline Data Fetching)

```typescript
// Characters page - BEFORE
export default function CharactersPage() {
  const [characters, setCharacters] = useState([])
  const [isLoading, setIsLoading] = useState(false)

  const fetchCharacters = async () => {
    setIsLoading(true)
    const response = await fetch('/api/characters')
    const data = await response.json()
    setCharacters(data.characters)
    setIsLoading(false)
  }

  useEffect(() => { fetchCharacters() }, [])

  return <TokenFeed characters={characters} isLoading={isLoading} />
}
```

### After (Clean Architecture)

```typescript
// Characters page - AFTER
export default function CharactersPage() {
  const { characters, isLoading, fetchNextPage } = useCharacters({ tab, sort })

  return <TokenFeed characters={characters} isLoading={isLoading} onLoadMore={fetchNextPage} />
}
```

**Improvements**:
- 90% less code in component
- Automatic caching
- Better error handling
- Reusable hook
- Testable in isolation

## Best Practices

### 1. Keep Components Dumb

❌ **Bad**:
```typescript
function CharacterCard({ tokenId }: Props) {
  const [character, setCharacter] = useState(null)

  useEffect(() => {
    fetch(`/api/characters/${tokenId}`)
      .then(res => res.json())
      .then(setCharacter)
  }, [tokenId])

  return <div>{character?.name}</div>
}
```

✅ **Good**:
```typescript
function CharacterCard({ character }: Props) {
  return <div>{character.name}</div>
}

// Parent fetches data
function Parent() {
  const { character } = useCharacterDetail(tokenId)
  return <CharacterCard character={character} />
}
```

### 2. Use TypeScript Strictly

Always define interfaces and types:

```typescript
// Define return types
export function useCharacters(options: UseCharactersOptions): UseCharactersReturn {
  // ...
}

// Define prop types
interface CharacterCardProps {
  character: Character
  onSelect?: (id: number) => void
}
```

### 3. Follow Dependency Rule

Dependencies should point **inward**:

- Presentation → Application → Domain → Infrastructure ✅
- Infrastructure → Domain ❌
- Domain → Application ❌

### 4. Keep Business Logic in Services

❌ **Bad** (logic in component):
```typescript
function CharacterDetail() {
  const isOwner = character?.owner_address.toLowerCase() === address?.toLowerCase()
  // ...
}
```

✅ **Good** (logic in service):
```typescript
// In service
async isOwner(tokenId: number, address: string): Promise<boolean> {
  const character = await this.getCharacter(tokenId)
  return character?.owner_address.toLowerCase() === address.toLowerCase()
}

// In component
function CharacterDetail() {
  const { isOwner } = useCharacterOwnership(tokenId, address)
  // ...
}
```

### 5. Use React Query for All Data Fetching

Benefits:
- Automatic caching (5-minute stale time)
- Background revalidation
- Deduplication of requests
- Loading/error states
- Optimistic updates

## Performance Optimizations

### 1. React Query Caching

```typescript
staleTime: 5 * 60 * 1000, // Data stays fresh for 5 minutes
cacheTime: 10 * 60 * 1000, // Unused data kept in cache for 10 minutes
```

### 2. Infinite Scroll

Automatically loads more data as user scrolls:

```typescript
const { data, fetchNextPage, hasNextPage } = useInfiniteQuery({
  getNextPageParam: (lastPage) => lastPage.hasMore ? lastPage.page + 1 : undefined,
})
```

### 3. Parallel Requests

React Query automatically deduplicates and parallelizes:

```typescript
// Both hooks called in same component - only 1 request made
const characters = useCharacters({ tab: 'all' })
const ownedCharacters = useCharacters({ tab: 'owned' }) // Different query key
```

## Future Enhancements

### 1. Add Service Workers for Offline Support

```typescript
// lib/repositories/offline-character-repository.ts
export class OfflineCharacterRepository implements ICharacterRepository {
  async findMany(filters: CharacterFilters) {
    // Check IndexedDB first, fallback to network
  }
}
```

### 2. Add GraphQL Layer

```typescript
// lib/api/graphql-client.ts
export const graphqlClient = new GraphQLClient('/graphql')

// Can coexist with REST API
```

### 3. Add WebSocket Support for Real-Time Updates

```typescript
// hooks/useRealtimeCharacters.ts
export function useRealtimeCharacters() {
  // Subscribe to WebSocket for live updates
  // Invalidate React Query cache on updates
}
```

## Conclusion

This clean architecture refactoring provides:

✅ **Maintainability**: Clear separation of concerns
✅ **Testability**: Each layer independently testable
✅ **Scalability**: Easy to add features without breaking existing code
✅ **Flexibility**: Swap implementations (database, API, etc.) without rewriting business logic
✅ **Performance**: Built-in caching and optimizations with React Query
✅ **Developer Experience**: Type-safe, predictable patterns

The codebase is now production-ready and follows industry best practices for modern React/Next.js applications.
