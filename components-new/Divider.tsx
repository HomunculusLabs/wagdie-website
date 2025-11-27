
import React from 'react';

export const Divider: React.FC = () => {
  return (
    <div className="flex items-center justify-center w-full py-8 opacity-40">
      <div className="h-px w-full bg-gradient-to-r from-transparent via-neutral-700 to-transparent"></div>
      <div className="mx-4 text-neutral-600">
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg" className="rotate-45">
          <rect width="12" height="12" stroke="currentColor" strokeWidth="2" />
        </svg>
      </div>
      <div className="h-px w-full bg-gradient-to-r from-transparent via-neutral-700 to-transparent"></div>
    </div>
  );
};
