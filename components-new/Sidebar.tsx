'use client'

import React, { createContext, useContext, useState } from 'react';

// Simplified Sidebar Context for the UI Kit
const SidebarContext = createContext<{ isOpen: boolean; toggle: () => void }>({ isOpen: true, toggle: () => {} });

export const SidebarProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isOpen, setIsOpen] = useState(true);
  return (
    <SidebarContext.Provider value={{ isOpen, toggle: () => setIsOpen(!isOpen) }}>
      <div className="flex h-full w-full bg-soul-950 text-neutral-200 overflow-hidden border border-neutral-800 min-h-[300px]">
        {children}
      </div>
    </SidebarContext.Provider>
  );
};

export const Sidebar: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isOpen } = useContext(SidebarContext);
  return (
    <aside className={`
      bg-black/40 border-r border-neutral-800 transition-all duration-300 flex flex-col
      ${isOpen ? 'w-64' : 'w-16'}
    `}>
      {children}
    </aside>
  );
};

export const SidebarHeader: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="h-14 flex items-center px-4 border-b border-neutral-800 font-display uppercase tracking-widest text-sm text-soul-accent whitespace-nowrap overflow-hidden">
    {children}
  </div>
);

export const SidebarContent: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="flex-1 overflow-y-auto py-2">
    {children}
  </div>
);

export const SidebarFooter: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="p-4 border-t border-neutral-800">
    {children}
  </div>
);

export const SidebarTrigger: React.FC = () => {
  const { toggle } = useContext(SidebarContext);
  return (
    <button onClick={toggle} className="p-2 hover:bg-neutral-800 rounded-sm text-neutral-400 hover:text-white transition-colors">
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="3" rx="2"/><path d="M9 3v18"/></svg>
    </button>
  );
};

export const SidebarItem: React.FC<{ icon: React.ReactNode; label: string; active?: boolean }> = ({ icon, label, active }) => {
   const { isOpen } = useContext(SidebarContext);
   return (
     <button className={`
       w-full flex items-center gap-3 px-3 py-2 text-sm font-serif transition-colors relative group
       ${active ? 'bg-neutral-900 text-soul-accent' : 'text-neutral-400 hover:bg-neutral-900/50 hover:text-neutral-200'}
       ${!isOpen ? 'justify-center' : ''}
     `}>
       <span className="shrink-0">{icon}</span>
       {isOpen && <span className="truncate">{label}</span>}
       {!isOpen && (
         <div className="absolute left-full ml-2 px-2 py-1 bg-neutral-900 border border-neutral-800 text-xs rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50">
           {label}
         </div>
       )}
     </button>
   );
};

export const SidebarInset: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <main className="flex-1 flex flex-col bg-black/20 relative">
        {children}
    </main>
);
