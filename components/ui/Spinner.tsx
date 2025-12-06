
import React from 'react';

export const Spinner: React.FC<{ size?: 'sm' | 'md' | 'lg', className?: string }> = ({ size = 'md', className = '' }) => {
  const sizes = {
    sm: "w-4 h-4",
    md: "w-8 h-8",
    lg: "w-12 h-12"
  };

  return (
    <div className={`relative inline-flex items-center justify-center ${sizes[size]} ${className}`}>
      {/* Outer Ring */}
      <div className="absolute inset-0 border-2 border-transparent border-t-neutral-600 border-r-neutral-600 rounded-full animate-spin"></div>
      {/* Inner Ring Reverse */}
      <div className="absolute inset-1 border-2 border-transparent border-b-soul-accent border-l-soul-accent rounded-full animate-[spin_1.5s_linear_infinite_reverse]"></div>
      {/* Core */}
      <div className="w-1.5 h-1.5 bg-soul-accent rounded-full animate-pulse"></div>
    </div>
  );
};
