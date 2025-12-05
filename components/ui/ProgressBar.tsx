
import React from 'react';

interface ProgressBarProps {
  value: number;
  max: number;
  label?: string;
  variant?: 'health' | 'mana' | 'stamina' | 'souls';
  showValue?: boolean;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({ 
  value, 
  max, 
  label, 
  variant = 'health',
  showValue = true 
}) => {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100));

  const colors = {
    health: {
      bar: "bg-gradient-to-r from-red-900 to-red-700",
      glow: "shadow-[0_0_10px_rgba(153,27,27,0.4)]",
      border: "border-red-900/50"
    },
    mana: {
      bar: "bg-gradient-to-r from-blue-900 to-blue-700",
      glow: "shadow-[0_0_10px_rgba(30,58,138,0.4)]",
      border: "border-blue-900/50"
    },
    stamina: {
      bar: "bg-gradient-to-r from-emerald-900 to-emerald-700",
      glow: "shadow-[0_0_10px_rgba(6,78,59,0.4)]",
      border: "border-emerald-900/50"
    },
    souls: {
      bar: "bg-gradient-to-r from-yellow-900/80 to-soul-accent",
      glow: "shadow-[0_0_10px_rgba(200,170,110,0.4)]",
      border: "border-soul-accent/40"
    }
  };

  const currentStyle = colors[variant];

  return (
    <div className="w-full space-y-1">
      {(label || showValue) && (
        <div className="flex justify-between items-end text-xs font-display tracking-widest ">
            <span className="text-neutral-500">{label}</span>
            {showValue && (
                <span className="text-neutral-400">
                    {value} / {max}
                </span>
            )}
        </div>
      )}
      <div className={`h-3 w-full bg-black/60 border ${currentStyle.border} relative overflow-hidden`}>
        {/* Background texture */}
        <div className="absolute inset-0 opacity-20 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0IiBoZWlnaHQ9IjQiPgo8cmVjdCB3aWR0aD0iNCIgaGVpZ2h0PSI0IiBmaWxsPSIjZmZmIiBmaWxsLW9wYWNpdHk9IjAuMSIvPgo8cGF0aCBkPSJNMSAzaDJ2MkgxeiIgZmlsbD0iIzAwMCIgZmlsbC1vcGFjaXR5PSIwLjIiLz4KPC9zdmc+')]"></div>
        
        {/* The Bar */}
        <div 
            className={`h-full transition-all duration-500 ease-out ${currentStyle.bar} ${currentStyle.glow}`}
            style={{ width: `${percentage}%` }}
        >
            {/* Shimmer effect */}
            <div className="absolute top-0 right-0 bottom-0 w-[1px] bg-white/30 shadow-[0_0_5px_rgba(255,255,255,0.5)]"></div>
        </div>
      </div>
    </div>
  );
};
