
import React from 'react';

export const Divider: React.FC = () => {
  return (
    <div className="flex items-center justify-center w-full py-8 opacity-60">
      <div className="h-px w-full bg-midnight-light/50"></div>
      <div className="mx-4 text-soul-accent/40">
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg" className="rotate-45">
          <rect width="12" height="12" stroke="currentColor" strokeWidth="1" />
        </svg>
      </div>
      <div className="h-px w-full bg-midnight-light/50"></div>
    </div>
  );
};
