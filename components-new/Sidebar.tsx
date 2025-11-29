'use client'

import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';

interface SidebarContextType {
  isOpen: boolean;
  toggle: () => void;
  setIsOpen: (open: boolean) => void;
}

const SidebarContext = createContext<SidebarContextType>({
  isOpen: true,
  toggle: () => {},
  setIsOpen: () => {},
});

export const useSidebar = () => {
  const context = useContext(SidebarContext);
  if (!context) {
    throw new Error('useSidebar must be used within SidebarProvider');
  }
  return context;
};

export const SidebarProvider = React.memo<{ children: React.ReactNode; defaultOpen?: boolean }>(({
  children,
  defaultOpen = true
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  const toggle = useCallback(() => {
    setIsOpen(prev => !prev);
  }, []);

  const contextValue = useMemo(() => ({
    isOpen,
    toggle,
    setIsOpen,
  }), [isOpen, toggle]);

  return (
    <SidebarContext.Provider value={contextValue}>
      <div className="flex h-full w-full bg-soul-950 text-neutral-200 overflow-hidden border border-neutral-800 min-h-[300px]">
        {children}
      </div>
    </SidebarContext.Provider>
  );
});

SidebarProvider.displayName = 'SidebarProvider';

export const Sidebar = React.memo<{ children: React.ReactNode; className?: string }>(({ children, className = '' }) => {
  const { isOpen } = useContext(SidebarContext);

  return (
    <aside
      role="navigation"
      aria-label="Main sidebar"
      className={`
        bg-black/40 border-r border-neutral-800 transition-all duration-300 flex flex-col
        ${isOpen ? 'w-64' : 'w-16'}
        ${className}
      `}
    >
      {children}
    </aside>
  );
});

Sidebar.displayName = 'Sidebar';

export const SidebarHeader = React.memo<{ children: React.ReactNode; className?: string }>(({
  children,
  className = ''
}) => (
  <div className={`h-14 flex items-center px-4 border-b border-neutral-800 font-display uppercase tracking-widest text-sm text-soul-accent whitespace-nowrap overflow-hidden ${className}`}>
    {children}
  </div>
));

SidebarHeader.displayName = 'SidebarHeader';

export const SidebarContent = React.memo<{ children: React.ReactNode; className?: string }>(({
  children,
  className = ''
}) => (
  <div className={`flex-1 overflow-y-auto py-2 ${className}`}>
    {children}
  </div>
));

SidebarContent.displayName = 'SidebarContent';

export const SidebarFooter = React.memo<{ children: React.ReactNode; className?: string }>(({
  children,
  className = ''
}) => (
  <div className={`p-4 border-t border-neutral-800 ${className}`}>
    {children}
  </div>
));

SidebarFooter.displayName = 'SidebarFooter';

export const SidebarTrigger = React.memo<{ className?: string }>(({ className = '' }) => {
  const { toggle, isOpen } = useContext(SidebarContext);

  return (
    <button
      type="button"
      onClick={toggle}
      aria-expanded={isOpen}
      aria-label={isOpen ? 'Collapse sidebar' : 'Expand sidebar'}
      className={`p-2 hover:bg-neutral-800 rounded-sm text-neutral-400 hover:text-white transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-soul-accent/50 ${className}`}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <rect width="18" height="18" x="3" y="3" rx="2"/>
        <path d="M9 3v18"/>
      </svg>
    </button>
  );
});

SidebarTrigger.displayName = 'SidebarTrigger';

interface SidebarItemProps {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  onClick?: () => void;
  className?: string;
}

export const SidebarItem = React.memo<SidebarItemProps>(({
  icon,
  label,
  active,
  onClick,
  className = ''
}) => {
  const { isOpen } = useContext(SidebarContext);

  return (
    <button
      type="button"
      onClick={onClick}
      aria-current={active ? 'page' : undefined}
      className={`
        w-full flex items-center gap-3 px-3 py-2 text-sm font-serif transition-colors relative group
        focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-soul-accent/50
        ${active ? 'bg-neutral-900 text-soul-accent' : 'text-neutral-400 hover:bg-neutral-900/50 hover:text-neutral-200'}
        ${!isOpen ? 'justify-center' : ''}
        ${className}
      `}
    >
      <span className="shrink-0" aria-hidden="true">{icon}</span>
      {isOpen && <span className="truncate">{label}</span>}
      {!isOpen && (
        <span className="sr-only">{label}</span>
      )}
      {!isOpen && (
        <div
          role="tooltip"
          className="absolute left-full ml-2 px-2 py-1 bg-neutral-900 border border-neutral-800 text-xs rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50"
          aria-hidden="true"
        >
          {label}
        </div>
      )}
    </button>
  );
});

SidebarItem.displayName = 'SidebarItem';

export const SidebarInset = React.memo<{ children: React.ReactNode; className?: string }>(({
  children,
  className = ''
}) => (
  <main className={`flex-1 flex flex-col bg-black/20 relative ${className}`}>
    {children}
  </main>
));

SidebarInset.displayName = 'SidebarInset';
