
import React from 'react';

export const InputOTP: React.FC = () => {
  return (
    <div className="flex gap-2">
      {[1, 2, 3, 4].map((i) => (
        <input 
            key={i}
            type="text" 
            maxLength={1}
            className="w-10 h-12 bg-black border border-neutral-700 text-center text-xl font-display text-soul-accent focus:border-soul-accent focus:ring-1 focus:ring-soul-accent/50 outline-none transition-all placeholder-neutral-800"
            placeholder="•"
        />
      ))}
    </div>
  );
};
