# WAGDIE Simplified - Architecture Diagram

## System Overview

```mermaid
graph TB
    subgraph "External Systems"
        ETH["⛓️ Ethereum Mainnet<br/>(WAGDIE Smart Contracts)"]
        SUPABASE["🐘 Supabase PostgreSQL<br/>(Characters, Tweets, Sessions)"]
        ALCHEMY["⚗️ Alchemy RPC<br/>(Blockchain Provider)"]
    end

    subgraph "Client Browser"
        subgraph "Presentation Layer"
            PAGES["📄 Next.js Pages<br/>(App Router)"]
            COMPONENTS["🧩 React Components"]
            STORYBOOK["📚 Storybook<br/>(Component Library)"]
        end

        subgraph "Application Layer"
            HOOKS["🪝 Custom Hooks<br/>(useCharacters, useTweets, etc.)"]
            REACT_QUERY["📦 React Query<br/>(Caching & State)"]
            WALLET_CONNECT["👛 RainbowKit + wagmi<br/>(Wallet Connection)"]
        end
    end

    subgraph "Next.js Server"
        subgraph "API Routes"
            AUTH_API["🔐 /api/auth/*<br/>(SIWE Auth)"]
            CHAR_API["👤 /api/characters/*"]
            TWEET_API["🐦 /api/tweets"]
            SYNC_API["🔄 /api/sync/*"]
        end

        subgraph "Domain Layer (Services)"
            CHAR_SVC["CharacterService"]
            TWEET_SVC["TweetService"]
            WALLET_SVC["WalletService"]
            EVENT_SVC["EventService"]
        end

        subgraph "Infrastructure Layer"
            subgraph "Repositories"
                CHAR_REPO["CharacterRepository"]
                TWEET_REPO["TweetRepository"]
                LOCATION_REPO["LocationRepository"]
                EVENT_REPO["EventRepository"]
            end

            subgraph "Blockchain Services"
                OWNERSHIP["OwnershipService"]
                STAKING["StakingService"]
                SPREAD["SpreadService"]
                BALANCES["BalancesService"]
            end

            API_CLIENT["📡 API Client<br/>(Type-safe Fetch)"]
            SUPABASE_CLIENT["Supabase Client"]
        end
    end

    %% Presentation -> Application
    PAGES --> HOOKS
    COMPONENTS --> HOOKS
    HOOKS --> REACT_QUERY
    HOOKS --> WALLET_CONNECT

    %% Application -> API
    REACT_QUERY --> AUTH_API
    REACT_QUERY --> CHAR_API
    REACT_QUERY --> TWEET_API
    WALLET_CONNECT --> ETH

    %% API -> Domain
    AUTH_API --> WALLET_SVC
    CHAR_API --> CHAR_SVC
    TWEET_API --> TWEET_SVC
    SYNC_API --> CHAR_SVC

    %% Domain -> Infrastructure
    CHAR_SVC --> CHAR_REPO
    TWEET_SVC --> TWEET_REPO
    EVENT_SVC --> EVENT_REPO
    CHAR_SVC --> OWNERSHIP

    %% Infrastructure -> External
    CHAR_REPO --> SUPABASE_CLIENT
    TWEET_REPO --> SUPABASE_CLIENT
    LOCATION_REPO --> SUPABASE_CLIENT
    SUPABASE_CLIENT --> SUPABASE

    OWNERSHIP --> ALCHEMY
    STAKING --> ALCHEMY
    SPREAD --> ALCHEMY
    BALANCES --> ALCHEMY
    ALCHEMY --> ETH

    classDef external fill:#2d3748,stroke:#4a5568,color:#e2e8f0
    classDef presentation fill:#744210,stroke:#975a16,color:#fefce8
    classDef application fill:#1e40af,stroke:#3b82f6,color:#dbeafe
    classDef domain fill:#166534,stroke:#22c55e,color:#dcfce7
    classDef infrastructure fill:#7f1d1d,stroke:#dc2626,color:#fee2e2

    class ETH,SUPABASE,ALCHEMY external
    class PAGES,COMPONENTS,STORYBOOK presentation
    class HOOKS,REACT_QUERY,WALLET_CONNECT application
    class CHAR_SVC,TWEET_SVC,WALLET_SVC,EVENT_SVC domain
    class CHAR_REPO,TWEET_REPO,LOCATION_REPO,EVENT_REPO,OWNERSHIP,STAKING,SPREAD,BALANCES,API_CLIENT,SUPABASE_CLIENT infrastructure
```

