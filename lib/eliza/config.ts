/**
 * Eliza SDK Configuration
 * Environment-based configuration for the Eliza API client
 */

const DEFAULT_ELIZA_BASE_URL = 'https://eliza-api.runiverse.ai' as const

export const elizaConfig = {
  /**
   * Base URL for Eliza API.
   * Prefer server-only ELIZA_API_URL; NEXT_PUBLIC_ELIZA_API_URL is a fallback.
   */
  baseUrl:
    process.env.ELIZA_API_URL ||
    process.env.NEXT_PUBLIC_ELIZA_API_URL ||
    DEFAULT_ELIZA_BASE_URL,

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
