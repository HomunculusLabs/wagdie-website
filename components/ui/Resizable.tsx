'use client'

import React from 'react';

export const ResizablePanelGroup: React.FC<{ direction?: 'horizontal' | 'vertical'; children: React.ReactNode }> = ({ direction = 'horizontal', children }) => {
  return (
    <div className={`flex ${direction === 'horizontal' ? 'flex-row' : 'flex-col'} w-full h-full border border-midnight-light/50 overflow-hidden`}>
      {children}
    </div>
  );
};

export const ResizablePanel: React.FC<{ defaultSize?: number; children: React.ReactNode }> = ({ defaultSize: _defaultSize = 50, children }) => {
  return (
    <div className="flex-1 bg-midnight/20 p-4 min-w-[50px] min-h-[50px] relative overflow-hidden">
        {children}
    </div>
  );
};

export const ResizableHandle: React.FC<{ direction?: 'horizontal' | 'vertical' }> = ({ direction = 'horizontal' }) => {
    // Note: A full draggable implementation requires complex state management for widths.
    // This is a visual representation that fits the request for the UI component gallery.
  return (
    <div className={`
        flex items-center justify-center bg-soul-950 border-midnight-light/50
        ${direction === 'horizontal' ? 'w-1.5 border-x cursor-col-resize hover:bg-soul-accent/5' : 'h-1.5 border-y cursor-row-resize hover:bg-soul-accent/5'}
        transition-all duration-300
    `}>
        <div className={`bg-midnight-light rounded-full ${direction === 'horizontal' ? 'w-[1px] h-4' : 'w-4 h-[1px]'}`} />
    </div>
  );
};
