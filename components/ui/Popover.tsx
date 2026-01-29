'use client'

import React, { useState, useRef, useEffect, useCallback } from 'react';

interface PopoverProps {
  trigger: React.ReactNode;
  content: React.ReactNode;
}

export const Popover: React.FC<PopoverProps> = ({ trigger, content }) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    // Use passive listener for better scroll performance
    document.addEventListener('mousedown', handleClickOutside, { passive: true });
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleToggle = useCallback(() => {
    setIsOpen(prev => !prev);
  }, []);

  return (
    <div className="relative inline-block" ref={containerRef}>
      <div onClick={handleToggle} className="cursor-pointer">{trigger}</div>
      {isOpen ? (
        <div className="absolute z-50 mt-2 w-72 bg-soul-950/95 backdrop-blur-xl border border-midnight-light/50 p-4 animate-fade-in rounded-sm">
          <div className="text-ash font-eskapade text-sm leading-relaxed">
            {content}
          </div>
        </div>
      ) : null}
    </div>
  );
};
