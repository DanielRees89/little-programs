import { useState } from 'react';

/**
 * ResultsPanel - Right panel showing generated files and outputs
 */
export default function ResultsPanel({ 
    results, 
    isVisible, 
    onClose,
}) {
    const [activeTab, setActiveTab] = useState('files');
    
    const allCharts = [];
    const allFiles = [];
    let lastOutput = '';
    
    if (results && results.length > 0) {
        results.forEach((result) => {
            if (result.success) {
                if (result.charts) {
                    result.charts.forEach(chart => {
                        allCharts.push(chart);
                    });
                }
                if (result.files) {
                    result.files.forEach(file => {
                        allFiles.push(file);
                    });
                }
                if (result.output) {
                    lastOutput = result.output;
                }
            }
        });
    }

    const hasContent = allCharts.length > 0 || allFiles.length > 0 || lastOutput;

    if (!isVisible) return null;

    return (
        <div className="flex flex-col h-full bg-white border-l border-paper-200">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-paper-200 bg-paper-50">
                <div className="flex items-center gap-2">
                    <ChartIcon className="w-5 h-5 text-punch-500" />
                    <h2 className="font-semibold text-paper-800">Results</h2>
                    {(allCharts.length > 0 || allFiles.length > 0) && (
                        <span className="px-2 py-0.5 bg-punch-100 text-punch-700 text-xs rounded-full">
                            {allCharts.length + allFiles.length}
                        </span>
                    )}
                </div>
                <button onClick={onClose} className="p-1.5 hover:bg-paper-200 rounded-lg">
                    <XIcon className="w-5 h-5 text-paper-500" />
                </button>
            </div>

            {/* Tabs */}
            {hasContent && (
                <div className="flex border-b border-paper-200">
                    <button
                        onClick={() => setActiveTab('files')}
                        className={`flex-1 px-4 py-2.5 text-sm font-medium ${
                            activeTab === 'files'
                                ? 'text-punch-600 border-b-2 border-punch-500 bg-punch-50/50'
                                : 'text-paper-500 hover:bg-paper-50'
                        }`}
                    >
                        Files ({allCharts.length + allFiles.length})
                    </button>
                    <button
                        onClick={() => setActiveTab('output')}
                        className={`flex-1 px-4 py-2.5 text-sm font-medium ${
                            activeTab === 'output'
                                ? 'text-punch-600 border-b-2 border-punch-500 bg-punch-50/50'
                                : 'text-paper-500 hover:bg-paper-50'
                        }`}
                    >
                        Output
                    </button>
                </div>
            )}

            {/* Content */}
            <div className="flex-1 overflow-auto p-4">
                {!hasContent ? (
                    <EmptyState />
                ) : activeTab === 'files' ? (
                    <FilesTab charts={allCharts} files={allFiles} />
                ) : (
                    <OutputTab output={lastOutput} />
                )}
            </div>
        </div>
    );
}

function EmptyState() {
    return (
        <div className="flex flex-col items-center justify-center h-full text-center py-12">
            <div className="w-16 h-16 bg-paper-100 rounded-2xl flex items-center justify-center mb-4">
                <ChartIcon className="w-8 h-8 text-paper-300" />
            </div>
            <h3 className="text-paper-600 font-medium mb-1">No results yet</h3>
            <p className="text-paper-400 text-sm">Generated files will appear here</p>
        </div>
    );
}

function FilesTab({ charts, files }) {
    const allItems = [
        ...charts.map(c => ({ ...c, category: 'chart' })),
        ...files.map(f => ({ ...f, category: 'file' })),
    ];

    if (allItems.length === 0) return <EmptyState />;

    return (
        <div className="space-y-3">
            {allItems.map((item, index) => (
                <FileCard key={index} item={item} />
            ))}
        </div>
    );
}

