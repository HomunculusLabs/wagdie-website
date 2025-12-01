import React from 'react';

export interface CardProps {
  /** Card title */
  title?: string;

  /** Card content */
  children: React.ReactNode;

  /** Optional footer content */
  footer?: React.ReactNode;

  /** Whether the card is in a loading state */
  isLoading?: boolean;

  /** Whether the card has padding */
  padded?: boolean;

  /** Additional CSS class name */
  className?: string;
}

/**
 * A flexible card container component for displaying content in a contained box.
 *
 * Used to group related information with optional title and footer sections.
 * Perfect for displaying user profiles, articles, or any grouped content.
 */
export const Card: React.FC<CardProps> = ({
  title,
  children,
  footer,
  isLoading = false,
  padded = true,
  className = '',
}) => {
  const baseStyles = 'bg-shadow rounded-sm border-2 border-midnight shadow-[0_4px_0_0_#1a1a1a,0_8px_16px_rgba(0,0,0,0.5)] hover:border-gold transition-all duration-300';
  const paddingStyles = padded ? 'p-6' : '';
  const loadingStyles = isLoading ? 'opacity-50' : '';
  const combinedClassName = `${baseStyles} ${paddingStyles} ${loadingStyles} ${className}`;

  return (
    <div className={combinedClassName}>
      {title && (
        <div className="mb-4 pb-3 border-b-2 border-midnight">
          <h3 className="text-xl font-bold text-bone font-wagdie tracking-wide uppercase">{title}</h3>
        </div>
      )}
      <div className={isLoading ? 'animate-pulse' : ''}>
        {children}
      </div>
      {footer && <div className="mt-4 pt-4 border-t-2 border-midnight">{footer}</div>}
    </div>
  );
};
