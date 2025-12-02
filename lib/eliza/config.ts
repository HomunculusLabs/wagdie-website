/**
 * Eliza SDK Configuration
 * Environment-based configuration for the Eliza API client
 */

export const elizaConfig = {
  /**
   * Base URL for Eliza API (client-side accessible)
   */
  baseUrl: process.env.NEXT_PUBLIC_ELIZA_API_URL || 'http://localhost:3001',

  /**
   * API key for server-side authentication
   * Only available on server-side
   */
  apiKey: process.env.ELIZA_API_KEY || '',

  /**
   * Request timeout in milliseconds
   */
  timeout: 30000,

  /**
   * Retry configuration for failed requests
   */
  retry: {
    maxRetries: 3,
    baseDelay: 1000,
    retryServerErrors: true,
  },

  /**
   * Context window size for AI conversations
   * Only recent messages are sent to the AI
   */
  contextWindowSize: 30,

  /**
   * Maximum messages to load per page
   */
  messagesPerPage: 50,
} as const

/**
 * Check if Eliza API is configured
 */
export function isElizaConfigured(): boolean {
  return Boolean(elizaConfig.baseUrl)
}

/**
 * Check if running on server side with API key
 */
export function hasServerAuth(): boolean {
  return typeof window === 'undefined' && Boolean(elizaConfig.apiKey)
}
