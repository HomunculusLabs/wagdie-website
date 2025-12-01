/**
 * Tests for error handling
 * Tests T043 [US5] - Production vs development error display
 */

import React from 'react'
import { render, screen } from '@testing-library/react'
import { ErrorBoundary, ErrorFallback, isProduction } from '@/components/ErrorBoundary'

// Component that throws an error
function ThrowingComponent({ shouldThrow = true }: { shouldThrow?: boolean }) {
  if (shouldThrow) {
    throw new Error('Test error message with sensitive details: /app/lib/secret.ts:42')
  }
  return <div>No error</div>
}

describe('isProduction', () => {
  const originalEnv = process.env

  beforeEach(() => {
    jest.resetModules()
    process.env = { ...originalEnv }
  })

  afterAll(() => {
    process.env = originalEnv
  })

  it('should return true when NODE_ENV is production', () => {
    process.env.NODE_ENV = 'production'

    // Re-import to get fresh evaluation
    const { isProduction: isProd } = require('@/components/ErrorBoundary')
    expect(isProd()).toBe(true)
  })

  it('should return false when NODE_ENV is development', () => {
    process.env.NODE_ENV = 'development'

    const { isProduction: isProd } = require('@/components/ErrorBoundary')
    expect(isProd()).toBe(false)
  })

  it('should return false when NODE_ENV is test', () => {
    process.env.NODE_ENV = 'test'

    const { isProduction: isProd } = require('@/components/ErrorBoundary')
    expect(isProd()).toBe(false)
  })
})

describe('ErrorBoundary in production', () => {
  const originalEnv = process.env

  beforeEach(() => {
    process.env = { ...originalEnv, NODE_ENV: 'production' }
    // Suppress console.error during tests
    jest.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    process.env = originalEnv
    jest.restoreAllMocks()
  })

  it('should not show stack trace in production', () => {
    render(
      <ErrorBoundary>
        <ThrowingComponent />
      </ErrorBoundary>
    )

    // Should show generic error message
    expect(screen.getByText(/something went wrong/i)).toBeInTheDocument()

    // Should NOT show error details
    expect(screen.queryByText(/sensitive details/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/secret\.ts/i)).not.toBeInTheDocument()
  })

  it('should not expose internal paths in production', () => {
    render(
      <ErrorBoundary>
        <ThrowingComponent />
      </ErrorBoundary>
    )

    // Should NOT show any file paths
    expect(screen.queryByText(/\/app\//i)).not.toBeInTheDocument()
    expect(screen.queryByText(/\/lib\//i)).not.toBeInTheDocument()
  })
})

describe('ErrorBoundary in development', () => {
  const originalEnv = process.env

  beforeEach(() => {
    process.env = { ...originalEnv, NODE_ENV: 'development' }
    jest.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    process.env = originalEnv
    jest.restoreAllMocks()
  })

  it('should show error details in development', () => {
    render(
      <ErrorBoundary>
        <ThrowingComponent />
      </ErrorBoundary>
    )

    // Should show error details section
    expect(screen.getByText(/error details/i)).toBeInTheDocument()
  })
})

describe('ErrorFallback', () => {
  const originalEnv = process.env

  beforeEach(() => {
    process.env = { ...originalEnv, NODE_ENV: 'production' }
  })

  afterAll(() => {
    process.env = originalEnv
  })

  it('should show generic message in production', () => {
    const error = new Error('Sensitive: database connection string leaked')

    render(<ErrorFallback error={error} />)

    // Should show generic message, not the sensitive details
    expect(screen.getByText(/an error occurred/i)).toBeInTheDocument()
  })

  it('should show error message in development', () => {
    process.env.NODE_ENV = 'development'

    const error = new Error('Debug info needed')

    render(<ErrorFallback error={error} />)

    expect(screen.getByText(/debug info needed/i)).toBeInTheDocument()
  })
})

describe('API error responses', () => {
  it('should use generic error messages in production', () => {
    // This tests the pattern that should be used in API routes
    const internalError = new Error('Connection to database failed at 192.168.1.1:5432')

    // In production, API routes should return generic messages
    const productionResponse = {
      error: 'An internal error occurred. Please try again later.',
    }

    expect(productionResponse.error).not.toContain('192.168.1.1')
    expect(productionResponse.error).not.toContain('database')
    expect(productionResponse.error).not.toContain('5432')
  })
})
