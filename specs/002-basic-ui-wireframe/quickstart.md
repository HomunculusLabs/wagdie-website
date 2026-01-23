# Quickstart Guide: Basic UI Wireframe

**Feature**: 002-basic-ui-wireframe
**Date**: 2025-10-27
**Target Audience**: Developers implementing or contributing to this feature

## Overview

This guide walks you through implementing the basic UI wireframe feature for WAGDIE simplified. By the end, you'll have:

- ✅ Wallet connection with RainbowKit (MetaMask, WalletConnect, Rainbow, Coinbase Wallet)
- ✅ SIWE authentication integrated with existing backend
- ✅ Responsive navigation header and footer
- ✅ Gothic dark theme applied site-wide
- ✅ Mobile-responsive layouts with hamburger menu

**Estimated Time**: 6-8 hours for complete implementation

---

## Prerequisites

Before starting, ensure:

1. **Development environment set up**:
   - Node.js 18+ installed
   - Project repository cloned and dependencies installed
   - Local development server running (`npm run dev`)

2. **Existing infrastructure** (should already be in place):
   - Next.js 15 configured with App Router
   - Tailwind CSS configured
   - SIWE authentication endpoints (`/api/auth/nonce`, `/api/auth/verify`, `/api/auth/logout`)
   - Supabase database with users table

3. **Wallet for testing**:
   - MetaMask browser extension installed, or
   - Mobile wallet app with WalletConnect support

---

## Step 1: Install Dependencies

Install RainbowKit, wagmi, and viem for wallet integration:

```bash
npm install @rainbow-me/rainbowkit wagmi viem
```

Install optional testing dependencies:

```bash
npm install -D @testing-library/react @testing-library/jest-dom jest-environment-jsdom
npm install -D @playwright/test
```

Install toast notification library (optional, can build custom):

```bash
npm install react-hot-toast
```

**Verify installation**:
```bash
npm list @rainbow-me/rainbowkit wagmi viem
```

---

## Step 2: Configure wagmi and RainbowKit

Create `lib/wagmi.ts` to configure wallet providers:

```typescript
// lib/wagmi.ts
import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { mainnet } from 'wagmi/chains';

export const wagmiConfig = getDefaultConfig({
  appName: 'WAGDIE',
  projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID!, // Get from WalletConnect Cloud
  chains: [mainnet],
  ssr: true, // Enable server-side rendering support
});
```

**Get WalletConnect Project ID**:
1. Visit https://cloud.walletconnect.com/
2. Create free account
3. Create new project named "WAGDIE"
4. Copy Project ID

**Add to `.env.local`**:
```bash
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_project_id_here
```

---

## Step 3: Set Up Root Layout Providers

Update `app/layout.tsx` to wrap the app with wallet providers:

```typescript
// app/layout.tsx
import '@rainbow-me/rainbowkit/styles.css';
import { Providers } from './providers';
import './globals.css';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
```

Create `app/providers.tsx` for client-side providers:

```typescript
// app/providers.tsx
'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RainbowKitProvider, darkTheme } from '@rainbow-me/rainbowkit';
import { WagmiProvider } from 'wagmi';
import { wagmiConfig } from '@/lib/wagmi';
import { useState } from 'react';

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider theme={darkTheme({
          accentColor: '#8b2635', // Gothic red accent
          accentColorForeground: 'white',
          borderRadius: 'medium',
        })}>
          {children}
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
```

**Test**: Restart dev server, verify no errors. RainbowKit is now available.

---

## Step 4: Create Custom Hook for Wallet + SIWE

Create `hooks/useWalletAuth.ts` to orchestrate wallet connection with SIWE authentication:

```typescript
// hooks/useWalletAuth.ts
'use client';

import { useAccount, useDisconnect, useSignMessage } from 'wagmi';
import { useConnectModal } from '@rainbow-me/rainbowkit';
import { useState, useEffect } from 'react';
import { SiweMessage } from 'siwe';

export function useWalletAuth() {
  const { address, isConnected, isConnecting } = useAccount();
  const { openConnectModal } = useConnectModal();
  const { disconnectAsync } = useDisconnect();
  const { signMessageAsync } = useSignMessage();

  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  // Auto-authenticate when wallet connects
  useEffect(() => {
    if (address && !isAuthenticated) {
      authenticateWithSIWE();
    }
  }, [address]);

  const authenticateWithSIWE = async () => {
    if (!address) return;

    try {
      setIsAuthenticating(true);

      // 1. Get nonce from backend
      const nonceRes = await fetch('/api/auth/nonce', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address }),
      });
      const { nonce } = await nonceRes.json();

      // 2. Create SIWE message
      const message = new SiweMessage({
        domain: window.location.host,
        address,
        statement: 'Sign in to WAGDIE',
        uri: window.location.origin,
        version: '1',
        chainId: 1,
        nonce,
      });

      // 3. Sign message with wallet
      const signature = await signMessageAsync({ message: message.prepareMessage() });

      // 4. Verify signature with backend
      const verifyRes = await fetch('/api/auth/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address, signature, message: message.prepareMessage() }),
      });

      const { success } = await verifyRes.json();
      if (success) {
        setIsAuthenticated(true);
      }
    } catch (error) {
      console.error('SIWE authentication failed:', error);
    } finally {
      setIsAuthenticating(false);
    }
  };

  const handleDisconnect = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    await disconnectAsync();
    setIsAuthenticated(false);
  };

  return {
    address,
    isConnected,
    isConnecting,
    isAuthenticated,
    isAuthenticating,
    connect: openConnectModal,
    disconnect: handleDisconnect,
  };
}
```

