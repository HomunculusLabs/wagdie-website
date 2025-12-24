import type { Metadata } from 'next'
import './globals.css'
import { Providers } from '@/components/providers'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'),
  title: 'WAGDIE - We Are All Going to Die',
  description: 'WAGDIE NFT Community Platform - Connect your wallet to explore characters, lore, and participate in the dark fantasy world where your choices shape the narrative.',
  keywords: ['WAGDIE', 'NFT', 'Ethereum', 'Dark Fantasy', 'Community', 'Web3', 'Gaming'],
  authors: [{ name: 'WAGDIE Community' }],
  openGraph: {
    title: 'WAGDIE - We Are All Going to Die',
    description: 'Community-driven dark fantasy NFT project where your choices shape the narrative',
    type: 'website',
    siteName: 'WAGDIE',
    images: [
      {
        url: '/images/og-image.png',
        width: 1200,
        height: 630,
        alt: 'WAGDIE - We Are All Going to Die',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'WAGDIE - We Are All Going to Die',
    description: 'Community-driven dark fantasy NFT project',
    images: ['/images/og-image.png'],
    creator: '@WAGDIE_ETH',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark">
      <body className="flex flex-col min-h-screen bg-soul-950 text-neutral-300 selection:bg-soul-blood selection:text-white">
        <Providers>
          <Header />
          <main className="flex-1">{children}</main>
          <Footer />
        </Providers>
      </body>
    </html>
  )
}
