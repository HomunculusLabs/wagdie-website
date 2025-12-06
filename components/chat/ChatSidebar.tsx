/**
 * ChatSidebar Component
 * Slide-out chat panel for character conversations with history support
 */

'use client'

import { useEffect, useCallback, useState, memo } from 'react'
import { useAccount } from 'wagmi'
import { ChatHeader } from './ChatHeader'
import { ChatMessages } from './ChatMessages'
import { ChatInput } from './ChatInput'
import { ConversationList } from './ConversationList'
import { useCharacterChat } from '@/hooks/useCharacterChat'
import { useConversations } from '@/hooks/useConversations'
import { Button, Spinner } from '@/components/ui'

interface ChatSidebarProps {
  tokenId: string
  characterName: string
  characterId?: string // Eliza character ID (if known)
  isOpen: boolean
  onClose: () => void
}

// Local storage key for persisting current conversation
const getStorageKey = (tokenId: string, address: string) =>
  `wagdie-chat-conversation-${tokenId}-${address}`

function ChatSidebarComponent({
  tokenId,
  characterName,
  characterId,
  isOpen,
  onClose,
}: ChatSidebarProps) {
  const { isConnected, address } = useAccount()
  const [showHistory, setShowHistory] = useState(false)

  const {
    messages,
    sendMessage,
    isStreaming,
    streamingContent,
    conversationId,
    newConversation,
    setConversationId,
    loadMessages,
    error: chatError,
    clearError: clearChatError,
  } = useCharacterChat(tokenId)

  const {
    conversations,
    activeConversation,
    isLoading: isLoadingConversations,
    isLoadingMore,
    isLoadingConversation,
    hasMore,
    selectConversation,
    deleteConversation,
    loadMore,
    error: conversationsError,
    clearError: clearConversationsError,
  } = useConversations({
    characterId,
    autoFetch: isOpen && isConnected,
  })

  // Combined error
  const error = chatError || conversationsError
  const clearError = useCallback(() => {
    clearChatError()
    clearConversationsError()
  }, [clearChatError, clearConversationsError])

  // Persist conversation ID on change
  useEffect(() => {
    if (conversationId && address) {
      localStorage.setItem(getStorageKey(tokenId, address), conversationId)
    }
  }, [conversationId, tokenId, address])

  // Sync activeConversation messages to chat state
  useEffect(() => {
    if (activeConversation?.messages) {
      loadMessages(activeConversation.messages)
    }
  }, [activeConversation, loadMessages])

  // Restore conversation on open
  useEffect(() => {
    if (isOpen && isConnected && address && !conversationId && !isLoadingConversations) {
      const savedId = localStorage.getItem(getStorageKey(tokenId, address))
      if (savedId) {
        // Check if conversation still exists
        const exists = conversations.some(c => c.id === savedId)
        if (exists) {
          handleSelectConversation(savedId)
        } else {
          // Clear invalid saved ID
          localStorage.removeItem(getStorageKey(tokenId, address))
        }
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, isConnected, address, isLoadingConversations, conversations])

  // Handle Escape key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        if (showHistory) {
          setShowHistory(false)
        } else {
          onClose()
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, showHistory, onClose])

  // Trap focus and prevent body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
      return () => {
        document.body.style.overflow = ''
      }
    }
  }, [isOpen])

  // Handle selecting a conversation from history
  const handleSelectConversation = useCallback(async (id: string) => {
    // selectConversation fetches the conversation and loads messages into activeConversation
    await selectConversation(id)
    // Update local chat state with the conversation
    setConversationId(id)
    // Note: Messages are loaded in activeConversation state from useConversations hook
    // The parent ChatContainer should sync these states
    setShowHistory(false)
  }, [selectConversation, setConversationId])

  // Handle starting new conversation
  const handleNewConversation = useCallback(() => {
    newConversation()
    if (address) {
      localStorage.removeItem(getStorageKey(tokenId, address))
    }
    setShowHistory(false)
  }, [newConversation, tokenId, address])

  // Handle deleting a conversation
  const handleDeleteConversation = useCallback(async (id: string) => {
    const success = await deleteConversation(id)
    if (success && id === conversationId) {
      // If we deleted the active conversation, start fresh
      newConversation()
      if (address) {
        localStorage.removeItem(getStorageKey(tokenId, address))
      }
    }
  }, [deleteConversation, conversationId, newConversation, tokenId, address])

  const handleSend = useCallback(
    (content: string) => {
      sendMessage(content)
    },
    [sendMessage]
  )

  const toggleHistory = useCallback(() => {
    setShowHistory(prev => !prev)
  }, [])

  if (!isOpen) return null

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Sidebar */}
      <aside
        className={`
          fixed top-0 right-0 z-50 h-full
          w-full md:w-[500px]
          bg-soul-950 border-l border-neutral-800
          flex flex-col
          transform transition-transform duration-300 ease-out
          ${isOpen ? 'translate-x-0' : 'translate-x-full'}
        `}
        role="dialog"
        aria-modal="true"
        aria-labelledby="chat-sidebar-title"
      >
        <ChatHeader
          characterName={characterName}
          tokenId={tokenId}
          onClose={onClose}
          onToggleHistory={toggleHistory}
          onNewConversation={handleNewConversation}
          showHistoryToggle={isConnected && conversations.length > 0}
          isHistoryOpen={showHistory}
        />

        {/* Wallet connection gate */}
        {!isConnected ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
            <div className="text-4xl mb-4 opacity-30">🔒</div>
            <h3 className="text-lg font-display text-neutral-200 mb-2">
              Wallet Required
            </h3>
            <p className="text-sm text-neutral-500 mb-4">
              Connect your wallet to chat with {characterName}
            </p>
          </div>
        ) : (
          <>
            {/* Error display */}
            {error && (
              <div className="px-4 py-3 bg-red-900/20 border-b border-red-800/50">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-red-400">{error}</p>
                  <button
                    onClick={clearError}
                    className="text-red-400 hover:text-red-300"
                    aria-label="Dismiss error"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
            )}

            {/* Conversation history panel */}
            {showHistory && (
              <div className="border-b border-neutral-800 bg-neutral-900/50">
                <div className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-display text-neutral-300">
                      Conversation History
                    </h3>
                    <Button
                      variant="secondary"
                      onClick={handleNewConversation}
                      className="px-3 py-1.5 text-xs"
                    >
                      New Chat
                    </Button>
                  </div>
                  <ConversationList
                    conversations={conversations}
                    activeConversationId={conversationId || undefined}
                    isLoading={isLoadingConversations}
                    isLoadingMore={isLoadingMore}
                    hasMore={hasMore}
                    onSelect={handleSelectConversation}
                    onDelete={handleDeleteConversation}
                    onLoadMore={loadMore}
                  />
                </div>
              </div>
            )}

            {/* Loading conversation indicator */}
            {isLoadingConversation && (
              <div className="flex items-center justify-center py-4 border-b border-neutral-800">
                <Spinner size="sm" />
                <span className="ml-2 text-sm text-neutral-500">Loading conversation...</span>
              </div>
            )}

            {/* Messages area */}
            <ChatMessages
              messages={messages}
              isStreaming={isStreaming}
              streamingContent={streamingContent}
              characterName={characterName}
            />

            {/* Input */}
            <ChatInput
              onSend={handleSend}
              disabled={isStreaming}
              placeholder={`Message ${characterName}...`}
            />
          </>
        )}
      </aside>
    </>
  )
}

export const ChatSidebar = memo(ChatSidebarComponent)
