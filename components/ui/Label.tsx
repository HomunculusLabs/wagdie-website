import React from 'react';

interface LabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {
  required?: boolean;
}

export const Label: React.FC<LabelProps> = ({ children, className = '', required, ...props }) => {
  return (
    <label 
        className={`text-xs tracking-widest text-mist font-eskapade uppercase flex items-center gap-1 mb-1.5 ${className}`}
        {...props}
    >
      {children}
      {required && <span className="text-blood">*</span>}
    </label>
  );
};
