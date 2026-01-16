import { useState } from 'react';
import { CodeBlock, Markdown, ThinkingBlock } from '@/Components/UI';

export default function ChatMessage({ message, onSaveScript, onViewResults, isStreaming = false }) {
    const isUser = message.role === 'user';
    const attachedFiles = message.metadata?.attached_files || [];
    const executionResults = message.metadata?.execution_results || [];
    const hasGeneratedFiles = executionResults.some(r => 
        (r.charts?.length > 0) || (r.files?.length > 0)
    );
    const hasCode = message.code || executionResults.some(r => r.code);

    return (
        <div className={`py-4 ${isUser ? 'bg-transparent' : 'bg-paper-50/50'}`}>
            <div className="max-w-3xl mx-auto px-4">
                <div className="flex gap-4">
                    {/* Avatar */}
                    <div className={`
                        w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0
                        ${isUser ? 'bg-calm-500' : 'bg-punch-500'}
                        ${isStreaming ? 'animate-pulse' : ''}
                    `}>
                        {isUser ? (
                            <UserIcon className="w-4 h-4 text-white" />
                        ) : (
                            <SparkleIcon className="w-4 h-4 text-white" />
                        )}
                    </div>

                    <div className="flex-1 min-w-0 overflow-hidden">
                        {/* Role label */}
                        <div className="flex items-center gap-2 mb-1">
                            <span className="font-semibold text-sm text-paper-700">
                                {isUser ? 'You' : 'Assistant'}
                            </span>
                            {hasGeneratedFiles && !isStreaming && (
                                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full">
                                    <FileIcon className="w-3 h-3" />
                                    {executionResults.reduce((acc, r) => acc + (r.charts?.length || 0) + (r.files?.length || 0), 0)} files
                                </span>
                            )}
                        </div>

                        {/* Attached files */}
                        {attachedFiles.length > 0 && (
                            <div className="flex flex-wrap gap-2 mb-3">
                                {attachedFiles.map((file, i) => (
                                    <FileChip key={i} file={file} />
                                ))}
                            </div>
                        )}

                        {/* Thinking block */}
                        {!isUser && message.thinking && (
                            <div className="mb-3">
                                <ThinkingBlock 
                                    content={message.thinking} 
                                    defaultExpanded={isStreaming} 
                                    isStreaming={isStreaming}
                                />
                            </div>
                        )}

                        {/* Execution results - show during AND after streaming */}
                        {!isUser && executionResults.length > 0 && (
                            <div className="mb-3 space-y-3">
                                {executionResults.map((exec, i) => (
                                    <ExecutionBlock 
                                        key={i} 
                                        execution={exec} 
                                        index={i} 
                                        isStreaming={isStreaming && exec.status === 'running'}
                                    />
                                ))}
                            </div>
                        )}

                        {/* Message content */}
                        {message.content && (
                            <div className="prose prose-sm max-w-none text-paper-700">
                                {isUser ? (
                                    <p className="whitespace-pre-wrap break-words m-0">{message.content}</p>
                                ) : (
                                    <>
                                        <Markdown content={message.content} />
                                        {isStreaming && (
                                            <span className="inline-block w-2 h-4 ml-0.5 bg-punch-500 animate-pulse rounded-sm" />
                                        )}
                                    </>
                                )}
                            </div>
                        )}

                        {/* Loading state - only when no other content */}
                        {isStreaming && !message.content && !message.thinking && executionResults.length === 0 && (
                            <div className="flex items-center gap-2 text-paper-400 text-sm">
                                <div className="flex gap-1">
                                    <span className="w-1.5 h-1.5 bg-punch-400 rounded-full animate-bounce" style={{animationDelay: '-0.3s'}} />
                                    <span className="w-1.5 h-1.5 bg-punch-400 rounded-full animate-bounce" style={{animationDelay: '-0.15s'}} />
                                    <span className="w-1.5 h-1.5 bg-punch-400 rounded-full animate-bounce" />
                                </div>
                                <span>Thinking...</span>
                            </div>
                        )}

                        {/* Action buttons - only after streaming */}
                        {!isUser && !isStreaming && (hasCode || hasGeneratedFiles) && (
                            <div className="flex items-center gap-3 mt-4">
                                {onSaveScript && hasCode && (
                                    <button
                                        onClick={() => onSaveScript(message)}
                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-punch-500 hover:bg-punch-600 text-white text-sm font-medium rounded-lg transition-colors"
                                    >
                                        <SaveIcon className="w-4 h-4" />
                                        Save Script
                                    </button>
                                )}
                                {onViewResults && hasGeneratedFiles && (
                                    <button
                                        onClick={onViewResults}
                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium rounded-lg transition-colors"
                                    >
                                        <ChartIcon className="w-4 h-4" />
                                        View Results
                                    </button>
                                )}
                            </div>
                        )}

                        {/* Footer timestamp */}
                        {!isStreaming && (
                            <div className="flex items-center gap-4 mt-3 text-xs text-paper-400">
                                <span>{formatTime(message.created_at)}</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

/**
 * Shows a single code execution with code, output, and generated files
 */
function ExecutionBlock({ execution, index, isStreaming }) {
    const [codeExpanded, setCodeExpanded] = useState(true);
    const [outputExpanded, setOutputExpanded] = useState(true);
    
    const isRunning = execution.status === 'running';
    const success = execution.success;
    const hasOutput = execution.output || execution.error;
    const hasFiles = (execution.charts?.length > 0) || (execution.files?.length > 0);

    return (
        <div className={`rounded-lg border overflow-hidden ${
            isRunning ? 'border-yellow-300 bg-yellow-50/50' :
            success ? 'border-green-200 bg-green-50/50' : 
            'border-red-200 bg-red-50/50'
        }`}>
            {/* Header */}
            <div className={`px-3 py-2 flex items-center gap-2 ${
                isRunning ? 'bg-yellow-100/50' :
                success ? 'bg-green-100/50' : 'bg-red-100/50'
            }`}>
                {isRunning ? (
                    <div className="w-4 h-4 border-2 border-yellow-500 border-t-transparent rounded-full animate-spin" />
                ) : success ? (
                    <CheckIcon className="w-4 h-4 text-green-600" />
                ) : (
                    <XIcon className="w-4 h-4 text-red-600" />
                )}
                
                <span className={`text-sm font-medium ${
                    isRunning ? 'text-yellow-800' :
                    success ? 'text-green-800' : 'text-red-800'
                }`}>
                    {isRunning ? 'Executing Python...' :
                     success ? `Execution ${index + 1} successful` : `Execution ${index + 1} failed`}
                </span>

                {hasFiles && (
                    <span className="text-xs text-green-600 ml-auto mr-2">
                        {(execution.charts?.length || 0) + (execution.files?.length || 0)} files
                    </span>
                )}
            </div>

            {/* Code section */}
            {execution.code && (
                <div className="border-t border-paper-200">
                    <button
                        onClick={() => setCodeExpanded(!codeExpanded)}
                        className="w-full px-3 py-2 flex items-center gap-2 text-xs font-medium text-paper-600 hover:bg-paper-50"
                    >
                        <ChevronIcon className={`w-3 h-3 transition-transform ${codeExpanded ? 'rotate-90' : ''}`} />
                        <CodeIcon className="w-3 h-3" />
                        Python Code
                    </button>
                    {codeExpanded && (
                        <div className="px-3 pb-3">
                            <pre className="text-xs bg-paper-900 text-paper-100 p-3 rounded-lg overflow-x-auto max-h-64">
                                <code>{execution.code}</code>
                            </pre>
                        </div>
                    )}
                </div>
            )}

            {/* Output section */}
            {hasOutput && !isRunning && (
                <div className="border-t border-paper-200">
                    <button
                        onClick={() => setOutputExpanded(!outputExpanded)}
                        className="w-full px-3 py-2 flex items-center gap-2 text-xs font-medium text-paper-600 hover:bg-paper-50"
                    >
                        <ChevronIcon className={`w-3 h-3 transition-transform ${outputExpanded ? 'rotate-90' : ''}`} />
                        <TerminalIcon className="w-3 h-3" />
                        {success ? 'Output' : 'Error'}
                    </button>
                    {outputExpanded && (
                        <div className="px-3 pb-3">
                            <pre className={`text-xs p-3 rounded-lg overflow-x-auto max-h-48 ${
                                success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                            }`}>
                                {success ? execution.output : execution.error}
                            </pre>
                        </div>
                    )}
                </div>
            )}

            {/* Generated files section */}
            {hasFiles && !isRunning && (
                <div className="border-t border-paper-200 px-3 py-3">
                    <div className="text-xs font-medium text-paper-600 mb-2 flex items-center gap-1">
                        <FileIcon className="w-3 h-3" />
                        Generated Files
                    </div>
                    <div className="space-y-2">
                        {/* Charts with preview */}
                        {execution.charts?.map((chart, i) => (
                            <FilePreviewCard key={`chart-${i}`} file={chart} type="chart" />
                        ))}
                        {/* Other files */}
                        {execution.files?.map((file, i) => (
                            <FilePreviewCard key={`file-${i}`} file={file} type="file" />
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

/**
 * File card with inline preview for images
 */
function FilePreviewCard({ file, type }) {
    const [showPreview, setShowPreview] = useState(type === 'chart');
    const [imageError, setImageError] = useState(false);
    
    const fileType = file.type?.toLowerCase() || '';
    const isImage = ['png', 'jpg', 'jpeg', 'gif', 'svg'].includes(fileType);
    const isExcel = ['xlsx', 'xls', 'csv'].includes(fileType);
    const isPdf = fileType === 'pdf';

    const previewUrl = file.preview_url;
    const downloadUrl = file.download_url;

    const getIcon = () => {
        if (isImage) return <ImageIcon className="w-4 h-4" />;
        if (isExcel) return <TableIcon className="w-4 h-4" />;
        if (isPdf) return <DocumentIcon className="w-4 h-4" />;
        return <FileIcon className="w-4 h-4" />;
    };

    const getBg = () => {
        if (isImage) return 'bg-blue-50 text-blue-600';
        if (isExcel) return 'bg-green-50 text-green-600';
        if (isPdf) return 'bg-red-50 text-red-600';
        return 'bg-paper-100 text-paper-600';
    };

    return (
        <div className="border border-paper-200 rounded-lg overflow-hidden bg-white">
            {/* Image preview */}
            {isImage && showPreview && previewUrl && !imageError && (
                <div className="bg-paper-100 p-2 flex justify-center">
                    <img 
                        src={previewUrl} 
                        alt={file.filename}
                        className="max-w-full h-auto rounded shadow-sm"
                        style={{ maxHeight: '200px' }}
                        onError={() => setImageError(true)}
                    />
                </div>
            )}

            {/* File info */}
            <div className="px-3 py-2 flex items-center gap-2">
                <div className={`w-8 h-8 rounded flex items-center justify-center ${getBg()}`}>
                    {getIcon()}
                </div>
                <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-paper-800 truncate">{file.filename}</p>
                    {file.size && (
                        <p className="text-xs text-paper-400">{formatFileSize(file.size)}</p>
                    )}
                </div>
                <div className="flex items-center gap-1">
                    {isImage && previewUrl && (
                        <button
                            onClick={() => setShowPreview(!showPreview)}
                            className="p-1.5 hover:bg-paper-100 rounded transition-colors"
                            title={showPreview ? 'Hide preview' : 'Show preview'}
                        >
                            <EyeIcon className={`w-4 h-4 ${showPreview ? 'text-punch-500' : 'text-paper-400'}`} />
                        </button>
                    )}
                    {isPdf && previewUrl && (
                        <a
                            href={previewUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 hover:bg-paper-100 rounded transition-colors"
                            title="View PDF"
                        >
                            <EyeIcon className="w-4 h-4 text-paper-400" />
                        </a>
                    )}
                    {downloadUrl && (
                        <a
                            href={downloadUrl}
                            download={file.filename}
                            className="p-1.5 hover:bg-punch-50 rounded transition-colors"
                            title="Download"
                        >
                            <DownloadIcon className="w-4 h-4 text-paper-400 hover:text-punch-500" />
                        </a>
                    )}
                </div>
            </div>
        </div>
    );
}

function FileChip({ file }) {
    return (
        <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-white border border-paper-200 rounded-lg text-xs shadow-sm">
            <SpreadsheetIcon className="w-4 h-4 text-green-500" />
            <span className="text-paper-700 font-medium truncate max-w-[200px]">{file.name || 'File'}</span>
        </div>
    );
}

function formatTime(ts) {
    if (!ts) return '';
    return new Date(ts).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
}

function formatFileSize(bytes) {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// Icons
function UserIcon({ className }) {
    return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" /></svg>;
}

function SparkleIcon({ className }) {
    return <svg className={className} fill="currentColor" viewBox="0 0 20 20"><path d="M10 2a.75.75 0 01.75.75v1.5a.75.75 0 01-1.5 0v-1.5A.75.75 0 0110 2zm0 13a.75.75 0 01.75.75v1.5a.75.75 0 01-1.5 0v-1.5A.75.75 0 0110 15zm-7-5a.75.75 0 01.75-.75h1.5a.75.75 0 010 1.5h-1.5A.75.75 0 013 10zm13 0a.75.75 0 01.75-.75h1.5a.75.75 0 010 1.5h-1.5A.75.75 0 0116 10z" /></svg>;
}

function SaveIcon({ className }) {
    return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0z" /></svg>;
}

function CheckIcon({ className }) {
    return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>;
}

function XIcon({ className }) {
    return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>;
}

function FileIcon({ className }) {
    return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" /></svg>;
}

function ChartIcon({ className }) {
    return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75z" /></svg>;
}

function ChevronIcon({ className }) {
    return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>;
}

function CodeIcon({ className }) {
    return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M17.25 6.75L22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3l-4.5 16.5" /></svg>;
}

function TerminalIcon({ className }) {
    return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6.75 7.5l3 2.25-3 2.25m4.5 0h3m-9 8.25h13.5A2.25 2.25 0 0021 18V6a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 6v12a2.25 2.25 0 002.25 2.25z" /></svg>;
}

function SpreadsheetIcon({ className }) {
    return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M3.375 19.5h17.25m-17.25 0a1.125 1.125 0 01-1.125-1.125M3.375 19.5h7.5c.621 0 1.125-.504 1.125-1.125m-9.75 0V5.625m0 12.75v-1.5c0-.621.504-1.125 1.125-1.125m18.375 2.625V5.625m0 12.75c0 .621-.504 1.125-1.125 1.125m1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125m0 3.75h-7.5A1.125 1.125 0 0112 18.375m9.75-12.75c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125m19.5 0v1.5c0 .621-.504 1.125-1.125 1.125M2.25 5.625v1.5c0 .621.504 1.125 1.125 1.125m0 0h17.25m-17.25 0h7.5c.621 0 1.125.504 1.125 1.125M3.375 8.25c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125m17.25-3.75h-7.5c-.621 0-1.125.504-1.125 1.125m8.625-1.125c.621 0 1.125.504 1.125 1.125v1.5c0 .621-.504 1.125-1.125 1.125" /></svg>;
}

function ImageIcon({ className }) {
    return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" /></svg>;
}

function TableIcon({ className }) {
    return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M3.375 19.5h17.25m-17.25 0a1.125 1.125 0 01-1.125-1.125M3.375 19.5h7.5c.621 0 1.125-.504 1.125-1.125m-9.75 0V5.625m0 12.75v-1.5c0-.621.504-1.125 1.125-1.125m18.375 2.625V5.625m0 12.75c0 .621-.504 1.125-1.125 1.125m1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125m0 3.75h-7.5A1.125 1.125 0 0112 18.375m9.75-12.75c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125m19.5 0v1.5c0 .621-.504 1.125-1.125 1.125M2.25 5.625v1.5c0 .621.504 1.125 1.125 1.125m0 0h17.25m-17.25 0h7.5c.621 0 1.125.504 1.125 1.125M3.375 8.25c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125m17.25-3.75h-7.5c-.621 0-1.125.504-1.125 1.125m8.625-1.125c.621 0 1.125.504 1.125 1.125v1.5c0 .621-.504 1.125-1.125 1.125" /></svg>;
}

function DocumentIcon({ className }) {
    return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" /></svg>;
}

function EyeIcon({ className }) {
    return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>;
}

function DownloadIcon({ className }) {
    return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" /></svg>;
}
