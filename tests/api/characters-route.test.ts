/**
 * @jest-environment node
 */

import { NextRequest } from 'next/server'
import { GET } from '@/app/api/characters/route'
import { getCharacters } from '@/lib/services/character-service'

jest.mock('@/lib/services/character-service', () => ({
  getCharacters: jest.fn(),
}))

function createRequest(query = '') {
  return new NextRequest(`http://localhost/api/characters${query}`)
}

describe('Characters API Route', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('returns the existing invalid pagination response shape', async () => {
    const response = await GET(createRequest('?page=0'))

    expect(response.status).toBe(400)
    await expect(response.json()).resolves.toEqual({
      error: 'Invalid pagination parameters',
    })
  })

  it('returns the existing invalid tab response shape', async () => {
    const response = await GET(createRequest('?tab=unknown'))

    expect(response.status).toBe(400)
    await expect(response.json()).resolves.toEqual({
      error: 'Invalid tab parameter',
    })
  })

  it('keeps whitespace-padded tab values invalid', async () => {
    const response = await GET(createRequest('?tab=%20owned%20'))

    expect(response.status).toBe(400)
    await expect(response.json()).resolves.toEqual({
      error: 'Invalid tab parameter',
    })
  })

  it('returns the existing invalid sort response shape', async () => {
    const response = await GET(createRequest('?sort=random'))

    expect(response.status).toBe(400)
    await expect(response.json()).resolves.toEqual({
      error: 'Invalid sort parameter',
    })
  })

  it('keeps whitespace sort values invalid', async () => {
    const response = await GET(createRequest('?sort=%20'))

    expect(response.status).toBe(400)
    await expect(response.json()).resolves.toEqual({
      error: 'Invalid sort parameter',
    })
  })

  it('returns an empty raw response for owned tab without wallet', async () => {
    const response = await GET(createRequest('?tab=owned'))

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual({
      characters: [],
      hasMore: false,
      totalCount: 0,
    })
    expect(getCharacters).not.toHaveBeenCalled()
  })

  it('returns the character service response without success/data wrapping', async () => {
    const result = {
      characters: [{ token_id: 1, name: 'One' }],
      hasMore: false,
      totalCount: 1,
    }
    ;(getCharacters as jest.Mock).mockResolvedValueOnce(result)

    const response = await GET(createRequest('?page=2&perPage=25&sort=asc'))

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual(result)
    expect(getCharacters).toHaveBeenCalledWith(expect.objectContaining({
      tab: 'all',
      sort: 'asc',
      page: 2,
      perPage: 25,
    }))
  })

  it('forwards the ElizaOS profile filter to the character service', async () => {
    const result = {
      characters: [],
      hasMore: false,
      totalCount: 0,
    }
    ;(getCharacters as jest.Mock).mockResolvedValueOnce(result)

    const response = await GET(createRequest('?hasElizaProfile=true'))

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual(result)
    expect(getCharacters).toHaveBeenCalledWith(expect.objectContaining({
      hasElizaProfile: true,
    }))
  })
})
