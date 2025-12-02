# Implementation Plan: Character Editor & Chat Integration

**Branch**: `016-character-editor-chat` | **Date**: 2025-12-02 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/016-character-editor-chat/spec.md`

## Summary

Integrate the eliza-editor SDK (`@eliza/sdk`) into wagdie-simplified to enable:
1. **Chat Sidebar** (P1): Slide-out panel on character detail pages for real-time streaming conversations with AI characters
2. **AI Persona Editor** (P2): New tab for character owners to configure personality, system prompt, and example messages
3. **Conversation History** (P3): View and resume past conversations with characters

Technical approach: React components using the SDK's ChatAPI (streaming) and CharactersAPI (CRUD), with wagdie backend proxying Eliza authentication for SSO experience.

## Technical Context

**Language/Version**: TypeScript 5+, React 18+, Node.js 18+
**Primary Dependencies**: Next.js 15 (App Router), @eliza/sdk, wagmi v2, viem v2, RainbowKit 2.2+, Tailwind CSS 3.4, @tanstack/react-query
**Storage**: Supabase PostgreSQL (existing characters table), Eliza API backend (AI characters, conversations)
**Testing**: Jest, React Testing Library
**Target Platform**: Web (Chrome 67+, Firefox 63+, Safari 10.1+, Edge 79+), Mobile responsive (320px+)
**Project Type**: Web application (Next.js App Router)
**Performance Goals**: Chat init <2s, streaming start <1s, sidebar animation <300ms, 10 concurrent sessions/character
**Constraints**: Wallet connection required for chat, AI context window 20-50 messages, WCAG 2.1 AA accessibility
**Scale/Scope**: ~6000 WAGDIE characters, existing user base with wallet connections

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

Constitution file is template (not customized). Proceeding with standard best practices:
- ✅ Feature builds on existing architecture (Next.js App Router, React Query patterns)
- ✅ Uses established SDK (@eliza/sdk) rather than custom implementation
- ✅ Follows existing component patterns in wagdie-simplified
- ✅ No new external dependencies beyond the SDK integration

## Project Structure

### Documentation (this feature)

```text
specs/016-character-editor-chat/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output (API contracts)
└── tasks.md             # Phase 2 output (via /speckit.tasks)
```

### Source Code (repository root)

```text
# Existing structure to extend:
app/
├── characters/
│   └── [tokenId]/
│       └── page.tsx          # MODIFY: Add AI Persona tab, chat toggle
├── api/
│   └── eliza/                # NEW: Proxy endpoints for Eliza API
│       ├── auth/
│       │   └── route.ts      # Token management
│       ├── characters/
│       │   └── route.ts      # AI character CRUD proxy
│       └── chat/
│           └── route.ts      # Chat message proxy with streaming

components/
├── chat/                     # NEW: Chat UI components
│   ├── ChatSidebar.tsx       # Slide-out container
│   ├── ChatHeader.tsx        # Character name, close button
│   ├── ChatMessages.tsx      # Message history with virtualization
│   ├── ChatInput.tsx         # Input with send button
│   └── ChatBubble.tsx        # Individual message bubble
├── characters/
│   └── ai-editor/            # NEW: AI persona editing
│       ├── AIPersonaTab.tsx  # Tab container
│       ├── PersonalityEditor.tsx
│       ├── SystemPromptEditor.tsx
│       └── ExampleMessagesEditor.tsx

hooks/
├── useElizaAuth.ts           # NEW: Eliza auth state management
├── useCharacterChat.ts       # NEW: Chat with streaming
├── useAICharacter.ts         # NEW: AI character CRUD
└── useConversations.ts       # NEW: Conversation history

lib/
└── eliza/                    # NEW: SDK wrapper
    ├── client.ts             # ElizaClient singleton
    └── config.ts             # Environment configuration

types/
└── eliza.ts                  # NEW: Type definitions for Eliza entities
```

**Structure Decision**: Extend existing Next.js App Router structure. New components in dedicated `chat/` and `characters/ai-editor/` directories. API proxy routes under `app/api/eliza/` for SSO token management.

## Complexity Tracking

> No constitution violations to justify. Design follows existing patterns.
