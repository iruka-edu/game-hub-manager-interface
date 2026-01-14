'use client';

import { ReactNode } from 'react';
import { useBreakpoint } from '@/hooks/useBreakpoint';

interface Column {
  key: string;
  label: string;
  render?: (value: any, row: any) => ReactNode;
  mobileLabel?: string;
  hideOnMobile?: boolean;
}

interface ResponsiveTableProps {
  columns: Column[];
  data: any[];
  keyField?: string;
  emptyMessage?: string;
}

export function ResponsiveTable({ 
  columns, 
  data, 
  keyField = 'id',
  emptyMessage = 'No data available'
}: ResponsiveTableProps) {
  const { isMobile } = useBreakpoint();

  if (data.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-8 text-center">
        <p className="text-slate-500">{emptyMessage}</p>
      </div>
    );
  }

  // Mobile: Card view
  if (isMobile) {
    return (
      <div className="space-y-4">
        {data.map((row, index) => (
          <div 
            key={row[keyField] || index}
            className="bg-white rounded-lg border border-slate-200 p-4 space-y-3"
          >
            {columns
              .filter(col => !col.hideOnMobile)
              .map(col => (
                <div key={col.key} className="flex justify-between items-start gap-4">
                  <span className="text-sm font-medium text-slate-500 shrink-0">
                    {col.mobileLabel || col.label}
                  </span>
                  <span className="text-sm text-slate-900 text-right">
                    {col.render ? col.render(row[col.key], row) : row[col.key]}
                  </span>
                </div>
              ))}
          </div>
        ))}
      </div>
    );
  }

  // Desktop: Table view
  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              {columns.map(col => (
                <th 
                  key={col.key}
                  className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider"
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {data.map((row, index) => (
              <tr 
                key={row[keyField] || index}
                className="hover:bg-slate-50 transition-colors"
              >
                {columns.map(col => (
                  <td 
                    key={col.key}
                    className="px-6 py-4 text-sm text-slate-900"
                  >
                    {col.render ? col.render(row[col.key], row) : row[col.key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}