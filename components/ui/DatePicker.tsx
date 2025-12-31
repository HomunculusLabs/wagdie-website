'use client'

import React, { useState } from 'react';
import { Popover } from './Popover';
import { Calendar } from './Calendar';

export const DatePicker: React.FC = () => {
  const [date] = useState<string | null>(null);

  const Trigger = (
    <button className={`
      w-full justify-start text-left font-eskapade uppercase tracking-widest flex items-center gap-2 px-4 py-2 border border-midnight-light/50 bg-midnight/30 text-xs transition-all duration-300 hover:bg-midnight/50 hover:border-soul-accent/50
      ${!date ? 'text-mist' : 'text-bone'}
    `}>
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/></svg>
      {date ? date : "Pick a date"}
    </button>
  );

  return (
    <Popover 
      trigger={Trigger}
      content={
        <div className="p-0">
          <Calendar />
        </div>
      } 
    />
  );
};
