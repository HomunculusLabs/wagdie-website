
import React from 'react';

interface ScrollAreaProps extends React.HTMLAttributes<HTMLDivElement> {
  height?: string;
}

export const ScrollArea: React.FC<ScrollAreaProps> = ({ height = 'h-64', className = '', children, ...props }) => {
  return (
    <div className={`relative border border-neutral-800 bg-black/20 ${height} ${className} group`}>
        <div className="overflow-y-auto h-full p-4 scrollbar-thin scrollbar-thumb-neutral-700 scrollbar-track-transparent">
            {children}
        </div>
        {/* Visual corner indicators */}
        <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-neutral-700 opacity-50 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-neutral-700 opacity-50 pointer-events-none" />
    </div>
  );
};
