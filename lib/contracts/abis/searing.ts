// SearWagdie Contract ABI
// Source: web/src/typechain-types/SearWagdie.ts and factories/SearWagdie__factory.ts
// Contract Address (Mainnet): 0x5156A7F668E59119db23a264502F40407CDa076F

export const searingABI = [
  // Events
  {
    anonymous: false,
    inputs: [
      { indexed: false, internalType: 'uint16', name: 'wagdieId', type: 'uint16' },
      { indexed: false, internalType: 'uint16', name: 'tokenId', type: 'uint16' },
      { indexed: false, internalType: 'address', name: 'owner', type: 'address' },
    ],
    name: 'BeastSeared',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      { indexed: false, internalType: 'uint16', name: 'wagdieId', type: 'uint16' },
      { indexed: false, internalType: 'uint16', name: 'tokenId', type: 'uint16' },
      { indexed: false, internalType: 'address', name: 'owner', type: 'address' },
    ],
    name: 'ConcordSeared',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: 'address', name: 'previousOwner', type: 'address' },
      { indexed: true, internalType: 'address', name: 'newOwner', type: 'address' },
    ],
    name: 'OwnershipTransferred',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [{ indexed: false, internalType: 'bool', name: 'isSearingEnabled', type: 'bool' }],
    name: 'SearingEnabledChanged',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [{ indexed: false, internalType: 'bool', name: 'isTamingEnabled', type: 'bool' }],
    name: 'TamingEnabledChanged',
    type: 'event',
  },

  // Address getters
  {
    inputs: [],
    name: 'beastAddress',
    outputs: [{ internalType: 'address', name: '', type: 'address' }],
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
    name: 'wagdieAddress',
    outputs: [{ internalType: 'address', name: '', type: 'address' }],
    stateMutability: 'view',
    type: 'function',
  },

  // Searing Functions
  {
    inputs: [
      {
        components: [
          { internalType: 'uint16', name: 'wagdieId', type: 'uint16' },
          { internalType: 'uint16', name: 'tokenId', type: 'uint16' },
        ],
        internalType: 'struct SearWagdieParams[]',
        name: '_searParams',
        type: 'tuple[]',
      },
    ],
    name: 'searConcords',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      {
        components: [
          { internalType: 'uint16', name: 'wagdieId', type: 'uint16' },
          { internalType: 'uint16', name: 'tokenId', type: 'uint16' },
        ],
        internalType: 'struct SearWagdieParams[]',
        name: '_searParams',
        type: 'tuple[]',
      },
    ],
    name: 'tameBeasts',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },

  // Status Check Functions
  {
    inputs: [],
    name: 'isSearingEnabled',
    outputs: [{ internalType: 'bool', name: '', type: 'bool' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'isTamingEnabled',
    outputs: [{ internalType: 'bool', name: '', type: 'bool' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'uint16', name: 'wagdieId', type: 'uint16' }],
    name: 'isWagdieSeared',
    outputs: [{ internalType: 'uint16', name: '', type: 'uint16' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'uint16', name: 'wagdieId', type: 'uint16' }],
    name: 'isWagdieBlocked',
    outputs: [{ internalType: 'bool', name: '', type: 'bool' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'uint16', name: 'wagdieId', type: 'uint16' }],
    name: 'isConcordBlocked',
    outputs: [{ internalType: 'bool', name: '', type: 'bool' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'maxBeastId',
    outputs: [{ internalType: 'uint16', name: '', type: 'uint16' }],
    stateMutability: 'view',
    type: 'function',
  },

  // Admin Functions (for reference, not used in normal operations)
  {
    inputs: [{ internalType: 'uint16[]', name: '_tokens', type: 'uint16[]' }],
    name: 'setBlockedWAGDIE',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'uint16[]', name: '_tokens', type: 'uint16[]' }],
    name: 'setBlockedConcords',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'uint16', name: '_maxBeastId', type: 'uint16' }],
    name: 'setMaxBeastId',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'address', name: '_beastAddress', type: 'address' }],
    name: 'updateBeastAddress',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'bool', name: '_isSearingEnabled', type: 'bool' }],
    name: 'updateIsSearingEnabled',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'bool', name: '_isTamingEnabled', type: 'bool' }],
    name: 'updateIsTamingEnabled',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [],
    name: 'renounceOwnership',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'address', name: 'newOwner', type: 'address' }],
    name: 'transferOwnership',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
] as const
