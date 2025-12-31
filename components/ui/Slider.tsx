
import React from 'react';

interface SliderProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  valueDisplay?: boolean;
}

export const Slider: React.FC<SliderProps> = ({ label, valueDisplay = false, className: _className = '', ...props }) => {
  return (
    <div className="flex flex-col gap-4 w-full">
      <div className="flex justify-between items-end">
        {label && (
          <label className="text-[10px] tracking-widest text-mist font-display uppercase">
            {label}
          </label>
        )}
        {valueDisplay && (
          <span className="text-[10px] font-mono text-soul-accent border border-soul-accent/20 px-1.5 py-0.5 bg-midnight/50 rounded-sm">
            {props.value}
          </span>
        )}
      </div>
      <div className="relative h-6 flex items-center">
        <input
          type="range"
          className={`
            w-full appearance-none bg-transparent cursor-pointer z-10
            [&::-webkit-slider-thumb]:appearance-none
            [&::-webkit-slider-thumb]:w-4
            [&::-webkit-slider-thumb]:h-4
            [&::-webkit-slider-thumb]:bg-soul-900
            [&::-webkit-slider-thumb]:border
            [&::-webkit-slider-thumb]:border-soul-accent
            [&::-webkit-slider-thumb]:rotate-45
            [&::-webkit-slider-thumb]:mt-[-6px]
            [&::-webkit-slider-thumb]:transition-transform
            [&::-webkit-slider-thumb]:duration-100
            active:[&::-webkit-slider-thumb]:scale-125
            
            [&::-webkit-slider-runnable-track]:w-full
            [&::-webkit-slider-runnable-track]:h-1
            [&::-webkit-slider-runnable-track]:bg-midnight
            [&::-webkit-slider-runnable-track]:border
            [&::-webkit-slider-runnable-track]:border-midnight-light/30
          `}
          {...props}
        />
        {/* Decorative track fill simulation (simple version) */}
        <div className="absolute left-0 top-1/2 -translate-y-1/2 h-0.5 bg-soul-accent/20 w-full pointer-events-none"></div>
      </div>
    </div>
  );
};
