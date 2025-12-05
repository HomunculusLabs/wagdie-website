'use client'

import React, { useState } from 'react';

interface TooltipProps {
  content: string;
  children: React.ReactNode;
}

export const Tooltip: React.FC<TooltipProps> = ({ content, children }) => {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <div 
        className="relative inline-block"
        onMouseEnter={() => setIsVisible(true)}
        onMouseLeave={() => setIsVisible(false)}
    >
      {children}
      <div 
        className={`
            absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-max max-w-xs
            px-3 py-2 bg-neutral-900 border border-neutral-700 shadow-xl
            text-xs text-neutral-300 font-eskapade text-center pointer-events-none
            transition-all duration-200 z-50
            ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}
        `}
      >
        {content}
        {/* Arrow */}
        <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-neutral-700" />
      </div>
    </div>
  );
};
