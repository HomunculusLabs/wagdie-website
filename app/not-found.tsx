/**
 * 404 Not Found Page
 */

import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <h1 className="text-9xl font-bold text-gold mb-4">404</h1>
        <h2 className="text-3xl font-bold text-bone mb-4">Page Not Found</h2>
        <p className="text-ash mb-8">
          The page you're looking for has ventured too deep into the abyss.
        </p>

        <div className="flex gap-4 justify-center">
          <Link
            href="/"
            className="px-6 py-3 bg-gold text-abyss font-bold rounded hover:bg-yellow-500 transition-colors"
          >
            Return Home
          </Link>
          <Link
            href="/characters"
            className="px-6 py-3 bg-midnight text-ash border border-shadow rounded hover:text-bone transition-colors"
          >
            Browse Characters
          </Link>
        </div>
      </div>
    </div>
  )
}
