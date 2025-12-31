'use client'

import React, { useState, useEffect, useRef } from 'react';

interface ContextMenuProps {
  trigger: React.ReactNode;
  children: React.ReactNode;
}

export const ContextMenu: React.FC<ContextMenuProps> = ({ trigger, children }) => {
  const [visible, setVisible] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const menuRef = useRef<HTMLDivElement>(null);

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    setVisible(true);
    setPosition({ x: e.pageX, y: e.pageY });
  };

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setVisible(false);
      }
    };
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, []);

  return (
    <div onContextMenu={handleContextMenu} className="relative inline-block w-full">
      {trigger}
      {visible && (
        <div 
            ref={menuRef}
            className="fixed z-50 w-48 bg-soul-950/95 backdrop-blur-xl border border-midnight-light/50 shadow-2xl py-1 animate-fade-in rounded-sm overflow-hidden"
            style={{ top: position.y, left: position.x }}
        >
          {children}
        </div>
      )}
    </div>
  );
};

export const ContextMenuItem: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement>> = ({ className = '', ...props }) => (
    <button
      className={`block w-full text-left px-4 py-2 text-sm font-eskapade text-ash hover:bg-midnight/50 hover:text-bone transition-all duration-200 ${className}`}
      {...props}
    />
);

export const ContextMenuSeparator: React.FC = () => (
    <div className="h-px bg-midnight-light/20 my-1 mx-2" />
);

export const ContextMenuLabel: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <div className="px-4 py-1 text-xs font-display tracking-widest text-mist uppercase">
        {children}
    </div>
);
