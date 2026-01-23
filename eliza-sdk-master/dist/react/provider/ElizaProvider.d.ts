import type { ReactNode } from 'react';
import type { ElizaTransport } from '../transport/types.js';
export interface ElizaContextValue {
    transport: ElizaTransport;
}
export interface ElizaProviderProps {
    transport: ElizaTransport;
    children: ReactNode;
}
export declare function ElizaProvider({ transport, children }: ElizaProviderProps): JSX.Element;
export declare function useOptionalEliza(): ElizaContextValue | null;
/**
 * Convenience hook for future extensibility (e.g., auth state, config, logging).
 */
export declare function useEliza(): ElizaContextValue;
export declare function useElizaTransport(): ElizaTransport;
