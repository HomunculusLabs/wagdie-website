
import React from 'react';

interface CheckboxProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

export const Checkbox: React.FC<CheckboxProps> = ({ label, className = '', ...props }) => {
  return (
    <label className={`flex items-center gap-3 cursor-pointer group ${className}`}>
      <div className="relative flex items-center">
        <input 
          type="checkbox" 
          className="peer appearance-none w-5 h-5 border border-neutral-700 bg-black/40 checked:bg-soul-900 checked:border-soul-accent transition-all duration-300"
          {...props}
        />
        <svg 
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 text-soul-accent opacity-0 peer-checked:opacity-100 transition-opacity duration-200 pointer-events-none" 
          viewBox="0 0 12 12" 
          fill="none" 
          xmlns="http://www.w3.org/2000/svg"
        >
          <path d="M2 6L5 9L10 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </div>
      {label && (
        <span className="text-sm font-body text-neutral-500 group-hover:text-neutral-300 transition-colors select-none">
          {label}
        </span>
      )}
    </label>
  );
};
