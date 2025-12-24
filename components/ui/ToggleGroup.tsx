'use client'

import React, { useState } from 'react';

interface ToggleGroupProps {
  options: { label: string; value: string; icon?: React.ReactNode }[];
}

export const ToggleGroup: React.FC<ToggleGroupProps> = ({ options }) => {
  const [selected, setSelected] = useState(options[0].value);

  return (
    <div className="inline-flex border border-neutral-800 bg-black/20 p-1">
      {options.map((opt) => (
        <button
          key={opt.value}
          onClick={() => setSelected(opt.value)}
          className={`
            px-3 py-1.5 text-xs  tracking-wider font-eskapade flex items-center gap-2 transition-all
            ${selected === opt.value 
                ? 'bg-soul-900 text-soul-accent shadow-sm border border-neutral-800' 
                : 'text-neutral-500 hover:text-neutral-300'}
          `}
        >
          {opt.icon}
          {opt.label}
        </button>
      ))}
    </div>
  );
};
