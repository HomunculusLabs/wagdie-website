/**
 * Animated Character View (Placeholder)
 * Future: Display animated version of character
 */

'use client'

import { useParams, useRouter } from 'next/navigation'

export default function AnimatedCharacterPage() {
  const params = useParams()
  const router = useRouter()
  const tokenId = params.tokenId as string

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-bone mb-4">
          Animated View
        </h1>
        <p className="text-xl text-ash mb-8">
          Character #{tokenId}
        </p>
        <p className="text-mist mb-8">
          This feature is coming soon! <br />
          Animated character views will be displayed here.
        </p>
        <button
          onClick={() => router.push(`/characters/${tokenId}`)}
          className="px-6 py-3 bg-gold text-abyss font-bold rounded hover:bg-yellow-500 transition-colors"
        >
          Back to Character Sheet
        </button>
      </div>
    </div>
  )
}
