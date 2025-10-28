# Tasks: Basic UI Wireframe and Components

**Input**: Design documents from `/specs/002-basic-ui-wireframe/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/, quickstart.md

**Tests**: Tests are NOT explicitly requested in the feature specification. Test tasks are marked as OPTIONAL and can be deferred to Phase 6 (Polish).

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1, US2, US3, US4)
- Include exact file paths in descriptions

## Path Conventions

Project uses Next.js App Router structure:
- `app/`: Next.js pages and layouts
- `components/`: React components
- `lib/`: Core business logic and utilities
- `hooks/`: Custom React hooks
- `types/`: TypeScript type definitions
- `styles/`: Global styles and Tailwind config
- `__tests__/`: Test files

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and dependency installation

- [x] T001 Install RainbowKit, wagmi, and viem packages: `npm install @rainbow-me/rainbowkit wagmi viem @tanstack/react-query`
- [x] T002 [P] Install SIWE package for authentication: `npm install siwe`
- [x] T003 [P] Install optional toast notification library: `npm install react-hot-toast`
- [x] T004 Create WalletConnect project and add NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID to .env.local
- [x] T005 Create directory structure: `components/layout/`, `components/wallet/`, `hooks/`, `types/`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core configuration that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T006 Create wagmi configuration file at `lib/wagmi.ts` with mainnet chain and WalletConnect project ID
- [x] T007 Create providers wrapper component at `app/providers.tsx` with WagmiProvider, QueryClientProvider, and RainbowKitProvider
- [x] T008 [P] Configure Tailwind with gothic dark theme colors in `tailwind.config.ts` (abyss, shadow, midnight, bone, ash, mist, blood, ember, gold, poison, arcane)
- [x] T009 [P] Add global CSS utility classes in `app/globals.css` (.btn-primary, .btn-secondary, .nav-link, .nav-link.active)
- [x] T010 [P] Import RainbowKit styles in `app/layout.tsx`: `import '@rainbow-me/rainbowkit/styles.css'`
- [x] T011 Update root HTML element in `app/layout.tsx` to include `className="dark"` for dark mode
- [x] T012 [P] Create TypeScript types file at `types/wallet.ts` for Address, WalletConnectorId, WalletStatus, SIWEStep types

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Wallet Connection and Authentication (Priority: P1) 🎯 MVP

**Goal**: Users can connect their wallet (MetaMask, WalletConnect, Rainbow, Coinbase), authenticate via SIWE, see their address in the UI, and disconnect

**Independent Test**:
1. Click "Connect Wallet" button → RainbowKit modal opens with 4 wallet options
2. Select wallet and approve connection → Address appears truncated in button (0x1234...5678)
3. Click address → Dropdown shows "Disconnect" option
4. Click "Disconnect" → Returns to "Connect Wallet" state
5. Refresh page after connecting → Wallet reconnects automatically and session persists

### Implementation for User Story 1

- [x] T013 [P] [US1] Create useWalletAuth custom hook at `hooks/useWalletAuth.ts` that integrates wagmi useAccount with SIWE authentication flow
- [x] T014 [P] [US1] Implement nonce fetching logic in useWalletAuth: POST to `/api/auth/nonce` with address
- [x] T015 [P] [US1] Implement SIWE message signing logic in useWalletAuth using wagmi's useSignMessage hook
- [x] T016 [P] [US1] Implement signature verification logic in useWalletAuth: POST to `/api/auth/verify` with address, signature, message
- [x] T017 [P] [US1] Implement disconnect logic in useWalletAuth: POST to `/api/auth/logout` and call wagmi disconnect
- [x] T018 [P] [US1] Add auto-authentication effect in useWalletAuth when wallet address changes
- [x] T019 [P] [US1] Create WalletButton component at `components/wallet/WalletButton.tsx` with connect, connecting, and connected states
- [x] T020 [US1] Implement truncateAddress utility function in WalletButton to show "0x1234...5678" format
- [x] T021 [US1] Connect WalletButton to useWalletAuth hook and useConnectModal from RainbowKit
- [x] T022 [US1] Add loading spinner or "Connecting..." text to WalletButton when isConnecting is true
- [x] T023 [P] [US1] Create UserDropdown component at `components/wallet/UserDropdown.tsx` with dropdown menu (profile, settings, disconnect)
- [x] T024 [US1] Implement dropdown open/close state management in UserDropdown using useState
- [x] T025 [US1] Add "Disconnect Wallet" action to UserDropdown that calls disconnect from useWalletAuth
- [x] T026 [US1] Add click-outside detection to UserDropdown to close menu when clicking elsewhere
- [x] T027 [US1] Style UserDropdown with gothic theme (bg-shadow, text-bone, border-midnight, hover:bg-abyss)

**Checkpoint**: At this point, wallet connection + SIWE authentication should be fully functional. Test by connecting wallet, refreshing page, and disconnecting.

---

## Phase 4: User Story 2 - Site Navigation and Layout (Priority: P1)

**Goal**: Users can navigate between pages (Home, Characters, Lore, Gather) with consistent header and footer, active page highlighting, and mobile hamburger menu

**Independent Test**:
1. Navigate to each section → Header and footer remain consistent
2. Active navigation item is highlighted with gold underline
3. On mobile (<768px) → Hamburger menu appears and works
4. External links in footer open Discord, OpenSea, Twitter in new tabs

### Implementation for User Story 2

- [x] T028 [P] [US2] Create Navigation component at `components/layout/Navigation.tsx` with nav items array (Home, Characters, Lore, Gather)
- [x] T029 [P] [US2] Use Next.js usePathname hook in Navigation to determine active route
- [x] T030 [P] [US2] Map nav items to Link components with conditional active class based on current path
- [x] T031 [US2] Add mobile menu toggle state (isMobileMenuOpen) to Navigation using useState
- [x] T032 [US2] Implement hamburger button in Navigation that toggles mobile menu on click
- [x] T033 [US2] Style Navigation for desktop (hidden md:flex) and mobile (md:hidden) using Tailwind responsive classes
- [x] T034 [US2] Add active state styling to nav links: gold text color and bottom border for active page
- [x] T035 [P] [US2] Create Header component at `components/layout/Header.tsx` that contains logo, Navigation, and WalletButton
- [x] T036 [US2] Add sticky positioning to Header (sticky top-0 z-50) with bg-abyss and border-bottom
- [x] T037 [US2] Arrange Header layout with logo left, navigation center, wallet button right using flexbox
- [x] T038 [US2] Implement mobile Header layout with logo left, hamburger center-right, wallet button in mobile menu
- [x] T039 [P] [US2] Create Footer component at `components/layout/Footer.tsx` with external links array (Discord, OpenSea, Twitter)
- [x] T040 [US2] Map external links to anchor tags with target="_blank" and rel="noopener noreferrer" in Footer
- [x] T041 [US2] Add copyright text and project description to Footer
- [x] T042 [US2] Style Footer with bg-shadow, border-top, centered layout, and text-ash for links
- [x] T043 [US2] Update `app/layout.tsx` to include Header and Footer wrapping children with Providers
- [x] T044 [US2] Add flex container to body in `app/layout.tsx`: flex flex-col min-h-screen bg-abyss text-bone
- [x] T045 [US2] Set main content area to flex-1 so footer stays at bottom

**Checkpoint**: At this point, navigation should work on desktop and mobile. Test by navigating between pages, resizing browser, and clicking external links.

---

## Phase 5: User Story 3 - Gothic Dark Theme Experience (Priority: P2)

**Goal**: All pages display gothic dark theme with consistent colors, typography, and visual effects (hover animations, transitions)

**Independent Test**:
1. Visit any page → Background is dark (abyss), text is readable (bone)
2. Hover over buttons/links → Color transitions to ember/gold
3. All UI elements use gothic color palette consistently
4. Typography is readable while maintaining fantasy aesthetic

### Implementation for User Story 3

- [x] T046 [P] [US3] Verify Tailwind theme colors are applied in `tailwind.config.ts` (already done in T008, validate only)
- [ ] T047 [P] [US3] Add custom font configuration to Tailwind theme for gothic headers (consider Cinzel or MedievalSharp from Google Fonts)
- [ ] T048 [P] [US3] Import custom fonts in `app/layout.tsx` using next/font/google
- [ ] T049 [US3] Update globals.css to set font-family for headers (font-heading) and body (font-body)
- [x] T050 [US3] Add hover transitions to .btn-primary class: hover:bg-ember with transition-colors duration-200
- [x] T051 [US3] Add hover transitions to .btn-secondary class: hover:bg-shadow with transition-colors duration-200
- [x] T052 [US3] Add hover transitions to .nav-link class: hover:text-bone with transition-colors duration-150
- [x] T053 [US3] Apply theme colors to WalletButton: bg-blood for primary state, bg-midnight for connected state
- [x] T054 [US3] Apply theme colors to UserDropdown: bg-shadow for dropdown panel, border-midnight, hover:bg-abyss for menu items
- [x] T055 [US3] Apply theme colors to Header: bg-abyss, border-b border-midnight
- [x] T056 [US3] Apply theme colors to Footer: bg-shadow, border-t border-midnight, text-ash for secondary text
- [x] T057 [US3] Test color contrast for accessibility: ensure bone text on abyss background meets WCAG AA standards (4.5:1 ratio)

**Checkpoint**: At this point, gothic theme should be fully applied. Test by viewing all pages and checking colors, fonts, and hover effects.

---

## Phase 6: User Story 4 - Responsive Mobile Experience (Priority: P2)

**Goal**: All layouts adapt to mobile (< 768px), tablet (768-1024px), and desktop (> 1024px) with proper touch targets and responsive navigation

**Independent Test**:
1. Resize browser to <768px → Hamburger menu appears, navigation moves to mobile menu
2. Touch targets are at least 44x44px for buttons and menu items
3. All content is readable without horizontal scrolling on 320px width
4. Wallet modal is usable on mobile with large tap targets

### Implementation for User Story 4

- [x] T058 [P] [US4] Add responsive container classes to Header: container mx-auto px-4
- [x] T059 [P] [US4] Ensure WalletButton touch target is at least 44x44px: min-h-[44px] min-w-[44px] px-4 py-2
- [x] T060 [P] [US4] Ensure hamburger button touch target is 44x44px: w-11 h-11 (44px = 11 * 4px)
- [x] T061 [US4] Ensure Navigation menu items have 44x44px touch targets on mobile: py-3 px-4 (48px height)
- [x] T062 [US4] Test mobile menu close on navigation: add onClick handler to nav links that closes mobile menu
- [x] T063 [US4] Add responsive breakpoints to Navigation: flex-col gap-4 on mobile, flex-row gap-6 on desktop (md:flex-row md:gap-6)
- [x] T064 [US4] Test UserDropdown on mobile: ensure dropdown doesn't overflow screen, position correctly
- [x] T065 [US4] Add responsive padding to Footer: py-6 px-4 on mobile, py-8 on desktop
- [ ] T066 [US4] Test layout on 320px width (smallest phone): verify no horizontal scrolling
- [ ] T067 [US4] Test layout on 768px width (tablet): verify navigation adapts correctly at breakpoint
- [ ] T068 [US4] Test layout on 1024px+ width (desktop): verify full navigation shows
- [x] T069 [US4] Configure RainbowKit modal for mobile: ensure touch targets are appropriate size (RainbowKit handles this automatically, validate only)

**Checkpoint**: At this point, all responsive breakpoints should work correctly. Test on Chrome DevTools responsive mode with different device presets.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Final improvements, testing, and documentation

- [x] T070 [P] Add meta tags to `app/layout.tsx` for SEO: title, description, Open Graph tags
- [ ] T071 [P] Add favicon.ico and apple-touch-icon.png to `public/` directory
- [x] T072 [P] Test wallet connection flow end-to-end: connect → sign → disconnect → reconnect
- [x] T073 [P] Test session persistence: connect wallet, refresh page, verify auto-reconnect
- [x] T074 [P] Test wrong network handling: connect on Polygon, verify network switch prompt appears
- [x] T075 [P] Test error states: reject wallet connection, reject signature, verify error messages
- [x] T076 [P] Add console error handling for SIWE failures in useWalletAuth
- [x] T077 [P] Verify all Tailwind classes are used correctly (no typos or invalid classes)
- [x] T078 [P] Run `npm run build` to check for TypeScript errors and build issues
- [ ] T079 [P] Validate all external links work (Discord, OpenSea, Twitter)
- [x] T080 [P] Test with MetaMask wallet
- [x] T081 [P] Test with WalletConnect (mobile wallet)
- [x] T082 [P] Run quickstart.md validation: follow all steps and verify feature works
- [x] T083 [P] Add JSDoc comments to useWalletAuth hook explaining SIWE flow
- [x] T084 [P] Add component documentation comments to WalletButton, UserDropdown, Header, Footer, Navigation
- [x] T085 Code cleanup: remove console.logs, unused imports, commented code

### Optional: Testing Tasks (Deferred unless explicitly requested)

- [ ] T086 [P] [OPTIONAL] Setup Jest and React Testing Library configuration in `jest.config.js` and `jest.setup.js`
- [ ] T087 [P] [OPTIONAL] Create component test for WalletButton at `__tests__/components/WalletButton.test.tsx`
- [ ] T088 [P] [OPTIONAL] Create component test for Header at `__tests__/components/Header.test.tsx`
- [ ] T089 [P] [OPTIONAL] Setup Playwright configuration at `playwright.config.ts`
- [ ] T090 [P] [OPTIONAL] Create E2E test for wallet connection flow at `__tests__/e2e/wallet-connection.spec.ts`
- [ ] T091 [P] [OPTIONAL] Create E2E test for navigation at `__tests__/e2e/navigation.spec.ts`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Story 1 (Phase 3)**: Depends on Foundational (Phase 2) - No dependencies on other stories
- **User Story 2 (Phase 4)**: Depends on Foundational (Phase 2) - Integrates with US1 (uses WalletButton) but can be developed in parallel
- **User Story 3 (Phase 5)**: Depends on Foundational (Phase 2) and US1/US2 components - Applies theme to existing components
- **User Story 4 (Phase 6)**: Depends on Foundational (Phase 2) and US1/US2 components - Adds responsive behavior to existing components
- **Polish (Phase 7)**: Depends on all user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Foundation only - Can start immediately after Phase 2
- **User Story 2 (P1)**: Foundation + uses WalletButton from US1 - Can develop in parallel with US1 if using placeholder for wallet button initially
- **User Story 3 (P2)**: Requires US1 and US2 components to exist - Applies styling/theme to them
- **User Story 4 (P2)**: Requires US1 and US2 components to exist - Adds responsive behavior to them

**Recommended Order**: US1 → US2 → US3 + US4 in parallel

### Within Each User Story

**User Story 1**:
- T013-T018 (useWalletAuth hook logic) can run in parallel
- T019-T022 (WalletButton component) can run in parallel with hook tasks
- T023 (UserDropdown creation) can start in parallel
- T024-T027 (UserDropdown logic) must be sequential

**User Story 2**:
- T028-T034 (Navigation component) can be developed first
- T035-T038 (Header component) depends on Navigation existing
- T039-T042 (Footer component) can be parallel with Header
- T043-T045 (Layout integration) requires Header and Footer to exist

**User Story 3**:
- All theme tasks (T046-T057) can be done in parallel on different files

**User Story 4**:
- All responsive tasks (T058-T069) can be done in parallel on different files

### Parallel Opportunities

- **Phase 1 (Setup)**: T001, T002, T003 can all run in parallel
- **Phase 2 (Foundational)**: T008, T009, T010, T012 can run in parallel
- **Phase 3 (US1)**: T013-T018 parallel, T019-T022 parallel, T023 parallel with others
- **Phase 4 (US2)**: T028 and T039 can start in parallel
- **Phase 5 (US3)**: All tasks T046-T057 can run in parallel
- **Phase 6 (US4)**: All tasks T058-T069 can run in parallel
- **Phase 7 (Polish)**: Most tasks T070-T085 can run in parallel

---

## Parallel Example: User Story 1

```bash
# Launch useWalletAuth hook tasks together:
Task: "Create useWalletAuth custom hook at hooks/useWalletAuth.ts"
Task: "Implement nonce fetching logic in useWalletAuth"
Task: "Implement SIWE message signing logic in useWalletAuth"
Task: "Implement signature verification logic in useWalletAuth"
Task: "Implement disconnect logic in useWalletAuth"
Task: "Add auto-authentication effect in useWalletAuth"

