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
    default: "bg-midnight/50 border-midnight-light/50 text-bone",
    destructive: "bg-blood/10 border-blood/30 text-blood",
    warning: "bg-ember/10 border-ember/30 text-ember",
  };

  return (
    <div className={`relative w-full rounded-sm border backdrop-blur-sm p-4 ${styles[variant]} flex gap-4 items-start ${className}`}>
      {icon && <div className="shrink-0 mt-0.5">{icon}</div>}
      <div className="space-y-1">
        {title && <h5 className="font-eskapade tracking-widest text-sm font-bold leading-none uppercase">{title}</h5>}
        <div className="text-sm font-eskapade text-ash/90 leading-relaxed">
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
      <div className="absolute inset-0 bg-abyss/90 backdrop-blur-md" onClick={onClose} />
      <div className="relative w-full max-w-md bg-soul-950/95 backdrop-blur-xl border border-blood/30 shadow-2xl p-8 animate-fade-in rounded-sm">
        <div className="flex flex-col gap-2 text-center mb-8">
            <div className="mx-auto text-blood mb-4 shadow-blood-glow">
                <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            </div>
            <h2 className="text-2xl font-display text-bone tracking-widest uppercase">{title}</h2>
            <p className="text-ash font-eskapade text-sm leading-relaxed">{description}</p>
        </div>
        <div className="flex justify-center gap-4">
            <Button variant="secondary" onClick={onClose}>Cancel</Button>
            <Button variant="danger" onClick={() => { onConfirm(); onClose(); }}>Confirm</Button>
        </div>
      </div>
    </div>
  );
};
