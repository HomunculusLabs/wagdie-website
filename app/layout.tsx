import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'WAGDIE - We Are All Going to Die',
  description: 'WAGDIE NFT Community Platform',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
