import React, { useState } from 'react';
import { ChevronUp, ChevronDown, Search } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Column<T> {
  header: string;
  accessor: keyof T | ((row: T) => React.ReactNode);
  sortable?: boolean;
  cell?: (row: T) => React.ReactNode;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  keyField: keyof T;
  onRowClick?: (row: T) => void;
  searchable?: boolean;
  emptyMessage?: string;
  isLoading?: boolean;
}

function DataTable<T>({
  columns,
  data,
  keyField,
  onRowClick,
  searchable = true,
  emptyMessage = 'No data available',
  isLoading = false,
}: DataTableProps<T>) {
  const [sortConfig, setSortConfig] = useState<{
    key: keyof T | null;
    direction: 'asc' | 'desc';
  }>({ key: null, direction: 'asc' });
  
  const [searchQuery, setSearchQuery] = useState('');
  
  const handleSort = (column: Column<T>) => {
    if (!column.sortable || typeof column.accessor !== 'string') return;
    
    const accessor = column.accessor as keyof T;
    
    setSortConfig({
      key: sortConfig.key === accessor && sortConfig.direction === 'asc'
        ? accessor
        : accessor,
      direction: sortConfig.key === accessor && sortConfig.direction === 'asc'
        ? 'desc'
        : 'asc',
    });
  };
  
  const sortedData = React.useMemo(() => {
    if (!sortConfig.key) return [...data];
    
    const sorted = [...data].sort((a, b) => {
      const aValue = a[sortConfig.key as keyof T];
      const bValue = b[sortConfig.key as keyof T];
      
      if (aValue === bValue) return 0;
      
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortConfig.direction === 'asc'
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }
      
      if (aValue === null || aValue === undefined) return 1;
      if (bValue === null || bValue === undefined) return -1;
      
      return sortConfig.direction === 'asc'
        ? aValue < bValue ? -1 : 1
        : aValue < bValue ? 1 : -1;
    });
    
    return sorted;
  }, [data, sortConfig]);
  
  const filteredData = React.useMemo(() => {
    if (!searchQuery) return sortedData;
    
    return sortedData.filter((row) => {
      return columns.some((column) => {
        if (typeof column.accessor === 'function') return false;
        
        const value = row[column.accessor as keyof T];
        if (value === null || value === undefined) return false;
        
        return String(value).toLowerCase().includes(searchQuery.toLowerCase());
      });
    });
  }, [sortedData, searchQuery, columns]);
  
  const getSortIcon = (column: Column<T>) => {
    if (!column.sortable || typeof column.accessor !== 'string') return null;
    
    const accessor = column.accessor as keyof T;
    
    if (sortConfig.key !== accessor) {
      return <ChevronUp className="w-4 h-4 text-gray-400 opacity-0 group-hover:opacity-100" />;
    }
    
    return sortConfig.direction === 'asc'
      ? <ChevronUp className="w-4 h-4 text-primary-500" />
      : <ChevronDown className="w-4 h-4 text-primary-500" />;
  };
  
  return (
    <div className="w-full overflow-hidden bg-white rounded-lg shadow-sm">
      {searchable && (
        <div className="p-4 border-b border-gray-200">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <Search className="w-5 h-5 text-gray-400" />
            </div>
            <motion.input
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              type="text"
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      )}
      
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {columns.map((column, index) => (
                <th
                  key={index}
                  className={`px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${
                    column.sortable && typeof column.accessor === 'string'
                      ? 'cursor-pointer group hover:bg-gray-100'
                      : ''
                  }`}
                  onClick={() => handleSort(column)}
                >
                  <div className="flex items-center space-x-1">
                    <span>{column.header}</span>
                    {getSortIcon(column)}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            <AnimatePresence>
              {isLoading ? (
                <motion.tr
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <td colSpan={columns.length} className="px-6 py-4 text-center text-sm text-gray-500">
                    <div className="flex justify-center">
                      <svg className="animate-spin h-5 w-5 text-primary-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                    </div>
                  </td>
                </motion.tr>
              ) : filteredData.length === 0 ? (
                <motion.tr
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <td colSpan={columns.length} className="px-6 py-4 text-center text-sm text-gray-500">
                    {emptyMessage}
                  </td>
                </motion.tr>
              ) : (
                filteredData.map((row, rowIndex) => (
                  <motion.tr
                    key={String(row[keyField])}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.2, delay: rowIndex * 0.05 }}
                    className={onRowClick ? 'cursor-pointer hover:bg-gray-50' : ''}
                    onClick={() => onRowClick && onRowClick(row)}
                  >
                    {columns.map((column, colIndex) => (
                      <td key={colIndex} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {column.cell
                          ? column.cell(row)
                          : typeof column.accessor === 'function'
                          ? column.accessor(row)
                          : String(row[column.accessor] ?? '')}
                      </td>
                    ))}
                  </motion.tr>
                ))
              )}
            </AnimatePresence>
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default DataTable;