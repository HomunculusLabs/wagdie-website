import type { AgentMessageExample } from '@/lib/eliza/sdk-types'

/**
 * Convert Eliza export format messageExamples to canonical AgentMessageExample[].
 * Eliza export uses: [{ user: string, content: { text: string } }][]
 */
export function toElizaExportMessageExamples(
  examples?: AgentMessageExample[]
): Array<Array<{ user: string; content: { text: string } }>> | undefined {
  if (!examples || examples.length === 0) return undefined

  return examples.map((conversation) =>
    conversation.map((msg) => ({
      user: msg.name,
      content: { text: msg.content?.text ?? '' },
    }))
  )
}

/**
 * Convert Eliza export format back to canonical AgentMessageExample[].
 */
export function fromElizaExportMessageExamples(
  examples?: Array<Array<{ user: string; content: { text: string } }>>
): AgentMessageExample[] | undefined {
  if (!examples || examples.length === 0) return undefined

  return examples.map((conversation) =>
    conversation.map((entry) => ({
      name: entry.user,
      content: { text: entry.content?.text ?? '' },
    }))
  )
}
