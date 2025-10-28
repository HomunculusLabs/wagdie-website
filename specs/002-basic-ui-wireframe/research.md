# Research & Technology Decisions: Basic UI Wireframe

**Feature**: 002-basic-ui-wireframe
**Date**: 2025-10-27
**Purpose**: Document technology choices and best practices for foundational UI implementation

## 1. Testing Framework Selection

### Decision
Use **Jest 29+ with React Testing Library** for component/unit tests and **Playwright** for end-to-end wallet connection flows.

### Rationale
- **Jest + React Testing Library**: Industry standard for React component testing, built-in Next.js support, minimal configuration required
- **Playwright**: Superior for Web3 testing compared to Cypress - can mock wallet interactions more reliably, better multi-browser support
- **Alignment with constitution**: Simple, standard tools with minimal setup (no custom test infrastructure)

### Alternatives Considered
- **Vitest**: Faster than Jest but adds dependency churn, Jest is more stable and better documented for Next.js
- **Cypress**: Popular but Playwright has better Web3 extension mocking and faster execution
- **No E2E tests**: Rejected because wallet connection is critical path requiring integration testing per constitution principle V

### Implementation Notes
- Jest config extends Next.js defaults (`next/jest`)
- Mock wagmi hooks in component tests using `@wagmi/core/test`
- Playwright tests will use `playwright-wallet` or manual MetaMask extension mocking
- Test files: `__tests__/components/*.test.tsx` and `__tests__/e2e/*.spec.ts`

---

## 2. Wallet Integration: RainbowKit vs Custom Implementation

### Decision
Use **RainbowKit v2** with **wagmi v2** and **viem v2** for wallet connection.

### Rationale
- **Simplicity First (Constitution I)**: RainbowKit provides pre-built wallet connection modal, eliminates custom wallet connector code
- **UX Excellence (Constitution VII)**: RainbowKit has polished animations, error handling, and loading states out-of-the-box
- **Community Standard**: Most popular wallet connection library in React/Web3 ecosystem (100k+ weekly downloads)
- **Type Safety (Constitution IV)**: Fully typed with TypeScript, integrates seamlessly with wagmi/viem
- **Multi-wallet Support**: Supports MetaMask, WalletConnect, Rainbow, Coinbase Wallet without custom code

### Alternatives Considered
- **Custom wallet connectors**: Rejected due to complexity - would require maintaining connector code for 4+ wallet types
- **Web3Modal (WalletConnect)**: Good alternative but RainbowKit has better React integration and Next.js support
- **wagmi alone (no RainbowKit)**: Requires building custom UI for wallet selection - violates simplicity principle

### Implementation Notes
- Install: `@rainbow-me/rainbowkit`, `wagmi`, `viem`
- Config file: `lib/wagmi.ts` exports wagmi config and chains
- Wrap app in `<RainbowKitProvider>` in `app/layout.tsx`
- Theme customization: RainbowKit supports custom themes matching gothic aesthetic

### Integration with SIWE
RainbowKit has built-in SIWE adapter (`RainbowKitSiweNextAuthProvider`), but we're using custom SIWE endpoints:
- After wallet connection (wagmi `useAccount`), manually call `/api/auth/nonce` and `/api/auth/verify`
- Use custom hook `useWalletAuth` to orchestrate: wallet connect → get nonce → sign message → verify → session
- This preserves existing SIWE backend without modification

---

## 3. Gothic Dark Theme Implementation

### Decision
Use **Tailwind CSS custom theme** with dark mode configuration and custom color palette.

### Rationale
- **Already in stack**: Tailwind CSS is in the project (per features checklist), no new dependency
- **Constitution II (Community Accessibility)**: Tailwind's utility-first approach is familiar to most React developers
- **Flexibility**: Can customize colors, fonts, and spacing without complex CSS architecture
- **Performance**: No runtime CSS-in-JS overhead, all styles compiled at build time

### Alternatives Considered
- **CSS Modules**: More verbose, harder for contributors to understand theming
- **Styled Components / Emotion**: Adds runtime overhead, complex setup, violates Simplicity First
- **Plain CSS**: Harder to maintain consistency, Tailwind utilities are more reusable

### Theme Configuration

#### Color Palette (Gothic Dark Fantasy)
```javascript
// tailwind.config.js
colors: {
  // Background shades - deep blacks and dark grays
  'abyss': '#0a0a0a',        // Deepest black for backgrounds
  'shadow': '#1a1a1a',       // Card/panel backgrounds
  'midnight': '#252525',     // Hover states, borders

  // Text colors
  'bone': '#e8e8e8',         // Primary text (off-white)
  'ash': '#b0b0b0',          // Secondary text (muted gray)
  'mist': '#707070',         // Tertiary text, disabled states

  // Accent colors - muted fantasy tones
  'blood': '#8b2635',        // Primary accent (muted red)
  'ember': '#c94a3a',        // Hover/active states (brighter red)
  'gold': '#d4af37',         // Highlights, important elements
  'poison': '#4a7c59',       // Success states (muted green)
  'arcane': '#6a4c93',       // Links, info (muted purple)
}
```

