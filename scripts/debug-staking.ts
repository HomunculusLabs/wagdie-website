/**
 * Debug script to investigate staking revert
 * Usage: npx tsx scripts/debug-staking.ts
 */

import { createPublicClient, http, getAddress } from 'viem'
import { mainnet } from 'viem/chains'

// Contract addresses (properly checksummed)
const WAGDIE_ADDRESS = getAddress('0x659a4bdaaacc62d2bd9cb18225d9c89b5b697a5a')
const WAGDIE_WORLD_ADDRESS = getAddress('0x616D4635ceCf94597690Cab0Fc159c3A8231C904')

// ABIs
const wagdieWorldABI = [
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

const wagdieABI = [
  {
    inputs: [{ internalType: 'uint256', name: 'tokenId', type: 'uint256' }],
    name: 'ownerOf',
    outputs: [{ internalType: 'address', name: '', type: 'address' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'address', name: 'owner', type: 'address' },
      { internalType: 'address', name: 'operator', type: 'address' },
    ],
    name: 'isApprovedForAll',
    outputs: [{ internalType: 'bool', name: '', type: 'bool' }],
    stateMutability: 'view',
    type: 'function',
  },
] as const

async function main() {
  const wagdieId = 3157
  const locationId = 13n

  // Use Alchemy RPC from env or public RPC
  const rpcUrl = process.env.HTTP_RPC_URL || 'https://eth.llamarpc.com'

  console.log('=== WAGDIE Staking Debug ===\n')
  console.log(`WAGDIE ID: ${wagdieId}`)
  console.log(`Location ID: ${locationId}`)
  console.log(`RPC: ${rpcUrl}\n`)

  const client = createPublicClient({
    chain: mainnet,
    transport: http(rpcUrl),
  })

  try {
    // 1. Check if staking is enabled
    console.log('1. Checking if staking is enabled...')
    const stakingEnabled = await client.readContract({
      address: WAGDIE_WORLD_ADDRESS,
      abi: wagdieWorldABI,
      functionName: 'isStakingEnabled',
    })
    console.log(`   Staking enabled: ${stakingEnabled}`)
    if (!stakingEnabled) {
      console.log('   ⚠️  STAKING IS DISABLED - This would cause a revert!')
    }

    // 2. Check current staked location of WAGDIE #3157
    console.log('\n2. Checking current staked location of WAGDIE #3157...')
    const currentLocation = await client.readContract({
      address: WAGDIE_WORLD_ADDRESS,
      abi: wagdieWorldABI,
      functionName: 'wagdieIdToStakedLocation',
      args: [wagdieId],
    })
    console.log(`   Current staked location: ${currentLocation}`)
    if (currentLocation !== 0n) {
      console.log(`   ⚠️  WAGDIE #${wagdieId} is ALREADY STAKED at location ${currentLocation}!`)
      console.log('   You must UNSTAKE first before staking to a new location.')
    } else {
      console.log(`   ✓ WAGDIE #${wagdieId} is NOT currently staked (location 0)`)
    }

    // 3. Check if location 13 exists on-chain
    console.log('\n3. Checking if location 13 exists on-chain...')
    const locationInfo = await client.readContract({
      address: WAGDIE_WORLD_ADDRESS,
      abi: wagdieWorldABI,
      functionName: 'locationIdToInfo',
      args: [locationId],
    })
    console.log(`   Location info:`)
    console.log(`     - Name: "${locationInfo.name}"`)
    console.log(`     - Owner: ${locationInfo.owner}`)
    console.log(`     - NFTs Locked: ${locationInfo.nftsLocked}`)
    console.log(`     - Exists: ${locationInfo.exists}`)
    if (!locationInfo.exists) {
      console.log(`   ⚠️  LOCATION ${locationId} DOES NOT EXIST ON-CHAIN!`)
      console.log('   This would cause a revert!')
    } else if (locationInfo.nftsLocked) {
      console.log(`   ⚠️  LOCATION ${locationId} HAS NFTs LOCKED!`)
      console.log('   Characters cannot be unstaked from this location.')
    }

    // 4. Check who owns WAGDIE #3157
    console.log('\n4. Checking owner of WAGDIE #3157...')
    const owner = await client.readContract({
      address: WAGDIE_ADDRESS,
      abi: wagdieABI,
      functionName: 'ownerOf',
      args: [BigInt(wagdieId)],
    })
    console.log(`   Owner: ${owner}`)

    // If character is staked, owner should be the WagdieWorld contract
    if (owner.toLowerCase() === WAGDIE_WORLD_ADDRESS.toLowerCase()) {
      console.log('   ✓ WAGDIE is held by WagdieWorld contract (staked)')
    } else {
      console.log('   WAGDIE is in user wallet (not staked)')

      // 5. Check approval
      console.log('\n5. Checking if owner approved WagdieWorld for staking...')
      const isApproved = await client.readContract({
        address: WAGDIE_ADDRESS,
        abi: wagdieABI,
        functionName: 'isApprovedForAll',
        args: [owner, WAGDIE_WORLD_ADDRESS],
      })
      console.log(`   isApprovedForAll: ${isApproved}`)
      if (!isApproved) {
        console.log('   ⚠️  WagdieWorld is NOT approved to transfer WAGDIE tokens!')
        console.log('   User must call setApprovalForAll first.')
      }
    }

    // Summary
    console.log('\n=== DIAGNOSIS SUMMARY ===')
    if (currentLocation !== 0n) {
      console.log(`❌ ROOT CAUSE: WAGDIE #${wagdieId} is already staked at location ${currentLocation}`)
      console.log('   SOLUTION: Unstake the character first, then stake to new location.')
    } else if (!locationInfo.exists) {
      console.log(`❌ ROOT CAUSE: Location ${locationId} does not exist on-chain`)
      console.log('   SOLUTION: Use a valid on-chain location ID.')
    } else if (!stakingEnabled) {
      console.log('❌ ROOT CAUSE: Staking is disabled on the contract')
    } else {
      console.log('✓ All checks passed - staking should work')
      console.log('  If still reverting, check gas limits or other transaction params.')
    }

  } catch (error) {
    console.error('\nError during check:', error)
  }
}

main()
