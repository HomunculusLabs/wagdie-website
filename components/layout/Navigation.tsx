'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

interface NavItem {
  label: string
  path: string
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Home', path: '/' },
  { label: 'Characters', path: '/characters' },
  { label: 'World Map', path: '/map' },
  { label: 'Lore', path: '/lore' },
  { label: 'Gather', path: '/gather' },
]

interface NavigationProps {
  className?: string
  isMobile?: boolean
  onNavClick?: () => void
}

/**
 * Navigation Component
 *
 * Main navigation menu with active page highlighting using Next.js usePathname.
 * Supports both desktop horizontal and mobile vertical layouts.
 *
 * @component
 * @param {NavigationProps} props - Component props
 * @param {string} props.className - Additional CSS classes to apply
 * @param {boolean} props.isMobile - Whether to render in mobile layout (vertical)
 * @param {Function} props.onNavClick - Callback when navigation item is clicked
 *
 * @example
 * ```tsx
 * import { Navigation } from '@/components/layout/Navigation'
 *
 * // Desktop usage
 * function Header() {
 *   return <Navigation className="hidden md:flex" />
 * }
 *
 * // Mobile usage
 * function MobileMenu() {
 *   const handleNavClick = () => setMenuOpen(false)
 *   return <Navigation isMobile onNavClick={handleNavClick} />
 * }
 * ```
 *
 * Features:
 * - Active page detection via usePathname hook
 * - Golden underline indicator for active page
 * - Automatic layout switching (horizontal/vertical)
 * - 44x44px minimum touch targets for accessibility
 * - Gothic theme with hover transitions (ash → bone)
 * - Auto-close callback for mobile menu integration
 *
 * Navigation Items:
 * - Home (/)
 * - Characters (/characters)
 * - Lore (/lore)
 * - Gather (/gather)
 */
export function Navigation({ className = '', isMobile = false, onNavClick }: NavigationProps) {
  const pathname = usePathname()

  const handleClick = () => {
    if (onNavClick) {
      onNavClick()
    }
  }

  return (
    <nav className={`flex ${isMobile ? 'flex-col gap-4' : 'flex-row gap-6'} ${className}`}>
      {NAV_ITEMS.map((item) => {
        const isActive = pathname === item.path
        return (
          <Link
            key={item.path}
            href={item.path}
            className={`nav-link py-3 px-4 min-h-[44px] flex items-center ${isActive ? 'active' : ''}`}
            onClick={handleClick}
          >
            {item.label}
          </Link>
        )
      })}
    </nav>
  )
}
