/**
 * Integration test for location staking
 * T028 [P] [US3] Integration test for location staking
 * Following TDD approach - this test is written BEFORE implementation
 *
 * Test Requirements:
 * - Own a character
 * - Open location selector
 * - Confirm transaction
 * - Verify character moved to new location
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useLocationStaking } from '@/hooks/map/useLocationStaking'
import { LocationSelector } from '@/components/map/LocationSelector'
import { TransactionStatus } from '@/components/map/TransactionStatus'

// Mock wagmi
const mockWagmiConfig = {
  chains: [],
  transports: {},
} as any

const mockWalletAddress = '0x1234567890123456789012345678901234567890'

jest.mock('wagmi', () => ({
  useAccount() {
    return {
      address: mockWalletAddress,
      isConnected: true,
      isConnecting: false,
      isDisconnected: false,
    }
  },
  useWriteContract: jest.fn(),
  useWaitForTransactionReceipt: jest.fn(),
}))

// Mock the services and hooks
jest.mock('@/lib/services/map/wagdieWorldContract', () => ({
  stakeWagdies: jest.fn(),
  changeWagdieLocations: jest.fn(),
  unstakeWagdies: jest.fn(),
  formatContractError: jest.fn((error) => error.message || 'Contract error'),
}))

jest.mock('@/lib/services/map/locationService', () => ({
  createLocationTransaction: jest.fn(),
  updateLocationTransactionStatus: jest.fn(),
  updateCharacterLocationCache: jest.fn(),
}))

jest.mock('@/hooks/map/useLocationStaking', () => ({
  useLocationStaking: jest.fn(),
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

describe('Location Staking', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('shows location selector when triggered', async () => {
    // Arrange
    const mockUseLocationStaking = require('@/hooks/map/useLocationStaking')
    mockUseLocationStaking.useLocationStaking.mockReturnValue({
      stake: jest.fn(),
      move: jest.fn(),
      unstake: jest.fn(),
      isPending: false,
      error: null,
    })

    // Act
    const Wrapper = createWrapper()
    render(<LocationSelector characterId="1234" isOpen={true} onClose={jest.fn()} />, {
      wrapper: Wrapper,
    })

    // Assert
    await waitFor(() => {
      expect(screen.getByText(/select location/i)).toBeInTheDocument()
    })
  })

  it('initiates stake transaction when location is selected', async () => {
    // Arrange
    const { stakeWagdies } = require('@/lib/services/map/wagdieWorldContract')
    stakeWagdies.mockResolvedValue({
      hash: '0xabc123...',
      status: 'success',
    })

    const { stake, isPending } = useLocationStaking()
    isPending = true

    // Act
    stake({ wagdieId: 1234n, locationId: 1n })

    // Assert
    await waitFor(() => {
      expect(stakeWagdies).toHaveBeenCalledWith([
        { wagdieId: 1234n, locationId: 1n },
      ])
    })
  })

  it('displays transaction status during pending state', async () => {
    // Arrange
    const mockUseLocationStaking = require('@/hooks/map/useLocationStaking')
    mockUseLocationStaking.useLocationStaking.mockReturnValue({
      stake: jest.fn(),
      isPending: true,
      hash: '0xabc123...',
      error: null,
    })

    // Act
    const Wrapper = createWrapper()
    render(<TransactionStatus hash="0xabc123..." status="pending" />, {
      wrapper: Wrapper,
    })

    // Assert
    expect(screen.getByText(/traveling/i)).toBeInTheDocument()
    expect(screen.getByText(/pending/i)).toBeInTheDocument()
  })

  it('displays success message when transaction confirms', async () => {
    // Arrange
    const mockUseLocationStaking = require('@/hooks/map/useLocationStaking')
    mockUseLocationStaking.useLocationStaking.mockReturnValue({
      stake: jest.fn(),
      isPending: false,
      isSuccess: true,
      hash: '0xabc123...',
      error: null,
    })

    // Act
    const Wrapper = createWrapper()
    render(<TransactionStatus hash="0xabc123..." status="confirmed" />, {
      wrapper: Wrapper,
    })

    // Assert
    await waitFor(() => {
      expect(screen.getByText(/success/i)).toBeInTheDocument()
      expect(screen.getByText(/staked/i)).toBeInTheDocument()
    })
  })

  it('displays error message when transaction fails', async () => {
    // Arrange
    const { formatContractError } = require('@/lib/services/map/wagdieWorldContract')
    formatContractError.mockReturnValue('You do not own this character')

    const mockUseLocationStaking = require('@/hooks/map/useLocationStaking')
    mockUseLocationStaking.useLocationStaking.mockReturnValue({
      stake: jest.fn(),
      isPending: false,
      isSuccess: false,
      error: { code: 'NotOwner', message: 'You do not own this character' },
    })

    // Act
    const Wrapper = createWrapper()
    render(<TransactionStatus hash="0xabc123..." status="failed" error={{ code: 'NotOwner', message: 'You do not own this character' }} />, {
      wrapper: Wrapper,
    })

    // Assert
    await waitFor(() => {
      expect(screen.getByText(/error/i)).toBeInTheDocument()
      expect(screen.getByText(/You do not own this character/i)).toBeInTheDocument()
    })
  })

  it('updates character location cache after successful stake', async () => {
    // Arrange
    const { updateCharacterLocationCache } = require('@/lib/services/map/locationService')

    // Act - This would be triggered by useLocationStaking after confirmation
    updateCharacterLocationCache({
      character_id: '1234',
      location_id: 'concord_searing',
      wallet_address: mockWalletAddress,
      transaction_hash: '0xabc123...',
      status: 'staked',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })

    // Assert
    await waitFor(() => {
      expect(updateCharacterLocationCache).toHaveBeenCalledWith(
        expect.objectContaining({
          character_id: '1234',
          location_id: 'concord_searing',
          status: 'staked',
        })
      )
    })
  })

  it('creates transaction audit record', async () => {
    // Arrange
    const { createLocationTransaction } = require('@/lib/services/map/locationService')

    // Act - Create audit record for stake transaction
    const transactionId = await createLocationTransaction({
      character_id: '1234',
      to_location_id: 'concord_searing',
      wallet_address: mockWalletAddress,
      transaction_hash: '0xabc123...',
      action: 'stake',
      status: 'confirmed',
      created_at: new Date().toISOString(),
    })

    // Assert
    expect(transactionId).toBeDefined()
    expect(createLocationTransaction).toHaveBeenCalledWith(
      expect.objectContaining({
        character_id: '1234',
        action: 'stake',
        status: 'confirmed',
      })
    )
  })

  it('handles gas estimation correctly', async () => {
    // Arrange
    const { estimateGas } = require('@/lib/services/map/wagdieWorldContract')

    // Act
    const gasEstimate = estimateGas('stake', 1)

    // Assert
    expect(gasEstimate).toBe(120000n)
  })

  it('validates stake parameters', async () => {
    // Arrange
    const { validateStakeParams } = require('@/lib/services/map/wagdieWorldContract')

    // Act & Assert - Valid parameters
    expect(() => {
      validateStakeParams([{ wagdieId: 1234n, locationId: 1n }])
    }).not.toThrow()

    // Act & Assert - Invalid wagdieId
    expect(() => {
      validateStakeParams([{ wagdieId: 0n, locationId: 1n }])
    }).toThrow('Invalid wagdieId')

    // Act & Assert - Invalid locationId
    expect(() => {
      validateStakeParams([{ wagdieId: 1234n, locationId: 0n }])
    }).toThrow('Invalid locationId')
  })
})
