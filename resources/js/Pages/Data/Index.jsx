import { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { Card, DropZone, EmptyState } from '@/Components/UI';
import { FilePreviewModal } from '@/Components/Data';

export default function DataIndex({ files: initialFiles = [] }) {
    const [files, setFiles] = useState(initialFiles);
    const [selectedFile, setSelectedFile] = useState(null);
    const [showPreview, setShowPreview] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState(null);

    const handleFileDrop = async (file) => {
        setUploading(true);
        setError(null);

        const formData = new FormData();
        formData.append('file', file);

        try {
            const response = await fetch('/api/files', {
                method: 'POST',
                body: formData,
                headers: {
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.content,
                    'Accept': 'application/json',
                },
                credentials: 'same-origin',
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Upload failed');
            }

            // Add the new file to the list
            setFiles([data.file, ...files]);
        } catch (err) {
            console.error('Upload error:', err);
            setError(err.message || 'Failed to upload file');
        } finally {
            setUploading(false);
        }
    };

    const handleFileClick = async (file) => {
        setSelectedFile(file);
        setShowPreview(true);

        // Fetch full file details with preview data
        try {
            const response = await fetch(`/api/files/${file.id}`, {
                headers: {
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.content,
                },
                credentials: 'same-origin',
            });

            if (response.ok) {
                const data = await response.json();
                setSelectedFile({
                    ...data.file,
                    preview_data: data.preview,
                });
            }
        } catch (err) {
            console.error('Failed to fetch file details:', err);
        }
    };

    const handleClosePreview = () => {
        setShowPreview(false);
        setSelectedFile(null);
    };

    const handleDeleteFile = async (file) => {
        if (!confirm(`Are you sure you want to delete "${file.name}"?`)) {
            return;
        }

        try {
            const response = await fetch(`/api/files/${file.id}`, {
                method: 'DELETE',
                headers: {
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.content,
                },
                credentials: 'same-origin',
            });

            if (!response.ok) {
                throw new Error('Delete failed');
            }

            setFiles(files.filter(f => f.id !== file.id));
            
            if (selectedFile?.id === file.id) {
                handleClosePreview();
            }
        } catch (err) {
            console.error('Delete error:', err);
            setError('Failed to delete file');
        }
    };

    const handleRunAnalysis = (file) => {
        router.visit(`/playground?file=${file.id}`);
    };

    const formatFileSize = (bytes) => {
        if (!bytes) return '0 B';
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    };

    return (
        <AppLayout title="Data">
            <Head title="Data" />

            <div className="max-w-6xl">
                {/* Error message */}
                {error && (
                    <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-soft text-red-700">
                        {error}
                        <button 
                            onClick={() => setError(null)}
                            className="ml-2 text-red-500 hover:text-red-700"
                        >
                            ✕
                        </button>
                    </div>
                )}

                {/* Upload zone */}
                <div className="mb-8">
                    <DropZone
                        onFileDrop={handleFileDrop}
                        disabled={uploading}
                    />
                    {uploading && (
                        <div className="mt-3 flex items-center justify-center gap-2 text-paper-500">
                            <LoadingSpinner />
                            <span>Uploading and processing file...</span>
                        </div>
                    )}
                </div>

                {/* Files list */}
                <div>
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="font-display font-semibold text-lg text-paper-800">
                            Your files
                        </h2>
                        {files.length > 0 && (
                            <span className="text-sm text-paper-400">
                                {files.length} file{files.length !== 1 ? 's' : ''}
                            </span>
                        )}
                    </div>

                    {files.length === 0 ? (
                        <Card className="py-8">
                            <EmptyState
                                illustration="data"
                                title="No data files yet"
                                description="Drop a CSV file above to get started. Your data stays private and secure."
                            />
                        </Card>
                    ) : (
                        <div className="space-y-2">
                            {files.map((file) => (
                                <FileRow
                                    key={file.id}
                                    file={file}
                                    formatFileSize={formatFileSize}
                                    onClick={() => handleFileClick(file)}
                                    onDelete={() => handleDeleteFile(file)}
                                    onRun={() => handleRunAnalysis(file)}
                                />
                            ))}
                        </div>
                    )}
                </div>

                {/* Info card */}
                <Card variant="outlined" className="mt-8 bg-paper-50">
                    <div className="flex items-start gap-4">
                        <div className="w-10 h-10 bg-calm-100 rounded-full flex items-center justify-center flex-shrink-0">
                            <LockIcon className="w-5 h-5 text-calm-600" />
                        </div>
                        <div>
                            <h3 className="font-display font-semibold text-paper-800 mb-1">
                                Your data is yours
                            </h3>
                            <p className="text-paper-600 text-sm">
                                Files are stored securely and only accessible to you. We never share or
                                look at your data. You can delete files anytime.
                            </p>
                        </div>
                    </div>
                </Card>
            </div>

            {/* Preview Modal */}
            <FilePreviewModal
                isOpen={showPreview}
                onClose={handleClosePreview}
                file={selectedFile}
                onDelete={handleDeleteFile}
                onRunAnalysis={handleRunAnalysis}
            />
        </AppLayout>
    );
}

function FileRow({ file, formatFileSize, onClick, onDelete, onRun }) {
    return (
        <Card
            variant="interactive"
            padding="sm"
            className="group cursor-pointer"
            onClick={onClick}
        >
            <div className="flex items-center gap-4">
                {/* File icon */}
                <div className="w-10 h-10 bg-calm-100 rounded-soft flex items-center justify-center flex-shrink-0">
                    <FileIcon className="w-5 h-5 text-calm-600" />
                </div>

                {/* File info */}
                <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-paper-900 truncate group-hover:text-punch-600 transition-colors">
                        {file.name}
                    </h3>
                    <p className="text-paper-400 text-sm">
                        {file.formatted_size || formatFileSize(file.size)}
                        {file.row_count && ` • ${file.row_count.toLocaleString()} rows`}
                        {file.column_count && ` • ${file.column_count} cols`}
                    </p>
                </div>

                {/* Actions */}
                <div
                    className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={(e) => e.stopPropagation()}
                >
                    <button
                        onClick={onRun}
                        className="p-2 hover:bg-calm-50 rounded-soft transition-colors"
                        title="Run analysis"
                    >
                        <PlayIcon className="w-4 h-4 text-calm-500" />
                    </button>
                    <button
                        onClick={onDelete}
                        className="p-2 hover:bg-red-50 rounded-soft transition-colors"
                        title="Delete file"
                    >
                        <TrashIcon className="w-4 h-4 text-paper-400 hover:text-red-500" />
                    </button>
                </div>

                {/* View indicator */}
                <span className="text-punch-500 text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                    View →
                </span>
            </div>
        </Card>
    );
}

function LoadingSpinner() {
    return (
        <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
            <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
            />
            <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
        </svg>
    );
}

// Icons
function FileIcon({ className }) {
    return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
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

function TrashIcon({ className }) {
    return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
        </svg>
    );
}

function LockIcon({ className }) {
    return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
        </svg>
    );
}
