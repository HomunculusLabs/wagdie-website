/**
 * Eliza SDK Client Singleton
 * Provides a configured ElizaClient instance for server-side use
 */

import { ElizaClient, type ElizaClientConfig } from '@eliza/sdk'
import { elizaConfig } from './config'

let serverClient: ElizaClient | null = null

/**
 * Get the server-side Eliza client singleton
 * Uses API key authentication for server-to-server communication
 */
export function getElizaClient(): ElizaClient {
  if (typeof window !== 'undefined') {
    throw new Error('getElizaClient should only be called on the server side')
  }

  if (!serverClient) {
    const config: ElizaClientConfig = {
      baseUrl: elizaConfig.baseUrl,
      apiKey: elizaConfig.apiKey,
      timeout: elizaConfig.timeout,
      retry: elizaConfig.retry,
    }

    serverClient = new ElizaClient(config)
  }

  return serverClient
}

/**
 * Create a client with user-specific authentication
 * Used when proxying requests for a specific user
 */
export function createUserClient(accessToken: string): ElizaClient {
  const config: ElizaClientConfig = {
    baseUrl: elizaConfig.baseUrl,
    accessToken,
    timeout: elizaConfig.timeout,
    retry: elizaConfig.retry,
  }

  return new ElizaClient(config)
}

/**
 * Reset the server client (useful for testing)
 */
export function resetElizaClient(): void {
  serverClient = null
}
