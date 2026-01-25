
import React from 'react';

export const Calendar: React.FC = () => {
  const days = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
  const dates = Array.from({ length: 31 }, (_, i) => i + 1);

  return (
    <div className="w-full max-w-[280px] border border-midnight-light/50 bg-soul-900/40 backdrop-blur-sm p-4 rounded-sm">
      <div className="flex justify-between items-center mb-4 border-b border-midnight-light/30 pb-2">
        <h4 className="font-display text-soul-accent tracking-widest text-sm uppercase">Moon of Frost</h4>
        <div className="text-[10px] text-mist font-eskapade uppercase tracking-widest">Year 4092</div>
      </div>
      
      <div className="grid grid-cols-7 gap-1 text-center mb-2">
        {days.map(d => (
            <div key={d} className="text-[10px] text-mist font-display uppercase tracking-tighter opacity-70">{d}</div>
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
                        aspect-square flex items-center justify-center text-xs font-eskapade transition-all duration-300 rounded-sm
                        ${isToday ? 'text-soul-accent border border-soul-accent' : 'text-ash hover:bg-midnight/50 hover:text-bone'}
                        ${isSelected ? 'bg-soul-900 text-soul-accent border border-soul-accent/50 shadow-inner' : ''}
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
