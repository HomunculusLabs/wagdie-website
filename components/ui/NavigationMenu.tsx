import React from 'react';

export const NavigationMenu: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <nav className="flex items-center gap-6">
      {children}
    </nav>
  );
};

export const NavigationMenuItem: React.FC<{ href?: string; children: React.ReactNode; active?: boolean }> = ({ href, children, active }) => {
  return (
    <a 
        href={href || '#'}
        className={`
            text-sm font-eskapade  tracking-widest transition-all duration-300 relative group
            ${active ? 'text-soul-accent' : 'text-neutral-500 hover:text-neutral-300'}
        `}
    >
        {children}
        <span className={`absolute -bottom-1 left-0 h-px bg-soul-accent transition-all duration-300 ${active ? 'w-full' : 'w-0 group-hover:w-full'}`} />
    </a>
  );
};
