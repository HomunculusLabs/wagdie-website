/**
 * Make raw contract calls to understand the actual return format
 */

import { createPublicClient, http, getAddress, encodeFunctionData, keccak256, toBytes } from 'viem'
import { mainnet } from 'viem/chains'

const WAGDIE_WORLD_ADDRESS = getAddress('0x616D4635ceCf94597690Cab0Fc159c3A8231C904')

async function main() {
  const rpcUrl = process.env.HTTP_RPC_URL || 'https://eth.llamarpc.com'

  const client = createPublicClient({
    chain: mainnet,
    transport: http(rpcUrl),
  })

  console.log('=== Raw Contract Call Investigation ===\n')

  // locationIdCur() - should return uint64
  console.log('1. Calling locationIdCur()...')
  const locationIdCurSelector = keccak256(toBytes('locationIdCur()')).slice(0, 10)
  console.log(`   Selector: ${locationIdCurSelector}`)

  try {
    const result = await client.call({
      to: WAGDIE_WORLD_ADDRESS,
      data: locationIdCurSelector as `0x${string}`,
    })
    console.log(`   Raw result: ${result.data}`)
    if (result.data) {
      const value = BigInt(result.data)
      console.log(`   Decoded uint64: ${value}`)
    }
  } catch (e: any) {
    console.log(`   Error: ${e.message}`)
  }

  // locationIdToInfo(uint64) - for location 1
  console.log('\n2. Calling locationIdToInfo(1)...')
  const locationIdToInfoSelector = keccak256(toBytes('locationIdToInfo(uint64)')).slice(0, 10)
  console.log(`   Selector: ${locationIdToInfoSelector}`)

  // Encode the argument (uint64 = 1)
  const encodedArg = '0000000000000000000000000000000000000000000000000000000000000001'
  const callData = `${locationIdToInfoSelector}${encodedArg}`

  try {
    const result = await client.call({
      to: WAGDIE_WORLD_ADDRESS,
      data: callData as `0x${string}`,
    })
    console.log(`   Raw result (${result.data?.length} chars):`)
    console.log(`   ${result.data}`)

    // Try to parse the result manually
    if (result.data && result.data.length > 2) {
      const data = result.data.slice(2) // Remove 0x
      console.log(`\n   Manual decoding attempt:`)
      console.log(`   Data length: ${data.length / 2} bytes`)

      // First 32 bytes might be offset to dynamic data
      const offset = parseInt(data.slice(0, 64), 16)
      console.log(`   First word (offset?): ${offset}`)
    }
  } catch (e: any) {
    console.log(`   Error: ${e.message}`)
  }

  // Let's also check wagdieIdToStakedLocation for wagdieId 3157
  console.log('\n3. Calling wagdieIdToStakedLocation(3157)...')
  const wagdieIdSelector = keccak256(toBytes('wagdieIdToStakedLocation(uint16)')).slice(0, 10)
  console.log(`   Selector: ${wagdieIdSelector}`)

  // Encode wagdieId = 3157 as uint16 (padded to 32 bytes)
  const wagdieIdArg = (3157).toString(16).padStart(64, '0')
  const callData2 = `${wagdieIdSelector}${wagdieIdArg}`

  try {
    const result = await client.call({
      to: WAGDIE_WORLD_ADDRESS,
      data: callData2 as `0x${string}`,
    })
    console.log(`   Raw result: ${result.data}`)
    if (result.data && result.data !== '0x') {
      const value = BigInt(result.data)
      console.log(`   Decoded uint64 (staked location): ${value}`)
    }
  } catch (e: any) {
    console.log(`   Error: ${e.message}`)
  }

  // Try isStakingEnabled
  console.log('\n4. Calling isStakingEnabled()...')
  const isStakingSelector = keccak256(toBytes('isStakingEnabled()')).slice(0, 10)

  try {
    const result = await client.call({
      to: WAGDIE_WORLD_ADDRESS,
      data: isStakingSelector as `0x${string}`,
    })
    console.log(`   Raw result: ${result.data}`)
    if (result.data) {
      const value = BigInt(result.data)
      console.log(`   Decoded bool: ${value === 1n}`)
    }
  } catch (e: any) {
    console.log(`   Error: ${e.message}`)
  }
}

main()
