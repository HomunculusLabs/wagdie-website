/**
 * Component Interface Contracts: Basic UI Wireframe
 *
 * This file defines TypeScript interfaces for all components in the basic UI wireframe feature.
 * These serve as contracts between components and ensure type safety across the UI layer.
 *
 * Feature: 002-basic-ui-wireframe
 * Created: 2025-10-27
 *
 * NOTE: This is a design artifact, not production code.
 * Actual implementation files will import and implement these interfaces.
 */

// ============================================================================
// Core Type Definitions
// ============================================================================

/**
 * Ethereum address type (checksummed)
 */
export type Address = `0x${string}`;

/**
 * Supported wallet connector IDs
 */
export type WalletConnectorId = 'metaMask' | 'walletConnect' | 'rainbow' | 'coinbase';

/**
 * Wallet connection status
 */
export type WalletStatus = 'disconnected' | 'connecting' | 'connected' | 'reconnecting' | 'error';

/**
 * SIWE authentication flow steps
 */
export type SIWEStep = 'idle' | 'nonce' | 'signing' | 'verifying' | 'complete' | 'error';

/**
 * Toast notification types
 */
export type ToastType = 'success' | 'error' | 'info' | 'warning';

/**
 * Button size variants
 */
export type ButtonSize = 'sm' | 'md' | 'lg';

/**
 * Menu item variants
 */
export type MenuItemVariant = 'default' | 'danger';

/**
 * Navigation page identifiers
 */
export type PageId = 'home' | 'characters' | 'lore' | 'gather';

// ============================================================================
// Layout Components
// ============================================================================

/**
 * Header Component Props
 *
 * Main navigation header displayed at the top of every page.
 * Contains navigation links and wallet connection button.
 */
export interface HeaderProps {
  /**
   * Optional additional CSS classes for styling customization
   */
  className?: string;
}

/**
 * Footer Component Props
 *
 * Site footer with external links and project information.
 */
export interface FooterProps {
  /**
   * List of external resource links (Discord, OpenSea, Twitter, etc.)
   */
  externalLinks: ExternalLink[];

  /**
   * Optional additional CSS classes
   */
  className?: string;
}

/**
 * External Link Definition
 *
 * Represents a link to an external resource (social media, marketplace, etc.)
 */
export interface ExternalLink {
  /**
   * Display label for the link (e.g., "Discord", "OpenSea")
   */
  label: string;

  /**
   * Target URL
   */
  url: string;

  /**
   * Optional icon identifier or component reference
   */
  icon?: string;

  /**
   * Whether to open in new tab (default: true for external links)
   */
  openInNewTab?: boolean;
}

/**
 * Navigation Component Props
 *
 * Main navigation menu with support for both desktop and mobile layouts.
 */
export interface NavigationProps {
  /**
   * List of navigation items to display
   */
  items: NavigationItem[];

  /**
   * Current route path for highlighting active item
   */
  currentPath: string;

  /**
   * Whether rendering mobile layout (affects styling and behavior)
   */
  isMobile: boolean;

  /**
   * Mobile menu open/closed state (only relevant when isMobile=true)
   */
  isOpen?: boolean;

  /**
   * Handler for mobile menu toggle (only relevant when isMobile=true)
   */
  onToggle?: () => void;

  /**
   * Optional additional CSS classes
   */
  className?: string;
}

/**
 * Navigation Item Definition
 *
 * Represents a single navigation link in the main menu.
 */
export interface NavigationItem {
  /**
   * Display label
   */
  label: string;

  /**
   * Target path (internal route)
   */
  path: string;

  /**
   * Whether this item matches the current route
   */
  isActive: boolean;

  /**
   * Whether this navigation option is enabled (false for "coming soon" pages)
   */
  isEnabled: boolean;

  /**
   * Optional icon identifier
   */
  icon?: string;
}

// ============================================================================
// Wallet Components
// ============================================================================