function FileCard({ item }) {
    const [previewOpen, setPreviewOpen] = useState(false);
    const [imageError, setImageError] = useState(false);
    
    const fileType = item.type?.toLowerCase() || '';
    const isImage = ['png', 'jpg', 'jpeg', 'gif', 'svg'].includes(fileType);
    const isExcel = ['xlsx', 'xls', 'csv'].includes(fileType);
    const isPdf = fileType === 'pdf';

    // Use URLs provided by the backend
    const previewUrl = item.preview_url || null;
    const downloadUrl = item.download_url || null;

    const getIcon = () => {
        if (isImage) return <ImageIcon className="w-5 h-5" />;
        if (isExcel) return <TableIcon className="w-5 h-5" />;
        if (isPdf) return <DocumentIcon className="w-5 h-5" />;
        return <FileIcon className="w-5 h-5" />;
    };

    const getTypeLabel = () => {
        if (isImage) return 'Chart';
        if (isExcel) return 'Spreadsheet';
        if (isPdf) return 'PDF';
        return fileType.toUpperCase() || 'File';
    };

    const getBadgeColor = () => {
        if (isImage) return 'bg-blue-100 text-blue-700';
        if (isExcel) return 'bg-green-100 text-green-700';
        if (isPdf) return 'bg-red-100 text-red-700';
        return 'bg-paper-100 text-paper-700';
    };

    const getIconBg = () => {
        if (isImage) return 'bg-blue-50 text-blue-500';
        if (isExcel) return 'bg-green-50 text-green-500';
        if (isPdf) return 'bg-red-50 text-red-500';
        return 'bg-paper-100 text-paper-500';
    };

    return (
        <div className="border border-paper-200 rounded-lg overflow-hidden bg-white hover:border-paper-300 transition-colors">
            {/* Image preview */}
            {isImage && previewOpen && previewUrl && !imageError && (
                <div className="bg-paper-100 p-4 border-b border-paper-200">
                    <img 
                        src={previewUrl} 
                        alt={item.filename}
                        className="max-w-full h-auto rounded shadow-sm mx-auto"
                        style={{ maxHeight: '300px' }}
                        onError={() => setImageError(true)}
                    />
                </div>
            )}
            
            {isImage && previewOpen && imageError && (
                <div className="bg-paper-100 p-4 border-b border-paper-200 text-center text-paper-500 text-sm">
                    Unable to load preview
                </div>
            )}

            {/* File info row */}
            <div className="p-3 flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${getIconBg()}`}>
                    {getIcon()}
                </div>

                <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-paper-800 truncate">
                        {item.filename}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                        <span className={`text-xs px-1.5 py-0.5 rounded ${getBadgeColor()}`}>
                            {getTypeLabel()}
                        </span>
                        {item.size && (
                            <span className="text-xs text-paper-400">
                                {formatFileSize(item.size)}
                            </span>
                        )}
                    </div>
                </div>

                {/* Action buttons */}
                <div className="flex items-center gap-1">
                    {isImage && previewUrl && (
                        <button
                            onClick={() => {
                                setPreviewOpen(!previewOpen);
                                setImageError(false);
                            }}
                            className="p-2 hover:bg-paper-100 rounded-lg transition-colors"
                            title={previewOpen ? 'Hide' : 'Preview'}
                        >
                            <EyeIcon className={`w-4 h-4 ${previewOpen ? 'text-punch-500' : 'text-paper-400'}`} />
                        </button>
                    )}
                    {isPdf && previewUrl && (
                        <a
                            href={previewUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 hover:bg-paper-100 rounded-lg transition-colors"
                            title="View PDF"
                        >
                            <EyeIcon className="w-4 h-4 text-paper-400" />
                        </a>
                    )}
                    {downloadUrl && (
                        <a
                            href={downloadUrl}
                            download={item.filename}
                            className="p-2 hover:bg-punch-50 rounded-lg transition-colors group"
                            title="Download"
                        >
                            <DownloadIcon className="w-4 h-4 text-paper-400 group-hover:text-punch-500" />
                        </a>
                    )}
                </div>
            </div>
        </div>
    );
}

function OutputTab({ output }) {
    const [copied, setCopied] = useState(false);

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(output);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (e) {
            console.error('Copy failed', e);
        }
    };

    if (!output) {
        return <div className="text-center py-8 text-paper-400">No output</div>;
    }

    return (
        <div>
            <div className="flex justify-end mb-2">
                <button
                    onClick={handleCopy}
                    className="text-xs text-paper-500 hover:text-paper-700 flex items-center gap-1"
                >
                    {copied ? '✓ Copied' : 'Copy'}
                </button>
            </div>
            <div className="bg-paper-900 rounded-lg p-4 overflow-auto max-h-[500px]">
                <pre className="text-sm font-mono text-paper-100 whitespace-pre-wrap break-words">
                    {output}
                </pre>
            </div>
        </div>
    );
}

function formatFileSize(bytes) {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// Icons
function ChartIcon({ className }) {
    return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
        </svg>
    );
}

function XIcon({ className }) {
    return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
    );
}

function ImageIcon({ className }) {
    return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
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

function DocumentIcon({ className }) {
    return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
        </svg>
    );
}

function FileIcon({ className }) {
    return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
        </svg>
    );
}

function EyeIcon({ className }) {
    return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
    );
}

function DownloadIcon({ className }) {
    return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
        </svg>
    );
}
