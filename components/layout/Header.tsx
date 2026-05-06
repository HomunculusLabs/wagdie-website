'use client'

import React from 'react';
import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useAccount } from 'wagmi'
import { Navigation } from './Navigation'
import { WalletButton } from '@/components/wallet/WalletButton'
import { isAdmin } from '@/lib/auth/admin'
import { lockBodyScroll, unlockBodyScroll } from '@/lib/utils/bodyScrollLock'

/**
 * Header Component
 * Main site header with logo, navigation, and wallet connection.
 */
export function Header() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const [darkMode, setDarkMode] = useState(true)
  const { address } = useAccount()
  const isAdminWallet = isAdmin(address)

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

  // TODO: Wire up dark mode toggle in UI
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const _toggleDarkMode = () => {
    setDarkMode(!darkMode)
    document.documentElement.classList.toggle('dark')
  }

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // Disable body scroll when drawer is open
  useEffect(() => {
    if (isDrawerOpen) {
      lockBodyScroll('header-drawer')
    } else {
      unlockBodyScroll('header-drawer')
    }

    return () => {
      unlockBodyScroll('header-drawer')
    }
  }, [isDrawerOpen])

  return (
    <header className="sticky top-0 z-50 bg-soul-950/95 backdrop-blur-sm border-b border-neutral-800">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo with scroll-to-top */}
          <Link
            href="/"
            onClick={scrollToTop}
            className="group flex items-center cursor-pointer"
            title="Scroll to top"
            aria-label="WAGDIE home"
          >
            <Image
              src="/images/wagdie.png"
              alt="WAGDIE"
              width={1910}
              height={588}
              priority
              className="h-9 w-auto transition-opacity duration-300 group-hover:opacity-80"
            />
          </Link>

          {/* Desktop Navigation */}
          <Navigation className="hidden md:flex" />

          {/* Mobile Menu Button */}
          <button
            className="md:hidden text-neutral-400 p-2 w-11 h-11 flex items-center justify-center hover:text-soul-accent transition-colors"
            onClick={toggleMobileMenu}
            aria-label="Toggle menu"
            aria-expanded={isMobileMenuOpen}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {isMobileMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center gap-2">
            {/* MORE button */}
            <button
              onClick={toggleDrawer}
              className="px-4 py-2 text-neutral-500 hover:text-soul-accent transition-colors font-eskapade text-md"
              title="More options"
              aria-label="Open menu drawer"
            >
              More
            </button>

            <WalletButton />
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-neutral-800">
            <Navigation isMobile onNavClick={closeMobileMenu} />
            <div className="mt-4 flex flex-col gap-2 px-2">
              <button
                onClick={() => {
                  closeMobileMenu()
                  toggleDrawer()
                }}
                className="text-left px-4 py-3 text-neutral-500 hover:text-soul-accent transition-colors font-eskapade text-xl"
              >
                More Options
              </button>
              <div className="px-4">
                <WalletButton />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Menu Drawer (Desktop & Mobile) */}
      {isDrawerOpen && (
        <div
          className="fixed inset-0 top-16 bg-black/80 backdrop-blur-sm z-50"
          onClick={closeDrawer}
        >
          <div
            className="fixed right-0 top-0.5 h-[calc(100vh-4rem)] w-80 bg-soul-950 border-l border-neutral-800 shadow-2xl overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Drawer Header */}
            <div className="flex items-center justify-between p-6 border-b border-neutral-800">
              <h2 className="text-sm font-eskapade text-neutral-200">Menu</h2>
              <button
                onClick={closeDrawer}
                className="p-2 text-neutral-500 hover:text-red-500 transition-colors"
                aria-label="Close drawer"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Drawer Content */}
            <nav className="p-4 space-y-1">
              <Link
                href="/map"
                onClick={closeDrawer}
                className="block px-4 py-3 text-neutral-400 hover:text-soul-accent hover:bg-soul-accent/5 transition-all duration-300 font-eskapade text-sm"
              >
                World Map
              </Link>
              <Link
                href="/lore"
                onClick={closeDrawer}
                className="block px-4 py-3 text-neutral-400 hover:text-soul-accent hover:bg-soul-accent/5 transition-all duration-300 font-eskapade text-sm"
              >
                Lore & History
              </Link>
              <Link
                href="/videos"
                onClick={closeDrawer}
                className="block px-4 py-3 text-neutral-400 hover:text-soul-accent hover:bg-soul-accent/5 transition-all duration-300 font-eskapade text-sm"
              >
                Low Poly Videos
              </Link>
              <Link
                href="/spread"
                onClick={closeDrawer}
                className="block px-4 py-3 text-neutral-400 hover:text-soul-accent hover:bg-soul-accent/5 transition-all duration-300 font-eskapade text-sm"
              >
                Spread Infection
              </Link>
              <Link
                href="/searing"
                onClick={closeDrawer}
                className="block px-4 py-3 text-neutral-400 hover:text-soul-accent hover:bg-soul-accent/5 transition-all duration-300 font-eskapade text-sm"
              >
                Searing
              </Link>

              {isAdminWallet && (
                <>
                  <div className="my-4 h-px bg-neutral-800" />
                  <Link
                    href="/map-editor"
                    onClick={closeDrawer}
                    className="block px-4 py-3 text-neutral-400 hover:text-soul-accent hover:bg-soul-accent/5 transition-all duration-300 font-eskapade text-sm"
                  >
                    Map Editor
                  </Link>
                  <Link
                    href="/searing-map-editor"
                    onClick={closeDrawer}
                    className="block px-4 py-3 text-neutral-400 hover:text-soul-accent hover:bg-soul-accent/5 transition-all duration-300 font-eskapade text-sm"
                  >
                    Searing Map Editor
                  </Link>
                </>
              )}

              <div className="my-4 h-px bg-neutral-800" />

              <a
                href="https://discord.gg/wagdie"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between px-4 py-3 text-neutral-500 hover:text-soul-accent hover:bg-soul-accent/5 transition-all duration-300 font-eskapade text-sm"
              >
                <span>Discord</span>
                <svg className="w-4 h-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
              <a
                href="https://twitter.com/WAGDIE_ETH"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between px-4 py-3 text-neutral-500 hover:text-soul-accent hover:bg-soul-accent/5 transition-all duration-300 font-eskapade text-sm"
              >
                <span>Twitter</span>
                <svg className="w-4 h-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
              <a
                href="https://opensea.io/collection/we-are-all-going-to-die"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between px-4 py-3 text-neutral-500 hover:text-soul-accent hover:bg-soul-accent/5 transition-all duration-300 font-eskapade text-sm"
              >
                <span>OpenSea</span>
                <svg className="w-4 h-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
            </nav>
          </div>
        </div>
      )}
    </header>
  )
}
