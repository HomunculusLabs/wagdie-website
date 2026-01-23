/**
 * @jest-environment node
 */

/**
 * Unit tests for Import/Export API Routes
 * T055 [P3] [US6] Import/Export API tests
 *
 * Test Coverage:
 * - Export route returns valid JSON
 * - Export route handles missing character
 * - Export route converts message examples to Eliza format
 * - Import route validates input
 * - Import route handles valid import
 * - Import route skips knowledge documents with warning
 * - Import route converts Eliza message format to SDK format
 */

import { NextRequest } from 'next/server'
import { GET as exportHandler } from '@/app/api/eliza/characters/[tokenId]/export/route'
import { POST as importHandler } from '@/app/api/eliza/characters/[tokenId]/import/route'

// Mock the Eliza client (canonical record APIs)
const mockGetRecordByExternalId = jest.fn()
const mockReplaceRecord = jest.fn()

jest.mock('@/lib/eliza/client', () => ({
  getElizaClient: () => ({
    characters: {
      getRecordByExternalId: mockGetRecordByExternalId,
      replaceRecord: mockReplaceRecord,
    },
  }),
}))

// Mock validation schema
jest.mock('@/lib/eliza/validation', () => ({
  elizaCharacterExportSchema: {
    safeParse: jest.fn((data) => {
      // Simple validation - just check required fields exist
      if (typeof data !== 'object' || data === null) {
        return {
          success: false,
          error: { errors: [{ path: [], message: 'Invalid data' }] },
        }
      }
      return { success: true, data }
    }),
  },
}))

describe('Export API Route', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  const createRequest = () => {
    return new NextRequest('http://localhost/api/eliza/characters/123/export')
  }

  const createParams = (tokenId: string) => ({
    params: Promise.resolve({ tokenId }),
  })

  describe('successful export', () => {
    it('should return character data as JSON with download headers', async () => {
      mockGetRecordByExternalId.mockResolvedValueOnce({
        id: 'record-123',
        character: {
          name: 'Test Character',
          bio: ['A brave warrior'],
          lore: ['Born in darkness'],
          topics: ['combat', 'honor'],
          adjectives: ['brave', 'strong'],
          style: { all: ['Be concise'], chat: [], post: [] },
          postExamples: ['Just another day...'],
          knowledge: [],
        },
      })

      const response = await exportHandler(createRequest(), createParams('123'))

      expect(response.status).toBe(200)
      expect(response.headers.get('Content-Type')).toBe('application/json')
      expect(response.headers.get('Content-Disposition')).toContain('test-character-character.json')

      const data = await response.json()
      expect(data.name).toBe('Test Character')
      expect(data.bio).toEqual(['A brave warrior'])
      expect(data.topics).toContain('combat')
    })

    it('should convert SDK message examples to Eliza format', async () => {
      mockGetRecordByExternalId.mockResolvedValueOnce({
        id: 'record-123',
        character: {
          name: 'Test',
          bio: ['Bio'],
          messageExamples: [
            [
              { name: '{{user1}}', content: { text: 'Hello there' } },
              { name: '{{char}}', content: { text: 'Greetings, traveler' } },
            ],
            [
              { name: '{{user1}}', content: { text: 'What do you do?' } },
              { name: '{{char}}', content: { text: 'I guard the realm' } },
            ],
          ],
        },
      })

      const response = await exportHandler(createRequest(), createParams('123'))
      const data = await response.json()

      // Should be converted to Eliza format (arrays of conversations)
      expect(data.messageExamples).toBeDefined()
      expect(data.messageExamples.length).toBe(2) // 2 conversations

      // First conversation
      expect(data.messageExamples[0][0].user).toBe('{{user1}}')
      expect(data.messageExamples[0][0].content.text).toBe('Hello there')
      expect(data.messageExamples[0][1].user).toBe('{{char}}')
      expect(data.messageExamples[0][1].content.text).toBe('Greetings, traveler')
    })

    it('should export knowledge documents with path and content', async () => {
      mockGetRecordByExternalId.mockResolvedValueOnce({
        id: 'record-123',
        character: {
          name: 'Test',
          bio: ['Bio'],
          knowledge: [
            { id: 'doc-1', path: 'lore.txt', content: 'Some lore content' },
            { id: 'doc-2', path: 'rules.md', content: 'Game rules here' },
          ],
        },
      })

      const response = await exportHandler(createRequest(), createParams('123'))
      const data = await response.json()

      expect(data.knowledge).toBeDefined()
      expect(data.knowledge.length).toBe(2)
      expect(data.knowledge[0].path).toBe('lore.txt')
      expect(data.knowledge[0].content).toBe('Some lore content')
    })
  })

  describe('error handling', () => {
    it('should return 400 if tokenId is missing', async () => {
      const response = await exportHandler(createRequest(), createParams(''))

      expect(response.status).toBe(400)
      const data = await response.json()
      expect(data.error).toBe('Token ID is required')
    })

    it('should return 404 if character not found', async () => {
      mockGetRecordByExternalId.mockResolvedValueOnce(null)

      const response = await exportHandler(createRequest(), createParams('nonexistent'))

      expect(response.status).toBe(404)
      const data = await response.json()
      expect(data.error).toBe('Character not found')
    })

    it('should return 500 on internal error', async () => {
      mockGetRecordByExternalId.mockRejectedValueOnce(new Error('Database error'))

      const response = await exportHandler(createRequest(), createParams('123'))

      expect(response.status).toBe(500)
      const data = await response.json()
      expect(data.error).toBe('Failed to export character')
    })
  })
})

