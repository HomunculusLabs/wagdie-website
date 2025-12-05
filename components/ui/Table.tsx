
import React from 'react';

export const Table: React.FC<React.TableHTMLAttributes<HTMLTableElement>> = ({ className = '', children, ...props }) => {
  return (
    <div className="w-full overflow-x-auto border border-neutral-800 bg-black/20 backdrop-blur-sm">
      <table className={`w-full text-left border-collapse ${className}`} {...props}>
        {children}
      </table>
    </div>
  );
};

export const TableCaption: React.FC<React.HTMLAttributes<HTMLTableCaptionElement>> = ({ className = '', children, ...props }) => {
  return (
    <caption className={`mt-4 text-xs font-body text-neutral-600 italic ${className}`} {...props}>
      {children}
    </caption>
  );
};

export const Thead: React.FC<React.HTMLAttributes<HTMLTableSectionElement>> = ({ className = '', children, ...props }) => {
  return (
    <thead className={`bg-neutral-900/50 ${className}`} {...props}>
      {children}
    </thead>
  );
};

export const Tbody: React.FC<React.HTMLAttributes<HTMLTableSectionElement>> = ({ className = '', children, ...props }) => {
  return (
    <tbody className={`divide-y divide-neutral-800/50 ${className}`} {...props}>
      {children}
    </tbody>
  );
};

export const TableFooter: React.FC<React.HTMLAttributes<HTMLTableSectionElement>> = ({ className = '', children, ...props }) => {
  return (
    <tfoot className={`bg-neutral-900/80 border-t border-neutral-800 font-medium text-neutral-400 ${className}`} {...props}>
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
    <th className={`px-4 py-3 text-xs font-display  tracking-normal text-neutral-500 font-normal border-b border-neutral-800 ${className}`} {...props}>
      {children}
    </th>
  );
};

export const Td: React.FC<React.TdHTMLAttributes<HTMLTableDataCellElement>> = ({ className = '', children, ...props }) => {
  return (
    <td className={`px-4 py-3 text-sm font-body text-neutral-400 group-hover:text-neutral-200 transition-colors ${className}`} {...props}>
      {children}
    </td>
  );
};
