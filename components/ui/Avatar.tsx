
import React from 'react';

interface AvatarProps {
  src?: string;
  alt?: string;
  initials?: string;
  size?: 'sm' | 'md' | 'lg';
  shape?: 'circle' | 'square' | 'diamond';
  status?: 'online' | 'offline' | 'busy';
}

export const Avatar: React.FC<AvatarProps> = ({ 
  src, 
  alt, 
  initials, 
  size = 'md', 
  shape = 'circle',
  status 
}) => {
  const sizeClasses = {
    sm: "w-8 h-8 text-xs",
    md: "w-12 h-12 text-sm",
    lg: "w-20 h-20 text-lg",
  };

  const shapeClasses = {
    circle: "rounded-full",
    square: "rounded-sm",
    diamond: "rotate-45 scale-75 m-2", // Rotated, need margin to not clip in flex containers
  };

  const statusColors = {
    online: "bg-emerald-500 shadow-[0_0_5px_rgba(16,185,129,0.5)]",
    offline: "bg-neutral-500",
    busy: "bg-red-500 shadow-[0_0_5px_rgba(239,68,68,0.5)]",
  };

  return (
    <div className={`relative inline-block ${shape === 'diamond' ? 'p-2' : ''}`}>
      <div 
        className={`
          relative flex items-center justify-center overflow-hidden border border-neutral-700 bg-neutral-900
          ${sizeClasses[size]} 
          ${shapeClasses[shape]}
          group
        `}
      >
        {src ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={src}
            alt={alt}
            className={`w-full h-full object-cover transition-transform duration-500 group-hover:scale-110 ${shape === 'diamond' ? '-rotate-45 scale-[1.45]' : ''}`}
          />
        ) : (
          <span className={`font-display font-bold text-neutral-400 ${shape === 'diamond' ? '-rotate-45' : ''}`}>
            {initials}
          </span>
        )}
        
        {/* Shine effect */}
        <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/10 to-white/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
      </div>

      {status && shape !== 'diamond' && (
        <span 
          className={`
            absolute bottom-0 right-0 block h-2.5 w-2.5 rounded-full ring-2 ring-soul-950 
            ${statusColors[status]}
          `} 
        />
      )}
    </div>
  );
};
