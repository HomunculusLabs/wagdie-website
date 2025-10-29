/**
 * Tweet entity types
 * Official lore content from @WAGDIE_ETH Twitter account
 */

export type MediaType = 'none' | 'image' | 'video'

export interface Tweet {
  tweet_id: string
  text: string
  author_username: string
  created_at: string
  media_type: MediaType
  media_url: string | null
  video_url: string | null
  engagement_count: EngagementCount | null
  is_reply: boolean
  is_retweet: boolean
  fetched_at: string
}

export interface EngagementCount {
  likes: number
  retweets: number
  replies: number
}

export type TweetFilterTab = 'all' | 'text' | 'video'
export type SortOrder = 'asc' | 'desc'

export interface TweetFilters {
  tab: TweetFilterTab
  sort: SortOrder
  perPage: number
  startAt?: string // Cursor for pagination
}

export interface TweetsResponse {
  tweets: Tweet[]
  hasMore: boolean
  nextCursor: string | null
}
