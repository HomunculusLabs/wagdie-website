'use client'

import React, { useState } from 'react';

interface ToggleGroupProps {
  options: { label: string; value: string; icon?: React.ReactNode }[];
}

export const ToggleGroup: React.FC<ToggleGroupProps> = ({ options }) => {
  const [selected, setSelected] = useState(options[0].value);

  return (
    <div className="inline-flex border border-midnight-light/50 bg-midnight/30 p-1 rounded-sm">
      {options.map((opt) => (
        <button
          key={opt.value}
          onClick={() => setSelected(opt.value)}
          className={`
            px-3 py-1.5 text-[10px] uppercase tracking-widest font-eskapade flex items-center gap-2 transition-all duration-300
            ${selected === opt.value 
                ? 'bg-soul-900 text-soul-accent shadow-glow-sm border border-soul-accent/50' 
                : 'text-mist hover:text-ash hover:bg-midnight/50'}
          `}
        >
          {opt.icon}
          {opt.label}
        </button>
      ))}
    </div>
  );
};
