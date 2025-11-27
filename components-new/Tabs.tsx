'use client'

import React, { useState, useEffect } from 'react';

export interface TabItem {
  id: string;
  label: React.ReactNode;
  content?: React.ReactNode;
  icon?: React.ReactComponentElement<any>;
}

interface TabsProps {
  items: TabItem[];
  defaultActiveId?: string;
  activeId?: string; // Controlled mode
  onChange?: (id: string) => void; // Controlled mode
  className?: string;
}

export const Tabs: React.FC<TabsProps> = ({ 
  items, 
  defaultActiveId, 
  activeId: controlledActiveId, 
  onChange,
  className = ''
}) => {
  const [internalActiveId, setInternalActiveId] = useState(defaultActiveId || items[0]?.id);
  
  const activeId = controlledActiveId !== undefined ? controlledActiveId : internalActiveId;

  const handleTabClick = (id: string) => {
    if (onChange) {
      onChange(id);
    } else {
      setInternalActiveId(id);
    }
  };

  return (
    <div className={`w-full ${className}`}>
      {/* Tab Navigation */}
      <div className="flex flex-wrap justify-center gap-2 md:gap-4 border-b border-neutral-800 pb-1 mb-8">
        {items.map((item) => (
          <button
            key={item.id}
            onClick={() => handleTabClick(item.id)}
            className={`
              flex items-center gap-2 px-4 md:px-6 py-3 
              font-display uppercase text-sm tracking-wider 
              transition-all duration-300 border-b-2 
              group relative overflow-hidden
              ${activeId === item.id 
                ? 'border-soul-accent text-soul-accent drop-shadow-[0_0_8px_rgba(200,170,110,0.4)]' 
                : 'border-transparent text-neutral-600 hover:text-neutral-400 hover:border-neutral-800'
              }
            `}
          >
            {/* Hover Glow Background */}
            <div className={`absolute inset-0 bg-soul-accent/5 translate-y-full transition-transform duration-300 ${activeId === item.id ? 'translate-y-0' : 'group-hover:translate-y-0'}`} />
            
            <span className="relative z-10 flex items-center gap-2">
              {item.icon && React.cloneElement(item.icon, { size: 16 })}
              {item.label}
            </span>
          </button>
        ))}
      </div>

      {/* Tab Content (Only renders if content is provided in items) */}
      <div className="relative animate-fade-in">
        {items.map((item) => {
          if (item.id !== activeId || !item.content) return null;
          return (
            <div key={item.id} className="w-full">
              {item.content}
            </div>
          );
        })}
      </div>
    </div>
  );
};
