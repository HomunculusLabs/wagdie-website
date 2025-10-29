'use client'

import { useState, useEffect } from 'react'
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
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const [darkMode, setDarkMode] = useState(true)

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen)
  }

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false)
  }

  const toggleDrawer = () => {
    setIsDrawerOpen(!isDrawerOpen)
  }

  const closeDrawer = () => {
    setIsDrawerOpen(false)
  }

  const toggleDarkMode = () => {
    setDarkMode(!darkMode)
    document.documentElement.classList.toggle('dark')
  }

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // Disable body scroll when drawer is open
  useEffect(() => {
    if (isDrawerOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isDrawerOpen])

  return (
    <header className="sticky top-0 z-50 bg-abyss border-b border-midnight">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo with scroll-to-top */}
          <Link
            href="/"
            onClick={scrollToTop}
            className="text-2xl font-bold text-bone hover:text-gold transition-colors duration-200 cursor-pointer"
            title="Scroll to top"
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

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center gap-4">
            {/* Dark Mode Toggle */}
            <button
              onClick={toggleDarkMode}
              className="p-2 text-bone hover:text-gold transition-colors"
              title="Toggle dark mode"
              aria-label="Toggle dark mode"
            >
              {darkMode ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
              )}
            </button>

            {/* MORE button */}
            <button
              onClick={toggleDrawer}
              className="px-3 py-2 text-bone hover:text-gold transition-colors font-medium"
              title="More options"
              aria-label="Open menu drawer"
            >
              MORE
            </button>

            <WalletButton />
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-midnight">
            <Navigation isMobile onNavClick={closeMobileMenu} />
            <div className="mt-4 flex flex-col gap-3">
              <button
                onClick={toggleDarkMode}
                className="flex items-center gap-2 px-4 py-2 text-bone hover:text-gold transition-colors"
              >
                {darkMode ? 'Light Mode' : 'Dark Mode'}
              </button>
              <button
                onClick={() => {
                  closeMobileMenu()
                  toggleDrawer()
                }}
                className="text-left px-4 py-2 text-bone hover:text-gold transition-colors"
              >
                MORE
              </button>
              <WalletButton />
            </div>
          </div>
        )}
      </div>

      {/* Menu Drawer (Desktop & Mobile) */}
      {isDrawerOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-50"
          onClick={closeDrawer}
        >
          <div
            className="fixed right-0 top-0 h-full w-80 bg-abyss border-l border-midnight shadow-xl overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Drawer Header */}
            <div className="flex items-center justify-between p-4 border-b border-midnight">
              <h2 className="text-xl font-bold text-bone">Menu</h2>
              <button
                onClick={closeDrawer}
                className="p-2 text-bone hover:text-gold transition-colors"
                aria-label="Close drawer"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Drawer Content */}
            <nav className="p-4 space-y-2">
              <Link
                href="/about"
                onClick={closeDrawer}
                className="block px-4 py-3 text-bone hover:text-gold hover:bg-midnight rounded transition-colors"
              >
                About WAGDIE
              </Link>
              <Link
                href="/spread"
                onClick={closeDrawer}
                className="block px-4 py-3 text-bone hover:text-gold hover:bg-midnight rounded transition-colors"
              >
                Spread Infection
              </Link>
              <div className="border-t border-midnight my-4" />
              <a
                href="https://discord.gg/wagdie"
                target="_blank"
                rel="noopener noreferrer"
                className="block px-4 py-3 text-bone hover:text-gold hover:bg-midnight rounded transition-colors"
              >
                Join Discord ↗
              </a>
              <a
                href="https://twitter.com/WAGDIE_ETH"
                target="_blank"
                rel="noopener noreferrer"
                className="block px-4 py-3 text-bone hover:text-gold hover:bg-midnight rounded transition-colors"
              >
                Follow on Twitter ↗
              </a>
              <a
                href="https://opensea.io/collection/wagdie"
                target="_blank"
                rel="noopener noreferrer"
                className="block px-4 py-3 text-bone hover:text-gold hover:bg-midnight rounded transition-colors"
              >
                View on OpenSea ↗
              </a>
            </nav>
          </div>
        </div>
      )}
    </header>
  )
}
