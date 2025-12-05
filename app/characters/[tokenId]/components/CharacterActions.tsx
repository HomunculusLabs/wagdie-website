'use client'

/**
 * CharacterActions Component
 * Blockchain action buttons for character owners.
 */

import { Card, CardContent, Button } from '@/components-new'

const FireIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" />
  </svg>
)

const SkullIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
)

const HeartIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
  </svg>
)

interface CharacterActionsProps {
  isInfected: boolean
  onSear: () => void
  onInfect: () => void
  onCure: () => void
}

export function CharacterActions({
  isInfected,
  onSear,
  onInfect,
  onCure,
}: CharacterActionsProps) {
  return (
    <Card className="mt-auto">
      <CardContent className="p-4">
        <p className="text-[16px] font-display tracking-widest text-neutral-500 mb-3">
          Blockchain Actions
        </p>
        <div className="flex flex-wrap gap-2">
          <Button variant="primary" onClick={onSear} className="gap-2">
            <FireIcon /> Sear Concords
          </Button>
          <Button variant="danger" onClick={onInfect} className="gap-2">
            <SkullIcon /> Infect
          </Button>
          {isInfected && (
            <Button
              variant="secondary"
              onClick={onCure}
              className="gap-2 border-emerald-900/50 text-emerald-500 hover:border-emerald-700"
            >
              <HeartIcon /> Cure
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
