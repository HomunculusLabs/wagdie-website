'use client'

import React, { useState, useEffect, useCallback } from 'react'

const STORAGE_KEY = 'wagdie-map-onboarding-dismissed'

interface OnboardingStep {
  title: string
  description: string
  icon: React.ReactNode
}

const ONBOARDING_STEPS: OnboardingStep[] = [
  {
    title: 'Explore the Map',
    description: 'Scroll to zoom in and out. Click and drag to pan around the world.',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
      </svg>
    ),
  },
  {
    title: 'Toggle Layers',
    description: 'Use the Layers button to show or hide locations, characters, burns, deaths, and fights.',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M4 12h16M4 18h16" />
      </svg>
    ),
  },
  {
    title: 'Click Locations',
    description: 'Click on any location marker to see details and manage staking for your characters.',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
  {
    title: 'Stake Your Characters',
    description: 'Connect your wallet, select a location, and stake your WAGDIE characters to claim territory.',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.879 16.121A3 3 0 1012.015 11L11 14H9c0 .768.293 1.536.879 2.121z" />
      </svg>
    ),
  },
]

interface MapOnboardingProps {
  className?: string
}

/**
 * MapOnboarding Component
 * Shows a dismissible onboarding tooltip for first-time map visitors.
 * Persists dismissal state in localStorage.
 */
export function MapOnboarding({ className = '' }: MapOnboardingProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [currentStep, setCurrentStep] = useState(0)
  const [hasCheckedStorage, setHasCheckedStorage] = useState(false)

  // Check localStorage on mount
  useEffect(() => {
    const dismissed = localStorage.getItem(STORAGE_KEY)
    if (dismissed !== 'true') {
      setIsVisible(true)
    }
    setHasCheckedStorage(true)
  }, [])

  const handleDismiss = useCallback(() => {
    localStorage.setItem(STORAGE_KEY, 'true')
    setIsVisible(false)
  }, [])

  const handleNext = useCallback(() => {
    if (currentStep < ONBOARDING_STEPS.length - 1) {
      setCurrentStep(prev => prev + 1)
    } else {
      handleDismiss()
    }
  }, [currentStep, handleDismiss])

  const handlePrev = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1)
    }
  }, [currentStep])

  // Don't render until we've checked localStorage (prevents flash)
  if (!hasCheckedStorage || !isVisible) return null

  const step = ONBOARDING_STEPS[currentStep]
  const isLastStep = currentStep === ONBOARDING_STEPS.length - 1

  return (
    <div className={`absolute bottom-4 right-4 z-40 w-80 max-w-[calc(100vw-2rem)] ${className}`}>
      <div className="bg-soul-950/95 border border-soul-accent/30 rounded-lg backdrop-blur-sm overflow-hidden">
        {/* Progress bar */}
        <div className="h-1 bg-neutral-800">
          <div
            className="h-full bg-soul-accent transition-all duration-300"
            style={{ width: `${((currentStep + 1) / ONBOARDING_STEPS.length) * 100}%` }}
          />
        </div>

        {/* Content */}
        <div className="p-4">
          {/* Header */}
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded bg-soul-accent/10 text-soul-accent">
                {step.icon}
              </div>
              <div>
                <h3 className="font-eskapade text-sm text-bone">
                  {step.title}
                </h3>
                <p className="text-xs text-neutral-500">
                  Step {currentStep + 1} of {ONBOARDING_STEPS.length}
                </p>
              </div>
            </div>
            <button
              onClick={handleDismiss}
              className="p-1 text-neutral-500 hover:text-neutral-300 transition-colors"
              aria-label="Dismiss onboarding"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Description */}
          <p className="text-sm text-neutral-400 font-eskapade mb-4">
            {step.description}
          </p>

          {/* Navigation */}
          <div className="flex items-center justify-between">
            <button
              onClick={handlePrev}
              disabled={currentStep === 0}
              className="text-sm text-neutral-500 hover:text-neutral-300 disabled:opacity-30 disabled:cursor-not-allowed transition-colors font-eskapade"
            >
              Previous
            </button>

            <div className="flex items-center gap-1.5">
              {ONBOARDING_STEPS.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentStep(index)}
                  className={`w-2 h-2 rounded-full transition-colors ${
                    index === currentStep ? 'bg-soul-accent' : 'bg-neutral-700 hover:bg-neutral-600'
                  }`}
                  aria-label={`Go to step ${index + 1}`}
                />
              ))}
            </div>

            <button
              onClick={handleNext}
              className="text-sm text-soul-accent hover:text-soul-accent/80 transition-colors font-eskapade"
            >
              {isLastStep ? 'Got it!' : 'Next'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

/**
 * MapOnboardingTrigger Component
 * A button to re-open the onboarding if the user wants to see it again.
 */
interface MapOnboardingTriggerProps {
  onOpen: () => void
  className?: string
}

export function MapOnboardingTrigger({ onOpen, className = '' }: MapOnboardingTriggerProps) {
  return (
    <button
      onClick={onOpen}
      className={`flex items-center justify-center w-8 h-8 rounded-full bg-neutral-800/80 text-neutral-400 hover:text-soul-accent hover:bg-neutral-700/80 transition-colors ${className}`}
      aria-label="Show map help"
      title="Map help"
    >
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    </button>
  )
}
