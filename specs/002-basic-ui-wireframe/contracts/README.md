# API Contracts: Basic UI Wireframe

**Feature**: 002-basic-ui-wireframe
**Date**: 2025-10-27

## Overview

This directory contains TypeScript interface contracts for the Basic UI Wireframe feature. These contracts define:

1. **Component Interfaces**: Props and return types for all UI components
2. **Hook Interfaces**: Return types for custom React hooks
3. **State Interfaces**: Data structures for application state
4. **API Types**: Request/response types for SIWE authentication endpoints

## Files

### `component-interfaces.ts`

Complete TypeScript interface definitions for all components, hooks, and state structures.

**Categories**:
- **Layout Components**: Header, Footer, Navigation
- **Wallet Components**: WalletButton, UserDropdown
- **Custom Hooks**: useWalletAuth, useNavigation, useTheme
- **State Interfaces**: WalletConnectionState, AuthSessionState, NavigationState, UIState
- **Configuration**: External links, navigation items, theme config
- **API Types**: SIWE endpoint request/response types

## Usage

These contracts serve as design artifacts and will be implemented in the actual codebase:

```typescript
// In actual implementation:
// components/wallet/WalletButton.tsx

import type { WalletButtonProps } from '@/types/wallet';

export function WalletButton({
  address,
  isConnected,
  isConnecting,
  onConnect,
  onDisconnect,
  size = 'md',
  className
}: WalletButtonProps) {
  // Implementation...
}
```

## Contract Principles

### 1. Type Safety
- All interfaces use explicit types (no `any`)
- Strict null checks (use `null` over `undefined` for absent values)
- Union types for status enums (`'connected' | 'disconnected'` etc.)

### 2. Clarity
- Every interface has JSDoc comments explaining purpose
- Props include default values in comments
- Complex types have usage examples

### 3. Minimal Surface Area
- Components receive only necessary props
- Hooks return focused, cohesive state
- No unnecessary optional props (if always provided, make required)

### 4. Separation of Concerns
- Props interfaces focus on component API
- State interfaces focus on data structure
- Hook return types focus on consumer needs

## Component Contracts

### Layout Components

#### Header
```typescript
interface HeaderProps {
  className?: string;
}
```
Self-contained component that internally manages wallet, auth, and navigation state via hooks.

#### Footer
```typescript
interface FooterProps {
  externalLinks: ExternalLink[];
  className?: string;
}
```
Receives external links configuration, renders static footer.

#### Navigation
```typescript
interface NavigationProps {
  items: NavigationItem[];
  currentPath: string;
  isMobile: boolean;
  isOpen?: boolean;
  onToggle?: () => void;
  className?: string;
}
```
Controlled component for navigation menu, supports mobile/desktop layouts.

### Wallet Components

#### WalletButton
```typescript
interface WalletButtonProps {
  address: Address | null;
  isConnected: boolean;
  isConnecting: boolean;
  onConnect: () => void;
  onDisconnect: () => void;
  size?: ButtonSize;
  className?: string;
}
```
Controlled component for wallet connection UI.

#### UserDropdown
```typescript
interface UserDropdownProps {
  address: Address;
  menuItems: UserMenuItem[];
  isOpen: boolean;
  onToggle: () => void;
  onClose: () => void;
  className?: string;
}
```
Controlled dropdown for authenticated user menu.

## Hook Contracts

### useWalletAuth
```typescript
interface UseWalletAuthReturn {
  // State
  address: Address | null;
  chainId: number | null;
  isConnected: boolean;
  isConnecting: boolean;
  isAuthenticated: boolean;
  isAuthenticating: boolean;
  walletStatus: WalletStatus;
  siweStep: SIWEStep;

  // Actions
  connect: () => void;
  disconnect: () => Promise<void>;
  authenticate: () => Promise<void>;

  // Errors
  error: WalletAuthError | null;
  clearError: () => void;
}
```
Comprehensive hook managing both wallet connection (wagmi) and SIWE authentication.

### useNavigation
```typescript
interface UseNavigationReturn {
  currentPath: string;
  currentPage: PageId;
  navItems: NavigationItem[];
  isMobileMenuOpen: boolean;
  toggleMobileMenu: () => void;
  closeMobileMenu: () => void;
}
```
Provides current navigation state and mobile menu controls.

### useTheme
```typescript
interface UseThemeReturn {
  mode: 'dark';
  reducedMotion: boolean;
  colorScheme: 'gothic' | 'blood' | 'arcane';
}
```
Minimal theme configuration (dark mode always on, reduced motion detection).

## API Contracts

### SIWE Endpoints

#### POST /api/auth/nonce
**Request**: `{ address: Address }`
**Response**:
```typescript
{
  nonce: string;
  expiresAt: string; // ISO 8601
}
```

#### POST /api/auth/verify
**Request**:
```typescript
{
  address: Address;
  signature: string;
  message: string;
}
```
**Response**:
```typescript
{
  success: boolean;
  session?: {
    address: Address;
    expiresAt: string;
  };
  error?: string;
}
```

#### POST /api/auth/logout
**Response**:
```typescript
{
  success: boolean;
}
```

## State Contracts

### WalletConnectionState
Managed by wagmi, accessed via `useAccount()` and transformed for UI consumption.

### AuthSessionState
Managed by `useWalletAuth` hook, orchestrates SIWE flow.

### NavigationState
Derived from Next.js router (`usePathname()`) and static nav configuration.

### UIState
Global UI state for toasts, modals, loading indicators.

## Type Aliases

### Address
```typescript
type Address = `0x${string}`;
```
Template literal type for Ethereum addresses (enforces 0x prefix).

### WalletConnectorId
```typescript
type WalletConnectorId = 'metaMask' | 'walletConnect' | 'rainbow' | 'coinbase';
```
Supported wallet providers.

### SIWEStep
```typescript
type SIWEStep = 'idle' | 'nonce' | 'signing' | 'verifying' | 'complete' | 'error';
```
SIWE authentication flow progression.

## Validation

### Address Validation
- Must match regex: `/^0x[a-fA-F0-9]{40}$/`
- Should be checksummed via `viem.getAddress()`

### Chain ID Validation
- Must be `1` (Ethereum Mainnet)
- Other chains should trigger network switch prompt

### Session Validation
- Session cookie must be present and valid
- 401 responses trigger re-authentication

## Error Handling

All error objects follow consistent structure:
```typescript
{
  message: string;    // User-facing message
  code?: string;      // Error code for debugging
  step?: string;      // Which step failed (for SIWE)
}
```

## Next Steps

After contract definition:
1. Implement actual components using these interfaces
2. Write tests using these types to validate contracts
3. Update contracts if implementation reveals missing properties

## References

- **Feature Spec**: `../spec.md`
- **Data Model**: `../data-model.md`
- **Research**: `../research.md`
