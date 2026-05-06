'use client'

import React from 'react';
import Link from 'next/link'
import { usePathname } from 'next/navigation'

interface NavItem {
  label: string
  path: string
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Home', path: '/' },
  { label: 'Characters', path: '/characters' },
  { label: 'Searing', path: '/searing' },
  { label: 'World Map', path: '/map' },
  { label: 'Lore', path: '/lore' },
  { label: 'Low Poly', path: '/videos' },
  { label: 'Spread', path: '/spread' },
]

interface NavigationProps {
  className?: string
  isMobile?: boolean
  onNavClick?: () => void
}

/**
 * Navigation Component
 * Main navigation menu with active page highlighting using Next.js usePathname.
 */
export function Navigation({ className = '', isMobile = false, onNavClick }: NavigationProps) {
  const pathname = usePathname()

  const handleClick = () => {
    if (onNavClick) {
      onNavClick()
    }
  }

  return (
    <nav className={`flex ${isMobile ? 'flex-col gap-2' : 'flex-row gap-1'} ${className}`}>
      {NAV_ITEMS.map((item) => {
        const isActive = pathname === item.path
        return (
          <Link
            key={item.path}
            href={item.path}
            className={`
              relative px-4 py-3 min-h-[44px] flex items-center
              text-md font-eskapade
              transition-all duration-300 group
              ${isActive
                ? 'text-soul-accent'
                : 'text-neutral-500 hover:text-neutral-300'
              }
            `}
            onClick={handleClick}
          >
            {item.label}
            {/* Underline indicator */}
            <span
              className={`
                absolute bottom-0 left-1/2 -translate-x-1/2 h-[1px] bg-soul-accent
                transition-all duration-300
                ${isActive ? 'w-full' : 'w-0 group-hover:w-1/2'}
              `}
            />
          </Link>
        )
      })}
    </nav>
  )
}
