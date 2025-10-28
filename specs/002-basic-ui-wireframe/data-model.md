# Data Model: Basic UI Wireframe

**Feature**: 002-basic-ui-wireframe
**Date**: 2025-10-27
**Purpose**: Define data structures for UI state, wallet connection, and navigation

## Overview

This feature's data model focuses on **client-side state** for UI components. No new database tables are required - the feature leverages existing Supabase `users` table for session persistence via SIWE.

## 1. Wallet Connection State

### WalletConnectionState

Represents the current state of the user's wallet connection.

```typescript
interface WalletConnectionState {
  // Wallet identity
  address: `0x${string}` | null;           // Ethereum address (checksummed) or null if disconnected
  chainId: number | null;                  // Current chain ID (1 = Ethereum Mainnet)

  // Connection status
  status: 'disconnected' | 'connecting' | 'connected' | 'reconnecting' | 'error';

  // Provider information
  connector: {
    id: string;                            // 'metaMask', 'walletConnect', 'rainbow', 'coinbase'
    name: string;                          // Display name: 'MetaMask', 'WalletConnect', etc.
    icon?: string;                         // Connector icon URL (from wagmi)
  } | null;

  // Error state
  error: {
    message: string;                       // User-friendly error message
    code?: string;                         // Error code for debugging
  } | null;
}
```

**Source**: Derived from wagmi's `useAccount()` and `useConnect()` hooks
**Lifecycle**: Managed by React state, persisted via wagmi's internal localStorage
**Validation**: `address` must be valid Ethereum address, `chainId` must be 1 (Mainnet)

---

## 2. Authentication Session State

### AuthSessionState

Represents SIWE authentication status (separate from wallet connection).

```typescript
interface AuthSessionState {
  // Authentication status
  isAuthenticated: boolean;                // Has valid SIWE session
  isAuthenticating: boolean;               // SIWE flow in progress

  // Session data
  session: {
    address: `0x${string}`;                // Authenticated wallet address
    nonce: string;                         // Current session nonce (from /api/auth/nonce)
    expiresAt: Date;                       // Session expiration time
  } | null;

  // SIWE flow state
  siweStep: 'idle' | 'nonce' | 'signing' | 'verifying' | 'complete' | 'error';

  // Error state
  error: {
    message: string;
    step: 'nonce' | 'signing' | 'verifying'; // Which step failed
  } | null;
}
```

**Source**: Managed by `useWalletAuth` hook, backed by HTTP-only session cookie
**Lifecycle**:
- Created: After successful SIWE signature verification
- Refreshed: On page load if cookie valid
- Destroyed: On logout or expiration

**State Transitions**:
1. `idle` → `nonce` (request nonce from `/api/auth/nonce`)
2. `nonce` → `signing` (prompt user to sign message)
3. `signing` → `verifying` (send signature to `/api/auth/verify`)
4. `verifying` → `complete` (session created) or `error`

---

## 3. Navigation State

### NavigationState

Represents the current page and navigation menu state.

```typescript
interface NavigationState {
  // Current route
  currentPath: string;                     // e.g., '/', '/characters', '/lore'
  currentPage: 'home' | 'characters' | 'lore' | 'gather';

  // Mobile menu state
  isMobileMenuOpen: boolean;               // Mobile hamburger menu open/closed

  // Navigation items
  navItems: NavigationItem[];              // Main navigation links
}

interface NavigationItem {
  label: string;                           // 'Home', 'Characters', 'Lore', 'Gather'
  path: string;                            // '/', '/characters', '/lore', '/gather'
  isActive: boolean;                       // Matches currentPath
  isEnabled: boolean;                      // Some pages may be disabled/coming soon
  icon?: string;                           // Optional icon name/component
}
```

**Source**:
- `currentPath`: Next.js `usePathname()` hook
- `isMobileMenuOpen`: Local component state
- `navItems`: Static configuration with dynamic `isActive` based on route

**Example Configuration**:
```typescript
const NAV_ITEMS: Omit<NavigationItem, 'isActive'>[] = [
  { label: 'Home', path: '/', isEnabled: true },
  { label: 'Characters', path: '/characters', isEnabled: false }, // Coming soon
  { label: 'Lore', path: '/lore', isEnabled: false },
  { label: 'Gather', path: '/gather', isEnabled: false },
];
```

---

## 4. Theme State

### ThemeState

Represents the current theme configuration (dark mode always on for this project).

```typescript
interface ThemeState {
  // Theme mode (fixed to 'dark' for WAGDIE)
  mode: 'dark';                            // Always dark - no light mode

  // Color scheme name (for future variations)
  colorScheme: 'gothic' | 'blood' | 'arcane'; // Current: 'gothic'

  // Accessibility overrides
  reducedMotion: boolean;                  // Respect prefers-reduced-motion
  highContrast: boolean;                   // Optional high-contrast mode
}
```

