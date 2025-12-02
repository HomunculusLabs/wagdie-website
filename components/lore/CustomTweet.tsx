/**
 * CustomTweet Component
 * Tweet card with text, images, video support, and engagement counts
 */

'use client'

import Image from 'next/image'
import { Card, CardContent, Avatar } from '@/components-new'
import type { Tweet } from '@/types/tweet'

interface CustomTweetProps {
  tweet: Tweet
  translationEnabled?: boolean
  className?: string
}

export function CustomTweet({
  tweet,
  translationEnabled = false,
  className = ''
}: CustomTweetProps) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  return (
    <Card className={`overflow-hidden transition-all duration-500 hover:border-soul-accent/40 ${className}`}>
      {/* Header */}
      <div className="p-4 border-b border-neutral-800/50">
        <div className="flex items-center gap-3">
          <Avatar
            initials="W"
            size="md"
            shape="square"
          />
          <div>
            <p className="font-display  tracking-wider text-sm text-neutral-200">
              @{tweet.author_username}
            </p>
            <p className="text-xs text-neutral-600 font-eskapade">{formatDate(tweet.created_at)}</p>
          </div>
        </div>
      </div>

      {/* Content */}
      <CardContent className="p-4">
        <p className="text-neutral-300 font-eskapade leading-relaxed whitespace-pre-wrap mb-4">
          {tweet.text}
        </p>

        {/* Translation (placeholder) */}
        {translationEnabled && (
          <div className="bg-black/30 border border-neutral-800 p-3 mb-4">
            <p className="text-sm text-neutral-600 font-eskapade italic">
              Translation feature coming soon...
            </p>
          </div>
        )}

        {/* Media - Image */}
        {tweet.media_type === 'image' && tweet.media_url && (
          <div className="relative w-full aspect-video overflow-hidden mb-4 border border-neutral-800">
            <Image
              src={tweet.media_url}
              alt="Tweet image"
              fill
              className="object-cover grayscale-[20%] hover:grayscale-0 transition-all duration-500"
            />
          </div>
        )}

        {/* Media - Video */}
        {tweet.media_type === 'video' && tweet.video_url && (
          <div className="overflow-hidden mb-4 border border-neutral-800">
            <video
              controls
              preload="metadata"
              className="w-full"
            >
              <source src={tweet.video_url} type="video/mp4" />
              Your browser does not support the video tag.
            </video>
          </div>
        )}

        {/* Engagement Counts */}
        {tweet.engagement_count && (
          <div className="flex gap-6 text-xs text-neutral-600 mt-4 pt-4 border-t border-neutral-800/50">
            <span className="flex items-center gap-2 hover:text-red-500 transition-colors cursor-default">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
              {tweet.engagement_count.likes.toLocaleString()}
            </span>
            <span className="flex items-center gap-2 hover:text-soul-accent transition-colors cursor-default">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              {tweet.engagement_count.replies.toLocaleString()}
            </span>
            <span className="flex items-center gap-2 hover:text-emerald-500 transition-colors cursor-default">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
              </svg>
              {tweet.engagement_count.retweets.toLocaleString()}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
