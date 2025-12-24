/**
 * InfiniteScroll Component
 * Wrapper for infinite scroll pagination using Intersection Observer
 */

'use client'

import { useInView } from 'react-intersection-observer'
import { useEffect, useRef, useCallback } from 'react'
import { Spinner } from '@/components/ui/Spinner'

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
    threshold: 0.1, // Require 10% visibility before triggering
    rootMargin: '200px', // Trigger 200px before reaching the sentinel
  })

  const lastLoadTime = useRef<number>(0)
  const DEBOUNCE_TIME = 2000 // Increased to 2 seconds debounce between loads

  // Debounced load more function to prevent rapid fire calls
  const debouncedLoadMore = useCallback(() => {
    const now = Date.now()
    if (now - lastLoadTime.current > DEBOUNCE_TIME) {
      lastLoadTime.current = now
      onLoadMore()
    }
  }, [onLoadMore])

  // Trigger load more when sentinel comes into view
  useEffect(() => {
    if (inView && hasMore && !isLoading) {
      debouncedLoadMore()
    }
  }, [inView, hasMore, isLoading, debouncedLoadMore])

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
  return <Spinner size="md" />
}
