
import React from 'react';

interface TextAreaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
}

export const TextArea: React.FC<TextAreaProps> = ({ label, className = '', ...props }) => {
  return (
    <div className="flex flex-col gap-2 w-full">
      {label && (
        <label className="text-caption tracking-normal uppercase text-neutral-500 font-display">
          {label}
        </label>
      )}
      <textarea
        className={`bg-transparent border border-neutral-800 p-3 text-body font-body placeholder-neutral-700 focus:outline-none focus:border-soul-accent focus:bg-soul-accent/5 transition-all duration-300 text-neutral-200 resize-none min-h-[100px] ${className}`}
        {...props}
      />
    </div>
  );
};
