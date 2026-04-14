'use client';

import type { ReactNode, Ref } from 'react';

interface SidebarShellProps {
  isOpen: boolean;
  panelRef?: Ref<HTMLDivElement>;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
}

export function SidebarShell({
  isOpen,
  panelRef,
  onClose,
  children,
  footer,
}: SidebarShellProps) {
  return (
    <div className="absolute inset-0 z-[60] pointer-events-none">
      <button
        type="button"
        aria-label="Close sidebar"
        onClick={onClose}
        className={`
          absolute inset-0 md:hidden
          bg-black/60 backdrop-blur-sm
          transition-opacity duration-300
          pointer-events-auto
          ${isOpen ? 'opacity-100' : 'opacity-0'}
        `}
      />

      <div
        ref={panelRef}
        role="dialog"
        aria-labelledby="map-sidebar-title"
        className={`
          pointer-events-auto
          absolute top-0 right-0 h-full
          w-full md:w-[460px]
          bg-soul-950 border-l border-neutral-800
          flex flex-col shadow-2xl md:rounded-l-2xl
          transform transition-transform duration-300 ease-out
          ${isOpen ? 'translate-x-0' : 'translate-x-full'}
        `}
      >
        {children}
        {footer}
      </div>
    </div>
  );
}

