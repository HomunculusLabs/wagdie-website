/**
 * Check wagdieIdToStakedLocation for various token IDs
 */

import { createPublicClient, http, getAddress, keccak256, toBytes } from 'viem'
import { mainnet } from 'viem/chains'

const WAGDIE_WORLD_ADDRESS = getAddress('0x616D4635ceCf94597690Cab0Fc159c3A8231C904')

async function checkWagdieLocation(client: any, wagdieId: number): Promise<string> {
  const selector = keccak256(toBytes('wagdieIdToStakedLocation(uint16)')).slice(0, 10)
  const arg = wagdieId.toString(16).padStart(64, '0')
  const callData = `${selector}${arg}` as `0x${string}`

  try {
    const result = await client.call({
      to: WAGDIE_WORLD_ADDRESS,
      data: callData,
    })

    if (result.data && result.data !== '0x') {
      const locationId = BigInt(result.data)
      return locationId === 0n ? 'Not staked (0)' : `Staked at location ${locationId}`
    }
    return 'Empty response'
  } catch (e: any) {
    return `REVERTS`
  }
}

async function main() {
  const rpcUrl = process.env.HTTP_RPC_URL || 'https://eth.llamarpc.com'

  const client = createPublicClient({
    chain: mainnet,
    transport: http(rpcUrl),
  })

  console.log('=== Checking wagdieIdToStakedLocation for Various IDs ===\n')

  // Check a range of WAGDIE IDs
  const idsToCheck = [1, 10, 100, 1000, 2000, 3000, 3157, 4000, 5000, 6000, 6665]

  for (const id of idsToCheck) {
    const result = await checkWagdieLocation(client, id)
    console.log(`WAGDIE #${id}: ${result}`)
  }

  // Now let's also check a few that are definitely staked (by looking at transfers to WagdieWorld)
  console.log('\n--- Finding actually staked WAGDIEs ---')

  // Let's check the contract's event logs for recent stakes
  const WAGDIE_ADDRESS = getAddress('0x659a4bdaaacc62d2bd9cb18225d9c89b5b697a5a')

  // Check ownership of WAGDIE #3157
  const ownerOfSelector = keccak256(toBytes('ownerOf(uint256)')).slice(0, 10)
  const arg = (3157).toString(16).padStart(64, '0')

  try {
    const result = await client.call({
      to: WAGDIE_ADDRESS,
      data: `${ownerOfSelector}${arg}` as `0x${string}`,
    })
    console.log(`\nWAGDIE #3157 owner: 0x${result.data?.slice(26)}`)
    console.log(`(If owned by WagdieWorld ${WAGDIE_WORLD_ADDRESS}, it's staked)`)
  } catch (e: any) {
    console.log(`Error getting owner: ${e.message}`)
  }
}

main()
