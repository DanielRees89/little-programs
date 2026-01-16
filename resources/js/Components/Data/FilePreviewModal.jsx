import { useState, useEffect } from 'react';
import { Button, Modal } from '@/Components/UI';

export default function FilePreviewModal({ isOpen, onClose, file, onDelete, onRunAnalysis }) {
    const [activeTab, setActiveTab] = useState('preview');
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    // Reset tab when modal opens
    useEffect(() => {
        if (isOpen) {
            setActiveTab('preview');
            setShowDeleteConfirm(false);
        }
    }, [isOpen]);

    if (!file) return null;

    const handleDelete = () => {
        onDelete(file);
        setShowDeleteConfirm(false);
        onClose();
    };

    // Get columns from columns_metadata or preview headers
    const columns = file.columns_metadata || file.columns || [];

    return (
        <Modal isOpen={isOpen} onClose={onClose} size="xl">
            <Modal.Header onClose={onClose}>
                <div className="flex items-center gap-3">
                    <Modal.Icon variant="calm">
                        <FileIcon className="w-5 h-5 text-calm-600" />
                    </Modal.Icon>
                    <div className="flex-1 min-w-0">
                        <Modal.Title>{file.name}</Modal.Title>
                        <Modal.Description>
                            {file.formatted_size || formatFileSize(file.size)} • {file.row_count || '?'} rows • {file.column_count || '?'} columns
                        </Modal.Description>
                    </div>
                </div>
            </Modal.Header>

            {/* Tabs */}
            <div className="border-b border-paper-200 px-5">
                <div className="flex gap-6">
                    <TabButton
                        active={activeTab === 'preview'}
                        onClick={() => setActiveTab('preview')}
                    >
                        Preview
                    </TabButton>
                    <TabButton
                        active={activeTab === 'columns'}
                        onClick={() => setActiveTab('columns')}
                    >
                        Columns
                    </TabButton>
                    <TabButton
                        active={activeTab === 'info'}
                        onClick={() => setActiveTab('info')}
                    >
                        Info
                    </TabButton>
                </div>
            </div>

            <Modal.Body>
                {/* Preview Tab */}
                {activeTab === 'preview' && (
                    <div className="overflow-x-auto">
                        {file.preview_data ? (
                            <DataTable previewData={file.preview_data} />
                        ) : (
                            <div className="text-center py-12 text-paper-500">
                                <TableIcon className="w-12 h-12 mx-auto mb-3 text-paper-300" />
                                <p>Loading preview...</p>
                            </div>
                        )}
                    </div>
                )}

                {/* Columns Tab */}
                {activeTab === 'columns' && (
                    <div className="space-y-2">
                        {columns.length > 0 ? (
                            columns.map((column, index) => (
                                <div
                                    key={index}
                                    className="flex items-center justify-between p-3 bg-paper-50 rounded-soft"
                                >
                                    <div className="flex items-center gap-3">
                                        <span className="w-6 h-6 bg-paper-200 rounded text-xs font-mono flex items-center justify-center text-paper-500">
                                            {index + 1}
                                        </span>
                                        <span className="font-medium text-paper-800">{column.name}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="px-2 py-1 bg-paper-200 text-paper-600 text-xs font-mono rounded">
                                            {column.type || 'unknown'}
                                        </span>
                                        {column.sample_values && column.sample_values.length > 0 && (
                                            <span className="text-xs text-paper-400">
                                                e.g. {column.sample_values.slice(0, 2).join(', ')}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="text-center py-12 text-paper-500">
                                <p>Column information not available</p>
                            </div>
                        )}
                    </div>
                )}

                {/* Info Tab */}
                {activeTab === 'info' && (
                    <div className="space-y-4">
                        <InfoRow label="File name" value={file.name} />
                        <InfoRow label="File size" value={file.formatted_size || formatFileSize(file.size)} />
                        <InfoRow label="Rows" value={file.row_count?.toLocaleString() || 'Unknown'} />
                        <InfoRow label="Columns" value={file.column_count?.toString() || 'Unknown'} />
                        <InfoRow label="Uploaded" value={formatDate(file.created_at)} />
                        {file.updated_at && file.updated_at !== file.created_at && (
                            <InfoRow label="Last modified" value={formatDate(file.updated_at)} />
                        )}
                    </div>
                )}

                {/* Delete confirmation */}
                {showDeleteConfirm && (
                    <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-card">
                        <p className="text-red-700 text-sm mb-3">
                            Are you sure you want to delete <strong>{file.name}</strong>? This cannot be undone.
                        </p>
                        <div className="flex gap-2">
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setShowDeleteConfirm(false)}
                            >
                                Cancel
                            </Button>
                            <Button
                                size="sm"
                                onClick={handleDelete}
                                className="bg-red-600 hover:bg-red-700"
                            >
                                Yes, delete it
                            </Button>
                        </div>
                    </div>
                )}
            </Modal.Body>

            <Modal.Footer>
                <div className="flex items-center justify-between w-full">
                    <Button
                        variant="ghost"
                        onClick={() => setShowDeleteConfirm(true)}
                        className="text-red-600 hover:bg-red-50 hover:text-red-700"
                    >
                        <TrashIcon className="w-4 h-4" />
                        Delete
                    </Button>
                    <div className="flex gap-2">
                        <Button variant="secondary" onClick={onClose}>
                            Close
                        </Button>
                        {onRunAnalysis && (
                            <Button onClick={() => onRunAnalysis(file)}>
                                <PlayIcon className="w-4 h-4" />
                                Run Analysis
                            </Button>
                        )}
                    </div>
                </div>
            </Modal.Footer>
        </Modal>
    );
}

// Tab button component
function TabButton({ children, active, onClick }) {
    return (
        <button
            onClick={onClick}
            className={`
                py-3 text-sm font-medium border-b-2 transition-colors
                ${active
                    ? 'border-punch-500 text-punch-600'
                    : 'border-transparent text-paper-500 hover:text-paper-700'
                }
            `}
        >
            {children}
        </button>
    );
}

// Data table component - handles API response format
function DataTable({ previewData }) {
    // Handle the API format: { headers: [...], rows: [[...], [...]] }
    if (!previewData) {
        return (
            <div className="text-center py-8 text-paper-500">
                No data to display
            </div>
        );
    }

    const { headers, rows } = previewData;

    if (!headers || headers.length === 0 || !rows || rows.length === 0) {
        return (
            <div className="text-center py-8 text-paper-500">
                No data to display
            </div>
        );
    }

    return (
        <table className="w-full text-sm">
            <thead>
                <tr className="border-b border-paper-200">
                    {headers.map((header, index) => (
                        <th
                            key={index}
                            className="px-3 py-2 text-left font-display font-semibold text-paper-700 bg-paper-50 whitespace-nowrap"
                        >
                            {header}
                        </th>
                    ))}
                </tr>
            </thead>
            <tbody>
                {rows.map((row, rowIndex) => (
                    <tr
                        key={rowIndex}
                        className="border-b border-paper-100 hover:bg-paper-50"
                    >
                        {row.map((cell, cellIndex) => (
                            <td
                                key={cellIndex}
                                className="px-3 py-2 text-paper-600 font-mono text-xs whitespace-nowrap max-w-xs truncate"
                                title={cell?.toString() || ''}
                            >
                                {cell?.toString() || '—'}
                            </td>
                        ))}
                    </tr>
                ))}
            </tbody>
        </table>
    );
}

// Info row component
function InfoRow({ label, value }) {
    return (
        <div className="flex items-center justify-between py-2 border-b border-paper-100">
            <span className="text-paper-500">{label}</span>
            <span className="font-medium text-paper-800">{value}</span>
        </div>
    );
}

// Utility functions
function formatFileSize(bytes) {
    if (!bytes) return '0 B';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

function formatDate(dateString) {
    if (!dateString) return 'Unknown';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit'
    });
}

// Icons
function FileIcon({ className }) {
    return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
        </svg>
    );
}

function TableIcon({ className }) {
    return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.375 19.5h17.25m-17.25 0a1.125 1.125 0 01-1.125-1.125M3.375 19.5h7.5c.621 0 1.125-.504 1.125-1.125m-9.75 0V5.625m0 12.75v-1.5c0-.621.504-1.125 1.125-1.125m18.375 2.625V5.625m0 12.75c0 .621-.504 1.125-1.125 1.125m1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125m0 3.75h-7.5A1.125 1.125 0 0112 18.375m9.75-12.75c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125m19.5 0v1.5c0 .621-.504 1.125-1.125 1.125M2.25 5.625v1.5c0 .621.504 1.125 1.125 1.125m0 0h17.25m-17.25 0h7.5c.621 0 1.125.504 1.125 1.125M3.375 8.25c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125m17.25-3.75h-7.5c-.621 0-1.125.504-1.125 1.125m8.625-1.125c.621 0 1.125.504 1.125 1.125v1.5c0 .621-.504 1.125-1.125 1.125" />
        </svg>
    );
}

function TrashIcon({ className }) {
    return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
        </svg>
    );
}

function PlayIcon({ className }) {
    return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.348a1.125 1.125 0 010 1.971l-11.54 6.347a1.125 1.125 0 01-1.667-.985V5.653z" />
        </svg>
    );
}
