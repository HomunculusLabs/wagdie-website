/**
 * Eliza SDK Adapter (v0.2.0)
 *
 * Stable facade for all @eliza/sdk imports + data-shape mappings so the rest of
 * the app can remain stable while we migrate SDK versions.
 */

import { ElizaError } from '@eliza/sdk'

export { ElizaError }

export type {
  AgentCharacter,
  AgentMessage,
  AgentMessageExample,
  AuthTokens,
  CharacterPermissions,
  CharacterRecord,
  CharacterStyle,
  ChatMessage,
  ChatResponse,
  RoleContentMessage,
  StreamCallback,
  StreamCallbacks,
  StreamCompleteCallback,
  StreamErrorCallback,
} from '@/lib/eliza/sdk-types'

export {
  agentMessageExamplesToRoleContentPairs,
  fromAgentMessageExamples,
  roleContentPairsToAgentMessageExamples,
  toAgentMessageExamples,
} from '@/lib/eliza/message-examples'

export {
  applyWagdieUpdateToAgentCharacter,
  extractBackstory,
  mergeAgentCharacter,
  toAgentCharacterFromAICharacter,
  toAgentCharacterPatchFromUpdate,
  toAICharacterFromRecord,
} from '@/lib/eliza/agent-character-mapper'

export {
  fromElizaExportMessageExamples,
  toElizaExportMessageExamples,
} from '@/lib/eliza/eliza-export-mapper'
