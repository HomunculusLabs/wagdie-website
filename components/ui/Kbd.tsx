
import React from 'react';

export const Kbd: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <kbd className="inline-flex items-center justify-center h-5 px-1.5 text-[10px] font-mono font-medium text-ash bg-midnight border border-midnight-light/50 rounded mx-0.5">
      {children}
    </kbd>
  );
};