## Layered Architecture Detail

```mermaid
graph LR
    subgraph "Presentation"
        direction TB
        P1["app/page.tsx<br/>(Home)"]
        P2["app/characters/*<br/>(Character Pages)"]
        P3["app/map/*<br/>(Map View)"]
        P4["app/lore/*<br/>(Lore Feed)"]
        P5["app/spread/*<br/>(Infection)"]
    end

    subgraph "Components"
        direction TB
        C1["layout/<br/>Header, Footer, Navigation"]
        C2["characters/<br/>CharacterCard, TokenFeed, Editors"]
        C3["map/<br/>SimpleMap, Markers, Layers"]
        C4["lore/<br/>CustomTweet, TweetFilterBar"]
        C5["modals/<br/>Infection, Cure, Searing"]
        C6["wallet/<br/>WalletButton, UserDropdown"]
    end

    subgraph "Hooks"
        direction TB
        H1["useCharacters<br/>useCharacterDetail"]
        H2["useTweets"]
        H3["useMapData<br/>useMapLayers"]
        H4["useWalletAuth<br/>useCurrentUser"]
        H5["useStaking<br/>useSpread<br/>useCure"]
    end

    subgraph "Services"
        direction TB
        S1["CharacterService"]
        S2["TweetService"]
        S3["EventService"]
        S4["WalletService"]
        S5["Blockchain/*"]
    end

    subgraph "Repositories"
        direction TB
        R1["CharacterRepository"]
        R2["TweetRepository"]
        R3["LocationRepository"]
        R4["EventRepository"]
    end

    P1 & P2 & P3 & P4 & P5 --> C1 & C2 & C3 & C4 & C5 & C6
    C1 & C2 & C3 & C4 & C5 & C6 --> H1 & H2 & H3 & H4 & H5
    H1 & H2 & H3 & H4 & H5 --> S1 & S2 & S3 & S4 & S5
    S1 & S2 & S3 & S4 & S5 --> R1 & R2 & R3 & R4
```

## Component Hierarchy

```mermaid
graph TB
    subgraph "App Layout (app/layout.tsx)"
        PROVIDERS["Providers<br/>(WagmiProvider, QueryClient, RainbowKit)"]

        subgraph "Layout Components"
            HEADER["Header"]
            NAV["Navigation"]
            FOOTER["Footer"]
        end

        subgraph "Page Content"
            HOME["Home Page"]
            CHARS["Characters Page"]
            CHAR_DETAIL["Character Detail"]
            MAP["Map Page"]
            LORE["Lore Page"]
            SPREAD["Spread Page"]
        end
    end

    PROVIDERS --> HEADER
    PROVIDERS --> NAV
    PROVIDERS --> FOOTER
    PROVIDERS --> HOME
    PROVIDERS --> CHARS
    PROVIDERS --> CHAR_DETAIL
    PROVIDERS --> MAP
    PROVIDERS --> LORE
    PROVIDERS --> SPREAD

    subgraph "Header Components"
        WALLET_BTN["WalletButton"]
        USER_DD["UserDropdown"]
    end

    HEADER --> WALLET_BTN
    HEADER --> USER_DD

    subgraph "Character Components"
        TOKEN_FEED["TokenFeed"]
        CHAR_CARD["CharacterCard"]
        SHEET_TITLE["SheetTitleAndAttributes"]
        SHEET_EQUIP["SheetEquipment"]
        SHEET_STORY["SheetBackgroundStory"]
        STAT_EDITORS["StatEditor, NameEditor, etc."]
    end

    CHARS --> TOKEN_FEED
    TOKEN_FEED --> CHAR_CARD
    CHAR_DETAIL --> SHEET_TITLE
    CHAR_DETAIL --> SHEET_EQUIP
    CHAR_DETAIL --> SHEET_STORY
    CHAR_DETAIL --> STAT_EDITORS

    subgraph "Map Components"
        SIMPLE_MAP["PhaserMap<br/>(Phaser 3.90)"]
        CHAR_PANEL["CharacterListPanel"]
        LOADING["LoadingState"]
    end

    MAP --> SIMPLE_MAP
    MAP --> CHAR_PANEL
    MAP --> LOADING
```

