'use client'

import React, { useState, useRef, useEffect } from 'react';

export const Menubar: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="flex items-center border border-neutral-800 bg-soul-950 p-1 rounded-sm shadow-sm w-fit">
      {children}
    </div>
  );
};

export const MenubarMenu: React.FC<{ trigger: string; children: React.ReactNode }> = ({ trigger, children }) => {
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
    <div className="relative" ref={containerRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className={`px-3 py-1 text-sm font-display uppercase tracking-wider transition-colors rounded-sm ${isOpen ? 'bg-neutral-900 text-neutral-200' : 'text-neutral-500 hover:text-neutral-300 hover:bg-neutral-900/50'}`}
      >
        {trigger}
      </button>
      {isOpen && (
        <div className="absolute top-full left-0 mt-1 w-48 bg-soul-950 border border-neutral-800 shadow-xl py-1 z-50 animate-fade-in">
          {children}
        </div>
      )}
    </div>
  );
};

export const MenubarItem: React.FC<{ children: React.ReactNode; shortcut?: string; onClick?: () => void }> = ({ children, shortcut, onClick }) => (
    <button 
        onClick={onClick}
        className="w-full text-left px-4 py-1.5 text-sm font-serif text-neutral-400 hover:bg-neutral-900 hover:text-soul-accent transition-colors flex justify-between items-center group"
    >
        <span>{children}</span>
        {shortcut && <span className="text-xs text-neutral-600 font-mono group-hover:text-neutral-500">{shortcut}</span>}
    </button>
);

export const MenubarSeparator: React.FC = () => <div className="h-px bg-neutral-800 my-1 mx-2" />;
