'use client'

import React, { useState, useRef, useEffect, createContext, useContext, useCallback, useMemo } from 'react';

interface SelectContextType {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  value: string;
  onChange: (value: string, label: string) => void;
  highlightedIndex: number;
  setHighlightedIndex: (index: number) => void;
  registerItem: (value: string) => void;
  items: string[];
  triggerRef: React.RefObject<HTMLButtonElement | null>;
  listRef: React.RefObject<HTMLDivElement | null>;
  selectHighlighted: () => void;
  id: string;
}

const SelectContext = createContext<SelectContextType | undefined>(undefined);

function useSelectContext(component: string) {
  const context = useContext(SelectContext);
  if (!context) {
    throw new Error(`${component} must be used within CustomSelect`);
  }
  return context;
}

let selectIdCounter = 0;

export const CustomSelect = React.memo<{
  value?: string;
  onChange?: (value: string) => void;
  children: React.ReactNode
}>(({ value = "", onChange, children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [internalValue, setInternalValue] = useState(value);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [items, setItems] = useState<string[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const idRef = useRef(`select-${++selectIdCounter}`);

  const handleChange = useCallback((newValue: string, newLabel: string) => {
    setInternalValue(newValue);
    onChange?.(newValue);
    setIsOpen(false);
    triggerRef.current?.focus();
  }, [onChange]);

  const registerItem = useCallback((itemValue: string) => {
    setItems(prev => {
      if (!prev.includes(itemValue)) {
        return [...prev, itemValue];
      }
      return prev;
    });
  }, []);

  const selectHighlighted = useCallback(() => {
    if (highlightedIndex >= 0 && highlightedIndex < items.length) {
      handleChange(items[highlightedIndex], items[highlightedIndex]);
    }
  }, [highlightedIndex, items, handleChange]);

  // Click outside handler
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!isOpen) return;

      switch (event.key) {
        case 'Escape':
          event.preventDefault();
          setIsOpen(false);
          triggerRef.current?.focus();
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
        case 'Enter':
        case ' ':
          event.preventDefault();
          selectHighlighted();
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
          setIsOpen(false);
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, items.length, selectHighlighted]);

  // Reset highlighted index when opening
  useEffect(() => {
    if (isOpen) {
      const currentIndex = items.indexOf(internalValue);
      setHighlightedIndex(currentIndex >= 0 ? currentIndex : 0);
    }
  }, [isOpen, items, internalValue]);

  // Reset items list when children change
  useEffect(() => {
    setItems([]);
  }, [children]);

  const contextValue = useMemo(() => ({
    isOpen,
    setIsOpen,
    value: internalValue,
    onChange: handleChange,
    highlightedIndex,
    setHighlightedIndex,
    registerItem,
    items,
    triggerRef,
    listRef,
    selectHighlighted,
    id: idRef.current,
  }), [isOpen, internalValue, handleChange, highlightedIndex, registerItem, items, selectHighlighted]);

  return (
    <SelectContext.Provider value={contextValue}>
      <div className="relative w-full" ref={containerRef}>
        {children}
      </div>
    </SelectContext.Provider>
  );
});

CustomSelect.displayName = 'CustomSelect';

export const CustomSelectTrigger = React.memo<{ placeholder?: string; className?: string }>(({
  placeholder,
  className = ''
}) => {
  const context = useSelectContext('CustomSelectTrigger');

  const handleClick = useCallback(() => {
    context.setIsOpen(!context.isOpen);
  }, [context]);

  const handleKeyDown = useCallback((event: React.KeyboardEvent) => {
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp' || event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      context.setIsOpen(true);
    }
  }, [context]);

  return (
    <button
      ref={context.triggerRef as React.RefObject<HTMLButtonElement>}
      type="button"
      role="combobox"
      aria-expanded={context.isOpen}
      aria-haspopup="listbox"
      aria-controls={`${context.id}-listbox`}
      aria-labelledby={`${context.id}-label`}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      className={`
        flex h-10 w-full items-center justify-between rounded-sm border border-neutral-800 bg-black/20 px-3 py-2 text-sm text-neutral-200 placeholder:text-neutral-500 focus:outline-none focus:ring-1 focus:ring-soul-accent/50 disabled:cursor-not-allowed disabled:opacity-50
        ${className}
      `}
    >
      <span className="font-eskapade block truncate">{context.value || placeholder || "Select..."}</span>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
        className={`h-4 w-4 opacity-50 transition-transform duration-200 ${context.isOpen ? 'rotate-180' : ''}`}
      >
        <path d="m6 9 6 6 6-6" />
      </svg>
    </button>
  );
});

CustomSelectTrigger.displayName = 'CustomSelectTrigger';

export const CustomSelectContent = React.memo<{ children: React.ReactNode; className?: string }>(({
  children,
  className = ''
}) => {
  const context = useSelectContext('CustomSelectContent');

  if (!context.isOpen) return null;

  return (
    <div
      ref={context.listRef as React.RefObject<HTMLDivElement>}
      id={`${context.id}-listbox`}
      role="listbox"
      aria-labelledby={`${context.id}-label`}
      tabIndex={-1}
      className={`absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-sm border border-neutral-800 bg-soul-950 text-neutral-200 shadow-xl animate-fade-in ${className}`}
    >
      <div className="p-1">{children}</div>
    </div>
  );
});

CustomSelectContent.displayName = 'CustomSelectContent';

export const CustomSelectItem = React.memo<{ value: string; children: React.ReactNode; className?: string; disabled?: boolean }>(({
  value,
  children,
  className = '',
  disabled = false
}) => {
  const context = useSelectContext('CustomSelectItem');
  const isSelected = context.value === value;
  const itemIndex = context.items.indexOf(value);
  const isHighlighted = context.highlightedIndex === itemIndex;

  // Register this item
  useEffect(() => {
    context.registerItem(value);
  }, [value, context.registerItem]);

  const handleClick = useCallback(() => {
    if (!disabled) {
      context.onChange(value, children as string);
    }
  }, [disabled, context, value, children]);

  const handleMouseEnter = useCallback(() => {
    if (!disabled) {
      context.setHighlightedIndex(itemIndex);
    }
  }, [disabled, context, itemIndex]);

  return (
    <div
      role="option"
      aria-selected={isSelected}
      aria-disabled={disabled}
      id={`${context.id}-option-${value}`}
      onClick={handleClick}
      onMouseEnter={handleMouseEnter}
      className={`
        relative flex w-full cursor-pointer select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none transition-colors font-eskapade
        ${disabled ? 'cursor-not-allowed opacity-50' : ''}
        ${isHighlighted ? 'bg-neutral-800' : ''}
        ${isSelected ? 'bg-neutral-900 text-soul-accent' : 'text-neutral-400 hover:bg-neutral-900 hover:text-neutral-200'}
        ${className}
      `}
    >
      {isSelected && (
        <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center" aria-hidden="true">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4"><polyline points="20 6 9 17 4 12" /></svg>
        </span>
      )}
      {children}
    </div>
  );
});

CustomSelectItem.displayName = 'CustomSelectItem';

export const CustomSelectLabel: React.FC<{ children: React.ReactNode; id?: string }> = ({ children, id }) => (
  <div id={id} className="px-2 py-1.5 text-xs font-display  tracking-widest text-neutral-500">
    {children}
  </div>
);

export const CustomSelectSeparator: React.FC = () => (
  <div role="separator" className="-mx-1 my-1 h-px bg-neutral-800" />
);
