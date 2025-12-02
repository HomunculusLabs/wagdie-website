
import React from 'react';

interface InputGroupProps {
  children: React.ReactNode;
  className?: string;
}

export const InputGroup: React.FC<InputGroupProps> = ({ children, className = '' }) => {
  return (
    <div className={`flex w-full items-center border-b border-neutral-800 focus-within:border-soul-accent transition-colors ${className}`}>
        {/* This component expects InputGroupAddon and standard Input as children. 
            Standard Input needs variant='ghost' or no border for best effect. 
        */}
        {children}
    </div>
  );
};

export const InputGroupAddon: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <div className="px-3 text-neutral-500 text-sm font-eskapade bg-neutral-900/30 h-full flex items-center justify-center">
        {children}
    </div>
);
