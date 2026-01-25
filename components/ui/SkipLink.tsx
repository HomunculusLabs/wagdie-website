import React from 'react';

/**
 * SkipLink Component
 * Provides a "Skip to main content" link for keyboard and screen reader users.
 * Appears only when focused, allowing users to bypass navigation.
 */
export const SkipLink: React.FC = () => {
  return (
    <a
      href="#main-content"
      className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[100] focus:px-4 focus:py-2 focus:bg-soul-accent focus:text-soul-950 focus:font-eskapade focus:text-sm focus:rounded focus:outline-none focus:ring-2 focus:ring-soul-accent focus:ring-offset-2 focus:ring-offset-soul-950"
    >
      Skip to main content
    </a>
  );
};

SkipLink.displayName = 'SkipLink';
