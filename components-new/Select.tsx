
import React from 'react';

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  options: { value: string; label: string }[];
}

export const Select: React.FC<SelectProps> = ({ label, options, className = '', ...props }) => {
  return (
    <div className="flex flex-col gap-2 w-full">
      {label && (
        <label className="text-xs uppercase tracking-widest text-neutral-500 font-display">
          {label}
        </label>
      )}
      <div className="relative group">
        <select
          className={`appearance-none w-full bg-black/20 border-b border-neutral-800 py-2 pl-1 pr-8 text-lg font-serif text-neutral-300 focus:outline-none focus:border-soul-accent focus:bg-soul-accent/5 transition-all duration-300 cursor-pointer ${className}`}
          {...props}
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value} className="bg-soul-900 text-neutral-300">
              {opt.label}
            </option>
          ))}
        </select>
        {/* Custom Arrow */}
        <div className="absolute right-0 top-1/2 -translate-y-1/2 pointer-events-none text-neutral-600 group-hover:text-soul-accent transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="6 9 12 15 18 9"></polyline>
          </svg>
        </div>
      </div>
    </div>
  );
};
