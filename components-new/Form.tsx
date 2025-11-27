
import React from 'react';
import { Label } from './Label';

export const FormItem: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ className = '', ...props }) => {
  return <div className={`space-y-2 ${className}`} {...props} />;
};

export const FormLabel: React.FC<React.LabelHTMLAttributes<HTMLLabelElement>> = ({ className = '', ...props }) => {
  return <Label className={className} {...props} />;
};

export const FormControl: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ className = '', ...props }) => {
  return <div className={`relative ${className}`} {...props} />;
};

export const FormDescription: React.FC<React.HTMLAttributes<HTMLParagraphElement>> = ({ className = '', ...props }) => {
  return <p className={`text-[0.8rem] text-neutral-500 font-serif ${className}`} {...props} />;
};

export const FormMessage: React.FC<React.HTMLAttributes<HTMLParagraphElement>> = ({ className = '', ...props }) => {
  return <p className={`text-[0.8rem] font-medium text-red-500 font-serif ${className}`} {...props} />;
};
