import type { Preview } from '@storybook/react';
import React from 'react';
import '../app/globals.css';
import { WagmiProvider } from 'wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createConfig, http, injected } from 'wagmi';
import { mainnet, sepolia } from '@/lib/contracts/chains';
import { MockAuthProvider, MockTokenBalancesProvider, MockStakingStatusProvider, MockCharacterOwnershipProvider } from './mock-providers';
import { handlers } from './mocks/handlers';
import { setupWorker } from 'msw/browser';

// Initialize MSW worker for Storybook
const worker = setupWorker(...handlers);

// Start MSW worker in development mode
if (typeof window !== 'undefined') {
  worker.start({
    onUnhandledRequest: 'bypass',
  }).catch((error) => {
    console.error('MSW worker failed to start:', error);
  });
}

// Storybook-specific Wagmi config (with mock/fallback RPC)
const storybookConfig = createConfig({
  chains: [mainnet, sepolia] as any,
  connectors: [
    injected({
      shimDisconnect: true,
    }),
  ],
  ssr: true,
  transports: {
    [mainnet.id]: http('https://cloudflare-eth.com'),
    [sepolia.id]: http('https://sepolia.g.alchemy.com/v2/demo'),
  },
});

// Create a query client for Storybook
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Disable retries in Storybook for cleaner output
      retry: false,
      gcTime: 0,
    },
  },
});

// Mock data for different states
const mockStates = {
  connected: {
    isConnected: true,
    address: '0x1234567890123456789012345678901234567890',
  },
  disconnected: {
    isConnected: false,
    address: undefined,
  },
  error: {
    isConnected: false,
    error: 'Mock error state',
  },
};

// Global decorator to wrap all stories with providers
const withProviders = (Story: React.ComponentType, context: any) => {
  // Check if story has mock state parameter
  const mockState = context.globals?.mockState || 'connected';

  return (
    <WagmiProvider config={storybookConfig}>
      <QueryClientProvider client={queryClient}>
        <MockAuthProvider>
          <MockTokenBalancesProvider>
            <MockStakingStatusProvider>
              <MockCharacterOwnershipProvider>
                <div style={{ padding: '1rem' }}>
                  <Story />
                </div>
              </MockCharacterOwnershipProvider>
            </MockStakingStatusProvider>
          </MockTokenBalancesProvider>
        </MockAuthProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
};

const preview: Preview = {
  parameters: {
    actions: { argTypesRegex: '^on[A-Z].*' },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/,
      },
    },
    docs: {
      toc: true,
    },
    // Add support for bigint in Storybook controls
    backgrounds: {
      default: 'dark',
      values: [
        { name: 'dark', value: '#1a1a1a' },
        { name: 'light', value: '#ffffff' },
      ],
    },
  },
  decorators: [withProviders],
  globalTypes: {
    mockState: {
      description: 'Global mock state for components',
      defaultValue: 'connected',
      toolbar: {
        title: 'Mock State',
        icon: 'gear',
        items: [
          { value: 'connected', title: 'Connected' },
          { value: 'disconnected', title: 'Disconnected' },
          { value: 'error', title: 'Error' },
          { value: 'loading', title: 'Loading' },
        ],
      },
    },
  },
};

export default preview;