## Data Flow

```mermaid
sequenceDiagram
    participant User
    participant Component
    participant Hook
    participant ReactQuery
    participant API
    participant Service
    participant Repository
    participant Supabase

    User->>Component: Click "Load Characters"
    Component->>Hook: useCharacters({ tab: 'all' })
    Hook->>ReactQuery: useInfiniteQuery()

    alt Cache Hit
        ReactQuery-->>Hook: Return cached data
    else Cache Miss
        ReactQuery->>API: GET /api/characters
        API->>Service: characterService.getCharacters()
        Service->>Repository: repository.findMany()
        Repository->>Supabase: SELECT * FROM characters
        Supabase-->>Repository: Characters data
        Repository-->>Service: Formatted response
        Service-->>API: CharactersResponse
        API-->>ReactQuery: JSON response
        ReactQuery->>ReactQuery: Cache result
    end

    ReactQuery-->>Hook: { data, isLoading, fetchNextPage }
    Hook-->>Component: Destructured data
    Component-->>User: Render characters
```

## Blockchain Integration

```mermaid
graph TB
    subgraph "Frontend (wagmi v2)"
        WAGMI_PROVIDER["WagmiProvider<br/>(config)"]
        RAINBOW["RainbowKit<br/>(Wallet UI)"]
        USE_ACCOUNT["useAccount()"]
        USE_WRITE["useWriteContract()"]
        USE_READ["useReadContract()"]
    end

    subgraph "Smart Contracts"
        WAGDIE_NFT["WAGDIE NFT<br/>(ERC-721)"]
        WAGDIE_WORLD["WAGDIEWorld<br/>(Staking)"]
        CONCORD["Concord<br/>(Notes)"]
        SPREAD_CONTRACT["Spread<br/>(Infection)"]
        SEARING["Searing<br/>(Burns)"]
        CORPSE["Corpse<br/>(Deaths)"]
    end

    subgraph "Blockchain Services"
        OWNERSHIP_SVC["OwnershipService<br/>- getOwner()"]
        STAKING_SVC["StakingService<br/>- stake()<br/>- unstake()"]
        SPREAD_SVC["SpreadService<br/>- infect()<br/>- cure()"]
        BALANCE_SVC["BalancesService<br/>- getMushrooms()<br/>- getGold()"]
    end

    WAGMI_PROVIDER --> RAINBOW
    RAINBOW --> USE_ACCOUNT
    USE_ACCOUNT --> USE_WRITE
    USE_ACCOUNT --> USE_READ

    USE_READ --> WAGDIE_NFT
    USE_READ --> WAGDIE_WORLD
    USE_WRITE --> CONCORD
    USE_WRITE --> SPREAD_CONTRACT
    USE_WRITE --> SEARING

    OWNERSHIP_SVC --> WAGDIE_NFT
    STAKING_SVC --> WAGDIE_WORLD
    SPREAD_SVC --> SPREAD_CONTRACT
    BALANCE_SVC --> WAGDIE_NFT

    classDef contract fill:#3730a3,stroke:#6366f1,color:#e0e7ff
    class WAGDIE_NFT,WAGDIE_WORLD,CONCORD,SPREAD_CONTRACT,SEARING,CORPSE contract
```

