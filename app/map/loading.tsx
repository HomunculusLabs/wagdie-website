/**
 * Map page loading state
 * T014 [P] [US1] Create map loading component
 *
 * Displays a loading skeleton while the map page is loading
 */

export default function Loading() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="space-y-8">
        {/* Title skeleton */}
        <div className="animate-pulse">
          <div className="h-10 bg-midnight/20 rounded-lg w-64"></div>
        </div>

        {/* Map iframe skeleton */}
        <div className="animate-pulse">
          <div
            className="w-full border-2 border-midnight rounded-lg overflow-hidden bg-midnight/10"
            style={{ height: '600px' }}
          />
        </div>

        {/* Character list section skeleton */}
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-midnight/20 rounded-lg w-48"></div>
          <div className="space-y-2">
            <div className="h-16 bg-midnight/10 rounded-lg"></div>
            <div className="h-16 bg-midnight/10 rounded-lg"></div>
            <div className="h-16 bg-midnight/10 rounded-lg"></div>
          </div>
        </div>
      </div>
    </div>
  )
}