**Source**:
- `mode`: Static ('dark')
- `reducedMotion`: `window.matchMedia('(prefers-reduced-motion: reduce)')`
- `highContrast`: User preference (future enhancement)

**Note**: For initial implementation, theme is static. State structure allows future theme variations.

---

## 5. UI Interaction State

### UIState

Global UI state for modals, toasts, and loading indicators.

```typescript
interface UIState {
  // Wallet connection modal (RainbowKit manages this internally)
  isWalletModalOpen: boolean;              // Managed by RainbowKit

  // Toast notifications
  toasts: ToastMessage[];                  // Active toast messages

  // Global loading state
  isPageTransitioning: boolean;            // Next.js page transition
}

interface ToastMessage {
  id: string;                              // Unique ID for removal
  type: 'success' | 'error' | 'info' | 'warning';
  message: string;                         // User-facing message
  duration?: number;                       // Auto-dismiss time (ms), default 5000
  action?: {
    label: string;
    onClick: () => void;
  };
}
```

**Source**:
- Toasts: `react-hot-toast` library or custom React context
- Page transitions: Next.js router events

---

## 6. User Dropdown State

### UserDropdownState

State for the authenticated user's profile dropdown menu.

```typescript
interface UserDropdownState {
  isOpen: boolean;                         // Dropdown open/closed

  menuItems: UserMenuItem[];               // Menu actions
}

interface UserMenuItem {
  id: string;                              // 'profile', 'settings', 'disconnect'
  label: string;                           // Display text
  icon?: string;                           // Icon name/component
  onClick: () => void;                     // Action handler
  variant?: 'default' | 'danger';          // 'danger' for disconnect
  disabled?: boolean;
}
```

**Example Configuration**:
```typescript
const USER_MENU_ITEMS: Omit<UserMenuItem, 'onClick'>[] = [
  { id: 'profile', label: 'My Profile', variant: 'default', disabled: true }, // Future
  { id: 'settings', label: 'Settings', variant: 'default', disabled: true },  // Future
  { id: 'disconnect', label: 'Disconnect Wallet', variant: 'danger' },
];
```

---

## 7. Component Props Interfaces

### Header Component

```typescript
interface HeaderProps {
  className?: string;                      // Optional additional styles
}
```

The Header component internally uses hooks to get wallet/auth/navigation state.

---

### WalletButton Component

```typescript
interface WalletButtonProps {
  // Wallet state (from useAccount)
  address: `0x${string}` | null;
  isConnected: boolean;
  isConnecting: boolean;

  // Actions
  onConnect: () => void;                   // Open RainbowKit modal
  onDisconnect: () => void;                // Disconnect and clear session

  // UI customization
  size?: 'sm' | 'md' | 'lg';               // Button size variant
  className?: string;
}
```

---

### Navigation Component

```typescript
interface NavigationProps {
  items: NavigationItem[];                 // Navigation links
  currentPath: string;                     // Current route (for active state)
  isMobile: boolean;                       // Mobile vs desktop layout
  isOpen?: boolean;                        // Mobile menu open state
  onToggle?: () => void;                   // Mobile menu toggle handler
  className?: string;
}
```

---

### Footer Component

```typescript
interface FooterProps {
  externalLinks: ExternalLink[];          // Discord, OpenSea, Twitter, etc.
  className?: string;
}

interface ExternalLink {
  label: string;                           // 'Discord', 'OpenSea', etc.
  url: string;                             // External URL
  icon?: string;                           // Icon name/component
}
```

---

## 8. External Links Configuration

### ExternalLinksConfig

Static configuration for external resources (Discord, OpenSea, Twitter).

```typescript
interface ExternalLinksConfig {
  discord: string;                         // Discord invite URL
  opensea: string;                         // OpenSea collection URL
  twitter: string;                         // Twitter/X profile URL
  github?: string;                         // Optional: project GitHub
}
```

**Source**: Environment variables or static config file
**Example**:
```typescript
const EXTERNAL_LINKS: ExternalLinksConfig = {
  discord: process.env.NEXT_PUBLIC_DISCORD_URL || 'https://discord.gg/wagdie',
  opensea: process.env.NEXT_PUBLIC_OPENSEA_URL || 'https://opensea.io/collection/wagdie',
  twitter: process.env.NEXT_PUBLIC_TWITTER_URL || 'https://twitter.com/WAGDIE_ETH',
};
```

---

## State Management Strategy

### Local Component State
- **Navigation menu open/close**: `useState` in Navigation component
- **User dropdown open/close**: `useState` in UserDropdown component
- **Simple UI toggles**: Local state preferred (Constitution I: Simplicity)

### Custom Hooks (Shared State)
- **Wallet + Auth**: `useWalletAuth()` hook manages combined wallet + SIWE state
- **Navigation**: `useNavigation()` hook provides current route and nav items
- **Theme**: `useTheme()` hook (minimal - just reduced motion detection)

