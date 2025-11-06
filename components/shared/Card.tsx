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
  const baseStyles = 'bg-white rounded-lg border border-gray-200 shadow-sm';
  const paddingStyles = padded ? 'p-4' : '';
  const loadingStyles = isLoading ? 'opacity-50' : '';
  const combinedClassName = `${baseStyles} ${paddingStyles} ${loadingStyles} ${className}`;

  return (
    <div className={combinedClassName}>
      {title && (
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        </div>
      )}
      <div className={isLoading ? 'animate-pulse' : ''}>
        {children}
      </div>
      {footer && <div className="mt-4 pt-4 border-t border-gray-200">{footer}</div>}
    </div>
  );
};
