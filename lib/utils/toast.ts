// Toast Notification Utilities
// Utilities for displaying toast notifications to users

import { ContractError, TransactionHash } from '@/types/blockchain'
import { getErrorTypeIcon } from '@/lib/contracts/error-parser'

export interface ToastOptions {
  title: string
  description?: string
  duration?: number
  action?: {
    label: string
    onClick: () => void
  }
}

// Toast notification function signature
// This will be implemented by the UI layer (e.g., using Sonner, React Hot Toast, or similar)
export type ToastFunction = (options: ToastOptions) => void

let toastFn: ToastFunction | null = null

export function setToastFunction(fn: ToastFunction): void {
  toastFn = fn
}

export function showToast(options: ToastOptions): void {
  if (toastFn) {
    toastFn(options)
  } else {
    console.warn('Toast function not initialized. Call setToastFunction() first.')
    console.log('Toast:', options)
  }
}

export function showSuccessToast(title: string, description?: string): void {
  showToast({
    title: `✅ ${title}`,
    description,
    duration: 5000,
  })
}

export function showErrorToast(title: string, description?: string): void {
  showToast({
    title: `❌ ${title}`,
    description,
    duration: 7000,
  })
}

export function showInfoToast(title: string, description?: string): void {
  showToast({
    title: `ℹ️ ${title}`,
    description,
    duration: 4000,
  })
}

export function showLoadingToast(title: string, description?: string): void {
  showToast({
    title: `⏳ ${title}`,
    description,
    duration: Infinity, // Loading toasts should be manually dismissed
  })
}

export function showTransactionPendingToast(txHash: TransactionHash): void {
  showToast({
    title: '⏳ Transaction Pending',
    description: 'Your transaction has been submitted and is being processed.',
    duration: Infinity,
    action: {
      label: 'View on Etherscan',
      onClick: () => {
        window.open(`https://etherscan.io/tx/${txHash}`, '_blank')
      },
    },
  })
}

export function showTransactionSuccessToast(txHash: TransactionHash, message?: string): void {
  showToast({
    title: '✅ Transaction Successful',
    description: message || 'Your transaction has been confirmed.',
    duration: 5000,
    action: {
      label: 'View on Etherscan',
      onClick: () => {
        window.open(`https://etherscan.io/tx/${txHash}`, '_blank')
      },
    },
  })
}

export function showTransactionErrorToast(error: ContractError): void {
  const icon = getErrorTypeIcon(error.type)
  showToast({
    title: `${icon} Transaction Failed`,
    description: error.message,
    duration: 7000,
  })
}

export function showContractInteractionToast(
  action: string,
  status: 'pending' | 'success' | 'error',
  details?: string
): void {
  switch (status) {
    case 'pending':
      showLoadingToast(`${action}...`, details)
      break
    case 'success':
      showSuccessToast(action, details)
      break
    case 'error':
      showErrorToast(`${action} Failed`, details)
      break
  }
}

export function showApprovalRequiredToast(contractName: string): void {
  showInfoToast(
    'Approval Required',
    `You need to approve the ${contractName} contract before proceeding.`
  )
}

export function showApprovalSuccessToast(contractName: string): void {
  showSuccessToast('Approval Successful', `You can now interact with the ${contractName} contract.`)
}
