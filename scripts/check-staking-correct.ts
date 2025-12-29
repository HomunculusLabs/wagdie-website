/**
 * Check staking with correct ABI (wagdieIdToInfo)
 */

import { createPublicClient, http, getAddress, keccak256, toBytes, decodeAbiParameters } from 'viem'
import { mainnet } from 'viem/chains'

const WAGDIE_WORLD_ADDRESS = getAddress('0x616D4635ceCf94597690Cab0Fc159c3A8231C904')

// Correct ABI
const wagdieWorldABI = [
  {
    inputs: [{ internalType: 'uint16', name: '_wagdieId', type: 'uint16' }],
    name: 'wagdieIdToInfo',
    outputs: [
      {
        components: [
          { internalType: 'uint64', name: 'locationIdCur', type: 'uint64' },
          { internalType: 'address', name: 'owner', type: 'address' },
          { internalType: 'uint32', name: 'emptySpace', type: 'uint32' },
        ],
        internalType: 'struct WagdieWorld.WagdieInfo',
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

  console.log('=== Checking Staking with Correct ABI ===\n')

  const idsToCheck = [1, 100, 1000, 3157, 6000]

  for (const wagdieId of idsToCheck) {
    try {
      const result = await client.readContract({
        address: WAGDIE_WORLD_ADDRESS,
        abi: wagdieWorldABI,
        functionName: 'wagdieIdToInfo',
        args: [wagdieId],
      })

      console.log(`WAGDIE #${wagdieId}:`)
      console.log(`  Location: ${result.locationIdCur} ${result.locationIdCur === 0n ? '(NOT STAKED)' : '(STAKED)'}`)
      console.log(`  Owner: ${result.owner === '0x0000000000000000000000000000000000000000' ? 'None' : result.owner}`)
    } catch (e: any) {
      console.log(`WAGDIE #${wagdieId}: Error - ${e.shortMessage || e.message}`)
    }
  }

  // Also let's verify by checking a raw call
  console.log('\n--- Raw call to wagdieIdToInfo(3157) ---')
  const selector = keccak256(toBytes('wagdieIdToInfo(uint16)')).slice(0, 10)
  const arg = (3157).toString(16).padStart(64, '0')

  try {
    const result = await client.call({
      to: WAGDIE_WORLD_ADDRESS,
      data: `${selector}${arg}` as `0x${string}`,
    })
    console.log(`Raw result: ${result.data}`)

    if (result.data && result.data.length > 2) {
      // Try to decode manually
      // Format: uint64 locationIdCur | address owner | uint32 emptySpace
      // In EVM: these are packed into 32-byte slots
      const data = result.data.slice(2)
      console.log(`Data length: ${data.length / 2} bytes`)

      // First 32 bytes: uint64 (padded)
      const locationId = BigInt('0x' + data.slice(0, 64))
      console.log(`Decoded locationIdCur: ${locationId}`)

      // Next 32 bytes: address (20 bytes, right-padded in a 32 byte slot)
      const ownerHex = data.slice(64, 128)
      const owner = '0x' + ownerHex.slice(24, 64)
      console.log(`Decoded owner: ${owner}`)
    }
  } catch (e: any) {
    console.log(`Error: ${e.message}`)
  }
}

main()
