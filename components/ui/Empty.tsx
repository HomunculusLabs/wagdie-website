
import React from 'react';

interface EmptyProps {
  message?: string;
  icon?: React.ReactNode;
  className?: string;
}

export const Empty: React.FC<EmptyProps> = ({
    message = "No data available",
    icon,
    className = ''
}) => {
  return (
    <div className={`flex flex-col items-center justify-center py-12 px-4 text-center border border-dashed border-neutral-800 bg-black/10 ${className}`}>
      <div className="text-neutral-700 mb-4">
        {icon || (
            <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
        )}
      </div>
      <p className="text-sm font-display  tracking-normal text-neutral-600">{message}</p>
    </div>
  );
};
