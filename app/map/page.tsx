/**
 * Map page - Interactive map feature
 * T015 [US1] Create map page (depends on T013, T014)
 *
 * User Story 1: Users can access the interactive world map from navigation,
 * see map displayed in iframe, and navigate between pages
 */

'use client'

import { MapEmbed } from '@/components/map/MapEmbed'
import { CharacterLocationList } from '@/components/map/CharacterLocationList'
import { MapErrorBoundary } from '@/components/map/ErrorBoundary'
import { useAccount } from 'wagmi'

export default function MapPage() {
  const { address, isConnected } = useAccount()

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold mb-8">World Map</h1>

      <MapErrorBoundary>
        <MapEmbed />
      </MapErrorBoundary>

      {isConnected && (
        <div className="mt-8">
          <h2 className="text-2xl font-bold mb-4">Your Characters</h2>
          <MapErrorBoundary>
            <CharacterLocationList />
          </MapErrorBoundary>
        </div>
      )}
    </div>
  )
}
