/**
 * API Client
 * Type-safe fetch wrapper for all API calls
 * Provides centralized error handling, request/response interceptors
 */

/**
 * API Error class
 */
export class ApiError extends Error {
  constructor(
    public status: number,
    public statusText: string,
    message: string,
    public data?: any
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

/**
 * Request configuration
 */
export interface RequestConfig extends RequestInit {
  params?: Record<string, string | number | boolean | undefined>
}

/**
 * Type-safe API client
 */
export class ApiClient {
  private baseUrl: string

  constructor(baseUrl: string = '') {
    this.baseUrl = baseUrl
  }

  /**
   * Build URL with query parameters
   */
  private buildUrl(endpoint: string, params?: Record<string, string | number | boolean | undefined>): string {
    const url = new URL(endpoint, this.baseUrl || window.location.origin)

    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          url.searchParams.append(key, String(value))
        }
      })
    }

    return url.toString()
  }

  /**
   * Make HTTP request
   */
  private async request<T>(endpoint: string, config: RequestConfig = {}): Promise<T> {
    const { params, ...fetchConfig } = config

    const url = this.buildUrl(endpoint, params)

    try {
      const response = await fetch(url, {
        ...fetchConfig,
        headers: {
          'Content-Type': 'application/json',
          ...fetchConfig.headers,
        },
      })

      // Parse response body
      let data: any
      const contentType = response.headers.get('content-type')
      if (contentType?.includes('application/json')) {
        data = await response.json()
      } else {
        data = await response.text()
      }

      // Handle errors
      if (!response.ok) {
        throw new ApiError(
          response.status,
          response.statusText,
          data?.error || data?.message || 'Request failed',
          data
        )
      }

      return data as T
    } catch (error) {
      // Re-throw ApiError
      if (error instanceof ApiError) {
        throw error
      }

      // Network or other errors
      throw new ApiError(
        0,
        'Network Error',
        error instanceof Error ? error.message : 'An unknown error occurred'
      )
    }
  }

  /**
   * GET request
   */
  async get<T>(endpoint: string, config?: RequestConfig): Promise<T> {
    return this.request<T>(endpoint, {
      ...config,
      method: 'GET',
    })
  }

  /**
   * POST request
   */
  async post<T>(endpoint: string, body?: any, config?: RequestConfig): Promise<T> {
    return this.request<T>(endpoint, {
      ...config,
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    })
  }

  /**
   * PATCH request
   */
  async patch<T>(endpoint: string, body?: any, config?: RequestConfig): Promise<T> {
    return this.request<T>(endpoint, {
      ...config,
      method: 'PATCH',
      body: body ? JSON.stringify(body) : undefined,
    })
  }

  /**
   * DELETE request
   */
  async delete<T>(endpoint: string, config?: RequestConfig): Promise<T> {
    return this.request<T>(endpoint, {
      ...config,
      method: 'DELETE',
    })
  }
}

// Export singleton instance
export const apiClient = new ApiClient('/api')
