
import React from 'react';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'accent' | 'outline';
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({ children, variant = 'default', className = '' }) => {
  const baseStyles = "inline-flex items-center px-2 py-0.5 text-[10px] uppercase tracking-widest font-display border";

  const variants = {
    default: "bg-neutral-900 border-neutral-700 text-neutral-400",
    accent: "bg-soul-accent/10 border-soul-accent/40 text-soul-accent",
    outline: "bg-transparent border-neutral-700 text-neutral-500",
  };

  return (
    <span className={`${baseStyles} ${variants[variant]} ${className}`}>
      {children}
    </span>
  );
};
