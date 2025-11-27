'use client'

import React, { useEffect, useState } from 'react';
import { Button } from './Button';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children }) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (isOpen) {
        setVisible(true);
        document.body.style.overflow = 'hidden';
    } else {
        const timer = setTimeout(() => setVisible(false), 300); // Wait for fade out
        document.body.style.overflow = 'unset';
        return () => clearTimeout(timer);
    }
  }, [isOpen]);

  if (!visible && !isOpen) return null;

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0'}`}>
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
      
      {/* Modal Content */}
      <div 
        className={`
            relative w-full max-w-lg bg-soul-950 border border-neutral-800 shadow-2xl 
            transform transition-all duration-300 
            ${isOpen ? 'scale-100 translate-y-0' : 'scale-95 translate-y-4'}
        `}
      >
        {/* Decorative Corners */}
        <div className="absolute -top-1 -left-1 w-4 h-4 border-t-2 border-l-2 border-soul-accent/50" />
        <div className="absolute -top-1 -right-1 w-4 h-4 border-t-2 border-r-2 border-soul-accent/50" />
        <div className="absolute -bottom-1 -left-1 w-4 h-4 border-b-2 border-l-2 border-soul-accent/50" />
        <div className="absolute -bottom-1 -right-1 w-4 h-4 border-b-2 border-r-2 border-soul-accent/50" />

        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-neutral-900">
            <h3 className="text-xl font-display uppercase tracking-widest text-neutral-200">{title}</h3>
            <button onClick={onClose} className="text-neutral-500 hover:text-red-500 transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </button>
        </div>

        {/* Body */}
        <div className="p-6 text-neutral-400 font-serif">
            {children}
        </div>

        {/* Footer */}
        <div className="p-6 pt-0 flex justify-end gap-4">
            <Button variant="secondary" onClick={onClose}>Close</Button>
            <Button variant="primary" onClick={onClose}>Accept</Button>
        </div>
      </div>
    </div>
  );
};
