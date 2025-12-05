
import React from 'react';
import { Button } from './Button';

// --- Inline Alert ---
interface AlertProps {
  title?: string;
  children: React.ReactNode;
  variant?: 'default' | 'destructive' | 'warning';
  icon?: React.ReactNode;
  className?: string;
}

export const Alert: React.FC<AlertProps> = ({ title, children, variant = 'default', icon, className = '' }) => {
  const styles = {
    default: "bg-neutral-900/50 border-neutral-700 text-neutral-300",
    destructive: "bg-red-950/30 border-red-900/50 text-red-400",
    warning: "bg-yellow-950/30 border-yellow-900/50 text-yellow-500",
  };

  return (
    <div className={`relative w-full rounded-sm border p-4 ${styles[variant]} flex gap-4 items-start ${className}`}>
      {icon && <div className="shrink-0 mt-0.5">{icon}</div>}
      <div className="space-y-1">
        {title && <h5 className="font-display  tracking-wider text-sm font-bold leading-none">{title}</h5>}
        <div className="text-sm font-eskapade opacity-90 leading-relaxed">
          {children}
        </div>
      </div>
    </div>
  );
};

// --- Alert Dialog (Modal) ---
interface AlertDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
}

export const AlertDialog: React.FC<AlertDialogProps> = ({ isOpen, onClose, onConfirm, title, description }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/90 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md bg-soul-950 border border-red-900/30 shadow-[0_0_30px_rgba(0,0,0,0.8)] p-6 animate-fade-in">
        <div className="flex flex-col gap-2 text-center mb-6">
            <div className="mx-auto text-red-800 mb-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            </div>
            <h2 className="text-xl font-display  text-neutral-200 tracking-widest">{title}</h2>
            <p className="text-neutral-400 font-eskapade text-sm">{description}</p>
        </div>
        <div className="flex justify-center gap-4">
            <Button variant="secondary" onClick={onClose}>Cancel</Button>
            <Button variant="danger" onClick={() => { onConfirm(); onClose(); }}>Confirm</Button>
        </div>
      </div>
    </div>
  );
};
