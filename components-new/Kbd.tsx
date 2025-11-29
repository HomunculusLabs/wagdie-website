
import React from 'react';

export const Kbd: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <kbd className="inline-flex items-center justify-center h-5 px-1.5 text-[10px] font-mono font-medium text-neutral-400 bg-neutral-900 border border-neutral-700 rounded shadow-[0_1px_0_0_rgba(255,255,255,0.1)] mx-0.5">
      {children}
    </kbd>
  );
};
