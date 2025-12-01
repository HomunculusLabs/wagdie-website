import React from 'react';

export interface ModalProps {
  /** Whether the modal is open */
  isOpen?: boolean;

  /** Size of the modal */
  size?: 'sm' | 'md' | 'lg' | 'xl';

  /** Modal title */
  title?: string;

  /** Modal content */
  children: React.ReactNode;

  /** Close button click handler */
  onClose?: () => void;
}

/**
 * A modal dialog component for displaying content in an overlay.
 *
 * Use modals to display critical information or require user confirmation
 * for important actions. Should be used sparingly to avoid disrupting
 * the user experience.
 */
export const Modal: React.FC<ModalProps> = ({
  isOpen = false,
  size = 'md',
  title,
  children,
  onClose,
}) => {
  if (!isOpen) return null;

  const sizeStyles = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget && onClose) {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
      onClick={handleBackdropClick}
    >
      <div
        className={`relative bg-white rounded-lg shadow-xl ${sizeStyles[size]} w-full mx-4`}
        onClick={(e) => e.stopPropagation()}
      >
        {title && (
          <div className="flex items-center justify-between p-4 border-b">
            <h2 className="text-xl font-semibold">{title}</h2>
            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
                aria-label="Close"
              >
                ×
              </button>
            )}
          </div>
        )}
        <div className="p-4">{children}</div>
      </div>
    </div>
  );
};
