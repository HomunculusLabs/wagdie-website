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
          className="text-caption tracking-widest uppercase text-mist font-eskapade group-focus-within:text-soul-accent transition-colors duration-300"
        >
          {label}
        </label>
      )}
      <textarea
        id={textareaId}
        className={`bg-midnight/30 border border-midnight-light p-3 text-body font-eskapade placeholder-mist/30 focus:outline-none focus:border-soul-accent focus:bg-soul-accent/5 transition-all duration-300 text-bone resize-none min-h-[120px] ${className}`}
        {...props}
      />
    </div>
  );
};
