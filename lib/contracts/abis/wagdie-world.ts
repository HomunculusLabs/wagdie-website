// WagdieWorld Staking Contract ABI
// Source: Original project typechain-types/WagdieWorld.ts
// Contract Address (Mainnet): 0x616D4635ceCf94597690Cab0Fc159c3A8231C904

export const wagdieWorldABI = [
  // Staking Functions
  {
    inputs: [
      {
        components: [
          { internalType: 'uint64', name: 'locationId', type: 'uint64' },
          { internalType: 'uint16', name: 'wagdieId', type: 'uint16' },
        ],
        internalType: 'struct WagdieWorld.StakeWagdieParams[]',
        name: 'params',
        type: 'tuple[]',
      },
    ],
    name: 'stakeWagdies',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      {
        components: [{ internalType: 'uint16', name: 'wagdieId', type: 'uint16' }],
        internalType: 'struct WagdieWorld.UnstakeWagdieParams[]',
        name: 'params',
        type: 'tuple[]',
      },
    ],
    name: 'unstakeWagdies',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      {
        components: [
          { internalType: 'uint64', name: 'locationId', type: 'uint64' },
          { internalType: 'uint16', name: 'wagdieId', type: 'uint16' },
        ],
        internalType: 'struct WagdieWorld.ChangeWagdieLocationParams[]',
        name: 'params',
        type: 'tuple[]',
      },
    ],
    name: 'changeWagdieLocations',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  // Status Functions
  {
    inputs: [],
    name: 'isStakingEnabled',
    outputs: [{ internalType: 'bool', name: '', type: 'bool' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'uint16', name: 'wagdieId', type: 'uint16' }],
    name: 'wagdieIdToStakedLocation',
    outputs: [{ internalType: 'uint64', name: '', type: 'uint64' }],
    stateMutability: 'view',
    type: 'function',
  },
  // Location Management Functions
  {
    inputs: [
      {
        components: [
          { internalType: 'string', name: 'name', type: 'string' },
          { internalType: 'address', name: 'owner', type: 'address' },
          { internalType: 'bool', name: 'nftsLocked', type: 'bool' },
        ],
        internalType: 'struct WagdieWorld.AddLocationParams',
        name: 'params',
        type: 'tuple',
      },
    ],
    name: 'addLocation',
    outputs: [{ internalType: 'uint64', name: '', type: 'uint64' }],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'uint64', name: 'locationId', type: 'uint64' }],
    name: 'removeLocation',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'uint64', name: 'locationId', type: 'uint64' }],
    name: 'locationIdToInfo',
    outputs: [
      {
        components: [
          { internalType: 'string', name: 'name', type: 'string' },
          { internalType: 'address', name: 'owner', type: 'address' },
          { internalType: 'bool', name: 'nftsLocked', type: 'bool' },
          { internalType: 'bool', name: 'exists', type: 'bool' },
        ],
        internalType: 'struct WagdieWorld.LocationInfo',
        name: '',
        type: 'tuple',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  // Burn Functions
  {
    inputs: [
      {
        components: [
          { internalType: 'uint16', name: 'wagdieId', type: 'uint16' },
          { internalType: 'uint64', name: 'locationId', type: 'uint64' },
        ],
        internalType: 'struct WagdieWorld.BurnWagdieParams',
        name: 'params',
        type: 'tuple',
      },
    ],
    name: 'burnWagdie',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  // Concord Functions
  {
    inputs: [
      {
        components: [
          { internalType: 'uint64', name: 'locationId', type: 'uint64' },
          { internalType: 'uint256', name: 'amount', type: 'uint256' },
        ],
        internalType: 'struct WagdieWorld.MintConcordsToLocationParams',
        name: 'params',
        type: 'tuple',
      },
    ],
    name: 'mintConcordsToLocation',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  // ERC721 Receiver
  {
    inputs: [
      { internalType: 'address', name: '', type: 'address' },
      { internalType: 'address', name: '', type: 'address' },
      { internalType: 'uint256', name: '', type: 'uint256' },
      { internalType: 'bytes', name: '', type: 'bytes' },
    ],
    name: 'onERC721Received',
    outputs: [{ internalType: 'bytes4', name: '', type: 'bytes4' }],
    stateMutability: 'nonpayable',
    type: 'function',
  },
] as const
