'use client'

import React, { useEffect, useState } from 'react';

interface SheetProps {
  isOpen: boolean;
  onClose: () => void;
  side?: 'left' | 'right';
  children: React.ReactNode;
}

export const Sheet: React.FC<SheetProps> = ({ isOpen, onClose, side = 'right', children }) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setVisible(true);
      document.body.style.overflow = 'hidden';
    } else {
      const timer = setTimeout(() => setVisible(false), 300);
      document.body.style.overflow = 'unset';
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  if (!visible && !isOpen) return null;

  const sideClass = side === 'right' ? 'right-0 border-l' : 'left-0 border-r';
  const translateClass = side === 'right' 
    ? (isOpen ? 'translate-x-0' : 'translate-x-full') 
    : (isOpen ? 'translate-x-0' : '-translate-x-full');

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div 
        className={`absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0'}`} 
        onClick={onClose}
      />
      <div 
        className={`
            absolute top-0 bottom-0 w-3/4 max-w-sm bg-soul-950 border-neutral-800 shadow-2xl p-6
            transition-transform duration-500 ease-out
            ${sideClass} ${translateClass}
        `}
      >
        <div className="h-full flex flex-col">
            <div className="flex justify-end mb-4">
                <button onClick={onClose} className="text-neutral-500 hover:text-neutral-200">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                </button>
            </div>
            <div className="flex-1 overflow-y-auto pr-2">
                {children}
            </div>
        </div>
      </div>
    </div>
  );
};
