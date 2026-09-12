/**
 * Admin Configuration
 * Defines admin wallet addresses that can edit any character
 */

// Default admin wallet addresses, used when the ADMIN_WALLETS env var is unset
// or empty (zero-config backwards compatibility).
const DEFAULT_ADMIN_WALLETS = [
  '0x5a7F5938deA6238137043415e28efd99A6532dD3',
  '0xb384d03d8311cA41a163001dDDbaC75d86abf1fb',
  '0xDc0f9e358F8EEF58beA41b1Cad8FD23F84D15713',
  '0x27466663437508f761989e64f2c04a187c558f53',
  '0x08DF3044b520Fd001c93e97041D3F257D8c0dB7B',
]

/**
 * Parse admin wallets from a comma-separated string, trimming whitespace,
 * dropping empty entries, and normalizing to lowercase.
 */
export function parseAdminWallets(raw: string | undefined | null): string[] {
  if (!raw || raw.trim() === '') return [...DEFAULT_ADMIN_WALLETS.map((w) => w.toLowerCase())]
  return raw
    .split(',')
    .map((wallet) => wallet.trim().toLowerCase())
    .filter((wallet) => wallet.length > 0)
}

// Admin wallet addresses (case-insensitive). Overridable via the
// ADMIN_WALLETS env var (comma-separated); defaults preserve prior behavior.
export const ADMIN_WALLETS: string[] = parseAdminWallets(process.env.ADMIN_WALLETS)

/**
 * Check if a wallet address is an admin
 * @param address - The wallet address to check
 * @returns true if the address is an admin
 */
export function isAdmin(address: string | null | undefined): boolean {
  if (!address) return false
  const normalizedAddress = address.toLowerCase()
  return ADMIN_WALLETS.some((adminAddress) => adminAddress.toLowerCase() === normalizedAddress)
}