#### Typography
- **Headers**: Consider "Cinzel" or "MedievalSharp" from Google Fonts for gothic headers
- **Body**: "Inter" or "Roboto" for readability (don't sacrifice legibility for theme)
- **Font weights**: Use 400 (normal) and 700 (bold) to keep font bundle small

#### Responsive Breakpoints (Tailwind defaults)
- `sm`: 640px (phones landscape)
- `md`: 768px (tablets)
- `lg`: 1024px (desktop)
- `xl`: 1280px (large desktop)

### Implementation Notes
- Update `tailwind.config.js` with custom colors and fonts
- Use Tailwind's `dark:` variant (set `darkMode: 'class'` and add `dark` class to `<html>`)
- Create reusable component classes in `globals.css` for common patterns:
  - `.btn-primary`, `.btn-secondary` for consistent button styles
  - `.card` for common panel styling
  - `.nav-link` for navigation items

---

## 4. Responsive Navigation Pattern

### Decision
Use **CSS-based hamburger menu** with Tailwind's responsive utilities and React state for open/close.

### Rationale
- **Simplicity**: Pure CSS transitions, no animation libraries required
- **Performance**: Hardware-accelerated CSS transforms, no JavaScript animation
- **Accessibility**: Can be implemented with proper ARIA attributes and keyboard navigation

### Pattern Details

#### Desktop (≥768px)
- Horizontal navigation bar with inline links
- Wallet button on right side
- Logo/brand on left
- No hamburger menu visible

#### Mobile (<768px)
- Hamburger icon (☰) top-right
- Logo/brand top-left
- On tap: full-screen or slide-in menu with navigation links
- Wallet button prominently placed in menu

### Implementation Notes
- Component: `components/layout/Navigation.tsx` with `useState` for menu open/close
- Tailwind: Use `hidden md:flex` (desktop) and `md:hidden` (mobile) to show/hide appropriately
- Animation: CSS transition on `transform: translateX()` for slide-in effect
- Touch targets: Ensure hamburger icon and menu items are at least 44x44px (per FR-010)
- Accessibility:
  - `aria-expanded` on hamburger button
  - `aria-label="Main navigation menu"`
  - Keyboard: Escape key closes menu, Tab navigates links

---

## 5. Session Persistence Strategy

### Decision
Use **HTTP-only cookies** for session tokens (existing SIWE implementation) and **localStorage** for wallet address caching.

### Rationale
- **Security**: HTTP-only cookies prevent XSS attacks on session tokens
- **Existing pattern**: SIWE backend already uses cookies (`/api/auth/verify` sets cookie)
- **Wallet reconnection**: wagmi automatically reconnects wallet on page load (uses localStorage internally)
- **No changes needed**: Leverages existing authentication infrastructure

### Implementation Notes
- Backend (`/api/auth/verify`) already sets session cookie
- Frontend: After successful SIWE, wagmi persists wallet connection automatically
- On page load: wagmi reconnects wallet → check session cookie → if both valid, user is authenticated
- Logout: Call `/api/auth/logout` to clear cookie + disconnect wallet (wagmi `disconnect()`)

---

## 6. Component Architecture Patterns

### Decision
Use **presentational/container component pattern** with custom hooks for business logic.

### Rationale
- **Clean Architecture (Constitution III)**: Separates UI from logic
- **Testability**: Presentational components easy to test with mocked props
- **Reusability**: Presentational components can be reused with different logic hooks

### Pattern Example

#### Presentational Component
```typescript
// components/wallet/WalletButton.tsx
interface WalletButtonProps {
  address: string | null;
  isConnecting: boolean;
  onConnect: () => void;
  onDisconnect: () => void;
}

export function WalletButton({ address, isConnecting, onConnect, onDisconnect }: WalletButtonProps) {
  // Pure UI logic only
}
```

#### Container Hook
```typescript
// hooks/useWalletAuth.ts
export function useWalletAuth() {
  const { address, isConnecting } = useAccount(); // wagmi hook
  const { openConnectModal } = useConnectModal(); // RainbowKit hook
  // Business logic: SIWE flow, session management
  return { address, isConnecting, handleConnect, handleDisconnect };
}
```

#### Usage
```typescript
// In page or parent component
function Header() {
  const walletAuth = useWalletAuth();
  return <WalletButton {...walletAuth} />;
}
```

### Component Organization
- **Atomic design inspired** (but not strict):
  - `components/ui/`: Buttons, inputs (reusable primitives)
  - `components/layout/`: Header, Footer, Navigation (layout-specific)
  - `components/wallet/`: Wallet-specific UI (domain-specific)

---

## 7. Error Handling Best Practices

### Decision
Use **React Error Boundaries** for component errors and **toast notifications** for user-facing errors.

### Rationale
- **User Experience**: Error boundaries prevent full app crashes, toasts provide feedback
- **Constitution VII (Web3 Pragmatism)**: Clear error messages for wallet/blockchain errors
- **Simplicity**: Use lightweight toast library (e.g., `react-hot-toast`) or build simple custom toast

### Error Categories & Handling

#### Wallet Connection Errors
- **User rejection**: "Wallet connection cancelled" (info toast, not error)
- **Unsupported network**: "Please switch to Ethereum Mainnet" (prompt with switch button)
- **No wallet installed**: "Install MetaMask or use WalletConnect" (with links)
- **Connection timeout**: "Connection timed out. Please try again."

#### Session/Auth Errors
- **SIWE signature failure**: "Authentication failed. Please try connecting again."
- **Session expired**: "Your session has expired. Please reconnect your wallet."
- **Backend error**: "Unable to authenticate. Please try again later."

#### General UI Errors
- **Network errors**: "Network error. Check your connection."
- **Unexpected errors**: Error boundary catches, shows fallback UI

### Implementation Notes
- Install: `react-hot-toast` (or build custom toast component for ultimate simplicity)
- Error boundary: Create `components/ErrorBoundary.tsx` wrapping main layout
- Wallet errors: wagmi provides error objects with `.message` - map to user-friendly messages
- Logging: Console.error for debugging, consider Sentry for production (future enhancement)

---

## 8. Performance Optimization Strategies

### Decision
Implement **code splitting**, **image optimization**, and **lazy loading** for components below the fold.

### Rationale
- **Success Criteria SC-001/SC-002**: <3s initial load, <1s navigation requires optimization
- **Next.js built-in**: Automatic code splitting per route, Image component optimization
- **Constitution I (Simplicity)**: Use platform features, avoid custom bundler config

### Optimization Checklist

#### Code Splitting
- ✅ Automatic: Next.js splits by page/route
- ✅ Manual: Use `next/dynamic` for heavy components (e.g., RainbowKit modal)
- Example: `const WalletModal = dynamic(() => import('./WalletModal'), { ssr: false });`

#### Asset Optimization
- Use `next/image` for all images (automatic WebP, lazy loading, responsive)
- Fonts: Subset Google Fonts to only required characters
- Icons: Use SVG icons inline or via `next/image` (avoid icon libraries like FontAwesome)

#### Bundle Size
- RainbowKit: ~80KB gzipped (acceptable for wallet functionality)
- Tailwind: Purge unused styles in production (configured by default)
- Avoid: Heavy animation libraries (use CSS), lodash (use native JS), moment.js (use native Date or date-fns)

#### Runtime Performance
- Minimize re-renders: Use `React.memo` for expensive components
- Debounce: For search/filter inputs (if implemented)
- Virtualization: NOT needed for this feature (no long lists yet)

### Implementation Notes
- Monitor bundle size: `npm run build` shows size warnings
- Lighthouse: Target score >90 for Performance, Accessibility
- Real-world testing: Test on throttled 3G network (Chrome DevTools)

---

## Summary of Technology Stack

| Category | Technology | Version | Justification |
|----------|-----------|---------|---------------|
| Framework | Next.js | 15+ | Existing stack, App Router for modern patterns |
| UI Library | React | 18+ | Existing stack, industry standard |
| Language | TypeScript | 5+ | Constitution IV (Type Safety) |
| Styling | Tailwind CSS | Latest | Existing stack, community accessible |
| Wallet | RainbowKit | 2.x | Simplicity (pre-built UI), UX excellence |
| Web3 Library | wagmi | 2.x | RainbowKit dependency, fully typed |
| Ethereum Library | viem | 2.x | wagmi dependency, modern ethers alternative |
| Testing (Unit) | Jest + RTL | 29+ | React ecosystem standard |
| Testing (E2E) | Playwright | Latest | Superior Web3 testing, multi-browser |
| Notifications | react-hot-toast | Latest | Lightweight, simple API (or custom) |

### Next Steps
- ✅ Research complete - no blockers
- ➡️ Phase 1: Generate data-model.md (UI state structure)
- ➡️ Phase 1: Generate API contracts (component interfaces)
- ➡️ Phase 1: Generate quickstart.md (developer onboarding)

**All NEEDS CLARIFICATION items resolved.**