/**
 * WalletButton Component Props
 *
 * Button for connecting/disconnecting wallet with loading states.
 * Displays user's address when connected.
 */
export interface WalletButtonProps {
  /**
   * Connected wallet address (null if disconnected)
   */
  address: Address | null;

  /**
   * Whether wallet is currently connected
   */
  isConnected: boolean;

  /**
   * Whether connection is in progress
   */
  isConnecting: boolean;

  /**
   * Handler for initiating wallet connection (opens RainbowKit modal)
   */
  onConnect: () => void;

  /**
   * Handler for disconnecting wallet and clearing session
   */
  onDisconnect: () => void;

  /**
   * Button size variant
   * @default 'md'
   */
  size?: ButtonSize;

  /**
   * Optional additional CSS classes
   */
  className?: string;
}

/**
 * UserDropdown Component Props
 *
 * Dropdown menu displayed when user is authenticated.
 * Shows user's address and action menu items.
 */
export interface UserDropdownProps {
  /**
   * Authenticated user's wallet address
   */
  address: Address;

  /**
   * Menu items to display in dropdown
   */
  menuItems: UserMenuItem[];

  /**
   * Whether dropdown is currently open
   */
  isOpen: boolean;

  /**
   * Handler for toggling dropdown open/closed
   */
  onToggle: () => void;

  /**
   * Handler for closing dropdown (e.g., on outside click)
   */
  onClose: () => void;

  /**
   * Optional additional CSS classes
   */
  className?: string;
}

/**
 * User Menu Item Definition
 *
 * Represents an action in the user dropdown menu.
 */
export interface UserMenuItem {
  /**
   * Unique identifier for the menu item
   */
  id: string;

  /**
   * Display label
   */
  label: string;

  /**
   * Optional icon identifier
   */
  icon?: string;

  /**
   * Click handler
   */
  onClick: () => void;

  /**
   * Visual variant (e.g., 'danger' for disconnect action)
   * @default 'default'
   */
  variant?: MenuItemVariant;

  /**
   * Whether menu item is disabled
   * @default false
   */
  disabled?: boolean;
}

// ============================================================================
// Custom Hooks
// ============================================================================

/**
 * useWalletAuth Hook Return Type
 *
 * Custom hook that manages wallet connection + SIWE authentication.
 */
export interface UseWalletAuthReturn {
  // Wallet state
  address: Address | null;
  chainId: number | null;
  isConnected: boolean;
  isConnecting: boolean;
  walletStatus: WalletStatus;

  // Authentication state
  isAuthenticated: boolean;
  isAuthenticating: boolean;
  siweStep: SIWEStep;

  // Actions
  connect: () => void;
  disconnect: () => Promise<void>;
  authenticate: () => Promise<void>;

  // Error handling
  error: WalletAuthError | null;
  clearError: () => void;
}

/**
 * Wallet + Auth Error
 */
export interface WalletAuthError {
  message: string;
  code?: string;
  step?: 'wallet' | 'nonce' | 'signing' | 'verifying';
}

/**
 * useNavigation Hook Return Type
 *
 * Custom hook for accessing current navigation state.
 */
export interface UseNavigationReturn {
  /**
   * Current route path
   */
  currentPath: string;

  /**
   * Current page identifier
   */
  currentPage: PageId;

  /**
   * Navigation items with active state computed
   */
  navItems: NavigationItem[];

  /**
   * Mobile menu state
   */
  isMobileMenuOpen: boolean;

  /**
   * Toggle mobile menu
   */
  toggleMobileMenu: () => void;

  /**
   * Close mobile menu (e.g., after navigation)
   */
  closeMobileMenu: () => void;
}

/**
 * useTheme Hook Return Type
 *
 * Custom hook for theme configuration (minimal for this project).
 */
export interface UseThemeReturn {
  /**
   * Theme mode (always 'dark' for WAGDIE)
   */
  mode: 'dark';

