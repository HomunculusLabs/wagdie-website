import { createContext, useContext, useMemo } from 'react';
import type { ReactNode } from 'react';
import type { ElizaTransport } from '../transport/types.js';

export interface ElizaContextValue {
  transport: ElizaTransport;
}

export interface ElizaProviderProps {
  transport: ElizaTransport;
  children: ReactNode;
}

const ElizaContext = createContext<ElizaContextValue | null>(null);

export function ElizaProvider({ transport, children }: ElizaProviderProps): JSX.Element {
  const value = useMemo<ElizaContextValue>(() => ({ transport }), [transport]);

  return <ElizaContext.Provider value={value}>{children}</ElizaContext.Provider>;
}

export function useOptionalEliza(): ElizaContextValue | null {
  return useContext(ElizaContext);
}

/**
 * Convenience hook for future extensibility (e.g., auth state, config, logging).
 */
export function useEliza(): ElizaContextValue {
  const context = useOptionalEliza();
  if (!context) {
    throw new Error('useEliza must be used within an ElizaProvider');
  }
  return context;
}

export function useElizaTransport(): ElizaTransport {
  return useEliza().transport;
}