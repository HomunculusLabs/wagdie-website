'use client'

import React, { useState } from 'react';

interface ToggleProps {
  pressed?: boolean;
  onPressedChange?: (pressed: boolean) => void;
  children: React.ReactNode;
  ariaLabel?: string;
}

export const Toggle: React.FC<ToggleProps> = ({ 
  pressed = false, 
  onPressedChange, 
  children,
  ariaLabel
}) => {
  const [isPressed, setIsPressed] = useState(pressed);

  const handleClick = () => {
    const newState = !isPressed;
    setIsPressed(newState);
    if (onPressedChange) {
      onPressedChange(newState);
    }
  };

  return (
    <button
      type="button"
      aria-pressed={isPressed}
      aria-label={ariaLabel}
      onClick={handleClick}
      className={`
        inline-flex items-center justify-center rounded-sm text-sm font-medium transition-colors 
        h-9 px-3 border
        ${isPressed 
          ? 'bg-soul-900 text-soul-accent border-soul-accent shadow-[0_0_10px_rgba(200,170,110,0.2)]' 
          : 'bg-transparent text-neutral-400 border-neutral-800 hover:bg-neutral-900 hover:text-neutral-200'
        }
      `}
    >
      {children}
    </button>
  );
};
