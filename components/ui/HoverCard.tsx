'use client'

import React, { useState, useRef, useEffect, useCallback } from 'react';

interface HoverCardProps {
  trigger: React.ReactNode;
  children: React.ReactNode;
}

export const HoverCard: React.FC<HoverCardProps> = ({ trigger, children }) => {
  const [isHovered, setIsHovered] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Clean up timeout on unmount to prevent memory leaks
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const handleMouseEnter = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setIsHovered(true);
  }, []);

  const handleMouseLeave = useCallback(() => {
    timeoutRef.current = setTimeout(() => setIsHovered(false), 300);
  }, []);

  return (
    <div className="relative inline-block" onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
      <div className="cursor-help decoration-dotted underline decoration-midnight-light/60 underline-offset-4">
        {trigger}
      </div>

      {isHovered ? (
        <div className="absolute left-0 bottom-full mb-2 w-64 z-50 animate-fade-in">
          <div className="bg-soul-950/95 backdrop-blur-xl border border-midnight-light/50 p-4 rounded-sm relative">
             {children}
             {/* Arrow */}
             <div className="absolute -bottom-2 left-4 w-4 h-4 bg-soul-950/95 backdrop-blur-xl border-b border-r border-midnight-light/50 rotate-45"></div>
          </div>
        </div>
      ) : null}
    </div>
  );
};