import React, { useMemo } from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger';
  size?: 'md' | 'sm' | 'icon';
  isLoading?: boolean;
}

const variants = {
  primary: "bg-soul-900 border-soul-accent/40 text-soul-accent hover:bg-soul-accent/10 hover:border-soul-accent hover:shadow-[0_0_15px_rgba(200,170,110,0.15)]",
  secondary: "bg-transparent border-neutral-700 text-neutral-400 hover:border-neutral-500 hover:text-neutral-200",
  danger: "bg-soul-900 border-red-900/50 text-red-700 hover:bg-red-950/30 hover:border-red-800 hover:text-red-500",
} as const;

const sizes = {
  md: "px-6 py-2 text-lg",
  sm: "px-3 py-1.5 text-xs",
  icon: "h-11 w-11 p-0 text-lg",
} as const;

const baseStyles =
  "relative inline-flex items-center justify-center font-display transition-all duration-300 border disabled:opacity-50 disabled:cursor-not-allowed group overflow-hidden";

export const Button = React.memo<ButtonProps>(({
  children,
  variant = 'primary',
  size = 'md',
  isLoading,
  className = '',
  disabled,
  ...props
}) => {
  const combinedClassName = useMemo(
    () => `${baseStyles} ${sizes[size]} ${variants[variant]} ${className}`,
    [size, variant, className]
  );

  return (
    <button
      className={combinedClassName}
      disabled={disabled || isLoading}
      aria-busy={isLoading}
      {...props}
    >
      <span className={`relative z-10 flex items-center justify-center gap-2 ${isLoading ? 'opacity-0' : 'opacity-100'}`}>
        {children}
      </span>

      {/* Loading State Overlay */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center z-20" aria-hidden="true">
          <svg className="animate-spin h-5 w-5 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        </div>
      )}

      {/* Shine effect on hover */}
      <div className="absolute inset-0 h-full w-full scale-0 rounded-md transition-all duration-300 group-hover:scale-100 group-hover:bg-white/5" aria-hidden="true" />
    </button>
  );
});

Button.displayName = 'Button';
