import React from 'react';

export interface ButtonProps {
  /** Visual style variant of the button */
  variant?: 'primary' | 'secondary' | 'danger';

  /** Size of the button */
  size?: 'sm' | 'md' | 'lg';

  /** Whether the button is disabled */
  disabled?: boolean;

  /** Click event handler */
  onClick?: () => void;

  /** Button content */
  children: React.ReactNode;
}

/**
 * A versatile button component with multiple variants and sizes.
 *
 * Used to trigger actions or navigation. Supports multiple visual variants
 * and states for different use cases.
 */
export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  disabled = false,
  onClick,
  children,
}) => {
  const baseStyles = 'inline-flex items-center justify-center rounded-sm font-bold tracking-wide transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-abyss font-wagdie border-2 ';

  const variantStyles = {
    primary: 'bg-midnight text-bone border-gold hover:bg-gold hover:text-abyss hover:shadow-[0_0_20px_rgba(212,175,55,0.5)] focus:ring-gold shadow-[0_4px_0_0_#d4af37]',
    secondary: 'bg-shadow text-bone border-mist hover:border-ash hover:text-ash focus:ring-mist shadow-[0_4px_0_0_#707070]',
    danger: 'bg-blood text-bone border-blood hover:bg-ember hover:shadow-[0_0_20px_rgba(201,74,58,0.5)] focus:ring-blood shadow-[0_4px_0_0_#8b2635]',
  };

  const sizeStyles = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-6 py-3 text-base',
    lg: 'px-8 py-4 text-lg',
  };

  const disabledStyles = disabled
    ? 'opacity-40 cursor-not-allowed grayscale'
    : 'cursor-pointer';

  const combinedStyles = `${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${disabledStyles}`;

  return (
    <button
      type="button"
      className={combinedStyles}
      disabled={disabled}
      onClick={onClick}
    >
      {children}
    </button>
  );
};
