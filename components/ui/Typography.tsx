
import React from 'react';

export const Blockquote: React.FC<{ children: React.ReactNode, cite?: string }> = ({ children, cite }) => {
  return (
    <figure className="my-6">
      <blockquote className="border-l-2 border-soul-accent/40 pl-6 italic text-neutral-400 text-lg font-eskapade leading-relaxed relative">
        <span className="absolute -top-4 -left-3 text-4xl text-soul-accent/20 font-display">&ldquo;</span>
        {children}
      </blockquote>
      {cite && (
        <figcaption className="mt-3 pl-6 text-md font-display text-neutral-600">
          — {cite}
        </figcaption>
      )}
    </figure>
  );
};

export const Code: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <code className="bg-neutral-900 border border-neutral-800 rounded px-1.5 py-0.5 text-sm font-mono text-soul-accent/80">
      {children}
    </code>
  );
};

export const List: React.FC<{ children: React.ReactNode, type?: 'ul' | 'ol' }> = ({ children, type = 'ul' }) => {
  if (type === 'ol') {
    return (
      <ol className="list-decimal list-inside space-y-2 text-neutral-400 font-eskapade marker:text-soul-accent marker:font-display">
        {children}
      </ol>
    );
  }
  return (
    <ul className="space-y-2 text-neutral-400 font-eskapade">
      {React.Children.map(children, (child) => (
        <li className="flex items-start gap-3">
          <span className="mt-1.5 w-1.5 h-1.5 rotate-45 bg-soul-accent/50 shrink-0" />
          <span>{child}</span>
        </li>
      ))}
    </ul>
  );
};
