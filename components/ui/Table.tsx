
import React from 'react';

export const Table: React.FC<React.TableHTMLAttributes<HTMLTableElement>> = ({ className = '', children, ...props }) => {
  return (
    <div className="w-full overflow-x-auto border border-midnight-light/50 bg-soul-900/40 backdrop-blur-sm">
      <table className={`w-full text-left border-collapse ${className}`} {...props}>
        {children}
      </table>
    </div>
  );
};

export const TableCaption: React.FC<React.HTMLAttributes<HTMLTableCaptionElement>> = ({ className = '', children, ...props }) => {
  return (
    <caption className={`mt-4 text-xs font-eskapade text-mist italic ${className}`} {...props}>
      {children}
    </caption>
  );
};

export const Thead: React.FC<React.HTMLAttributes<HTMLTableSectionElement>> = ({ className = '', children, ...props }) => {
  return (
    <thead className={`bg-midnight/50 ${className}`} {...props}>
      {children}
    </thead>
  );
};

export const Tbody: React.FC<React.HTMLAttributes<HTMLTableSectionElement>> = ({ className = '', children, ...props }) => {
  return (
    <tbody className={`divide-y divide-midnight-light/30 ${className}`} {...props}>
      {children}
    </tbody>
  );
};

export const TableFooter: React.FC<React.HTMLAttributes<HTMLTableSectionElement>> = ({ className = '', children, ...props }) => {
  return (
    <tfoot className={`bg-soul-950/80 border-t border-midnight-light/50 font-medium text-ash ${className}`} {...props}>
      {children}
    </tfoot>
  );
};

export const Tr: React.FC<React.HTMLAttributes<HTMLTableRowElement>> = ({ className = '', children, ...props }) => {
  return (
    <tr className={`transition-colors duration-200 hover:bg-soul-accent/5 group ${className}`} {...props}>
      {children}
    </tr>
  );
};

export const Th: React.FC<React.ThHTMLAttributes<HTMLTableHeaderCellElement>> = ({ className = '', children, ...props }) => {
  return (
    <th className={`px-4 py-3 text-xs font-display tracking-widest text-mist font-normal border-b border-midnight-light/30 ${className}`} {...props}>
      {children}
    </th>
  );
};

export const Td: React.FC<React.TdHTMLAttributes<HTMLTableDataCellElement>> = ({ className = '', children, ...props }) => {
  return (
    <td className={`px-4 py-3 text-sm font-eskapade text-ash group-hover:text-bone transition-colors ${className}`} {...props}>
      {children}
    </td>
  );
};
