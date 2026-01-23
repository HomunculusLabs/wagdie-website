import type { AuthTokens } from '../../types/index.js';
import type { ElizaTransport } from '../transport/types.js';
import type { SIWEAuthState, SIWESigner } from './types.js';
type UseSIWEAuthOptions = {
    transport?: ElizaTransport;
    signer: SIWESigner;
    siwe: {
        domain: string;
        uri: string;
        chainId: number;
        statement?: string;
        resources?: string[];
    };
    onAuthenticated?: (tokens: AuthTokens) => void;
};
type UseSIWEAuthReturn = {
    state: SIWEAuthState;
    start: () => Promise<void>;
    reset: () => void;
};
export declare function useSIWEAuth(options: UseSIWEAuthOptions): UseSIWEAuthReturn;
export {};
