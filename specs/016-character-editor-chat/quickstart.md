# Quickstart: Character Editor & Chat Integration

**Feature**: 016-character-editor-chat
**Date**: 2025-12-02

## Prerequisites

- Node.js 18+
- WAGDIE development environment running (`npm run dev`)
- Eliza API backend running (default: `http://localhost:3001`)
- Wallet with WAGDIE NFT ownership (for testing owner features)

## Setup

### 1. Install Dependencies

```bash
npm install @eliza/sdk
```

### 2. Configure Environment

Add to `.env.local`:

```env
# Eliza API Configuration
NEXT_PUBLIC_ELIZA_API_URL=http://localhost:3001
ELIZA_API_KEY=elk_your_api_key_here
```

### 3. Start Development Servers

Terminal 1 - Eliza API:
```bash
cd ~/projects/eliza-editor
npm run dev
```

Terminal 2 - WAGDIE:
```bash
cd ~/projects/wagdie-simplified
npm run dev
```

## Quick Test Flow

### Test 1: Chat with Character (P1)

1. Navigate to any character detail page: `http://localhost:3000/characters/1`
2. Connect wallet using RainbowKit
3. Click the "Chat" button in the header
4. Verify sidebar slides in from right
5. Type a message and send
6. Verify streaming response appears

### Test 2: Edit AI Persona (P2)

1. Navigate to a character you own
2. Connect owner wallet
3. Click "AI Persona" tab
4. Edit personality field
5. Click Save
6. Open chat and verify personality affects responses

### Test 3: Conversation History (P3)

1. Have a conversation with a character
2. Navigate away and return
3. Open chat sidebar
4. Verify previous conversation is listed
5. Select it and verify messages load

## Component Usage

### ChatSidebar

```tsx
import { ChatSidebar } from '@/components/chat/ChatSidebar'

function CharacterPage({ tokenId }: { tokenId: string }) {
  const [isChatOpen, setIsChatOpen] = useState(false)

  return (
    <>
      <button onClick={() => setIsChatOpen(true)}>Chat</button>
      <ChatSidebar
        tokenId={tokenId}
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
      />
    </>
  )
}
```

### AIPersonaTab

```tsx
import { AIPersonaTab } from '@/components/characters/ai-editor/AIPersonaTab'

function CharacterTabs({ tokenId, isOwner }: Props) {
  return (
    <Tabs>
      {/* ... other tabs ... */}
      <Tab id="ai-persona" label="AI Persona">
        <AIPersonaTab
          tokenId={tokenId}
          isOwner={isOwner}
          readOnly={!isOwner}
        />
      </Tab>
    </Tabs>
  )
}
```

### useCharacterChat Hook

```tsx
import { useCharacterChat } from '@/hooks/useCharacterChat'

function ChatInterface({ tokenId }: { tokenId: string }) {
  const {
    messages,
    sendMessage,
    isStreaming,
    streamingContent,
    error
  } = useCharacterChat(tokenId)

  const handleSend = async (content: string) => {
    await sendMessage(content)
  }

  return (
    <div>
      {messages.map(msg => (
        <ChatBubble key={msg.id} message={msg} />
      ))}
      {isStreaming && (
        <ChatBubble
          message={{ role: 'assistant', content: streamingContent }}
          isStreaming
        />
      )}
      <ChatInput onSend={handleSend} disabled={isStreaming} />
    </div>
  )
}
```

## API Proxy Endpoints

All Eliza API calls go through WAGDIE backend proxy:

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/eliza/auth/token` | POST | Get/refresh Eliza access token |
| `/api/eliza/characters/{tokenId}` | GET | Get AI character by WAGDIE token |
| `/api/eliza/characters/{tokenId}` | PUT | Create/update AI character |
| `/api/eliza/chat` | POST | Send message (SSE streaming) |
| `/api/eliza/conversations` | GET | List conversations |
| `/api/eliza/conversations/{id}` | GET | Get conversation with messages |
| `/api/eliza/conversations/{id}` | DELETE | Delete conversation |

## Troubleshooting

### "Unable to connect to chat service"

1. Verify Eliza API is running on configured URL
2. Check `ELIZA_API_KEY` is set correctly
3. Check browser console for CORS errors

### "Wallet connection required"

1. Chat requires wallet connection (per spec clarification)
2. Click Connect Wallet in header
3. Sign the SIWE message

### "Not character owner" on AI Persona edit

1. Verify connected wallet owns the character
2. Check Supabase `characters.owner_address` matches wallet

### Streaming not working

1. Check browser supports EventSource
2. Verify `/api/eliza/chat` returns `text/event-stream` content type
3. Check for proxy timeout issues (default 120s)

## Development Notes

### Local Storage Keys

- `wagdie-ai-draft-{tokenId}` - Unsaved AI persona edits
- `wagdie-chat-conversation-{tokenId}` - Current conversation ID

### React Query Cache Keys

- `['ai-character', tokenId]` - AI character data
- `['conversations', userId, tokenId?]` - Conversation list
- `['conversation', conversationId]` - Single conversation with messages

### Mobile Breakpoint

Chat sidebar switches to full-screen at `< 768px` (md breakpoint).
