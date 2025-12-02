# Research: Character Editor & Chat Integration

**Feature**: 016-character-editor-chat
**Date**: 2025-12-02

## SDK Integration Research

### Decision: Use @eliza/sdk directly (not @eliza/chat-widget)
**Rationale**: Custom React components provide better integration with existing wagdie-simplified patterns (Tailwind CSS, WAGDIE dark theme, React Query caching). The chat widget is Web Components-based which would require wrapper components and styling overrides.

**Alternatives Considered**:
- `@eliza/chat-widget` - Rejected: Would need React wrapper, styling conflicts with WAGDIE theme, less control over UX
- Custom API implementation - Rejected: SDK already provides typed interfaces, streaming support, error handling

### Decision: Server-side API proxy for authentication
**Rationale**: Clarification confirmed SSO experience required. Wagdie backend manages Eliza tokens, preventing client-side token exposure and simplifying auth flow for users (single wallet connection).

**Alternatives Considered**:
- Client-side SIWE with Eliza - Rejected: Would require dual signature requests, worse UX
- API key only - Rejected: Can't attribute conversations to specific users

## SDK Capabilities (Verified from ~/projects/eliza-editor)

### CharactersAPI
```typescript
// Available methods:
client.characters.list({ page, pageSize })     // Paginated listing
client.characters.get(id)                       // Single character
client.characters.getByExternalId(externalId)   // By WAGDIE tokenId
client.characters.create(input)                 // Create with upsert
client.characters.update(id, input)             // Partial update
client.characters.delete(id)                    // Remove

// Character fields:
interface Character {
  id: string
  name: string
  personality: string        // AI personality description
  backstory: string          // Character background
  systemPrompt?: string      // Custom system prompt
  exampleMessages?: Array<{role: 'user'|'assistant', content: string}>
  createdAt: string
  updatedAt: string
}
```

### ChatAPI
```typescript
// Available methods:
client.chat.sendMessage({ characterId, message, conversationId? })
client.chat.sendMessageStream({ characterId, message, conversationId? }, {
  onToken: (token) => void,
  onComplete: (response) => void,
  onError: (error) => void
})

// Returns:
interface ChatResponse {
  id: string
  content: string
  role: 'assistant'
  conversationId: string
  createdAt: string
}
```

### ConversationsAPI
```typescript
// Available methods:
client.conversations.list()                        // All for user
client.conversations.listByCharacter(characterId)  // For specific character
client.conversations.get(conversationId)           // Full history
client.conversations.delete(conversationId)        // Remove
```

### Authentication
```typescript
// SIWE flow:
const nonce = await client.auth.getNonce()
const message = createSIWEMessage({ domain, address, nonce, uri, chainId })
// Sign with wallet...
await client.auth.verify(message, signature, sessionId)
// Token refresh:
await client.auth.refresh()
```

## Integration Patterns Research

### Decision: React Query for caching AI character data
**Rationale**: Wagdie-simplified already uses @tanstack/react-query for character data. Consistent pattern for AI character and conversation caching with 5-minute stale time.

**Alternatives Considered**:
- Local state only - Rejected: Would lose caching benefits, more re-fetches
- SWR - Rejected: Project already standardized on React Query

### Decision: Custom streaming hook (not SDK's raw stream)
**Rationale**: Need to integrate with React state, handle UI updates (typing indicator, progressive rendering), and manage conversation context. Wrapper hook provides cleaner component interface.

**Implementation Pattern**:
```typescript
function useCharacterChat(characterId: string) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [isStreaming, setIsStreaming] = useState(false)
  const [streamingContent, setStreamingContent] = useState('')

  const sendMessage = async (content: string) => {
    // Add user message immediately
    // Start streaming with onToken callback
    // Update streamingContent progressively
    // On complete, add assistant message to messages
  }

  return { messages, sendMessage, isStreaming, streamingContent }
}
```

### Decision: External ID linking (tokenId → externalId)
**Rationale**: Eliza SDK supports `externalId` field for linking to external systems. WAGDIE tokenId serves as the stable link between Supabase character and Eliza AI character.

**Data Mapping**:
| WAGDIE (Supabase) | Eliza API | Sync Direction |
|-------------------|-----------|----------------|
| token_id | externalId | WAGDIE → Eliza (immutable link) |
| name | name | Bidirectional |
| background_story | backstory | Bidirectional |
| N/A | personality | Eliza only |
| N/A | systemPrompt | Eliza only |
| N/A | exampleMessages | Eliza only |

## UI/UX Research

### Decision: Slide-out sidebar (not modal)
**Rationale**: User confirmed preference. Sidebar allows viewing character details while chatting, better for context.

**Implementation Details**:
- Desktop: Fixed-width sidebar (400px), slides from right
- Mobile: Full-screen overlay (100vw)
- Animation: CSS transform with 300ms transition
- Backdrop: Semi-transparent overlay, click to close

### Decision: Virtualized message list for long conversations
**Rationale**: Spec requires handling 100+ messages with pagination. React-window or similar provides smooth scrolling without rendering all DOM nodes.

**Alternatives Considered**:
- Pagination with "Load More" - Rejected: Worse UX for chat interface
- No virtualization - Rejected: Performance issues with 100+ messages

### Decision: Context window of 20-50 messages for AI
**Rationale**: Clarification confirmed. Full history stored but only recent messages sent to AI for response generation. Balances context quality with token costs.

## Error Handling Research

### Decision: Graceful degradation with retry options
**Rationale**: Spec requires user-friendly error messages. Three error states:
1. API unavailable → "Unable to connect. Retry?"
2. Network interruption during streaming → Show partial response + "Connection lost. Retry?"
3. Auth failure → Prompt wallet reconnection

### Decision: Local storage for unsaved edits
**Rationale**: Spec requires preserving unsaved changes if wallet disconnects. Store draft AI persona edits in localStorage keyed by tokenId.

## Accessibility Research

### Decision: WCAG 2.1 AA compliance
**Rationale**: Spec requirement FR-015.

**Implementation Checklist**:
- Focus management when sidebar opens/closes
- Keyboard navigation (Tab, Enter, Escape to close)
- ARIA labels for all interactive elements
- Screen reader announcements for new messages
- Sufficient color contrast in dark theme
- Visible focus indicators

## Dependencies

### Required Additions
```json
{
  "@eliza/sdk": "^1.0.0"
}
```

### Environment Variables
```env
NEXT_PUBLIC_ELIZA_API_URL=http://localhost:3001  # Dev
ELIZA_API_KEY=elk_...                             # Server-side only
```

## Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Eliza API downtime | Medium | High | Graceful error UI, retry mechanism |
| SDK version incompatibility | Low | Medium | Pin SDK version, integration tests |
| Token management complexity | Medium | Medium | Thorough testing of auth proxy |
| Mobile UX issues | Low | Medium | Extensive responsive testing |
