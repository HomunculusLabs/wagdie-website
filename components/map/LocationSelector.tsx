'use client'

import React, { useState, useMemo, useCallback } from 'react'
import { useLocations } from '@/hooks/map/useLocations'
import { useLocationStaking } from '@/hooks/map/useLocationStaking'
import { TransactionStatus } from './TransactionStatus'

interface LocationSelectorProps {
  characterId: string
  currentLocationId?: string
  isOpen: boolean
  onClose: () => void
}

function LocationSelector({
  characterId,
  currentLocationId,
  isOpen,
  onClose,
}: LocationSelectorProps) {
  const { data: locations, isLoading } = useLocations()
  const { stake, move, isPending, isSuccess, error, hash } = useLocationStaking()
  const [selectedLocationId, setSelectedLocationId] = useState<string>('')
  const [showStatus, setShowStatus] = useState(false)

  // Memoize footerMessage to avoid recalculation on every render
  const footerMessage = useMemo(() => {
    if (!selectedLocationId) {
      return 'Select a location to continue'
    } else if (currentLocationId === selectedLocationId) {
      return 'Character is already at this location'
    } else {
      return 'Ready to stake character'
    }
  }, [selectedLocationId, currentLocationId])

  // Memoize buttonText to avoid recalculation on every render
  const buttonText = useMemo(() => {
    if (isPending) {
      return 'Staking...'
    } else if (currentLocationId) {
      return 'Move Character'
    } else {
      return 'Stake Character'
    }
  }, [isPending, currentLocationId])

  const handleComplete = () => {
    setShowStatus(true)
    setTimeout(() => {
      onClose()
      setShowStatus(false)
      setSelectedLocationId('')
    }, 3000)
  }

  const handleConfirm = () => {
    if (!selectedLocationId) return

    if (currentLocationId && currentLocationId !== selectedLocationId) {
      move([{ wagdieId: BigInt(characterId), newLocationId: BigInt(selectedLocationId) }])
    } else {
      stake([{ wagdieId: BigInt(characterId), locationId: BigInt(selectedLocationId) }])
    }
    setShowStatus(true)
  }

  const handleClose = () => {
    if (!isPending) {
      onClose()
      setShowStatus(false)
      setSelectedLocationId('')
    }
  }

  // Memoize status for TransactionStatus
  const status = useMemo<'pending' | 'confirmed' | 'failed'>(() => {
    if (isPending) {
      return 'pending'
    } else if (isSuccess) {
      return 'confirmed'
    } else {
      return 'failed'
    }
  }, [isPending, isSuccess])

  // Compute cursor style
  const cursorStyle = useMemo(
    () => (isPending ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'),
    [isPending]
  )

  const renderContent = useCallback(() => {
    if (isLoading) {
      return (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse bg-midnight/10 rounded-lg p-4 h-24" />
          ))}
        </div>
      )
    }

    if (showStatus && (isPending || isSuccess || error)) {
      return (
        <TransactionStatus
          hash={hash}
          status={status}
          error={error}
          onComplete={handleComplete}
          onRetry={() => {
            setShowStatus(false)
          }}
        />
      )
    }

    return (
      <div className="space-y-3">
        {locations?.map((location) => (
          <button
            key={location.id}
            onClick={() => setSelectedLocationId(location.id)}
            disabled={isPending}
            className={`w-full text-left p-4 rounded-lg border transition-colors ${
              selectedLocationId === location.id
                ? 'border-gold bg-gold/10'
                : 'border-midnight hover:border-midnight/80'
            } ${cursorStyle}`}
            data-testid="location-item"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-lg font-bold text-bone">{location.name}</h3>
                  {currentLocationId === location.id && (
                    <span className="px-2 py-1 text-xs bg-green-500/20 text-green-400 rounded">
                      Current
                    </span>
                  )}
                </div>

                {location.description && (
                  <p className="text-sm text-bone/70">{location.description}</p>
                )}

                {location.metadata && location.metadata.special_properties && (
                  <div className="flex gap-2 mt-2">
                    {location.metadata.special_properties.map((prop) => (
                      <span
                        key={prop}
                        className="px-2 py-1 text-xs bg-midnight/30 text-bone/80 rounded"
                      >
                        {prop}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {selectedLocationId === location.id && (
                <svg
                  className="w-6 h-6 text-gold flex-shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              )}
            </div>
          </button>
        ))}

        {(!locations || locations.length === 0) && (
          <div className="text-center py-8 text-bone/60">
            <p>No locations available at the moment.</p>
          </div>
        )}
      </div>
    )
  }, [isLoading, showStatus, isPending, isSuccess, error, hash, handleComplete, locations, selectedLocationId, currentLocationId, cursorStyle, status])

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isPending) {
          handleClose()
        }
      }}
    >
      <div
        className="bg-abyss border border-midnight rounded-lg max-w-2xl w-full max-h-[90vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
        data-testid="location-selector"
      >
        <div className="p-6 border-b border-midnight">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-bone">
              Select Location
            </h2>
            {!isPending && (
              <button
                onClick={handleClose}
                className="text-bone/60 hover:text-bone transition-colors"
                aria-label="Close"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
          <p className="text-bone/60 mt-2">
            Choose where to stake WAGDIE #{characterId}
          </p>
        </div>

        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {renderContent()}
        </div>

        {showStatus ? null : (
          <div className="p-6 border-t border-midnight bg-midnight/20">
            <div className="flex items-center justify-between">
              <p className="text-sm text-bone/60">{footerMessage}</p>
              <div className="flex gap-3">
                <button onClick={handleClose} disabled={isPending} className="px-4 py-2 border border-midnight text-bone rounded-lg hover:bg-midnight/20 transition-colors disabled:opacity-50">
                  Cancel
                </button>
                <button onClick={handleConfirm} disabled={!selectedLocationId || isPending || currentLocationId === selectedLocationId} className="px-6 py-2 bg-gold text-abyss font-bold rounded-lg hover:bg-gold/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed" data-testid="confirm-stake-button">
                  {buttonText}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// Memoize the component to prevent unnecessary re-renders
const LocationSelectorComponent = React.memo(LocationSelector)
export { LocationSelectorComponent as LocationSelector }
