'use client'

import React, { useState, useRef, useEffect } from 'react';

export const Menubar: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="flex items-center border border-midnight-light/50 bg-soul-950/80 backdrop-blur-md p-1 rounded-sm w-fit">
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
        className={`px-3 py-1 text-xs font-eskapade uppercase tracking-widest transition-all duration-200 rounded-sm ${isOpen ? 'bg-midnight text-bone' : 'text-mist hover:text-bone hover:bg-midnight/50'}`}
      >
        {trigger}
      </button>
      {isOpen && (
        <div className="absolute top-full left-0 mt-1 w-48 bg-soul-950/95 backdrop-blur-xl border border-midnight-light/50 py-1 z-50 animate-fade-in rounded-sm overflow-hidden">
          {children}
        </div>
      )}
    </div>
  );
};

export const MenubarItem: React.FC<{ children: React.ReactNode; shortcut?: string; onClick?: () => void }> = ({ children, shortcut, onClick }) => (
    <button 
        onClick={onClick}
        className="w-full text-left px-4 py-1.5 text-xs font-eskapade text-ash hover:bg-midnight/50 hover:text-bone transition-all duration-200 flex justify-between items-center group uppercase tracking-widest"
    >
        <span>{children}</span>
        {shortcut && <span className="text-[10px] text-mist font-mono group-hover:text-ash border border-midnight-light/20 px-1 rounded-sm">{shortcut}</span>}
    </button>
);

export const MenubarSeparator: React.FC = () => <div className="h-px bg-midnight-light/20 my-1 mx-2" />;
