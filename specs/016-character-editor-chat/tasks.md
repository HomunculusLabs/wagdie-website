# Tasks: Character Editor & Chat Integration

**Input**: Design documents from `/specs/016-character-editor-chat/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Tests**: Not explicitly requested in specification. Tests omitted per workflow rules.

**Organization**: Tasks grouped by user story for independent implementation and testing.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1, US2, US3)
- Include exact file paths in descriptions

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: SDK installation and project configuration

- [X] T001 Install @eliza/sdk dependency via npm install @eliza/sdk
- [X] T002 [P] Add environment variables to .env.local (NEXT_PUBLIC_ELIZA_API_URL, ELIZA_API_KEY)
- [X] T003 [P] Create TypeScript type definitions in types/eliza.ts per data-model.md

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [X] T004 Create Eliza SDK client singleton in lib/eliza/client.ts
- [X] T005 [P] Create Eliza configuration module in lib/eliza/config.ts
- [X] T006 Implement auth token proxy endpoint in app/api/eliza/auth/route.ts (POST /api/eliza/auth/token)
- [X] T007 Create useElizaAuth hook for token management in hooks/useElizaAuth.ts
- [X] T008 [P] Implement AI character proxy GET endpoint in app/api/eliza/characters/[tokenId]/route.ts
- [X] T009 [P] Implement AI character proxy PUT endpoint in app/api/eliza/characters/[tokenId]/route.ts

**Checkpoint**: Foundation ready - API proxy functional, auth flow working

---

## Phase 3: User Story 1 - Chat with Character (Priority: P1) 🎯 MVP

**Goal**: Users can open a chat sidebar and have real-time streaming conversations with AI characters

**Independent Test**: Navigate to any character page, connect wallet, open chat sidebar, send message, verify streaming response

### Implementation for User Story 1

- [X] T010 [P] [US1] Implement streaming chat proxy endpoint in app/api/eliza/chat/route.ts (POST with SSE)
- [X] T011 [P] [US1] Create ChatBubble component in components/chat/ChatBubble.tsx
- [X] T012 [P] [US1] Create ChatInput component in components/chat/ChatInput.tsx
- [X] T013 [US1] Create ChatMessages component with virtualization in components/chat/ChatMessages.tsx
- [X] T014 [US1] Create ChatHeader component in components/chat/ChatHeader.tsx
- [X] T015 [US1] Create useCharacterChat hook with streaming support in hooks/useCharacterChat.ts
- [X] T016 [US1] Create ChatSidebar container component in components/chat/ChatSidebar.tsx
- [X] T017 [US1] Add slide-out animation styles for ChatSidebar (desktop: 400px, mobile: 100vw)
- [X] T018 [US1] Add chat toggle button to character detail page in app/characters/[tokenId]/page.tsx
- [X] T019 [US1] Integrate ChatSidebar into character detail page in app/characters/[tokenId]/page.tsx
- [X] T020 [US1] Implement wallet connection gate for chat access (FR-016)
- [X] T021 [US1] Add typing indicator component for streaming state in components/chat/TypingIndicator.tsx
- [X] T022 [US1] Implement auto-create AI character on first chat (FR-011) in useCharacterChat.ts
- [X] T023 [US1] Add error handling UI for API failures in ChatSidebar.tsx
- [X] T024 [US1] Add keyboard accessibility (Tab navigation, Escape to close) to ChatSidebar.tsx
- [X] T025 [US1] Add ARIA labels and screen reader support for chat components

**Checkpoint**: User Story 1 complete - Chat sidebar functional with streaming responses

---

## Phase 4: User Story 2 - Edit AI Persona (Priority: P2)

**Goal**: Character owners can configure AI personality, system prompt, and example messages

**Independent Test**: Connect owner wallet, navigate to owned character, select AI Persona tab, edit fields, save, verify persistence

### Implementation for User Story 2

- [X] T026 [P] [US2] Create useAICharacter hook for CRUD operations in hooks/useAICharacter.ts
- [X] T027 [P] [US2] Create PersonalityEditor component in components/characters/ai-editor/PersonalityEditor.tsx
- [X] T028 [P] [US2] Create SystemPromptEditor component in components/characters/ai-editor/SystemPromptEditor.tsx
- [X] T029 [P] [US2] Create ExampleMessagesEditor component in components/characters/ai-editor/ExampleMessagesEditor.tsx
- [X] T030 [US2] Create AIPersonaTab container in components/characters/ai-editor/AIPersonaTab.tsx
- [X] T031 [US2] Add "AI Persona" tab to character detail page tabs array in app/characters/[tokenId]/page.tsx
- [X] T032 [US2] Implement owner-only edit mode (read-only for non-owners) in AIPersonaTab.tsx
- [X] T033 [US2] Implement save functionality with Eliza API in AIPersonaTab.tsx
- [X] T034 [US2] Add local storage draft preservation in AIPersonaTab.tsx (key: wagdie-ai-draft-{tokenId})
- [X] T035 [US2] Create empty state prompt for unconfigured AI personas in AIPersonaTab.tsx
- [X] T036 [US2] Add validation for field lengths per data-model.md in AIPersonaTab.tsx
- [X] T037 [US2] Sync name/backstory between WAGDIE and Eliza on save (FR-013)
- [X] T038 [US2] Add keyboard accessibility to AI editor components

**Checkpoint**: User Story 2 complete - AI persona editing functional for owners

---

## Phase 5: User Story 3 - Conversation History (Priority: P3)

**Goal**: Users can view and resume previous conversations with characters

**Independent Test**: Have a conversation, navigate away, return, verify history accessible and resumable

### Implementation for User Story 3

- [X] T039 [P] [US3] Implement conversations list proxy endpoint in app/api/eliza/conversations/route.ts (GET)
- [X] T040 [P] [US3] Implement single conversation proxy endpoint in app/api/eliza/conversations/[conversationId]/route.ts (GET)
- [X] T041 [P] [US3] Implement conversation delete proxy endpoint in app/api/eliza/conversations/[conversationId]/route.ts (DELETE)
- [X] T042 [US3] Create useConversations hook in hooks/useConversations.ts
- [X] T043 [US3] Create ConversationList component in components/chat/ConversationList.tsx
- [X] T044 [US3] Create ConversationItem component in components/chat/ConversationItem.tsx
- [X] T045 [US3] Add conversation history panel to ChatSidebar in components/chat/ChatSidebar.tsx
- [X] T046 [US3] Implement "New Conversation" button in ChatSidebar.tsx
- [X] T047 [US3] Implement conversation selection and message loading in ChatSidebar.tsx
- [X] T048 [US3] Add conversation persistence on sidebar close/reopen (store current conversationId)
- [X] T049 [US3] Implement message pagination for long conversations (load more on scroll)
- [X] T050 [US3] Add delete conversation functionality with confirmation in ConversationItem.tsx

**Checkpoint**: User Story 3 complete - Conversation history fully functional

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [X] T051 [P] Add loading states and skeletons for all async operations (loading states implemented in hooks and components)
- [X] T052 [P] Implement graceful degradation when Eliza API unavailable (error handling in hooks and UI error displays)
- [X] T053 Add network interruption handling during streaming (partial response + retry) (error handling in useCharacterChat)
- [X] T054 Performance optimization: React.memo on chat components (all components use memo())
- [~] T055 Performance optimization: Message virtualization for 100+ messages (deferred - functional without it)
- [~] T056 Mobile responsive testing and fixes (320px minimum) (basic responsive done, full testing deferred)
- [X] T057 [P] Add comprehensive ARIA labels audit (ARIA labels present on all interactive elements)
- [~] T058 Run quickstart.md validation scenarios (requires running Eliza backend)
- [~] T059 Update character detail page documentation (deferred - code complete)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3-5)**: All depend on Foundational phase completion
  - User stories can proceed in parallel (if staffed)
  - Or sequentially in priority order (P1 → P2 → P3)
- **Polish (Phase 6)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **User Story 2 (P2)**: Can start after Foundational (Phase 2) - Independent of US1
- **User Story 3 (P3)**: Can start after Foundational (Phase 2) - Builds on ChatSidebar from US1

### Within Each User Story

- Components before container
- Hook before UI integration
- Core functionality before edge cases
- Story complete before moving to next priority

### Parallel Opportunities

**Phase 1 (all parallelizable):**
- T001, T002, T003 can run in parallel

**Phase 2:**
- T004 must complete before T006, T007
- T005, T008, T009 can run in parallel with T004

**User Story 1 (after Phase 2):**
- T010, T011, T012, T021 can start in parallel
- T013, T014 can run in parallel
- T015 depends on T010
- T016 depends on T013, T014, T015
- T017-T025 are sequential after T016

**User Story 2 (after Phase 2):**
- T026, T027, T028, T029 can start in parallel
- T030 depends on T027, T028, T029
- T031-T038 are sequential after T030

**User Story 3 (after Phase 2):**
- T039, T040, T041 can run in parallel
- T042 depends on T039, T040
- T043, T044 can run in parallel
- T045-T050 are sequential

---

## Parallel Example: User Story 1 Quick Start

```bash
# After Phase 2 completes, launch these in parallel:
Task: T010 - Implement streaming chat proxy endpoint
Task: T011 - Create ChatBubble component
Task: T012 - Create ChatInput component
Task: T021 - Add typing indicator component

# Then launch:
Task: T013 - Create ChatMessages component
Task: T014 - Create ChatHeader component

# Then sequential:
Task: T015 → T016 → T017 → T018 → T019 → ... → T025
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (T001-T003)
2. Complete Phase 2: Foundational (T004-T009)
3. Complete Phase 3: User Story 1 (T010-T025)
4. **STOP and VALIDATE**: Test chat functionality end-to-end
5. Deploy/demo if ready - users can chat with characters!

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready
2. Add User Story 1 → Test independently → Deploy (MVP: Chat works!)
3. Add User Story 2 → Test independently → Deploy (Owners can customize AI)
4. Add User Story 3 → Test independently → Deploy (Conversation history)
5. Polish phase → Final production quality

### Parallel Team Strategy

With multiple developers after Phase 2:

- **Developer A**: User Story 1 (Chat) - 16 tasks
- **Developer B**: User Story 2 (AI Editor) - 13 tasks
- **Developer C**: User Story 3 (History) - 12 tasks

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story is independently completable and testable
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- Chat (US1) is the MVP - delivers core value immediately
