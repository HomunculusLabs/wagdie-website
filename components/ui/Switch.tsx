
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
        <div className="w-11 h-6 bg-midnight/50 border border-midnight-light/50 transition-all duration-300 peer-checked:bg-soul-900 peer-checked:border-soul-accent rounded-full overflow-hidden"></div>
        <div className="absolute top-[2px] left-[2px] bg-mist w-5 h-5 border border-abyss transition-all duration-300 peer-checked:translate-x-full peer-checked:bg-soul-accent peer-checked:border-soul-950 shadow-md rounded-full">
            {/* Inner detail */}
            <div className="absolute inset-1.5 border border-black/10 peer-checked:border-soul-950/20 rounded-full"></div>
        </div>
      </div>
      {label && (
        <span className="text-sm font-eskapade text-mist group-hover:text-ash transition-colors select-none uppercase tracking-widest">
          {label}
        </span>
      )}
    </label>
  );
};
