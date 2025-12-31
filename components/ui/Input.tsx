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
          className="text-caption tracking-widest uppercase text-mist font-eskapade group-focus-within:text-soul-accent transition-colors duration-300"
        >
          {label}
        </label>
      )}
      <input
        id={inputId}
        className={`bg-midnight/30 border-b border-midnight-light py-2 px-2 text-body font-eskapade placeholder-mist/30 focus:outline-none focus:border-soul-accent focus:bg-soul-accent/5 transition-all duration-300 text-bone ${className}`}
        {...props}
      />
    </div>
  );
};
