/**
 * Integration test for map page
 * T011 [P] [US1] Integration test for map page
 * Following TDD approach - this test is written BEFORE implementation
 *
 * Test Requirements:
 * - Navigate to /map URL
 * - Verify interactive map loads with iframe from wagdie.world
 * - Verify page structure and components render correctly
 */

import { render, screen, waitFor } from '@testing-library/react'
import MapPage from '@/app/map/page'
import { WagmiConfig } from 'wagmi'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

// Mock wagmi config
const mockWagmiConfig = {
  chains: [],
  transports: {},
} as any

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter() {
    return {
      push: jest.fn(),
      prefetch: jest.fn(),
      back: jest.fn(),
      forward: jest.fn(),
      refresh: jest.fn(),
    }
  },
}))

// Mock the wagmi hooks
jest.mock('wagmi', () => ({
  useAccount() {
    return {
      address: '0x1234567890123456789012345678901234567890',
      isConnected: true,
    }
  },
  useReadContract: jest.fn(),
  useWriteContract: jest.fn(),
  useWaitForTransactionReceipt: jest.fn(),
}))

// Mock the MapEmbed component (will be implemented in T013)
jest.mock('@/components/map/MapEmbed', () => ({
  MapEmbed: () => <div data-testid="map-embed">Map Embed Component</div>,
}))

// Mock the CharacterLocationList component
jest.mock('@/components/map/CharacterLocationList', () => ({
  CharacterLocationList: () => <div data-testid="character-list">Character List Component</div>,
}))

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  })

  return ({ children }: { children: React.ReactNode }) => (
    <WagmiConfig config={mockWagmiConfig}>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </WagmiConfig>
  )
}

describe('MapPage', () => {
  it('renders the map page with correct heading', async () => {
    // Arrange
    const Wrapper = createWrapper()

    // Act
    render(<MapPage />, { wrapper: Wrapper })

    // Assert
    expect(screen.getByRole('heading', { name: /world map/i })).toBeInTheDocument()
  })

  it('renders the MapEmbed component', async () => {
    // Arrange
    const Wrapper = createWrapper()

    // Act
    render(<MapPage />, { wrapper: Wrapper })

    // Assert
    expect(screen.getByTestId('map-embed')).toBeInTheDocument()
  })

  it('shows character list when wallet is connected', async () => {
    // Arrange
    const Wrapper = createWrapper()

    // Act
    render(<MapPage />, { wrapper: Wrapper })

    // Assert
    // The component should show character list since isConnected is mocked as true
    expect(screen.getByTestId('character-list')).toBeInTheDocument()
  })

  it('does not show character list when wallet is not connected', async () => {
    // Arrange
    jest.clearAllMocks()
    jest.mock('wagmi', () => ({
      useAccount() {
        return {
          address: undefined,
          isConnected: false,
        }
      },
    }))

    const Wrapper = createWrapper()

    // Act
    render(<MapPage />, { wrapper: Wrapper })

    // Assert
    // The character list should not render when wallet is not connected
    expect(screen.queryByTestId('character-list')).not.toBeInTheDocument()
  })

  it('has correct page structure with container', async () => {
    // Arrange
    const Wrapper = createWrapper()

    // Act
    render(<MapPage />, { wrapper: Wrapper })

    // Assert
    // Check that the page has a container div
    const container = screen.getByRole('main').parentElement
    expect(container).toHaveClass('container')
    expect(container).toHaveClass('mx-auto')
    expect(container).toHaveClass('px-4')
  })
})
