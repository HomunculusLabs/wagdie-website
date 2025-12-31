'use client'

import React, { useState } from 'react';

interface HoverCardProps {
  trigger: React.ReactNode;
  children: React.ReactNode;
}

export const HoverCard: React.FC<HoverCardProps> = ({ trigger, children }) => {
  const [isHovered, setIsHovered] = useState(false);
  const [timeoutId, setTimeoutId] = useState<ReturnType<typeof setTimeout> | null>(null);

  const handleMouseEnter = () => {
    if (timeoutId) clearTimeout(timeoutId);
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    const id = setTimeout(() => setIsHovered(false), 300);
    setTimeoutId(id);
  };

  return (
    <div className="relative inline-block" onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
      <div className="cursor-help decoration-dotted underline decoration-midnight-light/60 underline-offset-4">
        {trigger}
      </div>
      
      {isHovered && (
        <div className="absolute left-0 bottom-full mb-2 w-64 z-50 animate-fade-in">
          <div className="bg-soul-950/95 backdrop-blur-xl border border-midnight-light/50 shadow-2xl p-4 rounded-sm relative">
             {children}
             {/* Arrow */}
             <div className="absolute -bottom-2 left-4 w-4 h-4 bg-soul-950/95 backdrop-blur-xl border-b border-r border-midnight-light/50 rotate-45"></div>
          </div>
        </div>
      )}
    </div>
  );
};