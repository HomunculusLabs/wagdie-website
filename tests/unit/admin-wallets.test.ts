/**
 * Tests for admin wallet configuration via the ADMIN_WALLETS env var
 * (P2-10: env-configurable with default fallback).
 */
import { parseAdminWallets } from '@/lib/auth/admin'

const DEFAULT_ADMIN_WALLETS = [
  '0x5a7f5938dea6238137043415e28efd99a6532dd3',
  '0xb384d03d8311ca41a163001dddbac75d86abf1fb',
  '0xdc0f9e358f8eef58bea41b1cad8fd23f84d15713',
  '0x27466663437508f761989e64f2c04a187c558f53',
  '0x08df3044b520fd001c93e97041d3f257d8c0db7b',
]

describe('parseAdminWallets', () => {
  it('falls back to the default admin wallets when env is unset', () => {
    expect(parseAdminWallets(undefined)).toEqual(DEFAULT_ADMIN_WALLETS)
    expect(parseAdminWallets(null)).toEqual(DEFAULT_ADMIN_WALLETS)
  })

  it('falls back to the default admin wallets when env is empty or whitespace-only', () => {
    expect(parseAdminWallets('')).toEqual(DEFAULT_ADMIN_WALLETS)
    expect(parseAdminWallets('   ')).toEqual(DEFAULT_ADMIN_WALLETS)
  })

  it('parses a comma-separated list', () => {
    expect(parseAdminWallets('0xAAA,0xBBB,0xCCC')).toEqual([
      '0xaaa',
      '0xbbb',
      '0xccc',
    ])
  })

  it('trims whitespace around entries and drops empty ones', () => {
    expect(parseAdminWallets(' 0xAAA , , 0xBBB ,, ')).toEqual(['0xaaa', '0xbbb'])
  })

  it('normalizes entries to lowercase', () => {
    expect(parseAdminWallets('0xAbCdEf012345678901234567890123456789AbCd')).toEqual([
      '0xabcdef012345678901234567890123456789abcd',
    ])
  })
})

describe('isAdmin with ADMIN_WALLETS env', () => {
  const ORIGINAL_ENV = process.env.ADMIN_WALLETS

  afterEach(() => {
    if (ORIGINAL_ENV === undefined) {
      delete process.env.ADMIN_WALLETS
    } else {
      process.env.ADMIN_WALLETS = ORIGINAL_ENV
    }
    // Clear the module cache so ADMIN_WALLETS re-evaluates per test
    jest.resetModules()
  })

  it('accepts a default admin wallet (case-insensitive) when env is unset', () => {
    delete process.env.ADMIN_WALLETS
    jest.resetModules()
    const { isAdmin } = require('@/lib/auth/admin')
    expect(isAdmin('0x5a7F5938deA6238137043415e28efd99A6532dD3')).toBe(true)
    expect(isAdmin('0X5A7F5938DEA6238137043415E28EFD99A6532DD3'.toLowerCase())).toBe(true)
    expect(isAdmin('0x0000000000000000000000000000000000000001')).toBe(false)
    expect(isAdmin(null)).toBe(false)
    expect(isAdmin(undefined)).toBe(false)
  })

  it('uses wallets from the env var, ignoring defaults', () => {
    process.env.ADMIN_WALLETS = ' 0xCustomAdmin1 , 0xCUSTOMADMIN2 '
    jest.resetModules()
    const { isAdmin, ADMIN_WALLETS } = require('@/lib/auth/admin')
    expect(ADMIN_WALLETS).toEqual(['0xcustomadmin1', '0xcustomadmin2'])
    expect(isAdmin('0xCUSTOMADMIN1')).toBe(true)
    expect(isAdmin('0xcustomadmin2')).toBe(true)
    // A default wallet is no longer admin when env overrides the list
    expect(isAdmin('0x5a7F5938deA6238137043415e28efd99A6532dD3')).toBe(false)
  })
})
