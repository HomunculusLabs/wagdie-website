'use client'

import { useState } from 'react'
import dynamic from 'next/dynamic'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { WagmiProvider } from 'wagmi'
import { RainbowKitProvider, darkTheme } from '@rainbow-me/rainbowkit'
import { config } from '@/lib/wagmi'
import { TransactionProvider } from '@/contexts/TransactionContext'
import '@rainbow-me/rainbowkit/styles.css'

import { ChatDockProvider, useChatDock } from '@/contexts/ChatDockContext'

// Lazy load chat components to reduce initial bundle size
const ChatDock = dynamic(
  () => import('@/components/chat/ChatDock').then(mod => ({ default: mod.ChatDock })),
  { ssr: false }
)
const ChatToggleButton = dynamic(
  () => import('@/components/chat/ChatToggleButton').then(mod => ({ default: mod.ChatToggleButton })),
  { ssr: false }
)

function ChatDockContentWrapper({ children }: { children: React.ReactNode }) {
  const { isOpen, target } = useChatDock()
  const shouldPushContent = isOpen && !!target

  return (
    <div
      className={`transition-[margin] duration-300 ${shouldPushContent ? 'md:mr-[500px]' : ''}`}
    >
      {children}
    </div>
  )
}

export function Providers({ children }: { children: React.ReactNode }) {
  // Initialize QueryClient inside component to avoid issues with React Fast Refresh
  const [queryClient] = useState(() => new QueryClient())

  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider
          theme={darkTheme({
            accentColor: '#8b2635', // Gothic blood red
            accentColorForeground: 'white',
            borderRadius: 'medium',
          })}
        >
          <TransactionProvider>
            <ChatDockProvider>
              <ChatDockContentWrapper>
                {children}
              </ChatDockContentWrapper>
              <ChatDock />
              <ChatToggleButton />
            </ChatDockProvider>
          </TransactionProvider>
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  )
}
