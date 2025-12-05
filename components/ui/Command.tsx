'use client'

import React, { useState } from 'react';

interface CommandProps {
  items: { id: string; label: string; shortcut?: string }[];
  placeholder?: string;
  onSelect: (id: string) => void;
}

export const Command: React.FC<CommandProps> = ({ items, placeholder = "Type a command...", onSelect }) => {
  const [query, setQuery] = useState('');
  const filtered = items.filter(item => item.label.toLowerCase().includes(query.toLowerCase()));

  return (
    <div className="w-full max-w-md bg-soul-950 border border-neutral-800 shadow-xl overflow-hidden rounded-md">
      <div className="flex items-center border-b border-neutral-800 px-3">
        <svg className="w-4 h-4 text-neutral-500 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
        <input 
            className="flex-1 h-12 bg-transparent outline-none text-sm text-neutral-200 placeholder-neutral-600 font-body"
            placeholder={placeholder}
            value={query}
            onChange={e => setQuery(e.target.value)}
        />
      </div>
      <div className="max-h-60 overflow-y-auto p-1">
        {filtered.length === 0 ? (
            <div className="py-6 text-center text-xs text-neutral-600 font-display  tracking-normal">No results found.</div>
        ) : (
            filtered.map(item => (
                <button
                    key={item.id}
                    onClick={() => onSelect(item.id)}
                    className="w-full flex items-center justify-between px-3 py-2 text-sm text-neutral-400 hover:bg-neutral-900 hover:text-soul-accent rounded-sm transition-colors group"
                >
                    <span className="font-body">{item.label}</span>
                    {item.shortcut && (
                        <span className="text-xs text-neutral-600 font-mono group-hover:text-neutral-500">{item.shortcut}</span>
                    )}
                </button>
            ))
        )}
      </div>
    </div>
  );
};
