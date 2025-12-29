/**
 * Check locations with corrected ABI
 */

import { createPublicClient, http, getAddress } from 'viem'
import { mainnet } from 'viem/chains'

const WAGDIE_WORLD_ADDRESS = getAddress('0x616D4635ceCf94597690Cab0Fc159c3A8231C904')

// Corrected ABI based on actual contract
const wagdieWorldABI = [
  {
    inputs: [{ internalType: 'uint64', name: 'locationId', type: 'uint64' }],
    name: 'locationIdToInfo',
    outputs: [
      {
        components: [
          { internalType: 'string', name: 'name', type: 'string' },
          { internalType: 'address', name: 'locationOwner', type: 'address' },
          { internalType: 'int32', name: 'xCoordinate', type: 'int32' },
          { internalType: 'int32', name: 'yCoordinate', type: 'int32' },
          { internalType: 'bool', name: 'isLocationActive', type: 'bool' },
          { internalType: 'bool', name: 'areNftsLocked', type: 'bool' },
        ],
        internalType: 'struct WagdieWorld.LocationInfo',
        name: '',
        type: 'tuple',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'locationIdCur',
    outputs: [{ internalType: 'uint64', name: '', type: 'uint64' }],
    stateMutability: 'view',
    type: 'function',
  },
] as const

async function main() {
  const rpcUrl = process.env.HTTP_RPC_URL || 'https://eth.llamarpc.com'

  console.log('=== Checking On-Chain Locations (Corrected ABI) ===\n')

  const client = createPublicClient({
    chain: mainnet,
    transport: http(rpcUrl),
  })

  // First check the current location counter
  try {
    const locationIdCur = await client.readContract({
      address: WAGDIE_WORLD_ADDRESS,
      abi: wagdieWorldABI,
      functionName: 'locationIdCur',
    })
    console.log(`Current location counter: ${locationIdCur}`)
  } catch (e: any) {
    console.log(`Could not get location counter: ${e.shortMessage || e.message}`)
  }

  // Check locations 1-30
  console.log('\nChecking locations 1-30...\n')
  for (let locationId = 1; locationId <= 30; locationId++) {
    try {
      const locationInfo = await client.readContract({
        address: WAGDIE_WORLD_ADDRESS,
        abi: wagdieWorldABI,
        functionName: 'locationIdToInfo',
        args: [BigInt(locationId)],
      })

      if (locationInfo.isLocationActive) {
        console.log(`✓ Location ${locationId}: "${locationInfo.name}"`)
        console.log(`     Owner: ${locationInfo.locationOwner.slice(0, 10)}...`)
        console.log(`     Coords: (${locationInfo.xCoordinate}, ${locationInfo.yCoordinate})`)
        console.log(`     Locked: ${locationInfo.areNftsLocked}`)
      } else if (locationInfo.name) {
        console.log(`✗ Location ${locationId}: "${locationInfo.name}" (INACTIVE)`)
      } else {
        console.log(`- Location ${locationId}: (empty/not registered)`)
      }
    } catch (e: any) {
      console.log(`✗ Location ${locationId}: Error - ${e.shortMessage || 'decode failed'}`)
    }
  }
}

main()
