import { useState } from 'react';
import { CodeBlock } from '@/Components/UI';

/**
 * AgenticExecutionBlock - Shows a single script execution attempt
 * with downloadable/previewable generated files
 */
export default function AgenticExecutionBlock({ execution, index, isLatest = false }) {
    const [isExpanded, setIsExpanded] = useState(isLatest);
    const [previewImage, setPreviewImage] = useState(null);
    
    const success = execution?.success ?? false;
    const code = execution?.code || '';
    const output = execution?.output || '';
    const error = execution?.error || '';
    const charts = execution?.charts || [];
    const files = execution?.files || [];

    if (!execution) {
        return null;
    }

    const handlePreview = (url, filename) => {
        // For images, show inline preview
        if (filename.match(/\.(png|jpg|jpeg|gif|svg)$/i)) {
            setPreviewImage(url);
        } else if (filename.match(/\.pdf$/i)) {
            // Open PDF in new tab
            window.open(url, '_blank');
        } else {
            // For other files, just download
            window.open(url, '_blank');
        }
    };

    const handleDownload = (url, filename) => {
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    };

    return (
        <div className={`my-2 rounded-lg overflow-hidden border ${
            success ? 'border-green-200' : 'border-red-200'
        }`}>
            {/* Header */}
            <div
                className={`flex items-center justify-between px-3 py-2 cursor-pointer select-none ${
                    success ? 'bg-green-500' : 'bg-red-500'
                }`}
                onClick={() => setIsExpanded(!isExpanded)}
            >
                <div className="flex items-center gap-2 min-w-0 flex-1">
                    <ChevronIcon 
                        className={`w-4 h-4 text-white/80 transition-transform duration-200 ${
                            isExpanded ? 'rotate-90' : ''
                        }`}
                    />
                    
                    {success ? (
                        <CheckIcon className="w-4 h-4 text-white" />
                    ) : (
                        <XIcon className="w-4 h-4 text-white" />
                    )}
                    
                    <span className="text-xs font-semibold text-white uppercase tracking-wider">
                        Execution {index + 1} {success ? 'successful' : 'failed'}
                    </span>

                    {success && (charts.length > 0 || files.length > 0) && (
                        <span className="text-xs text-white/70 ml-2">
                            ({charts.length + files.length} file{charts.length + files.length > 1 ? 's' : ''} generated)
                        </span>
                    )}
                </div>
            </div>

            {/* Content */}
            {isExpanded && (
                <div className="bg-paper-50">
                    {/* Code */}
                    {code && (
                        <div className="border-b border-paper-200">
                            <div className="px-3 py-1.5 bg-paper-100 text-xs font-medium text-paper-600 flex items-center gap-1.5">
                                <CodeIcon className="w-3.5 h-3.5" />
                                Python Code
                            </div>
                            <div className="max-h-[300px] overflow-auto">
                                <CodeBlock code={code} language="python" showLineNumbers={false} maxHeight="300px" />
                            </div>
                        </div>
                    )}

                    {/* Output or Error */}
                    <div className="border-b border-paper-200">
                        <div className={`px-3 py-1.5 text-xs font-medium flex items-center gap-1.5 ${
                            success ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                        }`}>
                            {success ? (
                                <>
                                    <TerminalIcon className="w-3.5 h-3.5" />
                                    Output
                                </>
                            ) : (
                                <>
                                    <AlertIcon className="w-3.5 h-3.5" />
                                    Error
                                </>
                            )}
                        </div>
                        <div className="p-3 max-h-[200px] overflow-auto bg-white">
                            <pre className={`text-xs font-mono whitespace-pre-wrap break-words ${
                                success ? 'text-paper-600' : 'text-red-600'
                            }`}>
                                {success ? (output || '(No output)') : (error || 'Unknown error')}
                            </pre>
                        </div>
                    </div>

                    {/* Generated Charts - with previews */}
                    {success && charts.length > 0 && (
                        <div className="border-b border-paper-200">
                            <div className="px-3 py-1.5 bg-blue-50 text-xs font-medium text-blue-700 flex items-center gap-1.5">
                                <ChartIcon className="w-3.5 h-3.5" />
                                Generated Charts ({charts.length})
                            </div>
                            <div className="p-3 bg-white">
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                    {charts.map((chart, i) => (
                                        <div key={`chart-${i}`} className="border rounded-lg overflow-hidden bg-paper-50">
                                            {/* Chart preview */}
                                            {chart.preview_url && (
                                                <div 
                                                    className="aspect-video bg-paper-100 cursor-pointer hover:opacity-90 transition-opacity"
                                                    onClick={() => handlePreview(chart.preview_url, chart.filename)}
                                                >
                                                    <img 
                                                        src={chart.preview_url} 
                                                        alt={chart.filename}
                                                        className="w-full h-full object-contain"
                                                        onError={(e) => {
                                                            e.target.style.display = 'none';
                                                            e.target.parentElement.innerHTML = '<div class="flex items-center justify-center h-full text-paper-400 text-xs">Preview unavailable</div>';
                                                        }}
                                                    />
                                                </div>
                                            )}
                                            {/* Chart info and actions */}
                                            <div className="p-2">
                                                <div className="text-xs font-medium text-paper-700 truncate mb-1">
                                                    {chart.filename}
                                                </div>
                                                <div className="flex gap-1">
                                                    {chart.preview_url && (
                                                        <button
                                                            onClick={() => handlePreview(chart.preview_url, chart.filename)}
                                                            className="flex-1 text-xs px-2 py-1 bg-paper-100 hover:bg-paper-200 rounded text-paper-600 transition-colors"
                                                        >
                                                            View
                                                        </button>
                                                    )}
                                                    {chart.download_url && (
                                                        <button
                                                            onClick={() => handleDownload(chart.download_url, chart.filename)}
                                                            className="flex-1 text-xs px-2 py-1 bg-blue-100 hover:bg-blue-200 rounded text-blue-700 transition-colors"
                                                        >
                                                            Download
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Generated Files - with download buttons */}
                    {success && files.length > 0 && (
                        <div>
                            <div className="px-3 py-1.5 bg-purple-50 text-xs font-medium text-purple-700 flex items-center gap-1.5">
                                <FileIcon className="w-3.5 h-3.5" />
                                Generated Files ({files.length})
                            </div>
                            <div className="p-3 bg-white">
                                <div className="space-y-2">
                                    {files.map((file, i) => (
                                        <div 
                                            key={`file-${i}`} 
                                            className="flex items-center justify-between p-2 bg-paper-50 rounded-lg border border-paper-200"
                                        >
                                            <div className="flex items-center gap-2 min-w-0">
                                                <FileTypeIcon filename={file.filename} className="w-8 h-8 flex-shrink-0" />
                                                <div className="min-w-0">
                                                    <div className="text-sm font-medium text-paper-700 truncate">
                                                        {file.filename}
                                                    </div>
                                                    <div className="text-xs text-paper-500">
                                                        {file.type || 'Unknown type'}
                                                        {file.size && ` • ${formatFileSize(file.size)}`}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex gap-2 flex-shrink-0">
                                                {file.preview_url && file.filename.match(/\.pdf$/i) && (
                                                    <button
                                                        onClick={() => handlePreview(file.preview_url, file.filename)}
                                                        className="text-xs px-3 py-1.5 bg-paper-100 hover:bg-paper-200 rounded-md text-paper-600 transition-colors flex items-center gap-1"
                                                    >
                                                        <EyeIcon className="w-3.5 h-3.5" />
                                                        View
                                                    </button>
                                                )}
                                                {file.download_url && (
                                                    <button
                                                        onClick={() => handleDownload(file.download_url, file.filename)}
                                                        className="text-xs px-3 py-1.5 bg-purple-100 hover:bg-purple-200 rounded-md text-purple-700 transition-colors flex items-center gap-1"
                                                    >
                                                        <DownloadIcon className="w-3.5 h-3.5" />
                                                        Download
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Image preview modal */}
            {previewImage && (
                <div 
                    className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
                    onClick={() => setPreviewImage(null)}
                >
                    <div className="relative max-w-4xl max-h-[90vh]">
                        <img 
                            src={previewImage} 
                            alt="Preview" 
                            className="max-w-full max-h-[90vh] object-contain rounded-lg"
                        />
                        <button
                            onClick={() => setPreviewImage(null)}
                            className="absolute top-2 right-2 p-2 bg-black/50 hover:bg-black/70 rounded-full text-white transition-colors"
                        >
                            <XIcon className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

function formatFileSize(bytes) {
    if (!bytes) return '';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

function FileTypeIcon({ filename, className }) {
    const ext = filename?.split('.').pop()?.toLowerCase() || '';
    
    if (['pdf'].includes(ext)) {
        return (
            <div className={`${className} flex items-center justify-center bg-red-100 text-red-600 rounded`}>
                <span className="text-xs font-bold">PDF</span>
            </div>
        );
    }
    if (['xlsx', 'xls'].includes(ext)) {
        return (
            <div className={`${className} flex items-center justify-center bg-green-100 text-green-600 rounded`}>
                <span className="text-xs font-bold">XLS</span>
            </div>
        );
    }
    if (['csv'].includes(ext)) {
        return (
            <div className={`${className} flex items-center justify-center bg-blue-100 text-blue-600 rounded`}>
                <span className="text-xs font-bold">CSV</span>
            </div>
        );
    }
    if (['json'].includes(ext)) {
        return (
            <div className={`${className} flex items-center justify-center bg-yellow-100 text-yellow-600 rounded`}>
                <span className="text-xs font-bold">JSON</span>
            </div>
        );
    }
    return (
        <div className={`${className} flex items-center justify-center bg-paper-100 text-paper-600 rounded`}>
            <FileIcon className="w-4 h-4" />
        </div>
    );
}

// Icons
function ChevronIcon({ className }) {
    return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
    );
}

function CheckIcon({ className }) {
    return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
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

function CodeIcon({ className }) {
    return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
        </svg>
    );
}

function TerminalIcon({ className }) {
    return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
    );
}

function AlertIcon({ className }) {
    return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
    );
}

function ChartIcon({ className }) {
    return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
    );
}

function FileIcon({ className }) {
    return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
    );
}

function EyeIcon({ className }) {
    return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
        </svg>
    );
}

function DownloadIcon({ className }) {
    return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
        </svg>
    );
}
