import { useState, useMemo } from 'react';

export function DataTable({
    data,
    columns,
    title,
    subtitle,
    pageSize = 10,
    sortable = true,
    filterable = false,
    striped = true,
    className = '',
}) {
    const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
    const [filterText, setFilterText] = useState('');
    const [currentPage, setCurrentPage] = useState(1);

    // Auto-detect columns if not provided
    const tableColumns = useMemo(() => {
        if (columns) return columns;
        if (data.length === 0) return [];
        return Object.keys(data[0]).map(key => ({
            key,
            label: key.charAt(0).toUpperCase() + key.slice(1).replace(/_/g, ' '),
        }));
    }, [columns, data]);

    // Filter data
    const filteredData = useMemo(() => {
        if (!filterText) return data;
        const lowerFilter = filterText.toLowerCase();
        return data.filter(row =>
            tableColumns.some(col => {
                const value = row[col.key];
                return value?.toString().toLowerCase().includes(lowerFilter);
            })
        );
    }, [data, filterText, tableColumns]);

    // Sort data
    const sortedData = useMemo(() => {
        if (!sortConfig.key) return filteredData;
        
        return [...filteredData].sort((a, b) => {
            const aVal = a[sortConfig.key];
            const bVal = b[sortConfig.key];
            
            if (aVal === bVal) return 0;
            if (aVal === null || aVal === undefined) return 1;
            if (bVal === null || bVal === undefined) return -1;

            const comparison = typeof aVal === 'number' 
                ? aVal - bVal 
                : String(aVal).localeCompare(String(bVal));
            
            return sortConfig.direction === 'asc' ? comparison : -comparison;
        });
    }, [filteredData, sortConfig]);

    // Paginate data
    const paginatedData = useMemo(() => {
        const start = (currentPage - 1) * pageSize;
        return sortedData.slice(start, start + pageSize);
    }, [sortedData, currentPage, pageSize]);

    const totalPages = Math.ceil(sortedData.length / pageSize);

    const handleSort = (key) => {
        if (!sortable) return;
        setSortConfig(prev => ({
            key,
            direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc',
        }));
    };

    const formatCellValue = (value, column) => {
        if (value === null || value === undefined) return '—';
        if (column.format) return column.format(value);
        if (typeof value === 'number') {
            return column.type === 'currency' 
                ? `$${value.toLocaleString()}` 
                : value.toLocaleString();
        }
        return String(value);
    };

    return (
        <div className={`bg-white rounded-card border border-paper-200 overflow-hidden ${className}`}>
            {/* Header */}
            {(title || subtitle || filterable) && (
                <div className="px-5 py-4 border-b border-paper-200">
                    <div className="flex items-center justify-between gap-4">
                        <div>
                            {title && (
                                <h3 className="font-display font-semibold text-paper-900">{title}</h3>
                            )}
                            {subtitle && (
                                <p className="text-paper-500 text-sm">{subtitle}</p>
                            )}
                        </div>
                        {filterable && (
                            <div className="relative">
                                <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-paper-400" />
                                <input
                                    type="text"
                                    placeholder="Search..."
                                    value={filterText}
                                    onChange={(e) => {
                                        setFilterText(e.target.value);
                                        setCurrentPage(1);
                                    }}
                                    className="pl-9 pr-4 py-2 border border-paper-200 rounded-soft text-sm focus:outline-none focus:border-punch-500"
                                />
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Table */}
            <div className="overflow-x-auto">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="bg-paper-50 border-b border-paper-200">
                            {tableColumns.map((column) => (
                                <th
                                    key={column.key}
                                    onClick={() => handleSort(column.key)}
                                    className={`
                                        px-4 py-3 text-left font-display font-semibold text-paper-700
                                        ${sortable ? 'cursor-pointer hover:bg-paper-100 select-none' : ''}
                                        ${column.align === 'right' ? 'text-right' : ''}
                                        ${column.align === 'center' ? 'text-center' : ''}
                                    `}
                                >
                                    <div className="flex items-center gap-1">
                                        <span>{column.label}</span>
                                        {sortable && sortConfig.key === column.key && (
                                            <SortIcon direction={sortConfig.direction} />
                                        )}
                                    </div>
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {paginatedData.length === 0 ? (
                            <tr>
                                <td 
                                    colSpan={tableColumns.length} 
                                    className="px-4 py-12 text-center text-paper-500"
                                >
                                    {filterText ? 'No matching results' : 'No data available'}
                                </td>
                            </tr>
                        ) : (
                            paginatedData.map((row, rowIndex) => (
                                <tr
                                    key={rowIndex}
                                    className={`
                                        border-b border-paper-100 hover:bg-paper-50
                                        ${striped && rowIndex % 2 === 1 ? 'bg-paper-50/50' : ''}
                                    `}
                                >
                                    {tableColumns.map((column) => (
                                        <td
                                            key={column.key}
                                            className={`
                                                px-4 py-3 text-paper-700
                                                ${column.align === 'right' ? 'text-right' : ''}
                                                ${column.align === 'center' ? 'text-center' : ''}
                                                ${column.mono ? 'font-mono text-xs' : ''}
                                            `}
                                        >
                                            {formatCellValue(row[column.key], column)}
                                        </td>
                                    ))}
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="px-5 py-3 border-t border-paper-200 flex items-center justify-between">
                    <p className="text-paper-500 text-sm">
                        Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, sortedData.length)} of {sortedData.length} results
                    </p>
                    <div className="flex items-center gap-1">
                        <PaginationButton
                            onClick={() => setCurrentPage(1)}
                            disabled={currentPage === 1}
                        >
                            <ChevronsLeftIcon className="w-4 h-4" />
                        </PaginationButton>
                        <PaginationButton
                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                            disabled={currentPage === 1}
                        >
                            <ChevronLeftIcon className="w-4 h-4" />
                        </PaginationButton>
                        
                        <span className="px-3 py-1 text-sm text-paper-600">
                            Page {currentPage} of {totalPages}
                        </span>
                        
                        <PaginationButton
                            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                            disabled={currentPage === totalPages}
                        >
                            <ChevronRightIcon className="w-4 h-4" />
                        </PaginationButton>
                        <PaginationButton
                            onClick={() => setCurrentPage(totalPages)}
                            disabled={currentPage === totalPages}
                        >
                            <ChevronsRightIcon className="w-4 h-4" />
                        </PaginationButton>
                    </div>
                </div>
            )}
        </div>
    );
}

// Compact table for smaller displays
export function DataTableCompact({ data, columns, className = '' }) {
    const tableColumns = columns || Object.keys(data[0] || {}).map(key => ({
        key,
        label: key.charAt(0).toUpperCase() + key.slice(1).replace(/_/g, ' '),
    }));

    return (
        <div className={`overflow-x-auto ${className}`}>
            <table className="w-full text-sm">
                <thead>
                    <tr className="border-b border-paper-200">
                        {tableColumns.map((column) => (
                            <th
                                key={column.key}
                                className="px-3 py-2 text-left font-medium text-paper-600 bg-paper-50"
                            >
                                {column.label}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {data.map((row, rowIndex) => (
                        <tr key={rowIndex} className="border-b border-paper-100 hover:bg-paper-50">
                            {tableColumns.map((column) => (
                                <td key={column.key} className="px-3 py-2 text-paper-700">
                                    {row[column.key]?.toString() || '—'}
                                </td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

// Pagination button component
function PaginationButton({ children, onClick, disabled }) {
    return (
        <button
            onClick={onClick}
            disabled={disabled}
            className={`
                p-1.5 rounded-soft transition-colors
                ${disabled 
                    ? 'text-paper-300 cursor-not-allowed' 
                    : 'text-paper-500 hover:bg-paper-100 hover:text-paper-700'
                }
            `}
        >
            {children}
        </button>
    );
}

// Icons
function SearchIcon({ className }) {
    return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
    );
}

function SortIcon({ direction }) {
    return (
        <svg className="w-4 h-4 text-paper-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            {direction === 'asc' ? (
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
            ) : (
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            )}
        </svg>
    );
}

function ChevronLeftIcon({ className }) {
    return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
    );
}

function ChevronRightIcon({ className }) {
    return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
    );
}

function ChevronsLeftIcon({ className }) {
    return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
        </svg>
    );
}

function ChevronsRightIcon({ className }) {
    return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 5l7 7-7 7M5 5l7 7-7 7" />
        </svg>
    );
}
