/**
 * Mock Providers for Storybook
 * Provides isolated mock data for complex hooks in Storybook context
 */

import React, { createContext, useContext, ReactNode } from 'react';

// ============================================================================
// Mock Contexts
// ============================================================================

/**
 * Mock Auth Context
 */
const MockAuthContext = createContext({
  address: '0x1234567890123456789012345678901234567890',
  isConnected: true,
  isAuthenticated: true,
  isAuthenticating: false,
  error: null,
  connect: () => {},
  disconnect: async () => {},
});

/**
 * Mock Character Ownership Context
 */
const MockCharacterOwnershipContext = createContext({
  isOwner: true,
  isLoading: false,
  error: null,
});

/**
 * Mock Token Balances Context
 */
const MockTokenBalancesContext = createContext({
  balances: [
    { symbol: 'ETH', balance: '1.5', address: '0x0000000000000000000000000000000000000000' },
    { symbol: 'WAGDIE', balance: '10000', address: '0x1234567890123456789012345678901234567890' },
  ],
  isLoading: false,
  error: null,
});

/**
 * Mock Staking Status Context
 */
const MockStakingStatusContext = createContext({
  isStaked: false,
  stakedAtLocation: null,
  isLoading: false,
  error: null,
});

// ============================================================================
// Mock Providers
// ============================================================================

/**
 * Mock Auth Provider
 * For components using useAuth hook
 */
export const MockAuthProvider = ({ children }: { children: ReactNode }) => {
  return (
    <MockAuthContext.Provider
      value={{
        address: '0x1234567890123456789012345678901234567890',
        isConnected: true,
        isAuthenticated: true,
        isAuthenticating: false,
        error: null,
        connect: () => {},
        disconnect: async () => {},
      }}
    >
      {children}
    </MockAuthContext.Provider>
  );
};

/**
 * Mock Character Ownership Provider
 * For components checking character ownership
 */
export const MockCharacterOwnershipProvider = ({
  children,
  isOwner = true,
  isLoading = false,
  error = null,
}: {
  children: ReactNode;
  isOwner?: boolean;
  isLoading?: boolean;
  error?: any;
}) => {
  return (
    <MockCharacterOwnershipContext.Provider
      value={{
        isOwner,
        isLoading,
        error,
      }}
    >
      {children}
    </MockCharacterOwnershipContext.Provider>
  );
};

/**
 * Mock Token Balances Provider
 * For wallet components showing token balances
 */
export const MockTokenBalancesProvider = ({
  children,
  balances = [
    { symbol: 'ETH', balance: '1.5', address: '0x0000000000000000000000000000000000000000' },
    { symbol: 'WAGDIE', balance: '10000', address: '0x1234567890123456789012345678901234567890' },
  ],
  isLoading = false,
  error = null,
}: {
  children: ReactNode;
  balances?: Array<{ symbol: string; balance: string; address: string }>;
  isLoading?: boolean;
  error?: any;
}) => {
  return (
    <MockTokenBalancesContext.Provider
      value={{
        balances,
        isLoading,
        error,
      }}
    >
      {children}
    </MockTokenBalancesContext.Provider>
  );
};

/**
 * Mock Staking Status Provider
 * For staking-related components
 */
export const MockStakingStatusProvider = ({
  children,
  isStaked = false,
  stakedAtLocation = null,
  isLoading = false,
  error = null,
}: {
  children: ReactNode;
  isStaked?: boolean;
  stakedAtLocation?: string | null;
  isLoading?: boolean;
  error?: any;
}) => {
  return (
    <MockStakingStatusContext.Provider
      value={{
        isStaked,
        stakedAtLocation,
        isLoading,
        error,
      }}
    >
      {children}
    </MockStakingStatusContext.Provider>
  );
};

// ============================================================================
// Mock Hook Wrappers
// ============================================================================

/**
 * Mock useAuth hook for Storybook
 */
export const useAuth = () => {
  return {
    address: '0x1234567890123456789012345678901234567890',
    isConnected: true,
    isAuthenticated: true,
    isAuthenticating: false,
    error: null,
    connect: () => console.log('Mock connect'),
    disconnect: async () => console.log('Mock disconnect'),
  };
};

/**
 * Mock useCharacterOwnership hook for Storybook
 */
export const useCharacterOwnership = (tokenId: number | null) => {
  const context = useContext(MockCharacterOwnershipContext);
  return {
    isOwner: context.isOwner,
    isLoading: context.isLoading,
    error: context.error,
  };
};

/**
 * Mock useTokenBalances hook for Storybook
 */
export const useTokenBalances = (address: string) => {
  const context = useContext(MockTokenBalancesContext);
  return {
    balances: context.balances,
    isLoading: context.isLoading,
    error: context.error,
  };
};

/**
 * Mock useStakingStatus hook for Storybook
 */
export const useStakingStatus = (tokenId: number | null) => {
  const context = useContext(MockStakingStatusContext);
  return {
    isStaked: context.isStaked,
    stakedAtLocation: context.stakedAtLocation,
    isLoading: context.isLoading,
    error: context.error,
  };
};

// ============================================================================
// Mock Services
// ============================================================================

/**
 * Mock BalancesService
 */
export class MockBalancesService {
  async getAllBalances(address: string) {
    return [
      { symbol: 'ETH', balance: '1.5', address: '0x0000000000000000000000000000000000000000' },
      { symbol: 'WAGDIE', balance: '10000', address: '0x1234567890123456789012345678901234567890' },
    ];
  }
}

/**
 * Mock StakingService
 */
export class MockStakingService {
  async getStakingStatus(tokenId: number) {
    return {
      isStaked: false,
      stakedAtLocation: null,
    };
  }
}

/**
 * Mock OwnershipService
 */
export class MockOwnershipService {
  async checkOwnership(tokenId: number, address: string) {
    return {
      isOwner: true,
    };
  }
}