describe('Import API Route', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  const createRequest = (body: unknown) => {
    return new NextRequest('http://localhost/api/eliza/characters/123/import', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
  }

  const createParams = (tokenId: string) => ({
    params: Promise.resolve({ tokenId }),
  })

  describe('successful import', () => {
    it('should import valid character data', async () => {
      mockGetRecordByExternalId.mockResolvedValueOnce({
        id: 'record-123',
        character: { existingKey: 'keep-me' },
      })
      mockReplaceRecord.mockResolvedValueOnce({})

      const importData = {
        name: 'Imported Character',
        bio: ['A mysterious figure'],
        lore: ['From ancient times'],
        topics: ['mystery', 'magic'],
        adjectives: ['mysterious', 'powerful'],
        style: { all: ['Speak cryptically'], chat: [], post: [] },
        postExamples: ['The shadows whisper...'],
      }

      const response = await importHandler(createRequest(importData), createParams('123'))

      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.success).toBe(true)
      expect(data.imported).toContain('bio')
      expect(data.imported).toContain('lore')
      expect(data.imported).toContain('topics')
      expect(data.imported).toContain('adjectives')
      expect(data.imported).toContain('style')
      expect(data.imported).toContain('postExamples')

      expect(mockReplaceRecord).toHaveBeenCalledTimes(1)
      expect(mockReplaceRecord).toHaveBeenCalledWith(
        'record-123',
        expect.objectContaining({
          character: expect.objectContaining({
            existingKey: 'keep-me',
            bio: ['A mysterious figure'],
            lore: ['From ancient times'],
            topics: ['mystery', 'magic'],
            adjectives: ['mysterious', 'powerful'],
            postExamples: ['The shadows whisper...'],
          }),
        })
      )
    })

    it('should convert Eliza message format to SDK format', async () => {
      mockGetRecordByExternalId.mockResolvedValueOnce({
        id: 'record-123',
        character: {},
      })
      mockReplaceRecord.mockResolvedValueOnce({})

      const importData = {
        bio: ['Bio'],
        messageExamples: [
          [
            { user: '{{user1}}', content: { text: 'Hello' } },
            { user: '{{char}}', content: { text: 'Hi there' } },
          ],
        ],
      }

      const response = await importHandler(createRequest(importData), createParams('123'))

      expect(response.status).toBe(200)
      expect(mockReplaceRecord).toHaveBeenCalledTimes(1)

      const replaceArgs = mockReplaceRecord.mock.calls[0]
      expect(replaceArgs[0]).toBe('record-123')

      const updatedCharacter = (replaceArgs[1] as any).character
      expect(updatedCharacter).toBeDefined()
      expect(updatedCharacter.messageExamples).toBeDefined()
      expect(Array.isArray(updatedCharacter.messageExamples)).toBe(true)

      // Ensure conversion preserved the message contents in canonical structure
      expect(updatedCharacter.messageExamples[0][0].content.text).toBe('Hello')
      expect(updatedCharacter.messageExamples[0][1].content.text).toBe('Hi there')
    })

    it('should skip knowledge with warning', async () => {
      mockGetRecordByExternalId.mockResolvedValueOnce({
        id: 'record-123',
        character: {},
      })
      mockReplaceRecord.mockResolvedValueOnce({})

      const importData = {
        bio: ['Bio'],
        knowledge: [{ id: 'doc-1', path: 'file.txt', content: 'Content' }],
      }

      const response = await importHandler(createRequest(importData), createParams('123'))

      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.skipped).toContain('knowledge')
      expect(data.warnings.some((w: string) => w.includes('Knowledge documents'))).toBe(true)
    })

    it('should warn about ignored name', async () => {
      mockGetRecordByExternalId.mockResolvedValueOnce({
        id: 'record-123',
        character: {},
      })
      mockReplaceRecord.mockResolvedValueOnce({})

      const importData = {
        name: 'Different Name',
        bio: ['Bio'],
      }

      const response = await importHandler(createRequest(importData), createParams('123'))

      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.warnings.some((w: string) => w.includes('name'))).toBe(true)
    })
  })

  describe('error handling', () => {
    it('should return 400 if tokenId is missing', async () => {
      const response = await importHandler(createRequest({}), createParams(''))

      expect(response.status).toBe(400)
      const data = await response.json()
      expect(data.error).toBe('Token ID is required')
    })

    it('should return 400 for invalid JSON body', async () => {
      const request = new NextRequest('http://localhost/api/eliza/characters/123/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: 'not valid json{',
      })

      const response = await importHandler(request, createParams('123'))

      expect(response.status).toBe(400)
      const data = await response.json()
      expect(data.error).toBe('Invalid JSON in request body')
    })

    it('should return 500 on update failure', async () => {
      mockGetRecordByExternalId.mockResolvedValueOnce({
        id: 'record-123',
        character: {},
      })
      mockReplaceRecord.mockRejectedValueOnce(new Error('Update failed'))

      const response = await importHandler(createRequest({ bio: ['Bio'] }), createParams('123'))

      expect(response.status).toBe(500)
      const data = await response.json()
      expect(data.error).toBe('Failed to import character')
    })
  })

  describe('selective import', () => {
    it('should only import provided fields', async () => {
      mockGetRecordByExternalId.mockResolvedValueOnce({
        id: 'record-123',
        character: { existingKey: 'keep-me' },
      })
      mockReplaceRecord.mockResolvedValueOnce({})

      const importData = {
        bio: ['New bio'],
        topics: ['topic1', 'topic2'],
        // No lore, adjectives, style, etc.
      }

      const response = await importHandler(createRequest(importData), createParams('123'))

      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.imported).toContain('bio')
      expect(data.imported).toContain('topics')
      expect(data.imported).not.toContain('lore')
      expect(data.imported).not.toContain('adjectives')

      expect(mockReplaceRecord).toHaveBeenCalledWith(
        'record-123',
        expect.objectContaining({
          character: expect.objectContaining({
            existingKey: 'keep-me',
            bio: ['New bio'],
            topics: ['topic1', 'topic2'],
          }),
        })
      )
    })

    it('should skip empty arrays', async () => {
      mockGetRecordByExternalId.mockResolvedValueOnce({
        id: 'record-123',
        character: {},
      })
      mockReplaceRecord.mockResolvedValueOnce({})

      const importData = {
        bio: ['Bio'],
        lore: [], // Empty
        topics: [], // Empty
      }

      const response = await importHandler(createRequest(importData), createParams('123'))

      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.imported).toContain('bio')
      expect(data.imported).not.toContain('lore')
      expect(data.imported).not.toContain('topics')
    })
  })
})
