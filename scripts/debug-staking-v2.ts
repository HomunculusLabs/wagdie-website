/**
 * Debug script to investigate staking revert (v2)
 * Focus on checking token existence first
 */

import { createPublicClient, http, getAddress } from 'viem'
import { mainnet } from 'viem/chains'

const WAGDIE_ADDRESS = getAddress('0x659a4bdaaacc62d2bd9cb18225d9c89b5b697a5a')
const WAGDIE_WORLD_ADDRESS = getAddress('0x616D4635ceCf94597690Cab0Fc159c3A8231C904')

const wagdieABI = [
  {
    inputs: [{ internalType: 'uint256', name: 'tokenId', type: 'uint256' }],
    name: 'ownerOf',
    outputs: [{ internalType: 'address', name: '', type: 'address' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'totalSupply',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
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

const wagdieWorldABI = [
  {
    inputs: [],
    name: 'isStakingEnabled',
    outputs: [{ internalType: 'bool', name: '', type: 'bool' }],
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

async function main() {
  const wagdieId = 3157
  const locationId = 13n

  const rpcUrl = process.env.HTTP_RPC_URL || 'https://eth.llamarpc.com'

  console.log('=== WAGDIE Staking Debug v2 ===\n')
  console.log(`WAGDIE ID: ${wagdieId}`)
  console.log(`Location ID: ${locationId}\n`)

  const client = createPublicClient({
    chain: mainnet,
    transport: http(rpcUrl),
  })

  // 1. Check total supply
  console.log('1. Checking WAGDIE total supply...')
  try {
    const totalSupply = await client.readContract({
      address: WAGDIE_ADDRESS,
      abi: wagdieABI,
      functionName: 'totalSupply',
    })
    console.log(`   Total Supply: ${totalSupply}`)
    if (BigInt(wagdieId) >= totalSupply) {
      console.log(`   ⚠️  Token ID ${wagdieId} is >= total supply!`)
    }
  } catch (e) {
    console.log(`   Error getting total supply: ${e}`)
  }

  // 2. Check who owns the token
  console.log('\n2. Checking owner of WAGDIE #3157...')
  try {
    const owner = await client.readContract({
      address: WAGDIE_ADDRESS,
      abi: wagdieABI,
      functionName: 'ownerOf',
      args: [BigInt(wagdieId)],
    })
    console.log(`   Owner: ${owner}`)

    if (owner.toLowerCase() === WAGDIE_WORLD_ADDRESS.toLowerCase()) {
      console.log('   ⚠️  Token is held by WagdieWorld contract - IT IS STAKED!')
      console.log('   The user needs to UNSTAKE before re-staking.')
    } else {
      console.log('   Token is in user wallet')

      // Check approval
      console.log('\n3. Checking approval for WagdieWorld...')
      const isApproved = await client.readContract({
        address: WAGDIE_ADDRESS,
        abi: wagdieABI,
        functionName: 'isApprovedForAll',
        args: [owner, WAGDIE_WORLD_ADDRESS],
      })
      console.log(`   isApprovedForAll: ${isApproved}`)
      if (!isApproved) {
        console.log('   ⚠️  WagdieWorld is NOT approved!')
      }
    }
  } catch (e: any) {
    if (e.message?.includes('revert') || e.shortMessage?.includes('revert')) {
      console.log(`   ❌ Token #${wagdieId} appears to be BURNED or does not exist!`)
      console.log('   The ownerOf call reverted, indicating the token was burned.')
    } else {
      console.log(`   Error: ${e.message || e}`)
    }
  }

  // 4. Check location
  console.log('\n4. Checking location 13 on-chain...')
  try {
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
      console.log(`   ⚠️  Location ${locationId} does NOT exist on-chain!`)
    }
  } catch (e) {
    console.log(`   Error getting location info: ${e}`)
  }

  // 5. Check staking enabled
  console.log('\n5. Checking if staking is enabled...')
  try {
    const stakingEnabled = await client.readContract({
      address: WAGDIE_WORLD_ADDRESS,
      abi: wagdieWorldABI,
      functionName: 'isStakingEnabled',
    })
    console.log(`   Staking enabled: ${stakingEnabled}`)
  } catch (e) {
    console.log(`   Error: ${e}`)
  }

  console.log('\n=== END DEBUG ===')
}

main()
