import type { ReactNode } from 'react'
import { AdminNav } from './AdminNav'

interface AdminShellProps {
  children: ReactNode
  title?: string
  description?: string
  contentClassName?: string
}

export function AdminShell({
  children,
  title,
  description,
  contentClassName = 'mx-auto w-full max-w-7xl px-4 py-6 sm:px-6',
}: AdminShellProps) {
  return (
    <div className="min-h-screen bg-abyss text-soul-bone">
      <AdminNav />
      {(title || description) && (
        <header className="border-b border-soul-accent/10 bg-abyss/80">
          <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
            {title && (
              <h1 className="font-display text-3xl text-soul-accent">
                {title}
              </h1>
            )}
            {description && (
              <p className="mt-2 max-w-3xl text-sm text-soul-mist/75">
                {description}
              </p>
            )}
          </div>
        </header>
      )}
      <div className={contentClassName}>{children}</div>
    </div>
  )
}
