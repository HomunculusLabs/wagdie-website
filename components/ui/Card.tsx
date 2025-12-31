import React from 'react';

export const Card = React.memo<React.HTMLAttributes<HTMLDivElement>>(({ className = '', ...props }) => (
  <div className={`bg-soul-900/60 backdrop-blur-md border border-midnight-light/50 shadow-2xl relative overflow-hidden group ${className}`} {...props}>
    {/* Subtle inner shine */}
    {props.children}
  </div>
));
Card.displayName = 'Card';

export const CardHeader = React.memo<React.HTMLAttributes<HTMLDivElement>>(({ className = '', ...props }) => (
  <div className={`p-6 pb-2 relative z-10 ${className}`} {...props} />
));
CardHeader.displayName = 'CardHeader';

export const CardTitle = React.memo<React.HTMLAttributes<HTMLHeadingElement>>(({ className = '', ...props }) => (
  <h3 className={`text-h3 font-display text-bone tracking-widest ${className}`} {...props} />
));
CardTitle.displayName = 'CardTitle';

export const CardDescription = React.memo<React.HTMLAttributes<HTMLParagraphElement>>(({ className = '', ...props }) => (
  <p className={`text-body-sm text-ash font-eskapade leading-relaxed ${className}`} {...props} />
));
CardDescription.displayName = 'CardDescription';

export const CardContent = React.memo<React.HTMLAttributes<HTMLDivElement>>(({ className = '', ...props }) => (
  <div className={`p-6 pt-2 relative z-10 ${className}`} {...props} />
));
CardContent.displayName = 'CardContent';

export const CardFooter = React.memo<React.HTMLAttributes<HTMLDivElement>>(({ className = '', ...props }) => (
  <div className={`p-6 pt-0 flex items-center relative z-10 ${className}`} {...props} />
));
CardFooter.displayName = 'CardFooter';
