'use client'

import React, { useState } from 'react';

interface CollapsibleProps {
  trigger: React.ReactNode;
  children: React.ReactNode;
  defaultOpen?: boolean;
}

export const Collapsible: React.FC<CollapsibleProps> = ({ trigger, children, defaultOpen = false }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="w-full">
      <div 
        onClick={() => setIsOpen(!isOpen)} 
        className="cursor-pointer flex items-center justify-between"
      >
        {trigger}
        <span className={`text-mist transition-transform duration-300 ${isOpen ? 'rotate-90' : ''}`}>
             <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
        </span>
      </div>
      <div 
        className={`overflow-hidden transition-all duration-300 ease-in-out ${isOpen ? 'max-h-96 opacity-100 mt-2' : 'max-h-0 opacity-0'}`}
      >
        {children}
      </div>
    </div>
  );
};
