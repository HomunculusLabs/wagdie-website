'use client'

import React, { useState, useRef, useEffect, createContext, useContext } from 'react';

interface SelectContextType {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  value: string;
  onChange: (value: string, label: string) => void;
}

const SelectContext = createContext<SelectContextType | undefined>(undefined);

export const CustomSelect: React.FC<{ 
  value?: string; 
  onChange?: (value: string) => void; 
  children: React.ReactNode 
}> = ({ value = "", onChange, children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [internalValue, setInternalValue] = useState(value);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleChange = (newValue: string, newLabel: string) => {
    setInternalValue(newValue);
    if (onChange) onChange(newValue);
    setIsOpen(false);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <SelectContext.Provider value={{ isOpen, setIsOpen, value: internalValue, onChange: handleChange }}>
      <div className="relative w-full" ref={containerRef}>
        {children}
      </div>
    </SelectContext.Provider>
  );
};

export const CustomSelectTrigger: React.FC<{ placeholder?: string; className?: string }> = ({ placeholder, className = '' }) => {
  const context = useContext(SelectContext);
  if (!context) throw new Error("CustomSelectTrigger must be used within CustomSelect");

  // We need to find the label corresponding to the value. 
  // In a real implementation we might pass children to find it, or store label in state.
  // For this visual component, we'll display value if label isn't easily accessible, 
  // or rely on the state update to pass label (which we added to context).
  const [displayLabel, setDisplayLabel] = useState("");

  // This is a simplification. Real Shadcn Select uses complex Radix state.
  useEffect(() => {
    if (!context.value) setDisplayLabel("");
  }, [context.value]);

  return (
    <button
      type="button"
      onClick={() => context.setIsOpen(!context.isOpen)}
      className={`
        flex h-10 w-full items-center justify-between rounded-sm border border-neutral-800 bg-black/20 px-3 py-2 text-sm text-neutral-200 placeholder:text-neutral-500 focus:outline-none focus:ring-1 focus:ring-soul-accent/50 disabled:cursor-not-allowed disabled:opacity-50
        ${className}
      `}
    >
      <span className="font-serif block truncate">{context.value || placeholder || "Select..."}</span>
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
        className={`h-4 w-4 opacity-50 transition-transform duration-200 ${context.isOpen ? 'rotate-180' : ''}`}
      >
        <path d="m6 9 6 6 6-6" />
      </svg>
    </button>
  );
};

export const CustomSelectContent: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => {
  const context = useContext(SelectContext);
  if (!context) throw new Error("CustomSelectContent must be used within CustomSelect");

  if (!context.isOpen) return null;

  return (
    <div className={`absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-sm border border-neutral-800 bg-soul-950 text-neutral-200 shadow-xl animate-fade-in ${className}`}>
      <div className="p-1">{children}</div>
    </div>
  );
};

export const CustomSelectItem: React.FC<{ value: string; children: React.ReactNode; className?: string }> = ({ value, children, className = '' }) => {
  const context = useContext(SelectContext);
  if (!context) throw new Error("CustomSelectItem must be used within CustomSelect");

  const isSelected = context.value === value;

  return (
    <div
      onClick={() => context.onChange(value, children as string)}
      className={`
        relative flex w-full cursor-pointer select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none transition-colors font-serif
        ${isSelected ? 'bg-neutral-900 text-soul-accent' : 'text-neutral-400 hover:bg-neutral-900 hover:text-neutral-200'}
        ${className}
      `}
    >
      {isSelected && (
        <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4"><polyline points="20 6 9 17 4 12" /></svg>
        </span>
      )}
      {children}
    </div>
  );
};

export const CustomSelectLabel: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="px-2 py-1.5 text-xs font-display uppercase tracking-widest text-neutral-500">
    {children}
  </div>
);

export const CustomSelectSeparator: React.FC = () => (
  <div className="-mx-1 my-1 h-px bg-neutral-800" />
);
