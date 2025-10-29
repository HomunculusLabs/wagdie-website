// Spread Contract ABI (Infection Mechanics)
// Source: Original project src/features/abi/spreadContractABI.json
// Contract Address (Mainnet): 0xaCA80514986768F88F7d8E644546AB85383ddE7e

export const spreadABI = [
  // Infection Functions
  {
    inputs: [{ internalType: 'uint256', name: 'tokenId', type: 'uint256' }],
    name: 'infectWagdie',
    outputs: [],
    stateMutability: 'payable',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'uint256', name: 'quantity', type: 'uint256' }],
    name: 'spreadInfections',
    outputs: [],
    stateMutability: 'payable',
    type: 'function',
  },
  // View Functions
  {
    inputs: [],
    name: 'infectionPrice',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'concordAddress',
    outputs: [{ internalType: 'address', name: '', type: 'address' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'WAGDIE',
    outputs: [{ internalType: 'address', name: '', type: 'address' }],
    stateMutability: 'view',
    type: 'function',
  },
  // Events
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: 'address', name: 'sender', type: 'address' },
      { indexed: true, internalType: 'uint256', name: 'infectedToken', type: 'uint256' },
      { indexed: false, internalType: 'uint256', name: 'time', type: 'uint256' },
    ],
    name: 'InfectionSpread',
    type: 'event',
  },
] as const
