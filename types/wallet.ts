/**
 * Wallet and Authentication Type Definitions
 *
 * Core types for wallet connection, SIWE authentication, and user session management.
 */

/**
 * Ethereum address type (checksummed with 0x prefix)
 */
export type Address = `0x${string}`;

/**
 * Supported wallet connector IDs
 */
export type WalletConnectorId = 'metaMask' | 'walletConnect' | 'rainbow' | 'coinbase';

/**
 * Wallet connection status states
 */
export type WalletStatus = 'disconnected' | 'connecting' | 'connected' | 'reconnecting' | 'error';

/**
 * SIWE (Sign-In with Ethereum) authentication flow steps
 */
export type SIWEStep = 'idle' | 'nonce' | 'signing' | 'verifying' | 'complete' | 'error';

/**
 * Toast notification types
 */
export type ToastType = 'success' | 'error' | 'info' | 'warning';

/**
 * Wallet + Authentication Error
 */
export interface WalletAuthError {
  message: string;
  code?: string;
  step?: 'wallet' | 'nonce' | 'signing' | 'verifying';
}

/**
 * useWalletAuth Hook Return Type
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
