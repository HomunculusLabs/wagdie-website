/**
 * Find what locations actually exist on-chain in WagdieWorld contract
 */

import { createPublicClient, http, getAddress, parseAbiItem } from 'viem'
import { mainnet } from 'viem/chains'

const WAGDIE_WORLD_ADDRESS = getAddress('0x616D4635ceCf94597690Cab0Fc159c3A8231C904')

const locationAddedEvent = parseAbiItem('event LocationAdded(uint64 indexed locationId, string name, address owner)')

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

  const client = createPublicClient({
    chain: mainnet,
    transport: http(rpcUrl),
  })

  console.log('=== Finding On-Chain Locations ===\n')

  // Method 1: Check events
  console.log('1. Searching for LocationAdded events...')
  try {
    const logs = await client.getLogs({
      address: WAGDIE_WORLD_ADDRESS,
      event: locationAddedEvent,
      fromBlock: 15000000n,
      toBlock: 'latest',
    })

    if (logs.length > 0) {
      console.log(`   Found ${logs.length} LocationAdded events:`)
      for (const log of logs) {
        console.log(`   - ID ${log.args.locationId}: "${log.args.name}" (owner: ${log.args.owner?.slice(0,10)}...)`)
      }
    } else {
      console.log('   No events found (event may have different signature)')
    }
  } catch (e: any) {
    console.log(`   Event search failed: ${e.shortMessage || e.message}`)
  }

  // Method 2: Brute force check IDs
  console.log('\n2. Checking various location IDs directly...')

  const foundLocations: { id: bigint; name: string; owner: string }[] = []

  // Check a wide range of IDs
  const rangesToCheck = [
    { start: 0, end: 50 },
    { start: 100, end: 110 },
    { start: 1000, end: 1010 },
  ]

  for (const range of rangesToCheck) {
    for (let id = range.start; id <= range.end; id++) {
      try {
        const info = await client.readContract({
          address: WAGDIE_WORLD_ADDRESS,
          abi: wagdieWorldABI,
          functionName: 'locationIdToInfo',
          args: [BigInt(id)],
        })

        if (info.exists) {
          foundLocations.push({
            id: BigInt(id),
            name: info.name,
            owner: info.owner
          })
          console.log(`   ✓ Location ${id}: "${info.name}" (owner: ${info.owner.slice(0,10)}..., locked: ${info.nftsLocked})`)
        }
      } catch {
        // Decode error means location doesn't exist or has no data
      }
    }
  }

  console.log(`\n=== SUMMARY ===`)
  if (foundLocations.length > 0) {
    console.log(`Found ${foundLocations.length} valid on-chain locations:`)
    for (const loc of foundLocations) {
      console.log(`  - ID ${loc.id}: "${loc.name}"`)
    }
  } else {
    console.log('No valid on-chain locations found in the checked ranges.')
    console.log('\nThis means either:')
    console.log('1. No locations have been registered via addLocation() on WagdieWorld')
    console.log('2. Location IDs use a different numbering scheme')
    console.log('3. The contract stores location data differently')
  }
}

main()
