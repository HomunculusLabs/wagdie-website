/**
 * Check recent staking transactions to see what location IDs are being used
 */

import { createPublicClient, http, getAddress, decodeAbiParameters, decodeFunctionData } from 'viem'
import { mainnet } from 'viem/chains'
import { wagdieWorldABI } from '../lib/contracts/abis/wagdie-world'

const WAGDIE_WORLD_ADDRESS = getAddress('0x616D4635ceCf94597690Cab0Fc159c3A8231C904')

async function main() {
  const rpcUrl = process.env.HTTP_RPC_URL || 'https://eth.llamarpc.com'

  const client = createPublicClient({
    chain: mainnet,
    transport: http(rpcUrl),
  })

  console.log('=== Checking Recent Staking Transactions ===\n')

  // Get the latest block
  const latestBlock = await client.getBlockNumber()
  console.log(`Latest block: ${latestBlock}`)

  // Check recent blocks for staking transactions
  const fromBlock = latestBlock - 100000n // ~2 weeks of blocks

  console.log(`\nSearching from block ${fromBlock} to ${latestBlock}...`)

  // Get logs for any staking-related function
  // We'll look for Transfer events TO the WagdieWorld contract (indicates staking)
  const transferEvent = {
    anonymous: false,
    inputs: [
      { indexed: true, name: 'from', type: 'address' },
      { indexed: true, name: 'to', type: 'address' },
      { indexed: true, name: 'tokenId', type: 'uint256' },
    ],
    name: 'Transfer',
    type: 'event',
  } as const

  const WAGDIE_ADDRESS = getAddress('0x659a4bdaaacc62d2bd9cb18225d9c89b5b697a5a')

  try {
    console.log('\nLooking for WAGDIE transfers TO WagdieWorld (staking)...')
    const logs = await client.getLogs({
      address: WAGDIE_ADDRESS,
      event: transferEvent,
      args: {
        to: WAGDIE_WORLD_ADDRESS,
      },
      fromBlock,
      toBlock: 'latest',
    })

    console.log(`\nFound ${logs.length} staking transfers:`)

    // Get the transaction details for each
    const uniqueTxs = new Set(logs.map(l => l.transactionHash))
    console.log(`Unique transactions: ${uniqueTxs.size}`)

    let count = 0
    for (const txHash of uniqueTxs) {
      if (count >= 5) break // Check first 5

      const tx = await client.getTransaction({ hash: txHash })

      console.log(`\n--- Transaction ${txHash.slice(0, 10)}... ---`)
      console.log(`  Block: ${tx.blockNumber}`)
      console.log(`  From: ${tx.from}`)

      try {
        const decoded = decodeFunctionData({
          abi: wagdieWorldABI,
          data: tx.input,
        })

        console.log(`  Function: ${decoded.functionName}`)
        console.log(`  Args: ${JSON.stringify(decoded.args, (k, v) => typeof v === 'bigint' ? v.toString() : v, 2)}`)
      } catch (e) {
        console.log(`  Could not decode: ${tx.input.slice(0, 10)}...`)
      }

      count++
    }

  } catch (e: any) {
    console.log(`Error: ${e.shortMessage || e.message}`)
  }
}

main()
