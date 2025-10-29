/**
 * BannerHeader Component
 * Page title banner with optional subtitle
 */

interface BannerHeaderProps {
  title: string
  subtitle?: string
  className?: string
}

export function BannerHeader({ title, subtitle, className = '' }: BannerHeaderProps) {
  return (
    <header className={`bg-gray-900 text-white px-4 py-6 md:px-8 md:py-8 ${className}`}>
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl md:text-4xl font-bold mb-2">{title}</h1>
        {subtitle && (
          <p className="text-gray-400 text-lg">{subtitle}</p>
        )}
      </div>
    </header>
  )
}
