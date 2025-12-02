# Data Model: Character Editor & Chat Integration

**Feature**: 016-character-editor-chat
**Date**: 2025-12-02

## Entity Overview

This feature bridges two data sources:
1. **WAGDIE Database** (Supabase PostgreSQL) - Existing character data
2. **Eliza API** - AI character profiles and conversations

## Entities

### AI Character (Eliza API)

Represents the AI persona linked to a WAGDIE character.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| id | string (UUID) | Yes | Eliza-generated unique identifier |
| externalId | string | Yes | WAGDIE tokenId for linking (e.g., "1234") |
| name | string | Yes | Character display name (synced from WAGDIE) |
| personality | string | No | AI personality description (e.g., "A gruff warrior with a heart of gold") |
| backstory | string | No | Character background (synced with WAGDIE background_story) |
| systemPrompt | string | No | Custom system prompt for AI behavior |
| exampleMessages | ExampleMessage[] | No | Training examples for character voice |
| createdAt | ISO 8601 string | Yes | Creation timestamp |
| updatedAt | ISO 8601 string | Yes | Last modification timestamp |

**Validation Rules**:
- `externalId` must be unique within Eliza system
- `name` max length: 100 characters
- `personality` max length: 2000 characters
- `backstory` max length: 5000 characters
- `systemPrompt` max length: 4000 characters
- `exampleMessages` max count: 20 pairs

**State Transitions**:
- `unconfigured` → `configured` (on first save of personality/systemPrompt)
- No deletion from WAGDIE side (only via Eliza admin)

### Conversation (Eliza API)

A chat session between a user and an AI character.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| id | string (UUID) | Yes | Unique conversation identifier |
| characterId | string (UUID) | Yes | Reference to AI Character |
| userId | string | Yes | User's wallet address (lowercase) |
| title | string | No | Auto-generated or user-set title |
| messageCount | number | Yes | Total messages in conversation |
| createdAt | ISO 8601 string | Yes | Conversation start time |
| updatedAt | ISO 8601 string | Yes | Last message timestamp |

**Validation Rules**:
- `userId` must be valid Ethereum address format
- One active conversation per user per character (new = archive old)

**State Transitions**:
- `active` → `archived` (on new conversation start)

### Chat Message (Eliza API)

An individual message in a conversation.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| id | string (UUID) | Yes | Unique message identifier |
| conversationId | string (UUID) | Yes | Parent conversation |
| role | 'user' \| 'assistant' | Yes | Message sender type |
| content | string | Yes | Message text content |
| createdAt | ISO 8601 string | Yes | Message timestamp |

**Validation Rules**:
- `content` max length: 10000 characters
- `role` must be 'user' or 'assistant'
- Messages are append-only (no edit/delete)

### Example Message Pair (Embedded in AI Character)

Training example for character voice.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| userMessage | string | Yes | Example user input |
| assistantMessage | string | Yes | Expected character response |

**Validation Rules**:
- Both fields required if pair exists
- `userMessage` max length: 500 characters
- `assistantMessage` max length: 1000 characters

## Relationships

```
┌─────────────────┐         ┌─────────────────┐
│ WAGDIE Character│         │  AI Character   │
│   (Supabase)    │◄───────►│   (Eliza API)   │
│                 │         │                 │
│ token_id ───────┼────────►│ externalId      │
│ name ───────────┼────────►│ name            │
│ background_story├────────►│ backstory       │
└─────────────────┘         └────────┬────────┘
                                     │
                                     │ 1:N
                                     ▼
                            ┌─────────────────┐
                            │  Conversation   │
                            │                 │
                            │ characterId     │
                            │ userId          │
                            └────────┬────────┘
                                     │
                                     │ 1:N
                                     ▼
                            ┌─────────────────┐
                            │  Chat Message   │
                            │                 │
                            │ conversationId  │
                            │ role            │
                            │ content         │
                            └─────────────────┘
```

## Data Synchronization

### WAGDIE → Eliza (On AI Character Create/Update)

When creating or updating an AI Character:
1. Use WAGDIE `token_id` as Eliza `externalId`
2. Sync `name` from WAGDIE character
3. Sync `background_story` to Eliza `backstory`

### Eliza → WAGDIE (Optional, on explicit save)

When saving AI persona with "Sync to WAGDIE" option:
1. Update WAGDIE `name` if changed in Eliza
2. Update WAGDIE `background_story` from Eliza `backstory`

### Auto-Create Behavior

When user initiates first chat with a character that has no AI profile:
1. Fetch WAGDIE character data
2. Create Eliza AI Character with:
   - `externalId`: tokenId
   - `name`: WAGDIE name
   - `backstory`: WAGDIE background_story
   - `personality`: Default based on NFT traits (e.g., "A {Body} {Alignment} character")
3. Start conversation

## Local Storage Schema

For preserving unsaved edits (per FR-068):

```typescript
interface DraftAIPersona {
  tokenId: string
  personality?: string
  systemPrompt?: string
  exampleMessages?: ExampleMessage[]
  savedAt: ISO 8601 string
}

// Key: `wagdie-ai-draft-${tokenId}`
```

## TypeScript Definitions

```typescript
// types/eliza.ts

export interface AICharacter {
  id: string
  externalId: string
  name: string
  personality: string | null
  backstory: string | null
  systemPrompt: string | null
  exampleMessages: ExampleMessage[]
  createdAt: string
  updatedAt: string
}

export interface ExampleMessage {
  userMessage: string
  assistantMessage: string
}

export interface Conversation {
  id: string
  characterId: string
  userId: string
  title: string | null
  messageCount: number
  createdAt: string
  updatedAt: string
}

export interface ChatMessage {
  id: string
  conversationId: string
  role: 'user' | 'assistant'
  content: string
  createdAt: string
}

export interface CreateAICharacterInput {
  externalId: string
  name: string
  personality?: string
  backstory?: string
  systemPrompt?: string
  exampleMessages?: ExampleMessage[]
}

export interface UpdateAICharacterInput {
  name?: string
  personality?: string
  backstory?: string
  systemPrompt?: string
  exampleMessages?: ExampleMessage[]
}

export interface SendMessageInput {
  characterId: string
  message: string
  conversationId?: string
}

export interface ChatResponse {
  id: string
  content: string
  role: 'assistant'
  conversationId: string
  createdAt: string
}
```
