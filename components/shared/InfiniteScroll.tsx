/**
 * InfiniteScroll Component
 * Wrapper for infinite scroll pagination using Intersection Observer
 */

'use client'

import { useInView } from 'react-intersection-observer'
import { useEffect } from 'react'

interface InfiniteScrollProps {
  hasMore: boolean
  isLoading: boolean
  onLoadMore: () => void
  children: React.ReactNode
  loaderComponent?: React.ReactNode
  className?: string
}

export function InfiniteScroll({
  hasMore,
  isLoading,
  onLoadMore,
  children,
  loaderComponent,
  className = ''
}: InfiniteScrollProps) {
  const { ref, inView } = useInView({
    threshold: 0,
    rootMargin: '100px', // Trigger 100px before reaching the sentinel
  })

  // Trigger load more when sentinel comes into view
  useEffect(() => {
    if (inView && hasMore && !isLoading) {
      onLoadMore()
    }
  }, [inView, hasMore, isLoading, onLoadMore])

  return (
    <div className={className}>
      {children}

      {/* Sentinel element for intersection observer */}
      {hasMore && (
        <div ref={ref} className="py-8 flex justify-center">
          {isLoading && (loaderComponent || <DefaultLoader />)}
        </div>
      )}

      {/* End of results message */}
      {!hasMore && !isLoading && (
        <div className="py-8 text-center text-gray-500">
          No more items to load
        </div>
      )}
    </div>
  )
}

function DefaultLoader() {
  return (
    <div className="flex items-center space-x-2">
      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
    </div>
  )
}