**Note**: Install `siwe` package: `npm install siwe`

---

## Step 5: Build Wallet Button Component

Create `components/wallet/WalletButton.tsx`:

```typescript
// components/wallet/WalletButton.tsx
'use client';

import { useWalletAuth } from '@/hooks/useWalletAuth';

export function WalletButton() {
  const { address, isConnected, isConnecting, connect, disconnect } = useWalletAuth();

  const truncateAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  if (isConnecting) {
    return (
      <button className="btn-primary" disabled>
        Connecting...
      </button>
    );
  }

  if (isConnected && address) {
    return (
      <button className="btn-secondary" onClick={disconnect}>
        {truncateAddress(address)}
      </button>
    );
  }

  return (
    <button className="btn-primary" onClick={connect}>
      Connect Wallet
    </button>
  );
}
```

---

## Step 6: Create Navigation Components

### Header Component

Create `components/layout/Header.tsx`:

```typescript
// components/layout/Header.tsx
'use client';

import Link from 'next/link';
import { WalletButton } from '@/components/wallet/WalletButton';
import { Navigation } from './Navigation';

export function Header() {
  return (
    <header className="sticky top-0 z-50 bg-abyss border-b border-midnight">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="text-2xl font-bold text-bone hover:text-gold transition-colors">
            WAGDIE
          </Link>

          {/* Desktop Navigation */}
          <Navigation className="hidden md:flex" />

          {/* Wallet Button */}
          <WalletButton />
        </div>
      </div>
    </header>
  );
}
```

### Navigation Component

Create `components/layout/Navigation.tsx`:

```typescript
// components/layout/Navigation.tsx
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const NAV_ITEMS = [
  { label: 'Home', path: '/' },
  { label: 'Characters', path: '/characters' },
  { label: 'Lore', path: '/lore' },
  { label: 'Gather', path: '/gather' },
];

export function Navigation({ className = '' }: { className?: string }) {
  const pathname = usePathname();

  return (
    <nav className={`flex gap-6 ${className}`}>
      {NAV_ITEMS.map((item) => {
        const isActive = pathname === item.path;
        return (
          <Link
            key={item.path}
            href={item.path}
            className={`nav-link ${isActive ? 'active' : ''}`}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
```

### Footer Component

Create `components/layout/Footer.tsx`:

```typescript
// components/layout/Footer.tsx
export function Footer() {
  const externalLinks = [
    { label: 'Discord', url: 'https://discord.gg/wagdie' },
    { label: 'OpenSea', url: 'https://opensea.io/collection/we-are-all-going-to-die' },
    { label: 'Twitter', url: 'https://twitter.com/WAGDIE_ETH' },
  ];

  return (
    <footer className="bg-shadow border-t border-midnight mt-auto">
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center gap-8">
          {externalLinks.map((link) => (
            <a
              key={link.label}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-ash hover:text-bone transition-colors"
            >
              {link.label}
            </a>
          ))}
        </div>
        <p className="text-center text-mist text-sm mt-4">
          © 2025 WAGDIE. Community-driven fantasy NFT project.
        </p>
      </div>
    </footer>
  );
}
```

---

## Step 7: Update Root Layout

Update `app/layout.tsx` to include Header and Footer:

```typescript
// app/layout.tsx
import '@rainbow-me/rainbowkit/styles.css';
import { Providers } from './providers';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import './globals.css';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="flex flex-col min-h-screen bg-abyss text-bone">
        <Providers>
          <Header />
          <main className="flex-1">{children}</main>
          <Footer />
        </Providers>
      </body>
    </html>
  );
}
```

---

## Step 8: Configure Gothic Dark Theme

Update `tailwind.config.ts`:

