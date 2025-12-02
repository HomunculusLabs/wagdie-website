
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
        <span className="text-xs  tracking-widest text-neutral-500 font-display">
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
                className="peer appearance-none w-5 h-5 border border-neutral-700 bg-black/40 rotate-45 transition-all duration-300 checked:border-soul-accent checked:bg-soul-900"
              />
              <div className="absolute w-2 h-2 bg-soul-accent rotate-45 opacity-0 peer-checked:opacity-100 transition-opacity duration-300 pointer-events-none shadow-[0_0_8px_rgba(200,170,110,0.8)]" />
            </div>
            <span className={`text-sm font-eskapade transition-colors duration-300 ${value === option.value ? 'text-neutral-200' : 'text-neutral-500 group-hover:text-neutral-400'}`}>
              {option.label}
            </span>
          </label>
        ))}
      </div>
    </div>
  );
};
