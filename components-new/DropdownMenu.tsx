'use client'

import React, { useState, useRef, useEffect } from 'react';

interface DropdownMenuProps {
  trigger: React.ReactNode;
  children: React.ReactNode;
}

export const DropdownMenu: React.FC<DropdownMenuProps> = ({ trigger, children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative inline-block text-left" ref={containerRef}>
      <div onClick={() => setIsOpen(!isOpen)}>{trigger}</div>
      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 origin-top-right bg-soul-950 border border-neutral-800 shadow-xl z-50 animate-fade-in">
          <div className="py-1" role="menu">
            {children}
          </div>
        </div>
      )}
    </div>
  );
};

export const DropdownItem: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement>> = ({ className = '', ...props }) => (
  <button
    className={`block w-full text-left px-4 py-2 text-sm font-serif text-neutral-400 hover:bg-neutral-900 hover:text-soul-accent transition-colors ${className}`}
    role="menuitem"
    {...props}
  />
);

export const DropdownLabel: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <div className="px-4 py-2 text-xs font-display uppercase tracking-widest text-neutral-600 border-b border-neutral-900 mb-1">
        {children}
    </div>
);
