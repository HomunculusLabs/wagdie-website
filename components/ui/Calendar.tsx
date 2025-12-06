
import React from 'react';

export const Calendar: React.FC = () => {
  const days = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
  const dates = Array.from({ length: 31 }, (_, i) => i + 1);

  return (
    <div className="w-full max-w-[280px] border border-neutral-800 bg-black/40 p-4">
      <div className="flex justify-between items-center mb-4 border-b border-neutral-800 pb-2">
        <h4 className="font-display  text-soul-accent tracking-normal text-sm">Moon of Frost</h4>
        <div className="text-xs text-neutral-500">Year 4092</div>
      </div>
      
      <div className="grid grid-cols-7 gap-1 text-center mb-2">
        {days.map(d => (
            <div key={d} className="text-[10px]  text-neutral-600 font-display">{d}</div>
        ))}
      </div>
      
      <div className="grid grid-cols-7 gap-1">
        {dates.map(date => {
            const isToday = date === 12;
            const isSelected = date === 14;
            return (
                <button 
                    key={date} 
                    className={`
                        aspect-square flex items-center justify-center text-xs font-body transition-colors
                        ${isToday ? 'text-soul-accent border border-soul-accent' : 'text-neutral-400 hover:bg-neutral-800'}
                        ${isSelected ? 'bg-soul-900 text-soul-accent shadow-inner' : ''}
                    `}
                >
                    {date}
                </button>
            )
        })}
      </div>
    </div>
  );
};
