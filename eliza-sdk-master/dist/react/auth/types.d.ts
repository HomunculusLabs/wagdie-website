import type { AuthTokens } from '../../types/index.js';
export interface SIWESigner {
    getAddress(): Promise<string>;
    signMessage(message: string): Promise<string>;
}
export type SIWEAuthState = {
    status: 'idle';
} | {
    status: 'requesting_nonce';
} | {
    status: 'awaiting_signature';
    message: string;
    sessionId: string;
    nonce: string;
} | {
    status: 'verifying';
} | {
    status: 'authenticated';
    tokens: AuthTokens;
} | {
    status: 'error';
    error: Error;
};
