import React from 'react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';

interface Column<T> {
  header: string;
  accessor: keyof T | ((row: T) => React.ReactNode);
  cell?: (row: T) => React.ReactNode;
}

interface PrintableTableProps<T> {
  title: string;
  columns: Column<T>[];
  data: T[];
  keyField: keyof T;
}

function PrintableTable<T>({
  title,
  columns,
  data,
  keyField,
}: PrintableTableProps<T>) {
  return (
    <div className="p-8">
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold">{title}</h1>
        <p className="text-gray-600 mt-2">
          Tanggal: {format(new Date(), 'dd MMMM yyyy', { locale: id })}
        </p>
      </div>

      <table className="w-full border-collapse border border-gray-300">
        <thead>
          <tr className="bg-gray-100">
            {columns.map((column, index) => (
              <th
                key={index}
                className="border border-gray-300 px-4 py-2 text-left text-sm font-medium text-gray-700"
              >
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row) => (
            <tr key={String(row[keyField])}>
              {columns.map((column, colIndex) => (
                <td
                  key={colIndex}
                  className="border border-gray-300 px-4 py-2 text-sm text-gray-900"
                >
                  {column.cell
                    ? column.cell(row)
                    : typeof column.accessor === 'function'
                    ? column.accessor(row)
                    : String(row[column.accessor] ?? '-')}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>

      <div className="text-center text-sm text-gray-500 mt-8">
        © {new Date().getFullYear()} Sistem Pengelolaan Zakat
      </div>
    </div>
  );
}

export default PrintableTable;