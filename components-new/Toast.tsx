'use client'

import React, { useEffect, useState } from 'react';

export type ToastVariant = 'default' | 'success' | 'error' | 'warning';

interface ToastProps {
  message: string;
  variant?: ToastVariant;
  isVisible: boolean;
  onClose: () => void;
  duration?: number;
}

export const Toast: React.FC<ToastProps> = ({ 
  message, 
  variant = 'default', 
  isVisible, 
  onClose,
  duration = 3000 
}) => {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (isVisible) {
      setShow(true);
      const timer = setTimeout(() => {
        setShow(false);
        setTimeout(onClose, 300); // Wait for animation to finish before calling onClose
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [isVisible, duration, onClose]);

  const variants = {
    default: "border-neutral-700 bg-neutral-900 text-neutral-300",
    success: "border-soul-accent/50 bg-soul-900 text-soul-accent shadow-[0_0_15px_rgba(200,170,110,0.1)]",
    error: "border-red-900/50 bg-red-950/90 text-red-400 shadow-[0_0_15px_rgba(153,27,27,0.1)]",
    warning: "border-orange-900/50 bg-orange-950/90 text-orange-400",
  };

  const icons = {
    default: (
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
    ),
    success: (
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
    ),
    error: (
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
    ),
    warning: (
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
    )
  };

  if (!isVisible && !show) return null;

  return (
    <div 
      className={`
        fixed bottom-8 right-8 z-50 flex items-center gap-3 px-6 py-4 
        border backdrop-blur-md max-w-sm w-full
        transition-all duration-500 ease-out transform
        ${show ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}
        ${variants[variant]}
      `}
    >
      <div className="shrink-0">{icons[variant]}</div>
      <div className="flex-1">
        <p className="font-display tracking-wide uppercase text-sm">{message}</p>
      </div>
      {/* Progress bar for timer */}
      <div className="absolute bottom-0 left-0 h-[2px] bg-current opacity-30 animate-[width_3s_linear_forwards]" style={{width: '100%'}} />
    </div>
  );
};
