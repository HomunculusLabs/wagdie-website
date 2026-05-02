import { TextDecoder, TextEncoder } from 'util'

Object.assign(global, { TextDecoder, TextEncoder })

jest.mock('../../scripts/indexer/utils/batch-upsert', () => ({
  batchUpsert: jest.fn(async () => ({ totalInserted: 1, batchCount: 1 })),
}))

jest.mock('../../scripts/discord/outbox', () => ({
  enqueueSear: jest.fn(async () => undefined),
}))

const { encodeAbiParameters, parseAbiParameters } = require('viem') as typeof import('viem')
const { handleSearConcordsLogs } = require('../../scripts/indexer/searing-event-handler') as typeof import('../../scripts/indexer/searing-event-handler')
const { batchUpsert } = require('../../scripts/indexer/utils/batch-upsert') as typeof import('../../scripts/indexer/utils/batch-upsert')

const CONCORD_SEARED_TOPIC = '0x264071db4c9b45acadae999c5940b63d7f4c982f1d0342dac85d0457f69a167f'

describe('searing-event-handler', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('maps ABI tokenId to domain concord_id/concordId', async () => {
    const data = encodeAbiParameters(
      parseAbiParameters('uint16 wagdieId, uint16 tokenId, address owner'),
      [123, 456, '0x000000000000000000000000000000000000dEaD']
    )

    await handleSearConcordsLogs([
      {
        address: '0x5156A7F668E59119db23a264502F40407CDa076F',
        data,
        topics: [CONCORD_SEARED_TOPIC],
        transactionHash: '0x1111111111111111111111111111111111111111111111111111111111111111',
        blockNumber: 99n,
        logIndex: 7,
      } as never,
    ])

    expect(batchUpsert).toHaveBeenCalledWith('searing_events', [expect.objectContaining({
      token_id: 123,
      concord_id: 456,
      metadata: expect.objectContaining({
        wagdieId: 123,
        concordId: 456,
        abiTokenId: 456,
      }),
    })], { onConflict: 'transaction_hash,log_index' })
  })
})
