/**
 * Decode a specific staking transaction to see the location ID format
 */

import { createPublicClient, http, getAddress, decodeFunctionData } from 'viem'
import { mainnet } from 'viem/chains'
import { wagdieWorldABI } from '../lib/contracts/abis/wagdie-world'

async function main() {
  const rpcUrl = process.env.HTTP_RPC_URL || 'https://eth.llamarpc.com'

  const client = createPublicClient({
    chain: mainnet,
    transport: http(rpcUrl),
  })

  // Let's get a recent transaction to the WagdieWorld contract
  const WAGDIE_WORLD = getAddress('0x616D4635ceCf94597690Cab0Fc159c3A8231C904')

  // Get the last few blocks and check for WagdieWorld transactions
  const latestBlock = await client.getBlockNumber()
  console.log(`Latest block: ${latestBlock}`)

  // Check last 1000 blocks
  const startBlock = latestBlock - 1000n
  console.log(`Checking blocks ${startBlock} to ${latestBlock}...`)

  for (let blockNum = latestBlock; blockNum > startBlock; blockNum -= 100n) {
    try {
      const block = await client.getBlock({ blockNumber: blockNum, includeTransactions: true })

      for (const tx of block.transactions) {
        if (typeof tx !== 'string' && tx.to?.toLowerCase() === WAGDIE_WORLD.toLowerCase()) {
          console.log(`\n=== Found tx in block ${blockNum} ===`)
          console.log(`Hash: ${tx.hash}`)
          console.log(`From: ${tx.from}`)

          try {
            const decoded = decodeFunctionData({ abi: wagdieWorldABI, data: tx.input })
            console.log(`Function: ${decoded.functionName}`)

            if (decoded.args) {
              console.log(`Args:`)
              const args = decoded.args as unknown[]
              for (let i = 0; i < args.length; i++) {
                const arg = args[i]
                if (Array.isArray(arg)) {
                  console.log(`  [${i}]: Array of ${arg.length} items:`)
                  for (const item of arg) {
                    if (typeof item === 'object' && item !== null) {
                      const obj = item as Record<string, unknown>
                      console.log(`    - locationId: ${obj.locationId}, wagdieId: ${obj.wagdieId}`)
                    }
                  }
                } else {
                  console.log(`  [${i}]: ${JSON.stringify(arg, (k, v) => typeof v === 'bigint' ? v.toString() : v)}`)
                }
              }
            }

            // If it's a stakeWagdies call, we found what we need
            if (decoded.functionName === 'stakeWagdies' || decoded.functionName === 'unstakeWagdies') {
              process.exit(0)
            }
          } catch (e) {
            console.log(`Could not decode input data`)
          }
        }
      }
    } catch (e) {
      // Skip errors
    }
  }

  console.log('\nNo staking transactions found in recent blocks')
}

main()
