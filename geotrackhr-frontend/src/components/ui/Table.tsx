import React from 'react';
import Spinner from './Spinner';
import EmptyState from './EmptyState';

type Column<T> = {
  header: string;
  accessor: keyof T;
  /** Optional custom cell renderer, receives the full row */
  render?: (row: T) => React.ReactNode;
};

type Props<T> = {
  columns: Column<T>[];
  data: T[];
  /** Optional row click handler – receives the row data */
  onRowClick?: (row: T) => void;
  /** Optional function to compute a CSS class for a row */
  rowClassName?: (row: T) => string;
  loading?: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
};

function formatCell(value: unknown): React.ReactNode {
  if (value === null || value === undefined || value === '') {
    return <span className="text-ink-300">—</span>;
  }
  return String(value);
}

function Table<T extends object>({
  columns,
  data,
  onRowClick,
  rowClassName,
  loading = false,
  emptyTitle = 'No records found',
  emptyDescription,
}: Props<T>) {
  if (loading) {
    return (
      <div className="flex items-center justify-center rounded-lg border border-ink-100 bg-white py-16">
        <Spinner />
      </div>
    );
  }

  if (data.length === 0) {
    return <EmptyState title={emptyTitle} description={emptyDescription} />;
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-ink-100 bg-white">
      <table className="min-w-full divide-y divide-ink-100">
        <thead className="bg-ink-50">
          <tr>
            {columns.map((col) => (
              <th
                key={String(col.accessor)}
                className="whitespace-nowrap px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-ink-500"
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-ink-100">
          {data.map((row, i) => (
            <tr
              key={i}
              className={`transition-colors ${onRowClick ? 'cursor-pointer hover:bg-primary-50/60' : 'hover:bg-ink-50'} ${
                rowClassName ? rowClassName(row) : ''
              }`}
              onClick={onRowClick ? () => onRowClick(row) : undefined}
            >
              {columns.map((col) => (
                <td key={String(col.accessor)} className="whitespace-nowrap px-4 py-3 text-sm text-ink-700">
                  {col.render ? col.render(row) : formatCell(row[col.accessor])}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default Table;
