'use client'

import React, { createContext, useContext, useCallback, useMemo, useId, useState } from 'react';
import { Label } from './Label';

// Form Field Context for connecting labels, inputs, and error messages
interface FormFieldContextType {
  id: string;
  name: string;
  error?: string;
  setError: (error: string | undefined) => void;
}

const FormFieldContext = createContext<FormFieldContextType | undefined>(undefined);

function useFormField() {
  const context = useContext(FormFieldContext);
  if (!context) {
    throw new Error('Form components must be used within FormField');
  }
  return context;
}

// Form Context for managing form-wide state
interface FormContextType {
  errors: Record<string, string>;
  setFieldError: (name: string, error: string | undefined) => void;
  clearErrors: () => void;
}

const FormContext = createContext<FormContextType | undefined>(undefined);

export function useForm() {
  const context = useContext(FormContext);
  return context;
}

// Form Provider
interface FormProps extends Omit<React.FormHTMLAttributes<HTMLFormElement>, 'onSubmit'> {
  onSubmit?: (data: FormData, event: React.FormEvent<HTMLFormElement>) => void | Promise<void>;
  children: React.ReactNode;
}

export const Form = React.memo<FormProps>(({ onSubmit, children, className = '', ...props }) => {
  const [errors, setErrors] = useState<Record<string, string>>({});

  const setFieldError = useCallback((name: string, error: string | undefined) => {
    setErrors(prev => {
      if (error === undefined) {
        const { [name]: _, ...rest } = prev;
        return rest;
      }
      return { ...prev, [name]: error };
    });
  }, []);

  const clearErrors = useCallback(() => {
    setErrors({});
  }, []);

  const handleSubmit = useCallback(async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    await onSubmit?.(formData, event);
  }, [onSubmit]);

  const contextValue = useMemo(() => ({
    errors,
    setFieldError,
    clearErrors,
  }), [errors, setFieldError, clearErrors]);

  return (
    <FormContext.Provider value={contextValue}>
      <form
        onSubmit={handleSubmit}
        className={`space-y-6 ${className}`}
        noValidate
        {...props}
      >
        {children}
      </form>
    </FormContext.Provider>
  );
});

Form.displayName = 'Form';

// Form Field - wraps a single form field with context
interface FormFieldProps {
  name: string;
  children: React.ReactNode;
  className?: string;
}

export const FormField = React.memo<FormFieldProps>(({ name, children, className = '' }) => {
  const id = useId();
  const formContext = useForm();
  const [localError, setLocalError] = useState<string | undefined>();

  const error = formContext?.errors[name] ?? localError;

  const setError = useCallback((err: string | undefined) => {
    if (formContext) {
      formContext.setFieldError(name, err);
    } else {
      setLocalError(err);
    }
  }, [formContext, name]);

  const contextValue = useMemo(() => ({
    id,
    name,
    error,
    setError,
  }), [id, name, error, setError]);

  return (
    <FormFieldContext.Provider value={contextValue}>
      <div className={`space-y-2 ${className}`}>
        {children}
      </div>
    </FormFieldContext.Provider>
  );
});

FormField.displayName = 'FormField';

// Form Item - legacy wrapper for backwards compatibility
export const FormItem = React.memo<React.HTMLAttributes<HTMLDivElement>>(({ className = '', ...props }) => {
  return <div className={`space-y-2 ${className}`} {...props} />;
});

FormItem.displayName = 'FormItem';

// Form Label - connected to field context
interface FormLabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {
  required?: boolean;
}

export const FormLabel = React.memo<FormLabelProps>(({ className = '', required, children, ...props }) => {
  const fieldContext = useContext(FormFieldContext);

  return (
    <Label
      htmlFor={fieldContext?.id}
      className={`${fieldContext?.error ? 'text-red-500' : ''} ${className}`}
      required={required}
      {...props}
    >
      {children}
    </Label>
  );
});

FormLabel.displayName = 'FormLabel';

// Form Control - wraps input elements with proper attributes
interface FormControlProps {
  children: React.ReactElement<{
    id?: string;
    name?: string;
    'aria-describedby'?: string;
    'aria-invalid'?: boolean;
  }>;
}

export const FormControl = React.memo<FormControlProps>(({ children }) => {
  const fieldContext = useContext(FormFieldContext);

  if (!fieldContext) {
    return children;
  }

  const { id, name, error } = fieldContext;
  const descriptionId = `${id}-description`;
  const errorId = `${id}-error`;
  const ariaDescribedBy = error ? errorId : descriptionId;

  return React.cloneElement(children, {
    id,
    name,
    'aria-describedby': ariaDescribedBy,
    'aria-invalid': !!error,
  });
});

FormControl.displayName = 'FormControl';

// Form Description - help text for form fields
export const FormDescription = React.memo<React.HTMLAttributes<HTMLParagraphElement>>(({
  className = '',
  ...props
}) => {
  const fieldContext = useContext(FormFieldContext);
  const id = fieldContext ? `${fieldContext.id}-description` : undefined;

  return (
    <p
      id={id}
      className={`text-[0.8rem] text-neutral-500 font-body ${className}`}
      {...props}
    />
  );
});

FormDescription.displayName = 'FormDescription';

// Form Message - displays validation errors
interface FormMessageProps extends React.HTMLAttributes<HTMLParagraphElement> {
  /** Force display a specific message */
  message?: string;
}

export const FormMessage = React.memo<FormMessageProps>(({
  className = '',
  message,
  children,
  ...props
}) => {
  const fieldContext = useContext(FormFieldContext);
  const error = message ?? fieldContext?.error;
  const id = fieldContext ? `${fieldContext.id}-error` : undefined;

  if (!error && !children) {
    return null;
  }

  return (
    <p
      id={id}
      role="alert"
      aria-live="polite"
      className={`text-[0.8rem] font-medium text-red-500 font-body ${className}`}
      {...props}
    >
      {error || children}
    </p>
  );
});

FormMessage.displayName = 'FormMessage';