# In parallel, launch WalletButton tasks:
Task: "Create WalletButton component at components/wallet/WalletButton.tsx"
Task: "Add loading spinner to WalletButton"

# In parallel, start UserDropdown:
Task: "Create UserDropdown component at components/wallet/UserDropdown.tsx"
```

---

## Implementation Strategy

### MVP First (User Story 1 + User Story 2 Only)

**Minimum Viable Product**: Wallet connection + Navigation

1. Complete Phase 1: Setup (T001-T005)
2. Complete Phase 2: Foundational (T006-T012) - CRITICAL
3. Complete Phase 3: User Story 1 (T013-T027) - Wallet connection works
4. Complete Phase 4: User Story 2 (T028-T045) - Navigation works
5. **STOP and VALIDATE**:
   - Connect wallet → see address
   - Navigate between pages → header/footer consistent
   - Test on mobile → hamburger menu works
6. Deploy MVP or demo

**This gives you a functional platform where users can connect wallets and navigate - the foundation for all future features.**

### Incremental Delivery

1. **Foundation** (Phases 1-2) → Dependencies installed, config complete
2. **MVP** (Phases 3-4) → Wallet + Navigation working → Deploy v0.1
3. **Polished** (Phase 5) → Gothic theme applied → Deploy v0.2
4. **Mobile-Optimized** (Phase 6) → Responsive on all devices → Deploy v0.3
5. **Production-Ready** (Phase 7) → Tests pass, docs complete → Deploy v1.0

Each phase adds value without breaking previous work.

### Parallel Team Strategy

With multiple developers:

1. **Together**: Complete Setup + Foundational (critical path)
2. **After Foundational completes**:
   - **Developer A**: User Story 1 (Wallet connection)
   - **Developer B**: User Story 2 (Navigation, can use placeholder wallet button initially)
3. **After US1 + US2 complete**:
   - **Developer A**: User Story 3 (Theme)
   - **Developer B**: User Story 4 (Responsive)
4. **Together**: Polish and testing

---

## Task Checklist Summary

- **Total Tasks**: 91 tasks (85 implementation + 6 optional test tasks)
- **Phase 1 (Setup)**: 5 tasks
- **Phase 2 (Foundational)**: 7 tasks (CRITICAL - blocks all user stories)
- **Phase 3 (US1 - Wallet)**: 15 tasks
- **Phase 4 (US2 - Navigation)**: 18 tasks
- **Phase 5 (US3 - Theme)**: 12 tasks
- **Phase 6 (US4 - Responsive)**: 12 tasks
- **Phase 7 (Polish)**: 16 tasks (+ 6 optional test tasks)

**Parallel Opportunities**: ~60% of tasks can be parallelized (all tasks marked [P])

**MVP Scope**: Phases 1-4 (45 tasks) = Wallet connection + Navigation

**Estimated Time**:
- MVP (Phases 1-4): 4-5 hours
- Full Feature (Phases 1-7): 6-8 hours
- With full testing: +2-3 hours

---

## Notes

- [P] tasks = different files, no dependencies, can run in parallel
- [Story] label maps task to specific user story for traceability and independent testing
- Each user story should be independently completable and testable
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- Follow quickstart.md for detailed implementation guidance on each task
- Refer to contracts/component-interfaces.ts for TypeScript type definitions
- Refer to data-model.md for state management patterns
