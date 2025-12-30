
import React from 'react';

interface SwitchProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

export const Switch: React.FC<SwitchProps> = ({ label, className = '', ...props }) => {
  return (
    <label className={`inline-flex items-center gap-3 cursor-pointer group ${className}`}>
      <div className="relative">
        <input 
          type="checkbox" 
          className="peer sr-only" 
          {...props} 
        />
        <div className="w-11 h-6 bg-neutral-900 border border-neutral-700 peer-focus-visible:ring-2 peer-focus-visible:ring-soul-accent peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-soul-950 transition-all duration-300 peer-checked:bg-soul-900 peer-checked:border-soul-accent"></div>
        <div className="absolute top-[2px] left-[2px] bg-neutral-500 w-5 h-5 border border-black transition-all duration-300 peer-checked:translate-x-full peer-checked:bg-soul-accent peer-checked:border-soul-950 shadow-md">
            {/* Inner detail */}
            <div className="absolute inset-1.5 border border-black/20 peer-checked:border-black/40"></div>
        </div>
      </div>
      {label && (
        <span className="text-sm font-eskapade text-neutral-500 group-hover:text-neutral-300 transition-colors select-none">
          {label}
        </span>
      )}
    </label>
  );
};
