/**
 * List all on-chain locations with their IDs and names
 */

import { createPublicClient, http, getAddress, keccak256, toBytes } from 'viem'
import { mainnet } from 'viem/chains'

const WAGDIE_WORLD_ADDRESS = getAddress('0x616D4635ceCf94597690Cab0Fc159c3A8231C904')

// Correct ABI for locationIdToInfo
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

async function getLocationRaw(client: any, locationId: number): Promise<{ name: string; active: boolean } | null> {
  const selector = keccak256(toBytes('locationIdToInfo(uint64)')).slice(0, 10)
  const arg = locationId.toString(16).padStart(64, '0')

  try {
    const result = await client.call({
      to: WAGDIE_WORLD_ADDRESS,
      data: `${selector}${arg}` as `0x${string}`,
    })

    if (!result.data || result.data === '0x') return null

    const data = result.data.slice(2)
    if (data.length < 64 * 6) return null // Need at least 6 words

    // Parse the struct:
    // Word 0: offset to name (dynamic string)
    // Word 1: locationOwner (address)
    // Word 2: xCoordinate (int32, padded)
    // Word 3: yCoordinate (int32, padded)
    // Word 4: isLocationActive (bool)
    // Word 5: areNftsLocked (bool)
    // Then: string length + string data

    const nameOffset = parseInt(data.slice(0, 64), 16)
    const isActive = parseInt(data.slice(256, 320), 16) === 1

    // Read the string at the offset
    const stringLengthStart = nameOffset * 2
    const stringLength = parseInt(data.slice(stringLengthStart, stringLengthStart + 64), 16)

    if (stringLength === 0 || stringLength > 100) return null

    const stringDataStart = stringLengthStart + 64
    const stringHex = data.slice(stringDataStart, stringDataStart + stringLength * 2)
    const name = Buffer.from(stringHex, 'hex').toString('utf8')

    return { name, active: isActive }
  } catch {
    return null
  }
}

async function main() {
  const rpcUrl = process.env.HTTP_RPC_URL || 'https://eth.llamarpc.com'

  const client = createPublicClient({
    chain: mainnet,
    transport: http(rpcUrl),
  })

  console.log('=== On-Chain Locations (All 48) ===\n')

  const locations: { id: number; name: string; active: boolean }[] = []

  for (let id = 1; id <= 48; id++) {
    const loc = await getLocationRaw(client, id)
    if (loc && loc.name) {
      locations.push({ id, ...loc })
      const status = loc.active ? '✓' : '✗'
      console.log(`${status} ID ${id.toString().padStart(2)}: "${loc.name}"`)
    } else {
      console.log(`- ID ${id.toString().padStart(2)}: (empty or error)`)
    }
  }

  console.log('\n=== Summary ===')
  console.log(`Total locations found: ${locations.length}`)
  console.log(`Active locations: ${locations.filter((l) => l.active).length}`)

  // Check if DB location 13 ("Banshee's Hut") exists on-chain
  console.log('\n=== Looking for "Banshee\'s Hut" ===')
  const bansheeMatch = locations.find((l) => l.name.toLowerCase().includes('banshee'))
  if (bansheeMatch) {
    console.log(`Found! On-chain ID: ${bansheeMatch.id}, Name: "${bansheeMatch.name}"`)
  } else {
    console.log('Not found on-chain!')
  }
}

main()