## Authentication Flow (SIWE)

```mermaid
sequenceDiagram
    participant Wallet as 👛 Wallet
    participant Frontend as 🖥️ Frontend
    participant API as 🔌 API Routes
    participant Session as 🍪 Session

    Frontend->>API: GET /api/auth/nonce
    API-->>Frontend: { nonce: "abc123" }

    Frontend->>Wallet: Sign message with nonce
    Wallet-->>Frontend: Signature

    Frontend->>API: POST /api/auth/verify<br/>{ message, signature }
    API->>API: Verify SIWE signature
    API->>Session: Set httpOnly cookie
    API-->>Frontend: { address, authenticated: true }

    Note over Frontend,Session: User is now authenticated

    Frontend->>API: GET /api/auth/me
    API->>Session: Read cookie
    Session-->>API: Session data
    API-->>Frontend: { address, sessionId }

    Note over Frontend,API: On logout
    Frontend->>API: POST /api/auth/logout
    API->>Session: Clear cookie
    API-->>Frontend: { success: true }
```

## File Structure

```
wagdie-simplified/
├── 📁 app/                    # Next.js App Router (Presentation)
│   ├── 📁 api/               # API Routes
│   │   ├── auth/             # SIWE authentication
│   │   ├── characters/       # Character CRUD
│   │   ├── sync/             # Blockchain sync
│   │   └── tweets/           # Lore tweets
│   ├── characters/           # Character pages
│   ├── lore/                 # Lore feed
│   ├── map/                  # Interactive map
│   └── spread/               # Infection mechanics
│
├── 📁 components/             # React Components
│   ├── characters/           # Character UI
│   ├── home/                 # Homepage components
│   ├── layout/               # Header, Footer, Nav
│   ├── lore/                 # Tweet display
│   ├── map/                  # Map components
│   ├── modals/               # Modal dialogs
│   ├── shared/               # Reusable UI
│   ├── spread/               # Infection UI
│   ├── ui/                   # Base UI (Button, etc.)
│   └── wallet/               # Wallet connection
│
├── 📁 hooks/                  # Custom React Hooks
│   ├── map/                  # Map-specific hooks
│   ├── useAuth.ts            # Authentication
│   ├── useCharacters.ts      # Character data
│   ├── useTweets.ts          # Lore data
│   └── useWallet.ts          # Wallet state
│
├── 📁 lib/                    # Core Business Logic
│   ├── api/                  # API client
│   ├── auth/                 # SIWE utilities
│   ├── contracts/            # ABIs & addresses
│   ├── repositories/         # Data access
│   ├── services/             # Domain services
│   │   └── blockchain/       # Chain interactions
│   ├── store/                # State management
│   ├── types/                # TypeScript types
│   └── utils/                # Utility functions
│
├── 📁 types/                  # Global Type Definitions
│   ├── character.ts
│   ├── contracts.ts
│   ├── map.ts
│   └── wallet.ts
│
└── 📁 public/                 # Static Assets
    └── images/               # Map assets, icons
```

## Technology Stack

| Layer | Technology | Purpose |
|-------|------------|---------|
| **Framework** | Next.js 15 (App Router) | React framework with SSR |
| **UI** | React 18 + Tailwind CSS | Component library & styling |
| **State** | React Query (@tanstack) | Server state & caching |
| **Blockchain** | wagmi v2 + viem v2 | Ethereum interactions |
| **Wallet** | RainbowKit 2.2+ | Wallet connection UI |
| **Database** | Supabase PostgreSQL | Persistent storage |
| **Auth** | SIWE (Sign-In with Ethereum) | Web3 authentication |
| **Map** | Phaser 3.90 | Interactive game map |
| **Testing** | Jest + React Testing Library | Unit & integration tests |
| **Docs** | Storybook 8.x | Component documentation |

---

*Generated from codebase analysis on 2025-11-29*
