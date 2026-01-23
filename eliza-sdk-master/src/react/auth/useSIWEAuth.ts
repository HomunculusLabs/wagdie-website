import { useCallback, useEffect, useRef, useState } from 'react';
import { createSIWEMessage } from '../../auth/siwe.js';
import type { AuthTokens } from '../../types/index.js';
import type { ElizaTransport } from '../transport/types.js';
import { useOptionalEliza } from '../provider/ElizaProvider.js';
import { toError } from '../shared/errors.js';
import type { SIWEAuthState, SIWESigner } from './types.js';

type UseSIWEAuthOptions = {
  transport?: ElizaTransport; // defaults to context
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
  start: () => Promise<void>; // triggers the auth flow
  reset: () => void; // resets to idle
};

export function useSIWEAuth(options: UseSIWEAuthOptions): UseSIWEAuthReturn {
  const { transport: transportOverride, signer, siwe, onAuthenticated } = options;

  const context = useOptionalEliza();
  const transport = transportOverride ?? context?.transport ?? null;

  const [state, setState] = useState<SIWEAuthState>({ status: 'idle' });

  const isMountedRef = useRef(true);
  const attemptRef = useRef(0);
  const inFlightRef = useRef<Promise<void> | null>(null);

  useEffect(() => {
    isMountedRef.current = true; // Reset on mount (needed for React 18 Strict Mode)
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const safeSetState = useCallback((next: SIWEAuthState) => {
    if (!isMountedRef.current) return;
    setState(next);
  }, []);

  const reset = useCallback(() => {
    attemptRef.current += 1;
    inFlightRef.current = null;
    safeSetState({ status: 'idle' });
  }, [safeSetState]);

  const start = useCallback(async (): Promise<void> => {
    if (!transport) {
      safeSetState({
        status: 'error',
        error: new Error(
          'useSIWEAuth requires an ElizaTransport: pass options.transport or wrap in <ElizaProvider>.'
        ),
      });
      return;
    }

    if (inFlightRef.current) {
      return inFlightRef.current;
    }

    const attemptId = ++attemptRef.current;

    const run = (async () => {
      try {
        safeSetState({ status: 'requesting_nonce' });

        const { nonce, sessionId } = await transport.auth.getNonce();
        if (attemptRef.current !== attemptId) return;

        const address = await signer.getAddress();
        if (attemptRef.current !== attemptId) return;

        const message = createSIWEMessage({
          domain: siwe.domain,
          address,
          statement: siwe.statement,
          uri: siwe.uri,
          chainId: siwe.chainId,
          nonce,
          resources: siwe.resources,
        });

        safeSetState({ status: 'awaiting_signature', message, sessionId, nonce });

        const signature = await signer.signMessage(message);
        if (attemptRef.current !== attemptId) return;

        safeSetState({ status: 'verifying' });

        const tokens = await transport.auth.verify(message, signature, sessionId);
        if (attemptRef.current !== attemptId) return;

        safeSetState({ status: 'authenticated', tokens });
        onAuthenticated?.(tokens);
      } catch (error) {
        if (attemptRef.current !== attemptId) return;
        safeSetState({ status: 'error', error: toError(error, 'SIWE authentication failed') });
      }
    })().finally(() => {
      if (inFlightRef.current === run) {
        inFlightRef.current = null;
      }
    });

    inFlightRef.current = run;
    return run;
  }, [transport, signer, siwe, onAuthenticated, safeSetState]);

  return { state, start, reset };
}