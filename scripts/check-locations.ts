/**
 * Check which location IDs exist on-chain
 */

import { createPublicClient, http, getAddress } from 'viem'
import { mainnet } from 'viem/chains'

const WAGDIE_WORLD_ADDRESS = getAddress('0x616D4635ceCf94597690Cab0Fc159c3A8231C904')

const wagdieWorldABI = [
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
] as const

async function main() {
  const rpcUrl = process.env.HTTP_RPC_URL || 'https://eth.llamarpc.com'

  console.log('=== Checking On-Chain Locations ===\n')

  const client = createPublicClient({
    chain: mainnet,
    transport: http(rpcUrl),
  })

  // Check locations 1-20 to see which exist
  for (let locationId = 1; locationId <= 20; locationId++) {
    try {
      const locationInfo = await client.readContract({
        address: WAGDIE_WORLD_ADDRESS,
        abi: wagdieWorldABI,
        functionName: 'locationIdToInfo',
        args: [BigInt(locationId)],
      })

      if (locationInfo.exists) {
        console.log(`Location ${locationId}: ✓ EXISTS - "${locationInfo.name}" (owner: ${locationInfo.owner.slice(0,10)}...)`)
      } else {
        console.log(`Location ${locationId}: ✗ Does not exist (exists=false)`)
      }
    } catch (e: any) {
      // Decode error means the location likely doesn't exist or has empty data
      console.log(`Location ${locationId}: ✗ Error reading (likely doesn't exist)`)
    }
  }

  console.log('\n=== END ===')
}

main()
