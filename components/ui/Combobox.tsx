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
        <label className="text-caption tracking-widest uppercase text-mist font-eskapade">
          {label}
        </label>
      )}
      <div className="relative">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="w-full justify-between flex items-center bg-midnight/30 border border-midnight-light/50 px-3 py-2 text-body font-eskapade text-ash hover:bg-midnight/50 transition-colors uppercase tracking-widest text-xs"
        >
          {selectedLabel || placeholder}
          <svg className="ml-2 h-4 w-4 opacity-30" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
        </button>

        {isOpen && (
          <div className="absolute top-full left-0 z-50 w-full mt-1 bg-soul-950/95 backdrop-blur-xl border border-midnight-light/50 shadow-2xl p-1 animate-fade-in rounded-sm">
             <input
                className="w-full bg-midnight/50 border border-midnight-light/30 p-2 text-body-sm text-bone mb-1 outline-none focus:border-soul-accent font-eskapade uppercase tracking-widest text-xs"
                placeholder="Search..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
             />
             <div className="max-h-60 overflow-y-auto">
                {filteredOptions.length === 0 ? (
                    <div className="p-2 text-body-sm text-mist text-center uppercase tracking-widest opacity-50">No results.</div>
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
                                cursor-pointer px-2 py-1.5 text-body-sm font-eskapade flex items-center uppercase tracking-widest text-xs transition-colors
                                ${value === opt.value ? 'text-soul-accent bg-midnight' : 'text-ash hover:bg-midnight/50 hover:text-bone'}
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
