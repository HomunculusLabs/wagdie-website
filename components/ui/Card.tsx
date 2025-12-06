import React from 'react';

export const Card = React.memo<React.HTMLAttributes<HTMLDivElement>>(({ className = '', ...props }) => (
  <div className={`bg-black/40 border border-neutral-800 shadow-lg ${className}`} {...props} />
));
Card.displayName = 'Card';

export const CardHeader = React.memo<React.HTMLAttributes<HTMLDivElement>>(({ className = '', ...props }) => (
  <div className={`p-6 pb-2 ${className}`} {...props} />
));
CardHeader.displayName = 'CardHeader';

export const CardTitle = React.memo<React.HTMLAttributes<HTMLHeadingElement>>(({ className = '', ...props }) => (
  <h3 className={`text-h4 font-display text-neutral-200 ${className}`} {...props} />
));
CardTitle.displayName = 'CardTitle';

export const CardDescription = React.memo<React.HTMLAttributes<HTMLParagraphElement>>(({ className = '', ...props }) => (
  <p className={`text-body-sm text-neutral-500 font-body ${className}`} {...props} />
));
CardDescription.displayName = 'CardDescription';

export const CardContent = React.memo<React.HTMLAttributes<HTMLDivElement>>(({ className = '', ...props }) => (
  <div className={`p-6 pt-2 ${className}`} {...props} />
));
CardContent.displayName = 'CardContent';

export const CardFooter = React.memo<React.HTMLAttributes<HTMLDivElement>>(({ className = '', ...props }) => (
  <div className={`p-6 pt-0 flex items-center ${className}`} {...props} />
));
CardFooter.displayName = 'CardFooter';
