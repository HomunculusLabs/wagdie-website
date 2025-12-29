/**
 * Animated Character View (Placeholder)
 * Future: Display animated version of character
 */

'use client'

import { useParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui'

export default function AnimatedCharacterPage() {
  const params = useParams()
  const router = useRouter()
  const tokenId = params.tokenId as string

  return (
    <div className="min-h-screen flex items-center justify-center bg-soul-950">
      <div className="text-center max-w-md">
        <h1 className="text-h1 font-display text-neutral-200 mb-4">
          Animated View
        </h1>
        <p className="text-h3 text-soul-accent mb-8 font-eskapade">
          Character #{tokenId}
        </p>
        <p className="text-body text-neutral-500 mb-8 font-eskapade">
          This feature is coming soon! <br />
          Animated character views will be displayed here.
        </p>
        <Button onClick={() => router.push(`/characters/${tokenId}`)}>
          Back to Character Sheet
        </Button>
      </div>
    </div>
  )
}
