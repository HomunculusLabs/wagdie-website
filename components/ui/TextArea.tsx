import React, { useId } from 'react';

interface TextAreaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
}

export const TextArea: React.FC<TextAreaProps> = ({ label, className = '', id: providedId, ...props }) => {
  const generatedId = useId();
  const textareaId = providedId || generatedId;

  return (
    <div className="flex flex-col gap-2 w-full">
      {label && (
        <label
          htmlFor={textareaId}
          className="text-caption tracking-widest uppercase text-neutral-500 font-eskapade"
        >
          {label}
        </label>
      )}
      <textarea
        id={textareaId}
        className={`bg-transparent border border-neutral-800 p-3 text-body font-eskapade placeholder-neutral-700 focus:outline-none focus:border-soul-accent focus:bg-soul-accent/5 focus-visible:ring-2 focus-visible:ring-soul-accent/50 transition-all duration-300 text-neutral-200 resize-none min-h-[100px] ${className}`}
        {...props}
      />
    </div>
  );
};
