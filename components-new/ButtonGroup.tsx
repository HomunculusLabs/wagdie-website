
import React from 'react';

export const ButtonGroup: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="inline-flex rounded-sm shadow-sm" role="group">
      {React.Children.map(children, (child, index) => {
        if (React.isValidElement(child)) {
            return (
                <div className={`
                    [&>button]:rounded-none 
                    ${index === 0 ? '[&>button]:rounded-l-sm' : ''} 
                    ${index === React.Children.count(children) - 1 ? '[&>button]:rounded-r-sm' : ''}
                    ${index !== 0 ? '-ml-px' : ''}
                `}>
                    {child}
                </div>
            )
        }
        return child;
      })}
    </div>
  );
};
