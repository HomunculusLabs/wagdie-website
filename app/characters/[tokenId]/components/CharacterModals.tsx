'use client'

/**
 * CharacterModals Component
 * Container for all character-related modals.
 */

import toast from 'react-hot-toast'
import { SearingModal } from '@/components/modals/SearingModal'
import { InfectionModal } from '@/components/modals/InfectionModal'
import { CureModal } from '@/components/modals/CureModal'
import { ChatSidebar } from '@/components/chat'

interface CharacterModalsProps {
  tokenId: number
  name: string
  isSearingModalOpen: boolean
  isInfectionModalOpen: boolean
  isCureModalOpen: boolean
  isChatOpen: boolean
  onCloseSearing: () => void
  onCloseInfection: () => void
  onCloseCure: () => void
  onCloseChat: () => void
}

export function CharacterModals({
  tokenId,
  name,
  isSearingModalOpen,
  isInfectionModalOpen,
  isCureModalOpen,
  isChatOpen,
  onCloseSearing,
  onCloseInfection,
  onCloseCure,
  onCloseChat,
}: CharacterModalsProps) {
  return (
    <>
      <SearingModal
        wagdieId={tokenId}
        wagdieName={name}
        isOpen={isSearingModalOpen}
        onClose={onCloseSearing}
        onSuccess={() => {
          toast.success('Character seared successfully!')
          window.location.reload()
        }}
      />
      <InfectionModal
        mode="specific"
        tokenId={BigInt(tokenId)}
        tokenName={name}
        isOpen={isInfectionModalOpen}
        onClose={onCloseInfection}
        onSuccess={() => {
          toast.success('Character infected successfully!')
          window.location.reload()
        }}
      />
      <CureModal
        characterId={tokenId}
        characterName={name}
        isOpen={isCureModalOpen}
        onClose={onCloseCure}
        onSuccess={() => {
          toast.success('Character cured successfully!')
          window.location.reload()
        }}
      />
      <ChatSidebar
        tokenId={String(tokenId)}
        characterName={name}
        isOpen={isChatOpen}
        onClose={onCloseChat}
      />
    </>
  )
}
