/**
 * @jest-environment node
 */

import { NextRequest } from 'next/server'
import { GET } from '@/app/api/characters/traits/[traitType]/route'
import { serverCharacterRepository } from '@/lib/repositories/character-repository.server'

jest.mock('@/lib/repositories/character-repository.server', () => ({
  serverCharacterRepository: {
    getTraitCounts: jest.fn(),
  },
}))

function createRequest() {
  return new NextRequest('http://localhost/api/characters/traits/The%2017')
}

function createParams(traitType: string) {
  return { params: Promise.resolve({ traitType }) }
}

describe('Character trait counts API Route', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('accepts The 17 as a valid metadata trait type', async () => {
    const result = {
      traitType: 'The 17',
      traits: [{ value: 'Luta the Beacon', count: 1 }],
      totalCharacters: 1,
    }
    ;(serverCharacterRepository.getTraitCounts as jest.Mock).mockResolvedValueOnce(result)

    const response = await GET(createRequest(), createParams('The 17'))

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual(result)
    expect(serverCharacterRepository.getTraitCounts).toHaveBeenCalledWith('The 17')
  })

  it('normalizes accepted trait type casing before querying counts', async () => {
    const result = {
      traitType: 'The 17',
      traits: [],
      totalCharacters: 0,
    }
    ;(serverCharacterRepository.getTraitCounts as jest.Mock).mockResolvedValueOnce(result)

    const response = await GET(createRequest(), createParams('the 17'))

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual(result)
    expect(serverCharacterRepository.getTraitCounts).toHaveBeenCalledWith('The 17')
  })
})
