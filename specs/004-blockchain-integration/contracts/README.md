# WAGDIE Smart Contracts

**Purpose**: This directory contains contract addresses, ABIs, and configuration for blockchain integration.

## Files

- **`addresses.json`**: Contract addresses for mainnet and testnet
- **ABI Files** (to be added during implementation):
  - `wagdie.json` - WAGDIE ERC721 NFT contract ABI
  - `concord.json` - Tokens of Concord ERC1155 ABI
  - `corpse.json` - Corpse Token ERC1155 ABI
  - `mushroom.json` - Mushroom Token ERC1155 ABI
  - `searing.json` - SearWagdie contract ABI
  - `spread.json` - Spread/Infection contract ABI
  - `wagdie-world.json` - WagdieWorld staking contract ABI

## Contract Overview

### Main Collections

| Contract | Address (Mainnet) | Type | Purpose |
|----------|-------------------|------|---------|
| **WAGDIE** | `0x659a4bdaaacc62d2bd9cb18225d9c89b5b697a5a` | ERC721 | Main character NFTs |
| **Tokens of Concord** | `0x1d38150f1fd989fb89ab19518a9c4e93c5554634` | ERC1155 | Resource token for searing |
| **Corpse** | `0x21fc8585eee37be572a0e37c34c7ad2a15a36ee3` | ERC1155 | Corpse tokens for burning |
| **Mushroom** | `0x171a8518A1B75F9E26ea952728d4850BEf9B87d2` | ERC1155 | Spore tokens for infection |

### Game Mechanics Contracts

| Contract | Address (Mainnet) | Purpose |
|----------|-------------------|---------|
| **SearWagdie** | `0x5156A7F668E59119db23a264502F40407CDa076F` | Character transformation via Concord burning |
| **Spread** | `0xaCA80514986768F88F7d8E644546AB85383ddE7e` | Infection spreading mechanics |
| **WagdieWorld** | `0x616D4635ceCf94597690Cab0Fc159c3A8231C904` | Character staking at locations |

## Usage in Code

### Import Contract Addresses

```typescript
import contractAddresses from '@/specs/004-blockchain-integration/contracts/addresses.json'

// Get mainnet WAGDIE address
const wagdieAddress = contractAddresses.networks.mainnet.contracts.wagdie.address

// Get contract based on chain ID
const chainId = useChainId()
const network = chainId === 1 ? 'mainnet' : 'sepolia'
const address = contractAddresses.networks[network].contracts.wagdie.address
```

### Use with wagmi

```typescript
import { useReadContract } from 'wagmi'
import wagdieABI from '@/lib/contracts/abis/wagdie.json'
import addresses from '@/specs/004-blockchain-integration/contracts/addresses.json'

const { data: owner } = useReadContract({
  address: addresses.networks.mainnet.contracts.wagdie.address as `0x${string}`,
  abi: wagdieABI,
  functionName: 'ownerOf',
  args: [BigInt(tokenId)],
})
```

## ABI Source

All ABIs are sourced from the original WAGDIE project:
- **Location**: `/Users/t3rpz/projects/web/src/typechain-types/` and `/Users/t3rpz/projects/web/src/features/abi/`
- **Format**: TypeChain generated TypeScript files or JSON
- **Conversion**: TypeChain ABIs will be extracted and converted to pure JSON for use in the simplified app

## Verification

All contracts are verified on Etherscan:
- **Mainnet**: https://etherscan.io/address/{contract_address}
- **Sepolia**: https://sepolia.etherscan.io/address/{contract_address}

View source code, read/write functions, and events directly on Etherscan.

## Network Configuration

### Mainnet (Chain ID: 1)
- **RPC**: Alchemy (requires API key)
- **Explorer**: https://etherscan.io
- **All contracts**: Fully deployed and functional

### Sepolia Testnet (Chain ID: 11155111)
- **RPC**: Alchemy Sepolia (requires API key)
- **Explorer**: https://sepolia.etherscan.io
- **Partial deployment**: WAGDIE, Concord, WagdieWorld, Searing only
- **Missing**: Corpse, Mushroom, Spread contracts (use mainnet ABIs for type generation)

## Token IDs

For ERC1155 contracts (Concord, Corpse, Mushroom), the token ID is `1` for all tokens.

```typescript
// Reading ERC1155 balance
const { data: concordBalance } = useReadContract({
  address: concordAddress,
  abi: erc1155ABI,
  functionName: 'balanceOf',
  args: [userAddress, BigInt(1)], // Token ID = 1
})
```

## Security Notes

1. **Never hardcode private keys** - All signing happens in user's wallet
2. **Verify addresses** - Always cross-reference with official sources
3. **Test on Sepolia first** - Use testnet before mainnet transactions
4. **Gas estimation** - Always estimate gas before prompting user
5. **Rate limiting** - Implement retry logic for RPC calls

## Future Additions

Contracts that may be added in future:
- **WagdieBeasts**: Beast NFT collection
- **Wagdice**: On-chain randomization (Chainlink VRF)
- **Cure Contract**: If separate from WagdieWorld

## Implementation Checklist

During implementation, ensure:
- [ ] All ABI JSON files added to this directory
- [ ] Contract addresses match `addresses.json`
- [ ] TypeScript types generated via `wagmi generate`
- [ ] Environment variables configured for RPC URLs
- [ ] Testnet addresses tested and verified
- [ ] All contracts have corresponding ABIs

## Support

For questions about contracts:
- **Original project**: Check `/Users/t3rpz/projects/web/src/lib/common/eth-network-config.ts`
- **Etherscan**: View verified contract source and documentation
- **The Graph**: Query indexed event data (https://thegraph.com/hosted-service/subgraph/wagdie/wagdie-world)

---

**Last Updated**: 2025-10-28
**Status**: Ready for implementation - ABIs to be added during Phase 2
