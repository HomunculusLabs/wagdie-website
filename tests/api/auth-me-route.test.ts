/**
 * @jest-environment node
 */

import { GET } from '@/app/api/auth/me/route'
import { getSession } from '@/lib/auth/session'

jest.mock('@/lib/auth/session', () => ({
  getSession: jest.fn(),
}))

describe('Auth me API Route', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('returns unauthenticated response without success/data wrapping', async () => {
    ;(getSession as jest.Mock).mockResolvedValueOnce({
      address: null,
      expires: null,
    })

    const response = await GET()

    expect(response.status).toBe(401)
    await expect(response.json()).resolves.toEqual({ error: 'Not authenticated' })
  })

  it('returns current session payload unchanged', async () => {
    const session = {
      address: '0x123',
      expires: Date.now() + 1000,
      selectedCharacter: 7,
    }
    ;(getSession as jest.Mock).mockResolvedValueOnce(session)

    const response = await GET()

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual({
      address: session.address,
      expires: session.expires,
      selectedCharacter: 7,
    })
  })
})
