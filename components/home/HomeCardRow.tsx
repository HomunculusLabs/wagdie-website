/**
 * HomeCardRow Component
 * Container for a row of HomeCard components with title
 */

import React from 'react';

interface HomeCardRowProps {
  title: string
  children: React.ReactNode
  className?: string
}

export function HomeCardRow({ title, children, className = '' }: HomeCardRowProps) {
  return (
    <section className={`py-12 ${className}`}>
      <h2 className="text-3xl font-bold text-bone mb-8 text-center">{title}</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {children}
      </div>
    </section>
  )
}
