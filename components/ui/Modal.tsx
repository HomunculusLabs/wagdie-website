'use client'

import React, { useEffect, useState, useRef, useCallback } from 'react';
import { Button } from './Button';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  /** Custom footer content. If not provided, default Close/Accept buttons are shown */
  footer?: React.ReactNode;
  /** Hide the default footer entirely */
  hideFooter?: boolean;
  /** ID for accessibility labeling */
  id?: string;
}

let modalIdCounter = 0;

export const Modal = React.memo<ModalProps>(({
  isOpen,
  onClose,
  title,
  children,
  footer,
  hideFooter = false,
  id
}) => {
  const [visible, setVisible] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);
  const previousActiveElement = useRef<HTMLElement | null>(null);
  const modalId = useRef(id || `modal-${++modalIdCounter}`);

  // Store previously focused element and manage body scroll
  useEffect(() => {
    if (isOpen) {
      previousActiveElement.current = document.activeElement as HTMLElement;
      setVisible(true);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
      const timer = setTimeout(() => setVisible(false), 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // Focus trap and keyboard handling
  useEffect(() => {
    if (!isOpen || !modalRef.current) return;

    const modal = modalRef.current;
    const focusableElements = modal.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    // Focus first focusable element
    firstElement?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
        return;
      }

      if (event.key === 'Tab') {
        if (focusableElements.length === 0) {
          event.preventDefault();
          return;
        }

        if (event.shiftKey) {
          if (document.activeElement === firstElement) {
            event.preventDefault();
            lastElement?.focus();
          }
        } else {
          if (document.activeElement === lastElement) {
            event.preventDefault();
            firstElement?.focus();
          }
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Restore focus when modal closes
  useEffect(() => {
    if (!isOpen && previousActiveElement.current) {
      previousActiveElement.current.focus();
    }
  }, [isOpen]);

  const handleBackdropClick = useCallback((event: React.MouseEvent) => {
    if (event.target === event.currentTarget) {
      onClose();
    }
  }, [onClose]);

  if (!visible && !isOpen) return null;

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0'}`}
      role="presentation"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-abyss/80 backdrop-blur-md"
        onClick={handleBackdropClick}
        aria-hidden="true"
      />

      {/* Modal Content */}
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={`${modalId.current}-title`}
        aria-describedby={`${modalId.current}-body`}
        className={`
          relative w-full max-w-lg bg-soul-950/95 backdrop-blur-xl border border-midnight-light/50 shadow-2xl
          transform transition-all duration-300
          ${isOpen ? 'scale-100 translate-y-0' : 'scale-95 translate-y-4'}
        `}
      >
        {/* Decorative Corners */}
        <div className="absolute -top-1 -left-1 w-4 h-4 border-t-2 border-l-2 border-soul-accent/50" aria-hidden="true" />
        <div className="absolute -top-1 -right-1 w-4 h-4 border-t-2 border-r-2 border-soul-accent/50" aria-hidden="true" />
        <div className="absolute -bottom-1 -left-1 w-4 h-4 border-b-2 border-l-2 border-soul-accent/50" aria-hidden="true" />
        <div className="absolute -bottom-1 -right-1 w-4 h-4 border-b-2 border-r-2 border-soul-accent/50" aria-hidden="true" />

        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-midnight-light/30">
          <h3
            id={`${modalId.current}-title`}
            className="text-xl font-display tracking-widest text-bone"
          >
            {title}
          </h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="text-mist hover:text-blood transition-colors focus:outline-none focus:ring-1 focus:ring-soul-accent/50 rounded-sm"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div
          id={`${modalId.current}-body`}
          className="p-6 text-ash font-eskapade leading-relaxed"
        >
          {children}
        </div>

        {/* Footer */}
        {!hideFooter && (
          <div className="p-6 pt-0 flex justify-end gap-4">
            {footer ?? (
              <>
                <Button variant="secondary" onClick={onClose}>Close</Button>
                <Button variant="primary" onClick={onClose}>Accept</Button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
});

Modal.displayName = 'Modal';
