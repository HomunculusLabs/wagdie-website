/**
 * 404 Not Found Page
 */

import Link from 'next/link'
import { Button } from '@/components/ui'

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-soul-950">
      <div className="text-center max-w-md">
        <h1 className="text-[8rem] font-display text-soul-accent mb-4 leading-none">404</h1>
        <h2 className="text-h2 font-display text-neutral-200 mb-4">Page Not Found</h2>
        <p className="text-body text-neutral-500 font-eskapade mb-8">
          The page you&apos;re looking for has ventured too deep into the abyss.
        </p>

        <div className="flex gap-4 justify-center">
          <Link href="/">
            <Button>Return Home</Button>
          </Link>
          <Link href="/characters">
            <Button variant="secondary">Browse Characters</Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
