/**
 * HomeCard Component
 * Content card for home page sections
 */

import Link from 'next/link'
import Image from 'next/image'

interface HomeCardProps {
  title: string
  description: string
  imageSrc: string
  href: string
  isExternal?: boolean
  className?: string
}

export function HomeCard({
  title,
  description,
  imageSrc,
  href,
  isExternal = false,
  className = ''
}: HomeCardProps) {
  const cardContent = (
    <div className={`group relative overflow-hidden rounded-lg bg-midnight border border-shadow hover:border-gold transition-all duration-300 ${className}`}>
      {/* Image */}
      <div className="relative w-full aspect-video">
        <Image
          src={imageSrc}
          alt={title}
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-300"
        />
      </div>

      {/* Content */}
      <div className="p-6">
        <h3 className="text-xl font-bold text-bone mb-2 group-hover:text-gold transition-colors">
          {title}
          {isExternal && <span className="ml-2 text-sm">↗</span>}
        </h3>
        <p className="text-ash">{description}</p>
      </div>
    </div>
  )

  if (isExternal) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="block"
      >
        {cardContent}
      </a>
    )
  }

  return <Link href={href}>{cardContent}</Link>
}
