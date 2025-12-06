
import React from 'react';

interface AccordionProps {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}

export const Accordion: React.FC<AccordionProps> = ({ title, children, defaultOpen = false }) => {
  return (
    <details className="group border border-neutral-800 bg-black/20 open:bg-black/40 transition-colors duration-300" open={defaultOpen}>
      <summary className="flex items-center justify-between p-4 cursor-pointer select-none list-none text-neutral-400 hover:text-soul-accent transition-colors">
        <span className="font-display  tracking-normal text-sm">{title}</span>
        <span className="transform group-open:rotate-180 transition-transform duration-300 text-neutral-600 group-hover:text-soul-accent">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="6 9 12 15 18 9"></polyline>
            </svg>
        </span>
      </summary>
      <div className="p-4 pt-0 text-neutral-400 font-body leading-relaxed border-t border-transparent group-open:border-neutral-800/50 animate-fade-in">
        {children}
      </div>
    </details>
  );
};
