/**
 * Footer Component
 *
 * Site footer with external links to community resources and copyright information.
 * Uses environment variables for configurable URLs.
 *
 * @component
 * @example
 * ```tsx
 * import { Footer } from '@/components/layout/Footer'
 *
 * // In app/layout.tsx
 * export default function RootLayout({ children }) {
 *   return (
 *     <body>
 *       <main>{children}</main>
 *       <Footer />
 *     </body>
 *   )
 * }
 * ```
 *
 * Features:
 * - **External Links**: Discord, OpenSea, Twitter with fallback URLs
 * - **Security**: All external links use target="_blank" and rel="noopener noreferrer"
 * - **Responsive Layout**: Flex-wrap for link row, centered alignment
 * - **Accessibility**: 44x44px minimum touch targets on all links
 * - **Gothic Styling**: Shadow background, midnight border, ash text with bone hover
 * - **Environment Variables**: Customizable URLs via .env (NEXT_PUBLIC_DISCORD_URL, etc.)
 * - **Auto-positioning**: Uses mt-auto to stick to bottom of flex container
 *
 * External Links:
 * - Discord: Community chat and discussions
 * - OpenSea: NFT marketplace collection
 * - Twitter: Official project updates
 */
export function Footer() {
  const externalLinks = [
    {
      label: 'Discord',
      url: process.env.NEXT_PUBLIC_DISCORD_URL || 'https://discord.gg/wagdie',
    },
    {
      label: 'OpenSea',
      url: process.env.NEXT_PUBLIC_OPENSEA_URL || 'https://opensea.io/collection/wagdie',
    },
    {
      label: 'Twitter',
      url: process.env.NEXT_PUBLIC_TWITTER_URL || 'https://twitter.com/WAGDIE_ETH',
    },
  ]

  return (
    <footer className="bg-shadow border-t border-midnight mt-auto">
      <div className="container mx-auto px-4 py-8">
        {/* External Links */}
        <div className="flex justify-center gap-8 flex-wrap">
          {externalLinks.map((link) => (
            <a
              key={link.label}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-ash hover:text-bone transition-colors duration-200 min-h-[44px] flex items-center"
            >
              {link.label}
            </a>
          ))}
        </div>

        {/* Copyright and Description */}
        <p className="text-center text-mist text-sm mt-4">
          © 2025 WAGDIE. Community-driven fantasy NFT project.
        </p>
      </div>
    </footer>
  )
}
