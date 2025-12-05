import React from 'react';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen flex flex-col items-center bg-soul-950 text-neutral-300 font-eskapade selection:bg-soul-blood selection:text-white overflow-x-hidden">
      {/* Top Vignette */}
      <div className="fixed top-0 left-0 w-full h-32 bg-gradient-to-b from-black to-transparent pointer-events-none z-10" />
      
      {/* Content */}
      <main className="w-full max-w-5xl px-4 py-8 md:py-16 z-0 relative flex flex-col flex-grow">
        {children}
      </main>

      {/* Bottom Vignette */}
      <div className="fixed bottom-0 left-0 w-full h-32 bg-gradient-to-t from-black to-transparent pointer-events-none z-10" />
      
      {/* Corner Ornaments (Decorative) */}
      <div className="fixed top-4 left-4 w-16 h-16 border-t-2 border-l-2 border-soul-accent/20 pointer-events-none z-20" />
      <div className="fixed top-4 right-4 w-16 h-16 border-t-2 border-r-2 border-soul-accent/20 pointer-events-none z-20" />
      <div className="fixed bottom-4 left-4 w-16 h-16 border-b-2 border-l-2 border-soul-accent/20 pointer-events-none z-20" />
      <div className="fixed bottom-4 right-4 w-16 h-16 border-b-2 border-r-2 border-soul-accent/20 pointer-events-none z-20" />
    </div>
  );
};
