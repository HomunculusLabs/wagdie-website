import React, { useId } from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

export const Input: React.FC<InputProps> = ({ label, className = '', id: providedId, ...props }) => {
  const generatedId = useId();
  const inputId = providedId || generatedId;

  return (
    <div className="flex flex-col gap-2 w-full">
      {label && (
        <label
          htmlFor={inputId}
          className="text-caption tracking-widest uppercase text-neutral-500 font-eskapade"
        >
          {label}
        </label>
      )}
      <input
        id={inputId}
        className={`bg-transparent border-b border-neutral-800 py-2 px-1 text-body font-eskapade placeholder-neutral-700 focus:outline-none focus:border-soul-accent focus:bg-soul-accent/5 focus-visible:ring-2 focus-visible:ring-soul-accent/50 transition-all duration-300 text-neutral-200 ${className}`}
        {...props}
      />
    </div>
  );
};
