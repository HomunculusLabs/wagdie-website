import React from 'react';
import { Button } from './Button';
import { AlertCircle } from 'lucide-react';

// --- Inline Alert ---
interface AlertProps {
  title?: string;
  children: React.ReactNode;
  variant?: 'default' | 'destructive' | 'warning';
  icon?: React.ReactNode;
  className?: string;
  role?: string;
}

export const Alert: React.FC<AlertProps> = ({ title, children, variant = 'default', icon, className = '', role }) => {
  const styles = {
    default: "bg-soul-900/40 border-soul-900/50 text-bone",
    destructive: "bg-blood/10 border-blood/30 text-blood",
    warning: "bg-ember/10 border-ember/30 text-ember",
  };

  return (
    <div 
      className={`relative w-full rounded-sm border backdrop-blur-sm p-4 ${styles[variant]} flex gap-4 items-start ${className}`}
      role={role}
    >
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
      <div className="absolute inset-0 bg-soul-950/90 backdrop-blur-md" onClick={onClose} />
      <div className="relative w-full max-w-md bg-soul-950 border border-soul-900 p-8 animate-fade-in rounded-sm">
        <div className="flex flex-col gap-2 text-center mb-8">
            <div className="mx-auto text-blood mb-4">
                <AlertCircle size={48} strokeWidth={1.5} />
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
