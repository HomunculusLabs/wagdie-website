import React from 'react';

interface AccordionProps {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}

export const Accordion: React.FC<AccordionProps> = ({ title, children, defaultOpen = false }) => {
  return (
    <details className="group border border-midnight-light/50 bg-midnight/20 open:bg-midnight/40 transition-all duration-300 rounded-sm" open={defaultOpen}>
      <summary className="flex items-center justify-between p-4 cursor-pointer select-none list-none text-mist hover:text-soul-accent transition-colors">
        <span className="font-eskapade tracking-widest text-sm uppercase">{title}</span>
        <span className="transform group-open:rotate-180 transition-transform duration-300 text-mist group-hover:text-soul-accent">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="6 9 12 15 18 9"></polyline>
            </svg>
        </span>
      </summary>
      <div className="p-4 pt-0 text-ash font-eskapade leading-relaxed border-t border-transparent group-open:border-midnight-light/20 animate-fade-in">
        {children}
      </div>
    </details>
  );
};