### External Library State
- **Wallet connection**: Managed by wagmi (uses Zustand internally)
- **RainbowKit modal**: Managed by RainbowKit
- **Toast notifications**: Managed by react-hot-toast

### NO Global State Library Needed
Per Constitution I (Simplicity), avoid Redux/Zustand/Jotai for this feature:
- Wallet state: wagmi handles it
- Auth state: Encapsulated in `useWalletAuth` hook
- UI state: Local component state sufficient
- Navigation: Derived from Next.js router

---

## Data Flow Diagrams

### Wallet Connection + SIWE Flow

```
User clicks "Connect Wallet"
         ↓
   RainbowKit modal opens
         ↓
   User selects wallet provider
         ↓
   Wallet extension prompts connection
         ↓
   User approves → wagmi updates address
         ↓
   useWalletAuth detects address change
         ↓
   Fetch nonce: POST /api/auth/nonce { address }
         ↓
   Request signature: wallet.signMessage(nonce)
         ↓
   User signs in wallet → signature returned
         ↓
   Verify: POST /api/auth/verify { address, signature }
         ↓
   Backend verifies → sets session cookie
         ↓
   useWalletAuth updates isAuthenticated = true
         ↓
   UI updates: Show user dropdown with address
```

### Page Load Reconnection Flow

```
User loads page
         ↓
   wagmi checks localStorage
         ↓
   If wallet previously connected → auto-reconnect
         ↓
   useWalletAuth detects address
         ↓
   Check session cookie (automatic in fetch)
         ↓
   If cookie valid → isAuthenticated = true
         ↓
   If cookie invalid → prompt re-authentication
```

---

## Validation Rules

### Address Validation
- Must match regex: `/^0x[a-fA-F0-9]{40}$/`
- Must be checksummed using `viem.getAddress()`
- Example: `0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb`

### Chain ID Validation
- Must be `1` (Ethereum Mainnet)
- If user on wrong chain → show network switch prompt
- Use wagmi's `useSwitchChain()` hook

### Session Validation
- Session cookie must be present and valid
- On 401 response from any API → clear session, prompt reconnect
- Session expiry: Set by backend (default 24 hours)

---

## Error States

### Wallet Connection Errors

| Error Scenario | State | User Message |
|----------------|-------|--------------|
| User rejects connection | `status: 'disconnected'`, `error: null` | "Connection cancelled" (info toast) |
| No wallet installed | `status: 'error'`, `error.code: 'CONNECTOR_NOT_FOUND'` | "No wallet found. Install MetaMask or use WalletConnect" |
| Wrong network | `status: 'connected'`, `chainId: != 1` | "Please switch to Ethereum Mainnet" + switch button |
| Connection timeout | `status: 'error'`, `error.code: 'TIMEOUT'` | "Connection timed out. Please try again." |

### SIWE Authentication Errors

| Error Scenario | State | User Message |
|----------------|-------|--------------|
| Nonce fetch fails | `siweStep: 'error'`, `error.step: 'nonce'` | "Unable to start authentication. Please try again." |
| User rejects signature | `siweStep: 'idle'` | "Signature cancelled" (info toast) |
| Signature verification fails | `siweStep: 'error'`, `error.step: 'verifying'` | "Authentication failed. Please try again." |
| Session expired | `isAuthenticated: false` | "Your session has expired. Please reconnect." |

---

## Performance Considerations

### State Update Frequency
- **Wallet state**: Only updates on connection/disconnection events (low frequency)
- **Navigation state**: Updates on route changes only
- **UI state**: Toast additions/removals are infrequent

### Memoization Strategy
- Use `useMemo` for derived state (e.g., `navItems` with `isActive` computed)
- Use `useCallback` for event handlers passed to child components
- Example:
  ```typescript
  const navItems = useMemo(() =>
    NAV_ITEMS.map(item => ({ ...item, isActive: item.path === currentPath })),
    [currentPath]
  );
  ```

### Preventing Unnecessary Rerenders
- Wrap components in `React.memo` if they receive stable props
- Example: Footer component with static external links
- Use React DevTools Profiler to identify render bottlenecks

---

## Summary

This data model defines:
- ✅ **6 core state interfaces**: Wallet, Auth, Navigation, Theme, UI, User Dropdown
- ✅ **Component prop interfaces**: Header, WalletButton, Navigation, Footer
- ✅ **Configuration structures**: External links, navigation items
- ✅ **State management strategy**: Local state + custom hooks, no global store
- ✅ **Validation rules**: Address format, chain ID, session validity
- ✅ **Error handling**: Comprehensive error states and user messages
- ✅ **Data flow diagrams**: Wallet connection + SIWE, page load reconnection

**All state is client-side** - no new database tables required. Existing `users` table used via SIWE session cookies.
