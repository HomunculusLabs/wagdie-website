import type { Metadata } from 'next'
import './globals.css'
import { Providers } from '@/components/providers'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'

export const metadata: Metadata = {
  title: 'WAGDIE - We Are All Going to Die',
  description: 'WAGDIE NFT Community Platform - Connect your wallet to explore characters, lore, and participate in the dark fantasy world.',
  openGraph: {
    title: 'WAGDIE - We Are All Going to Die',
    description: 'Community-driven dark fantasy NFT project',
    type: 'website',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark">
      <body className="flex flex-col min-h-screen bg-abyss text-bone">
        <Providers>
          <Header />
          <main className="flex-1">{children}</main>
          <Footer />
        </Providers>
      </body>
    </html>
  )
}
