import {
  buildOwnedSearableConcords,
  getConcordImageUrl,
  isBlockedSearingConcord,
} from '@/hooks/useSearingConcords'
import type { ConcordSearingMap } from '@/lib/domain/searing/concord-searing-map'
import type { SearingConcordBalance } from '@/lib/services/blockchain/searing'

function searingMap(concordTokenId: number, tokenName = `Concord ${concordTokenId}`): ConcordSearingMap {
  return {
    token_name: tokenName,
    location: 'body',
    new_trait: `trait-${concordTokenId}`,
    makesBald: false,
    tokenId: String(concordTokenId),
    concordTokenId,
  }
}

function balance(concordId: number, value: bigint): SearingConcordBalance {
  return {
    concordId,
    tokenId: BigInt(concordId),
    balance: value,
    isOwned: value > 0n,
    contractAddress: '0x0000000000000000000000000000000000000000',
  }
}

describe('useSearingConcords helpers', () => {
  it('filters blocked and unowned Concords, then sorts owned Concords by amount', () => {
    const result = buildOwnedSearableConcords(
      [searingMap(1), searingMap(12), searingMap(2), searingMap(3)],
      [balance(1, 1n), balance(12, 5n), balance(2, 0n), balance(3, 4n)]
    )

    expect(result.map((concord) => concord.concordId)).toEqual([3, 1])
    expect(result[0]).toMatchObject({
      name: 'Concord 3',
      amount: 4n,
      imageUrl: getConcordImageUrl(3),
    })
  })

  it('keeps legacy blocked Concord IDs out of searing selection', () => {
    expect(isBlockedSearingConcord(12)).toBe(true)
    expect(isBlockedSearingConcord(15)).toBe(true)
    expect(isBlockedSearingConcord(25)).toBe(true)
    expect(isBlockedSearingConcord(27)).toBe(true)
    expect(isBlockedSearingConcord(1)).toBe(false)
  })
})
