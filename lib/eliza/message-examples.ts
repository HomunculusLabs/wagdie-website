import type { ExampleMessage } from '@/types/eliza'

import type { AgentMessageExample, RoleContentMessage } from '@/lib/eliza/sdk-types'
import {
  convertFromElizaMessageExamples,
  convertToElizaMessageExamples,
} from '@/lib/eliza/migration'

/**
 * Internal bridge type used by existing migration utilities (they use `user`, not `name`).
 */
type LegacyExampleEntry = { user: string; content: { text: string } }

/**
 * Convert wagdie ExampleMessage[] into canonical AgentMessageExample[].
 *
 * wagdie format:
 *   [{ userMessage: string, assistantMessage: string }, ...]
 *
 * canonical SDK format (messageExamples):
 *   [
 *     [
 *       { name: '{{user1}}', content: { text: '...' } },
 *       { name: '{{char}}', content: { text: '...' } }
 *     ],
 *     ...
 *   ]
 *
 * NOTE: We intentionally reuse existing migration helpers and bridge `user` -> `name`.
 */
export function toAgentMessageExamples(
  exampleMessages: ExampleMessage[] | null | undefined
): AgentMessageExample[] | undefined {
  if (!exampleMessages || exampleMessages.length === 0) return undefined

  const legacy = convertToElizaMessageExamples(exampleMessages) // uses `{ user, content: { text } }`
  return legacy.map((conversation) =>
    conversation.map((entry) => ({
      name: entry.user,
      content: { text: entry.content?.text ?? '' },
    }))
  )
}

/**
 * Convert canonical AgentMessageExample[] back into wagdie ExampleMessage[].
 *
 * This is used when returning an API response shaped like wagdie's AICharacter DTO.
 */
export function fromAgentMessageExamples(
  messageExamples: AgentMessageExample[] | null | undefined
): ExampleMessage[] {
  if (!messageExamples || messageExamples.length === 0) return []

  const legacy: LegacyExampleEntry[][] = messageExamples.map((conversation) =>
    conversation.map((entry) => ({
      user: entry.name,
      content: { text: entry.content?.text ?? '' },
    }))
  )

  return convertFromElizaMessageExamples(legacy)
}

/**
 * Convert legacy role/content pairs into canonical AgentMessageExample[].
 *
 * Expected input shape:
 *   [{role:'user', content:'...'}, {role:'assistant', content:'...'}, ...]
 * grouped as pairs.
 */
export function roleContentPairsToAgentMessageExamples(
  messages: RoleContentMessage[] | null | undefined
): AgentMessageExample[] | undefined {
  if (!messages || messages.length === 0) return undefined

  const examples: AgentMessageExample[] = []
  for (let i = 0; i < messages.length; i += 2) {
    const first = messages[i]
    const second = messages[i + 1]
    if (!first || !second) continue
    if (first.role !== 'user' || second.role !== 'assistant') continue

    examples.push([
      { name: '{{user1}}', content: { text: first.content ?? '' } },
      { name: '{{char}}', content: { text: second.content ?? '' } },
    ])
  }

  return examples.length > 0 ? examples : undefined
}

/**
 * Convert canonical AgentMessageExample[] into legacy role/content pairs (flattened).
 * This is mainly for helping during migration away from v0.1-style examples.
 */
export function agentMessageExamplesToRoleContentPairs(
  messageExamples: AgentMessageExample[] | null | undefined
): RoleContentMessage[] {
  if (!messageExamples || messageExamples.length === 0) return []

  const out: RoleContentMessage[] = []
  for (const conversation of messageExamples) {
    if (!Array.isArray(conversation) || conversation.length === 0) continue

    const user = conversation[0]
    const assistant = conversation.length > 1 ? conversation[1] : undefined

    out.push({ role: 'user', content: user?.content?.text ?? '' })
    if (assistant) {
      out.push({ role: 'assistant', content: assistant.content?.text ?? '' })
    }
  }

  return out
}
