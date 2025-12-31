'use client'

import React, { useState, useRef, useEffect } from 'react';

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
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative inline-block" ref={containerRef}>
      <div onClick={() => setIsOpen(!isOpen)} className="cursor-pointer">{trigger}</div>
      {isOpen && (
        <div className="absolute z-50 mt-2 w-72 bg-soul-950/95 backdrop-blur-xl border border-midnight-light/50 shadow-2xl p-4 animate-fade-in rounded-sm">
          <div className="text-ash font-eskapade text-sm leading-relaxed">
            {content}
          </div>
        </div>
      )}
    </div>
  );
};
