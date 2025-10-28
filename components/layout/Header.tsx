'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Navigation } from './Navigation'
import { WalletButton } from '@/components/wallet/WalletButton'

/**
 * Header Component
 *
 * Main site header with logo, navigation, and wallet connection.
 * Features sticky positioning and responsive mobile hamburger menu.
 *
 * @component
 * @example
 * ```tsx
 * import { Header } from '@/components/layout/Header'
 *
 * // In app/layout.tsx
 * export default function RootLayout({ children }) {
 *   return (
 *     <body>
 *       <Header />
 *       <main>{children}</main>
 *     </body>
 *   )
 * }
 * ```
 *
 * Features:
 * - **Sticky Positioning**: Stays at top of viewport while scrolling (z-index: 50)
 * - **Responsive Layout**: Desktop horizontal nav, mobile hamburger menu
 * - **Mobile Menu**: Toggle-able dropdown with X/hamburger icon transition
 * - **Logo**: WAGDIE text logo with hover effect (bone → gold)
 * - **Desktop Navigation**: Horizontal menu hidden on mobile (<768px)
 * - **Mobile Navigation**: Vertical menu with border separator, auto-closes on nav click
 * - **Wallet Integration**: WalletButton positioned appropriately for each layout
 * - **Accessibility**: aria-label and aria-expanded on hamburger button
 * - **Gothic Styling**: Abyss background, midnight border, smooth transitions
 *
 * Layout Breakpoints:
 * - Mobile (<768px): Logo + Hamburger + Collapsible menu
 * - Desktop (≥768px): Logo + Horizontal nav + Wallet button
 */
export function Header() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen)
  }

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false)
  }

  return (
    <header className="sticky top-0 z-50 bg-abyss border-b border-midnight">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link
            href="/"
            className="text-2xl font-bold text-bone hover:text-gold transition-colors duration-200"
          >
            WAGDIE
          </Link>

          {/* Desktop Navigation */}
          <Navigation className="hidden md:flex" />

          {/* Mobile Menu Button */}
          <button
            className="md:hidden text-bone p-2 w-11 h-11 flex items-center justify-center"
            onClick={toggleMobileMenu}
            aria-label="Toggle menu"
            aria-expanded={isMobileMenuOpen}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {isMobileMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>

          {/* Desktop Wallet Button */}
          <div className="hidden md:block">
            <WalletButton />
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-midnight">
            <Navigation isMobile onNavClick={closeMobileMenu} />
            <div className="mt-4">
              <WalletButton />
            </div>
          </div>
        )}
      </div>
    </header>
  )
}
