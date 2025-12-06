'use client'

import React, { useState, useRef, useEffect } from 'react';

export const ResizablePanelGroup: React.FC<{ direction?: 'horizontal' | 'vertical'; children: React.ReactNode }> = ({ direction = 'horizontal', children }) => {
  return (
    <div className={`flex ${direction === 'horizontal' ? 'flex-row' : 'flex-col'} w-full h-full border border-neutral-800 overflow-hidden`}>
      {children}
    </div>
  );
};

export const ResizablePanel: React.FC<{ defaultSize?: number; children: React.ReactNode }> = ({ defaultSize = 50, children }) => {
  return (
    <div className="flex-1 bg-black/20 p-4 min-w-[50px] min-h-[50px] relative overflow-hidden">
        {children}
    </div>
  );
};

export const ResizableHandle: React.FC<{ direction?: 'horizontal' | 'vertical' }> = ({ direction = 'horizontal' }) => {
    // Note: A full draggable implementation requires complex state management for widths.
    // This is a visual representation that fits the request for the UI component gallery.
  return (
    <div className={`
        flex items-center justify-center bg-neutral-900 border-neutral-800
        ${direction === 'horizontal' ? 'w-2 border-x cursor-col-resize hover:bg-soul-accent/10' : 'h-2 border-y cursor-row-resize hover:bg-soul-accent/10'}
        transition-colors
    `}>
        <div className={`bg-neutral-700 rounded-full ${direction === 'horizontal' ? 'w-1 h-4' : 'w-4 h-1'}`} />
    </div>
  );
};
