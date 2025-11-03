/**
 * Tweet Service
 * Domain layer - Business logic for fetching and filtering official WAGDIE tweets
 * Uses repository layer for data access (dependency injection)
 */

import { tweetRepository, type ITweetRepository } from '../repositories'
import type { Tweet, TweetFilters, TweetsResponse } from '@/types/tweet'

/**
 * Tweet Service
 * Encapsulates business rules for tweet handling
 */
export class TweetService {
  constructor(private repository: ITweetRepository) {}

  /**
   * Get tweets with filtering, pagination, and sorting
   * Business rule: Always filter out replies and retweets
   */
  async getTweets(filters: TweetFilters): Promise<TweetsResponse> {
    return this.repository.findMany(filters)
  }

  /**
   * Get tweets with auto-refresh capability
   * Useful for real-time lore updates
   */
  async getTweetsWithRefresh(filters: TweetFilters, lastFetchTime?: Date): Promise<TweetsResponse> {
    const result = await this.getTweets(filters)

    // Additional business logic can be added here
    // e.g., filter by timestamp, check for new content, etc.

    return result
  }
}

// Export singleton instance
export const tweetService = new TweetService(tweetRepository)

// Export individual functions for backward compatibility
export const getTweets = (filters: TweetFilters) => tweetService.getTweets(filters)
