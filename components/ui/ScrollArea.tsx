
import React from 'react';

interface ScrollAreaProps extends React.HTMLAttributes<HTMLDivElement> {
  height?: string;
}

export const ScrollArea: React.FC<ScrollAreaProps> = ({ height = 'h-64', className = '', children, ..._props }) => {
  return (
    <div className={`relative border border-midnight-light/50 bg-soul-950/20 ${height} ${className} group rounded-sm overflow-hidden`}>
        <div className="overflow-y-auto h-full p-4 scrollbar-thin scrollbar-thumb-midnight-light/30 scrollbar-track-transparent">
            {children}
        </div>
        {/* Visual corner indicators */}
        <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-midnight-light/40 opacity-50 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-midnight-light/40 opacity-50 pointer-events-none" />
    </div>
  );
};
