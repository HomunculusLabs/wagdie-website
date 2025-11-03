// Jest setup file
// This file is run before each test file

import '@testing-library/jest-dom'

// Mock next/navigation
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

// Mock wagmi
jest.mock('wagmi', () => ({
  useAccount() {
    return {
      address: undefined,
      isConnected: false,
    }
  },
  useReadContract: jest.fn(),
  useWriteContract: jest.fn(),
  useWaitForTransactionReceipt: jest.fn(),
}))

// Mock wagdie-world contract (optional - tests don't require it)
// jest.mock('@/lib/services/map/wagdieWorldContract')

// Mock other map-related hooks
jest.mock('@/hooks/map/useLocations', () => ({
  useLocations: () => ({
    data: [
      {
        id: '1',
        name: 'Test Location',
        description: 'A test location',
        metadata: {
          special_properties: ['Test Property'],
        },
      },
    ],
    isLoading: false,
  }),
}))

jest.mock('@/hooks/map/useLocationStaking', () => ({
  useLocationStaking: () => ({
    stake: jest.fn(),
    move: jest.fn(),
    isPending: false,
    isSuccess: false,
    error: null,
    hash: null,
  }),
}))

jest.mock('@/hooks/map/useCharacterLocation', () => ({
  useCharacterLocation: () => ({
    data: [],
    isLoading: false,
    error: null,
  }),
}))
