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
    <div className="w-full max-w-md bg-soul-950/95 backdrop-blur-xl border border-midnight-light/50 overflow-hidden rounded-sm">
      <div className="flex items-center border-b border-midnight-light/30 px-3">
        <svg className="w-4 h-4 text-mist mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
        <input 
            className="flex-1 h-12 bg-transparent outline-none text-sm text-bone placeholder-mist/30 font-eskapade uppercase tracking-widest"
            placeholder={placeholder}
            value={query}
            onChange={e => setQuery(e.target.value)}
        />
      </div>
      <div className="max-h-60 overflow-y-auto p-1">
        {filtered.length === 0 ? (
            <div className="py-6 text-center text-xs text-mist font-display tracking-widest uppercase opacity-50">No results found.</div>
        ) : (
            filtered.map(item => (
                <button
                    key={item.id}
                    onClick={() => onSelect(item.id)}
                    className="w-full flex items-center justify-between px-3 py-2 text-sm text-ash hover:bg-midnight/50 hover:text-soul-accent rounded-sm transition-all duration-200 group border-l-2 border-transparent hover:border-soul-accent"
                >
                    <span className="font-eskapade uppercase tracking-widest text-xs opacity-70 group-hover:opacity-100">{item.label}</span>
                    {item.shortcut && (
                        <span className="text-[10px] text-mist font-mono group-hover:text-ash border border-midnight-light/30 px-1 rounded-sm">{item.shortcut}</span>
                    )}
                </button>
            ))
        )}
      </div>
    </div>
  );
};
