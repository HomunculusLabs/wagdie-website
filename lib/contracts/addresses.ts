/*
 * Smart Contract Addresses
 * Source: specs/004-blockchain-integration/contracts/addresses.json
 *
 * Supports optional overrides via env vars:
 * - NEXT_PUBLIC_* for client-safe overrides
 * - server-only variants without NEXT_PUBLIC_
 */

export type Address = `0x${string}`

export interface ContractAddresses {
  wagdie: Address
  tokensOfConcord: Address
  corpse: Address
  mushroom: Address
  searing: Address
  spread: Address
  wagdieWorld: Address
}

export const mainnetAddresses: ContractAddresses = {
  wagdie: '0x659a4bdaaacc62d2bd9cb18225d9c89b5b697a5a',
  tokensOfConcord: '0x1d38150f1fd989fb89ab19518a9c4e93c5554634',
  corpse: '0x21fc8585eee37be572a0e37c34c7ad2a15a36ee3',
  mushroom: '0x171a8518A1B75F9E26ea952728d4850BEf9B87d2',
  searing: '0x5156A7F668E59119db23a264502F40407CDa076F',
  spread: '0xaCA80514986768F88F7d8E644546AB85383ddE7e',
  wagdieWorld: '0x616D4635ceCf94597690Cab0Fc159c3A8231C904',
}

export const sepoliaAddresses: Partial<ContractAddresses> = {
  wagdie: '0x5d3dc394D8C8310Af31e089460F7FcdC7F527604',
  tokensOfConcord: '0x4FBF88AC8C15f1Ea0d0022e3BfEbf7338483aE30',
  wagdieWorld: '0x7E0F603BaE7c21c02Ae8a66D26B27704d2eed652',
  searing: '0xd4f5BDF71ac7135dbB6B5FF29921848d5f1A0Fe4',
  // Note: Corpse, Mushroom, and Spread not deployed on Sepolia testnet
}

// Token IDs for ERC1155 contracts
export const TOKEN_IDS = {
  concord: 1n,
  corpse: 1n,
  mushroom: 1n,
} as const

function getEnvAddress(names: string[]): Address | undefined {
  for (const name of names) {
    const value = process.env[name]
    if (!value) continue
    if (/^0x[a-fA-F0-9]{40}$/.test(value)) return value as Address
    console.warn(`Invalid address for ${name}: ${value}`)
    return undefined
  }
  return undefined
}

function applyOverrides(base: ContractAddresses): ContractAddresses {
  const overrides: Partial<ContractAddresses> = {
    wagdie: getEnvAddress(['NEXT_PUBLIC_WAGDIE_ADDRESS', 'WAGDIE_ADDRESS']),
    tokensOfConcord: getEnvAddress([
      'NEXT_PUBLIC_CONCORD_ADDRESS',
      'CONCORD_ADDRESS',
      'NEXT_PUBLIC_TOKENS_OF_CONCORD_ADDRESS',
      'TOKENS_OF_CONCORD_ADDRESS',
    ]),
    corpse: getEnvAddress(['NEXT_PUBLIC_CORPSE_ADDRESS', 'CORPSE_ADDRESS']),
    mushroom: getEnvAddress(['NEXT_PUBLIC_MUSHROOM_ADDRESS', 'MUSHROOM_ADDRESS']),
    searing: getEnvAddress(['NEXT_PUBLIC_SEARING_ADDRESS', 'SEARING_ADDRESS']),
    spread: getEnvAddress(['NEXT_PUBLIC_SPREAD_ADDRESS', 'SPREAD_ADDRESS']),
    wagdieWorld: getEnvAddress(['NEXT_PUBLIC_WAGDIE_WORLD_ADDRESS', 'WAGDIE_WORLD_ADDRESS']),
  }

  const next = { ...base }
  ;(Object.keys(overrides) as (keyof ContractAddresses)[]).forEach((key) => {
    const value = overrides[key]
    if (value) next[key] = value
  })
  return next
}

// Get contract addresses based on chain ID
export function getContractAddresses(chainId: number): ContractAddresses {
  switch (chainId) {
    case 1: // Mainnet
      return applyOverrides(mainnetAddresses)
    case 11155111: // Sepolia
      // Return mainnet addresses for contracts not deployed on Sepolia
      return applyOverrides({
        ...mainnetAddresses,
        ...sepoliaAddresses,
      } as ContractAddresses)
    default:
      throw new Error(`Unsupported chain ID: ${chainId}`)
  }
}