  /**
   * Whether user prefers reduced motion
   */
  reducedMotion: boolean;

  /**
   * Color scheme variant
   */
  colorScheme: 'gothic' | 'blood' | 'arcane';
}

// ============================================================================
// State Interfaces
// ============================================================================

/**
 * Wallet Connection State
 *
 * Complete state for wallet connection management.
 */
export interface WalletConnectionState {
  address: Address | null;
  chainId: number | null;
  status: WalletStatus;
  connector: {
    id: WalletConnectorId;
    name: string;
    icon?: string;
  } | null;
  error: {
    message: string;
    code?: string;
  } | null;
}

/**
 * Authentication Session State
 *
 * Complete state for SIWE authentication session.
 */
export interface AuthSessionState {
  isAuthenticated: boolean;
  isAuthenticating: boolean;
  session: {
    address: Address;
    nonce: string;
    expiresAt: Date;
  } | null;
  siweStep: SIWEStep;
  error: {
    message: string;
    step: 'nonce' | 'signing' | 'verifying';
  } | null;
}

/**
 * Navigation State
 *
 * Complete state for navigation and routing.
 */
export interface NavigationState {
  currentPath: string;
  currentPage: PageId;
  isMobileMenuOpen: boolean;
  navItems: NavigationItem[];
}

/**
 * UI State
 *
 * Global UI state for modals, toasts, loading indicators.
 */
export interface UIState {
  isWalletModalOpen: boolean;
  toasts: ToastMessage[];
  isPageTransitioning: boolean;
}

/**
 * Toast Message
 */
export interface ToastMessage {
  id: string;
  type: ToastType;
  message: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

// ============================================================================
// Configuration Interfaces
// ============================================================================

/**
 * External Links Configuration
 *
 * Static configuration for external resource links.
 */
export interface ExternalLinksConfig {
  discord: string;
  opensea: string;
  twitter: string;
  github?: string;
}

/**
 * Navigation Configuration
 *
 * Static configuration for navigation items.
 */
export interface NavigationConfig {
  items: Omit<NavigationItem, 'isActive'>[];
}

/**
 * Theme Configuration
 *
 * Tailwind theme customization for gothic dark aesthetic.
 */
export interface ThemeConfig {
  colors: {
    // Background shades
    abyss: string;
    shadow: string;
    midnight: string;

    // Text colors
    bone: string;
    ash: string;
    mist: string;

    // Accent colors
    blood: string;
    ember: string;
    gold: string;
    poison: string;
    arcane: string;
  };
  fonts: {
    heading: string;
    body: string;
  };
  breakpoints: {
    sm: string;
    md: string;
    lg: string;
    xl: string;
  };
}

// ============================================================================
// API Response Types (SIWE endpoints)
// ============================================================================

/**
 * Response from /api/auth/nonce
 */
export interface NonceResponse {
  nonce: string;
  expiresAt: string; // ISO 8601 timestamp
}

/**
 * Request to /api/auth/verify
 */
export interface VerifyRequest {
  address: Address;
  signature: string;
  message: string;
}

/**
 * Response from /api/auth/verify
 */
export interface VerifyResponse {
  success: boolean;
  session?: {
    address: Address;
    expiresAt: string;
  };
  error?: string;
}

/**
 * Response from /api/auth/logout
 */
export interface LogoutResponse {
  success: boolean;
}

// ============================================================================
// Utility Types
// ============================================================================

/**
 * Helper type for truncating Ethereum addresses
 * Example: "0x1234...5678"
 */
export type TruncatedAddress = string;

/**
 * Helper function signature for address truncation
 */
export type TruncateAddressFn = (address: Address, prefixLength?: number, suffixLength?: number) => TruncatedAddress;

/**
 * Helper function signature for address validation
 */
export type IsValidAddressFn = (address: string) => address is Address;

/**
 * Helper function signature for chain ID validation
 */
export type IsMainnetFn = (chainId: number | null) => boolean;
