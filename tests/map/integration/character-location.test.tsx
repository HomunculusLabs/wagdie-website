/**
 * Integration test for character location fetching
 * T019 [P] [US2] Integration test for character location fetching
 * Following TDD approach - this test is written BEFORE implementation
 *
 * Test Requirements:
 * - Connect wallet with WAGDIE characters
 * - View map and see character list with current locations
 * - Verify location data is fetched from Supabase
 */

import { render, screen, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useCharacterLocation } from '@/hooks/map/useCharacterLocation'
import { useLocations } from '@/hooks/map/useLocations'

// Mock wagmi
const mockWagmiConfig = {
  chains: [],
  transports: {},
} as any

jest.mock('wagmi', () => ({
  useAccount() {
    return {
      address: '0x1234567890123456789012345678901234567890',
      isConnected: true,
      isConnecting: false,
      isDisconnected: false,
    }
  },
}))

// Mock the services
jest.mock('@/lib/services/map/locationService', () => ({
  getLocations: jest.fn(),
  getCharacterLocations: jest.fn(),
}))

jest.mock('@/components/map/CharacterLocationList', () => ({
  CharacterLocationList: () => <div data-testid="character-location-list">Character List</div>,
}))

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  })

  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  )
}

describe('Character Location Fetching', () => {
  it('fetches locations on component mount', async () => {
    // Arrange
    const mockLocations = [
      { id: 'concord_searing', name: 'Concord Searing', description: 'A place of power' },
      { id: 'forsaken_lands', name: 'Forsaken Lands', description: 'Starting grounds' },
    ]

    const { getLocations } = require('@/lib/services/map/locationService')
    getLocations.mockResolvedValue(mockLocations)

    // Act
    const Wrapper = createWrapper()
    render(<TestComponent />, { wrapper: Wrapper })

    // Assert
    await waitFor(() => {
      expect(getLocations).toHaveBeenCalledTimes(1)
    })
  })

  it('fetches character locations when wallet is connected', async () => {
    // Arrange
    const mockCharacterLocations = [
      {
        character_id: '1234',
        location_id: 'concord_searing',
        wallet_address: '0x1234567890123456789012345678901234567890',
        transaction_hash: '0xabc...',
        status: 'staked',
        location: { id: 'concord_searing', name: 'Concord Searing' },
      },
    ]

    const { getCharacterLocations } = require('@/lib/services/map/locationService')
    getCharacterLocations.mockResolvedValue(mockCharacterLocations)

    // Act
    const Wrapper = createWrapper()
    render(<TestComponent />, { wrapper: Wrapper })

    // Assert
    await waitFor(() => {
      expect(getCharacterLocations).toHaveBeenCalledWith('0x1234567890123456789012345678901234567890')
    })
  })

  it('displays loading state while fetching data', async () => {
    // Arrange
    const { getCharacterLocations } = require('@/lib/services/map/locationService')
    getCharacterLocations.mockReturnValue(new Promise(() => {})) // Never resolves

    // Act
    const Wrapper = createWrapper()
    render(<TestComponent />, { wrapper: Wrapper })

    // Assert
    expect(screen.getByText(/loading/i)).toBeInTheDocument()
  })

  it('displays error state when fetch fails', async () => {
    // Arrange
    const { getCharacterLocations } = require('@/lib/services/map/locationService')
    getCharacterLocations.mockRejectedValue(new Error('Failed to fetch'))

    // Act
    const Wrapper = createWrapper()
    render(<TestComponent />, { wrapper: Wrapper })

    // Assert
    await waitFor(() => {
      expect(screen.getByText(/error/i)).toBeInTheDocument()
    })
  })
})

// Test component that uses the hooks
function TestComponent() {
  const { data: locations } = useLocations()
  const { data: characterLocations } = useCharacterLocation()

  return (
    <div>
      <h1>Locations: {locations?.length || 0}</h1>
      <h2>Characters: {characterLocations?.length || 0}</h2>
    </div>
  )
}
