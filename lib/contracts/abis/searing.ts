// SearWagdie Contract ABI
// Source: Original project typechain-types/SearWagdie.ts
// Contract Address (Mainnet): 0x5156A7F668E59119db23a264502F40407CDa076F

export const searingABI = [
  // Searing Functions
  {
    inputs: [
      {
        components: [
          { internalType: 'uint16', name: 'wagdieId', type: 'uint16' },
          { internalType: 'uint16', name: 'concordId', type: 'uint16' },
        ],
        internalType: 'struct SearWagdie.SearWagdieParams[]',
        name: 'params',
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
          { internalType: 'uint16', name: 'concordId', type: 'uint16' },
        ],
        internalType: 'struct SearWagdie.SearWagdieParams[]',
        name: 'params',
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
    outputs: [{ internalType: 'bool', name: '', type: 'bool' }],
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
    inputs: [{ internalType: 'uint16', name: 'concordId', type: 'uint16' }],
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
    inputs: [
      { internalType: 'uint16[]', name: 'wagdieIds', type: 'uint16[]' },
      { internalType: 'bool', name: 'blocked', type: 'bool' },
    ],
    name: 'setBlockedWAGDIE',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'uint16[]', name: 'concordIds', type: 'uint16[]' },
      { internalType: 'bool', name: 'blocked', type: 'bool' },
    ],
    name: 'setBlockedConcords',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
] as const
