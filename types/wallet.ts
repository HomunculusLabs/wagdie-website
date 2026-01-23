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

/**
 * User session data (server-side iron-session)
 */
export interface UserSession {
  address: string // Ethereum address (checksummed)
  siwe: {
    message: string // SIWE message
    signature: string // Signature
    nonce: string // Used nonce
  }
  expires: number // Session expiration (Unix timestamp)

  /**
   * Optional Eliza auth state (v0.2 SIWE flow + user-scoped token).
   * Kept optional so existing sessions remain valid.
   */
  eliza?: {
    siwe: {
      nonce: string
      sessionId: string
      message: string
      issuedAt: string // ISO 8601 timestamp
    }
    tokens?: {
      accessToken: string
      /** Token expiration time (Unix timestamp in milliseconds) */
      expiresAt: number
      /** Optional refresh token for future token refresh support */
      refreshToken?: string
    }
  }

  selectedCharacter?: number // Currently selected token ID
}

/**
 * Blockchain transaction receipt
 */
export interface TransactionReceipt {
  transactionHash: string
  blockNumber: number
  from: string
  to: string
  status: 'success' | 'failure'
  gasUsed: string
  effectiveGasPrice: string
}
