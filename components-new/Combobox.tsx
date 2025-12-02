'use client'

import React, { useState, useRef, useEffect } from 'react';

interface ComboboxOption {
  value: string;
  label: string;
}

interface ComboboxProps {
  options: ComboboxOption[];
  placeholder?: string;
  label?: string;
}

export const Combobox: React.FC<ComboboxProps> = ({ options, placeholder = "Select option...", label }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [value, setValue] = useState("");
  const [search, setSearch] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);

  const filteredOptions = options.filter(opt => 
    opt.label.toLowerCase().includes(search.toLowerCase())
  );

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedLabel = options.find(opt => opt.value === value)?.label;

  return (
    <div className="flex flex-col gap-2 w-full" ref={containerRef}>
        {label && (
        <label className="text-xs  tracking-widest text-neutral-500 font-display">
          {label}
        </label>
      )}
      <div className="relative">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="w-full justify-between flex items-center bg-black/20 border border-neutral-800 px-3 py-2 text-sm font-eskapade text-neutral-300 hover:bg-neutral-900 transition-colors"
        >
          {selectedLabel || placeholder}
          <svg className="ml-2 h-4 w-4 opacity-50" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
        </button>

        {isOpen && (
          <div className="absolute top-full left-0 z-50 w-full mt-1 bg-soul-950 border border-neutral-800 shadow-xl p-1 animate-fade-in">
             <input 
                className="w-full bg-neutral-900 border border-neutral-800 p-2 text-xs text-neutral-200 mb-1 outline-none focus:border-soul-accent"
                placeholder="Search..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
             />
             <div className="max-h-60 overflow-y-auto">
                {filteredOptions.length === 0 ? (
                    <div className="p-2 text-xs text-neutral-600 text-center">No results.</div>
                ) : (
                    filteredOptions.map((opt) => (
                        <div
                            key={opt.value}
                            onClick={() => {
                                setValue(opt.value);
                                setIsOpen(false);
                                setSearch("");
                            }}
                            className={`
                                cursor-pointer px-2 py-1.5 text-sm flex items-center
                                ${value === opt.value ? 'text-soul-accent bg-neutral-900' : 'text-neutral-400 hover:bg-neutral-900 hover:text-neutral-200'}
                            `}
                        >
                            <span className={`mr-2 h-4 w-4 flex items-center justify-center ${value === opt.value ? 'opacity-100' : 'opacity-0'}`}>
                                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                            </span>
                            {opt.label}
                        </div>
                    ))
                )}
             </div>
          </div>
        )}
      </div>
    </div>
  );
};
