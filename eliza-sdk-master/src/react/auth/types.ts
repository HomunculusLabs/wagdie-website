import type { AuthTokens } from '../../types/index.js';

// SIWESigner - wallet abstraction that consumers implement
export interface SIWESigner {
  getAddress(): Promise<string>;
  signMessage(message: string): Promise<string>;
}

// SIWEAuthState - discriminated union for auth state machine
export type SIWEAuthState =
  | { status: 'idle' }
  | { status: 'requesting_nonce' }
  | { status: 'awaiting_signature'; message: string; sessionId: string; nonce: string }
  | { status: 'verifying' }
  | { status: 'authenticated'; tokens: AuthTokens }
  | { status: 'error'; error: Error };