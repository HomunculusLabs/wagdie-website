/**
 * HomeCard Component
 * Content card for home page sections
 */

import React from 'react';
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
    <div className={`group relative bg-midnight ${className}`}>
      {/* Image Borders */}
      <div className="absolute inset-0 pointer-events-none z-20">
        {/* Left Border */}
        <div className="absolute left-0 top-0 bottom-0 w-[6px]">
          <Image
            src="/images/border-l.png"
            alt=""
            fill
            className="object-cover opacity-80 group-hover:opacity-100 transition-opacity"
          />
        </div>
        {/* Right Border */}
        <div className="absolute right-0 top-0 bottom-0 w-[6px]">
          <Image
            src="/images/border-r.png"
            alt=""
            fill
            className="object-cover opacity-80 group-hover:opacity-100 transition-opacity"
          />
        </div>
        {/* Bottom Left Corner */}
        <div className="absolute -left-[2px] -bottom-[2px] w-[32px] h-[32px]">
          <Image
            src="/images/border-bottom-l.png"
            alt=""
            fill
            className="object-contain"
          />
        </div>
        {/* Bottom Right Corner */}
        <div className="absolute -right-[2px] -bottom-[2px] w-[32px] h-[32px]">
          <Image
            src="/images/border-bottom-r.png"
            alt=""
            fill
            className="object-contain"
          />
        </div>
        {/* Top Border (CSS fallback as no image provided) */}
        <div className="absolute left-0 right-0 top-0 h-[1px] bg-shadow group-hover:bg-gold transition-colors duration-300" />
      </div>

      {/* Content Container */}
      <div className="relative z-10 h-full flex flex-col border-t border-transparent">
        {/* Image */}
        <div className="relative w-full aspect-video overflow-hidden">
          <Image
            src={imageSrc}
            alt={title}
            fill
            className="object-cover group-hover:scale-110 transition-transform duration-500 filter group-hover:brightness-110"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-abyss via-transparent to-transparent opacity-50 group-hover:opacity-30 transition-opacity duration-300" />
        </div>

        {/* Text Content */}
        <div className="p-6 bg-shadow/50 flex-grow backdrop-blur-sm">
          <h3 className="text-xl font-bold text-bone mb-2 group-hover:text-gold transition-colors duration-300 font-wagdie tracking-wide ">
            {title}
            {isExternal && <span className="ml-2 text-sm group-hover:text-gold">↗</span>}
          </h3>
          <p className="text-ash text-sm leading-relaxed">{description}</p>
        </div>

        {/* Hover Indicator */}
        <div className="h-1 bg-gold scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left" />
      </div>
    </div>
  )

  if (isExternal) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="block h-full"
      >
        {cardContent}
      </a>
    )
  }

  return <Link href={href} className="block h-full">{cardContent}</Link>
}