```typescript
// tailwind.config.ts
import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class',
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Backgrounds
        abyss: '#0a0a0a',
        shadow: '#1a1a1a',
        midnight: '#252525',

        // Text
        bone: '#e8e8e8',
        ash: '#b0b0b0',
        mist: '#707070',

        // Accents
        blood: '#8b2635',
        ember: '#c94a3a',
        gold: '#d4af37',
        poison: '#4a7c59',
        arcane: '#6a4c93',
      },
    },
  },
  plugins: [],
};

export default config;
```

Update `app/globals.css`:

```css
/* app/globals.css */
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer components {
  .btn-primary {
    @apply px-4 py-2 bg-blood hover:bg-ember text-bone font-semibold rounded-md transition-colors;
  }

  .btn-secondary {
    @apply px-4 py-2 bg-midnight hover:bg-shadow text-bone rounded-md border border-ash transition-colors;
  }

  .nav-link {
    @apply text-ash hover:text-bone transition-colors relative;
  }

  .nav-link.active {
    @apply text-gold;
  }

  .nav-link.active::after {
    content: '';
    @apply absolute bottom-0 left-0 right-0 h-0.5 bg-gold;
  }
}
```

---

## Step 9: Test Wallet Connection

1. **Start development server**:
   ```bash
   npm run dev
   ```

2. **Open browser**: Navigate to `http://localhost:3000`

3. **Test wallet connection**:
   - Click "Connect Wallet" button
   - Select MetaMask (or other wallet)
   - Approve connection in wallet extension
   - Sign SIWE message when prompted
   - Verify address appears in button (truncated)

4. **Test disconnection**:
   - Click wallet address button
   - Verify disconnect works and returns to "Connect Wallet" state

5. **Test persistence**:
   - Connect wallet and authenticate
   - Refresh page
   - Verify wallet auto-reconnects and session persists

---

## Step 10: Add Mobile Responsive Navigation

Update `components/layout/Header.tsx` to add mobile menu:

```typescript
// components/layout/Header.tsx (mobile version)
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { WalletButton } from '@/components/wallet/WalletButton';
import { Navigation } from './Navigation';

export function Header() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-abyss border-b border-midnight">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="text-2xl font-bold text-bone hover:text-gold transition-colors">
            WAGDIE
          </Link>

          {/* Desktop Navigation */}
          <Navigation className="hidden md:flex" />

          {/* Mobile Menu Button */}
          <button
            className="md:hidden text-bone p-2"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label="Toggle menu"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          {/* Wallet Button (Desktop) */}
          <div className="hidden md:block">
            <WalletButton />
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-midnight">
            <Navigation className="flex flex-col gap-4" />
            <div className="mt-4">
              <WalletButton />
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
```

**Test mobile**: Use browser DevTools responsive mode (< 768px) to verify mobile menu works.

---

## Troubleshooting

### Issue: "Hydration mismatch" errors

**Cause**: Server/client rendering mismatch with wallet state.

**Solution**: Ensure providers are marked `'use client'` and wagmi config has `ssr: true`.

### Issue: WalletConnect not working

**Cause**: Missing or invalid `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID`.

**Solution**: Verify environment variable is set and restart dev server.

### Issue: SIWE signature fails

**Cause**: Backend `/api/auth/verify` expecting different message format.

**Solution**: Ensure SIWE message structure matches backend expectations (check `nonce`, `domain`, `uri` fields).

### Issue: Session doesn't persist

**Cause**: Backend not setting HTTP-only cookie correctly.

**Solution**: Verify `/api/auth/verify` endpoint sets cookie with proper attributes (httpOnly, secure in production, sameSite).

---

## Testing Checklist

Before marking feature complete, verify:

- [ ] Wallet connects successfully (MetaMask)
- [ ] WalletConnect works (test with mobile wallet)
- [ ] SIWE authentication completes and sets session
- [ ] Session persists across page refresh
- [ ] Disconnect clears wallet and session
- [ ] Navigation highlights active page
- [ ] Mobile menu opens/closes on hamburger click
- [ ] Theme colors match gothic aesthetic
- [ ] All text readable with sufficient contrast
- [ ] Touch targets meet 44x44px minimum on mobile
- [ ] External links in footer open in new tab
- [ ] No console errors in browser

---

## Next Steps

After completing this feature:

1. **Character Browser** (`/characters` page) - display NFT collection
2. **Character Detail Pages** (`/characters/[tokenId]`) - individual character sheets
3. **Lore Feed** (`/lore` page) - Twitter/lore content display

---

## Resources

- **RainbowKit Docs**: https://www.rainbowkit.com/docs/introduction
- **wagmi Docs**: https://wagmi.sh/
- **SIWE Spec**: https://eips.ethereum.org/EIPS/eip-4361
- **Tailwind CSS Docs**: https://tailwindcss.com/docs

## Support

- **GitHub Issues**: Report bugs or ask questions
- **Discord**: #dev-help channel (if applicable)
- **Spec Reference**: See `spec.md` for full requirements
