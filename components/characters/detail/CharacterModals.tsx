'use client'

/**
 * CharacterModals Component
 * Container for all character-related modals.
 */

import toast from 'react-hot-toast'
import { SearingModal } from '@/components/modals/SearingModal'
import { InfectionModal } from '@/components/modals/InfectionModal'
import { CureModal } from '@/components/modals/CureModal'

interface CharacterModalsProps {
  tokenId: number
  name: string
  isSearingModalOpen: boolean
  isInfectionModalOpen: boolean
  isCureModalOpen: boolean
  onCloseSearing: () => void
  onCloseInfection: () => void
  onCloseCure: () => void
}

export function CharacterModals({
  tokenId,
  name,
  isSearingModalOpen,
  isInfectionModalOpen,
  isCureModalOpen,
  onCloseSearing,
  onCloseInfection,
  onCloseCure,
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
    </>
  )
}
