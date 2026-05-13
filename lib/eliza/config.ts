/**
 * Eliza Gateway Configuration
 * Environment-based configuration for the app-owned Eliza/Venice gateway
 */

const DEFAULT_ELIZA_BASE_URL = 'https://eliza-api.runiverse.ai' as const
const DEFAULT_VENICE_BASE_URL = 'https://api.venice.ai/api/v1' as const

type ElizaInferenceProvider = 'venice'
export type ElizaIntegrationMode = 'legacy' | 'dual' | 'official'

function getIntegrationMode(): ElizaIntegrationMode {
  const mode = process.env.ELIZA_INTEGRATION_MODE

  if (mode === 'dual' || mode === 'official') {
    return mode
  }

  return 'legacy'
}

function getInferenceProvider(): ElizaInferenceProvider {
  return 'venice'
}

function optionalNumberInRange(
  value: string | undefined,
  options: { min?: number; max?: number; integer?: boolean } = {}
): number | undefined {
  if (!value) {
    return undefined
  }

  const parsed = Number(value)
  if (!Number.isFinite(parsed)) {
    return undefined
  }

  if (options.integer && !Number.isInteger(parsed)) {
    return undefined
  }

  if (typeof options.min === 'number' && parsed < options.min) {
    return undefined
  }

  if (typeof options.max === 'number' && parsed > options.max) {
    return undefined
  }

  return parsed
}

function optionalBoolean(value: string | undefined): boolean | undefined {
  if (!value) {
    return undefined
  }

  const normalized = value.trim().toLowerCase()
  if (['1', 'true', 'yes', 'on'].includes(normalized)) {
    return true
  }

  if (['0', 'false', 'no', 'off'].includes(normalized)) {
    return false
  }

  return undefined
}

export const elizaConfig = {
  /**
   * Server-only mode flag for the Eliza gateway.
   *
   * `legacy` and `dual` use the app-owned gateway behavior; `official` routes
   * through the WAGDIE-hosted official ElizaOS adapter.
   */
  mode: getIntegrationMode(),

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
   * Legacy/dual inference provider configuration.
   *
   * In official mode the hosted ElizaOS service owns Venice provider secrets and
   * streaming; the WAGDIE app only calls that service server-to-server.
   */
  inference: {
    provider: getInferenceProvider(),
    baseUrl:
      process.env.ELIZA_LLM_BASE_URL ||
      process.env.VENICE_API_BASE_URL ||
      DEFAULT_VENICE_BASE_URL,
    apiKey: process.env.ELIZA_LLM_API_KEY || process.env.VENICE_API_KEY || '',
    model: process.env.ELIZA_LLM_MODEL || process.env.VENICE_MODEL || '',
    temperature: optionalNumberInRange(process.env.ELIZA_LLM_TEMPERATURE, { min: 0, max: 2 }),
    maxTokens: optionalNumberInRange(process.env.ELIZA_LLM_MAX_TOKENS, {
      min: 1,
      integer: true,
    }),
  },

  /**
   * WAGDIE-hosted official ElizaOS service configuration.
   *
   * The official service owns Venice provider secrets. WAGDIE only stores the
   * service URL and server-to-server credential needed to call ElizaOS.
   */
  official: {
    baseUrl: process.env.ELIZAOS_BASE_URL || '',
    apiKey: process.env.ELIZAOS_API_KEY || '',
    healthPath: process.env.ELIZAOS_HEALTH_PATH || '/api/server/health',
  },

  /**
   * Public location-pin room settings for scheduled elizaOS character turns.
   * Disabled by default until the room domain/API/UI rollout is complete.
   */
  locationRooms: {
    enabled: optionalBoolean(process.env.ELIZA_LOCATION_ROOMS_ENABLED) ?? false,
    tickIntervalMinutes:
      optionalNumberInRange(process.env.ELIZA_LOCATION_ROOM_TICK_INTERVAL_MINUTES, {
        min: 1,
        integer: true,
      }) ?? 360,
    maxTicksPerRun:
      optionalNumberInRange(process.env.ELIZA_LOCATION_ROOM_MAX_TICKS_PER_RUN, {
        min: 1,
        integer: true,
      }) ?? 5,
    transcriptWindow:
      optionalNumberInRange(process.env.ELIZA_LOCATION_ROOM_TRANSCRIPT_WINDOW, {
        min: 1,
        integer: true,
      }) ?? 20,
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

/**
 * Check if Venice/OpenAI-compatible inference is configured.
 */
export function hasVeniceInference(): boolean {
  return Boolean(
    elizaConfig.inference.baseUrl &&
      elizaConfig.inference.apiKey &&
      elizaConfig.inference.model
  )
}
