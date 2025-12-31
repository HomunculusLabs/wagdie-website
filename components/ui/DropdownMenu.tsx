'use client'

import React, { useState, useRef, useEffect, useCallback, createContext, useContext, useMemo } from 'react';

interface DropdownContextType {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  highlightedIndex: number;
  setHighlightedIndex: (index: number) => void;
  registerItem: (id: string) => void;
  unregisterItem: (id: string) => void;
  items: string[];
  triggerRef: React.RefObject<HTMLButtonElement | null>;
  id: string;
  closeMenu: () => void;
}

const DropdownContext = createContext<DropdownContextType | undefined>(undefined);

function useDropdownContext(component: string) {
  const context = useContext(DropdownContext);
  if (!context) {
    throw new Error(`${component} must be used within DropdownMenu`);
  }
  return context;
}

let dropdownIdCounter = 0;

interface DropdownMenuProps {
  trigger: React.ReactNode;
  children: React.ReactNode;
  /** Alignment of the dropdown */
  align?: 'left' | 'right';
}

export const DropdownMenu = React.memo<DropdownMenuProps>(({ trigger, children, align = 'right' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [items, setItems] = useState<string[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const idRef = useRef(`dropdown-${++dropdownIdCounter}`);

  const registerItem = useCallback((id: string) => {
    setItems(prev => {
      if (!prev.includes(id)) {
        return [...prev, id];
      }
      return prev;
    });
  }, []);

  const unregisterItem = useCallback((id: string) => {
    setItems(prev => prev.filter(item => item !== id));
  }, []);

  const closeMenu = useCallback(() => {
    setIsOpen(false);
    setHighlightedIndex(-1);
    triggerRef.current?.focus();
  }, []);

  // Click outside handler
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setHighlightedIndex(-1);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      switch (event.key) {
        case 'Escape':
          event.preventDefault();
          closeMenu();
          break;
        case 'ArrowDown':
          event.preventDefault();
          setHighlightedIndex(prev =>
            prev < items.length - 1 ? prev + 1 : 0
          );
          break;
        case 'ArrowUp':
          event.preventDefault();
          setHighlightedIndex(prev =>
            prev > 0 ? prev - 1 : items.length - 1
          );
          break;
        case 'Home':
          event.preventDefault();
          setHighlightedIndex(0);
          break;
        case 'End':
          event.preventDefault();
          setHighlightedIndex(items.length - 1);
          break;
        case 'Tab':
          closeMenu();
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, items.length, closeMenu]);

  // Reset highlighted index when opening
  useEffect(() => {
    if (isOpen) {
      setHighlightedIndex(0);
      // Focus the menu for screen readers
      menuRef.current?.focus();
    }
  }, [isOpen]);

  // Reset items when children change
  useEffect(() => {
    setItems([]);
  }, [children]);

  const handleTriggerClick = useCallback(() => {
    setIsOpen(prev => !prev);
  }, []);

  const handleTriggerKeyDown = useCallback((event: React.KeyboardEvent) => {
    if (event.key === 'ArrowDown' || event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      setIsOpen(true);
    }
  }, []);

  const contextValue = useMemo(() => ({
    isOpen,
    setIsOpen,
    highlightedIndex,
    setHighlightedIndex,
    registerItem,
    unregisterItem,
    items,
    triggerRef,
    id: idRef.current,
    closeMenu,
  }), [isOpen, highlightedIndex, registerItem, unregisterItem, items, closeMenu]);

  return (
    <DropdownContext.Provider value={contextValue}>
      <div className="relative inline-block text-left" ref={containerRef}>
        <div
          onClick={handleTriggerClick}
          onKeyDown={handleTriggerKeyDown}
        >
          {React.isValidElement(trigger) ? (
            React.cloneElement(trigger as React.ReactElement<{ ref?: React.Ref<HTMLButtonElement>; 'aria-expanded'?: boolean; 'aria-haspopup'?: 'menu'; 'aria-controls'?: string }>, {
              ref: triggerRef,
              'aria-expanded': isOpen,
              'aria-haspopup': 'menu' as const,
              'aria-controls': `${idRef.current}-menu`,
            })
          ) : (
            trigger
          )}
        </div>
        {isOpen && (
          <div
            ref={menuRef}
            id={`${idRef.current}-menu`}
            role="menu"
            aria-labelledby={`${idRef.current}-trigger`}
            tabIndex={-1}
            className={`absolute ${align === 'right' ? 'right-0' : 'left-0'} mt-2 w-56 origin-top-${align} bg-soul-950/95 backdrop-blur-xl border border-midnight-light/50 shadow-2xl z-50 animate-fade-in focus:outline-none rounded-sm overflow-hidden`}
          >
            <div className="py-1">
              {children}
            </div>
          </div>
        )}
      </div>
    </DropdownContext.Provider>
  );
});

DropdownMenu.displayName = 'DropdownMenu';

interface DropdownItemProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'id'> {
  /** Called when item is selected */
  onSelect?: () => void;
}

export const DropdownItem = React.memo<DropdownItemProps>(({
  className = '',
  onSelect,
  onClick,
  children,
  disabled,
  ...props
}) => {
  const context = useDropdownContext('DropdownItem');
  const itemId = useRef(`${context.id}-item-${Math.random().toString(36).slice(2, 9)}`);
  const itemIndex = context.items.indexOf(itemId.current);
  const isHighlighted = context.highlightedIndex === itemIndex;

  // Register this item
  useEffect(() => {
    const id = itemId.current;
    context.registerItem(id);
    return () => context.unregisterItem(id);
  }, [context]);

  const handleClick = useCallback((event: React.MouseEvent<HTMLButtonElement>) => {
    if (disabled) return;
    onClick?.(event);
    onSelect?.();
    context.closeMenu();
  }, [disabled, onClick, onSelect, context]);

  const handleKeyDown = useCallback((event: React.KeyboardEvent<HTMLButtonElement>) => {
    if (disabled) return;
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onSelect?.();
      context.closeMenu();
    }
  }, [disabled, onSelect, context]);

  const handleMouseEnter = useCallback(() => {
    if (!disabled) {
      context.setHighlightedIndex(itemIndex);
    }
  }, [disabled, context, itemIndex]);

  return (
    <button
      id={itemId.current}
      role="menuitem"
      tabIndex={isHighlighted ? 0 : -1}
      aria-disabled={disabled}
      disabled={disabled}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      onMouseEnter={handleMouseEnter}
      className={`
        block w-full text-left px-4 py-2 text-sm font-eskapade text-ash
        transition-all duration-200 focus:outline-none
        ${isHighlighted ? 'bg-soul-accent/10 text-soul-accent border-l-2 border-soul-accent shadow-glow-sm' : 'hover:bg-midnight/50 hover:text-bone'}
        ${disabled ? 'opacity-30 cursor-not-allowed' : ''}
        ${className}
      `}
      {...props}
    >
      {children}
    </button>
  );
});

DropdownItem.displayName = 'DropdownItem';

export const DropdownLabel: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div
    role="presentation"
    className="px-4 py-2 text-xs font-display tracking-widest text-mist border-b border-midnight-light/20 mb-1 uppercase"
  >
    {children}
  </div>
);

export const DropdownSeparator: React.FC = () => (
  <div role="separator" className="-mx-1 my-1 h-px bg-midnight-light/20" />
);
