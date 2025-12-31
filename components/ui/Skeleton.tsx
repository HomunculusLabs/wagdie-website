
import React from 'react';

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
  variant?: 'text' | 'circular' | 'rectangular';
}

export const Skeleton: React.FC<SkeletonProps> = ({ className = '', variant = 'rectangular', ...props }) => {
  const baseStyles = "animate-pulse bg-midnight-light/20 border border-midnight-light/10 overflow-hidden relative";
  
  const variants = {
    text: "h-4 w-full rounded",
    circular: "rounded-full",
    rectangular: "rounded-md",
  };

  return (
    <div 
      className={`${baseStyles} ${variants[variant]} ${className}`}
      {...props}
    />
  );
};
