import React from 'react';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen flex flex-col items-center bg-soul-950 text-ash selection:bg-blood selection:text-white overflow-x-hidden">
      {/* Corner Ornaments (Decorative) */}
      <div className="fixed top-4 left-4 w-16 h-16 border-t font-display  border-l border-soul-accent/20 pointer-events-none z-20" />
      <div className="fixed top-4 right-4 w-16 h-16 border-t border-r border-soul-accent/20 pointer-events-none z-20" />
      <div className="fixed bottom-4 left-4 w-16 h-16 border-b border-l border-soul-accent/20 pointer-events-none z-20" />
      <div className="fixed bottom-4 right-4 w-16 h-16 border-b border-r border-soul-accent/20 pointer-events-none z-20" />

      {/* Page Content */}
      {children}
    </div>
  );
};
