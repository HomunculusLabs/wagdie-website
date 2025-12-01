'use client'

import React from 'react';
import { useState, useEffect, useRef } from 'react'
import { useWalletAuth } from '@/hooks/useWalletAuth'
import type { Address } from '@/types/wallet'

interface UserDropdownProps {
  /** Ethereum address of the authenticated user */
  address: Address
}

/**
 * UserDropdown Component
 *
 * Dropdown menu for authenticated users showing profile options and disconnect action.
 * Includes click-outside detection to auto-close the dropdown.
 *
 * @component
 * @param {UserDropdownProps} props - Component props
 * @param {Address} props.address - Ethereum address to display
 *
 * @example
 * ```tsx
 * import { UserDropdown } from '@/components/wallet/UserDropdown'
 *
 * function Header() {
 *   const { address, isAuthenticated } = useWalletAuth()
 *
 *   return isAuthenticated && address ? (
 *     <UserDropdown address={address} />
 *   ) : null
 * }
 * ```
 *
 * Features:
 * - Click trigger to open/close dropdown
 * - Auto-close on click outside (useEffect + ref)
 * - Truncated address display
 * - Profile and Settings options (disabled, future feature)
 * - Disconnect action with gothic theme styling
 * - Chevron rotation animation on open/close
 */
export function UserDropdown({ address }: UserDropdownProps) {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const { disconnect } = useWalletAuth()

  /**
   * Truncate Ethereum address to "0x1234...5678" format
   */
  const truncateAddress = (addr: string): string => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`
  }

  /**
   * Close dropdown when clicking outside
   */
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  const handleDisconnect = async () => {
    setIsOpen(false)
    await disconnect()
  }

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Dropdown trigger button */}
      <button
        className="btn-secondary flex items-center gap-2 min-h-[44px]"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="User menu"
        aria-expanded={isOpen}
      >
        {truncateAddress(address)}
        <svg
          className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-shadow border border-midnight rounded-md shadow-lg z-50">
          <div className="py-1">
            {/* Profile option - disabled for now (future feature) */}
            <button
              className="w-full text-left px-4 py-3 text-ash hover:bg-abyss transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              disabled
            >
              My Profile
            </button>

            {/* Settings option - disabled for now (future feature) */}
            <button
              className="w-full text-left px-4 py-3 text-ash hover:bg-abyss transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              disabled
            >
              Settings
            </button>

            {/* Divider */}
            <div className="border-t border-midnight my-1"></div>

            {/* Disconnect option */}
            <button
              className="w-full text-left px-4 py-3 text-ember hover:bg-abyss transition-colors"
              onClick={handleDisconnect}
            >
              Disconnect Wallet
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
