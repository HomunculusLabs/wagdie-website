
import React from 'react';

interface RadioOption {
  label: string;
  value: string;
}

interface RadioGroupProps {
  name: string;
  options: RadioOption[];
  value: string;
  onChange: (value: string) => void;
  label?: string;
}

export const RadioGroup: React.FC<RadioGroupProps> = ({ name, options, value, onChange, label }) => {
  return (
    <div className="flex flex-col gap-3">
      {label && (
        <span className="text-[10px] tracking-widest text-mist font-display uppercase">
          {label}
        </span>
      )}
      <div className="flex flex-col gap-2">
        {options.map((option) => (
          <label key={option.value} className="flex items-center gap-3 cursor-pointer group w-fit">
            <div className="relative flex items-center justify-center w-5 h-5">
              <input
                type="radio"
                name={name}
                value={option.value}
                checked={value === option.value}
                onChange={(e) => onChange(e.target.value)}
                className="peer appearance-none w-5 h-5 border border-midnight-light/50 bg-midnight/30 rotate-45 transition-all duration-300 checked:border-soul-accent checked:bg-soul-900"
              />
              <div className="absolute w-2 h-2 bg-soul-accent rotate-45 opacity-0 peer-checked:opacity-100 transition-opacity duration-300 pointer-events-none shadow-[0_0_8px_rgba(200,170,110,0.8)]" />
            </div>
            <span className={`text-sm font-eskapade transition-colors duration-300 uppercase tracking-widest text-xs ${value === option.value ? 'text-bone' : 'text-mist group-hover:text-ash'}`}>
              {option.label}
            </span>
          </label>
        ))}
      </div>
    </div>
  );
};
