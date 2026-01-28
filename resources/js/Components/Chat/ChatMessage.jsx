import { CodeBlock, Markdown, ThinkingBlock } from '@/Components/UI';
import AgenticExecutionBlock from './AgenticExecutionBlock';

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
                                    <AgenticExecutionBlock
                                        key={i}
                                        execution={exec}
                                        index={i}
                                        isLatest={i === executionResults.length - 1}
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

    const date = new Date(ts);
    const now = new Date();
    const diffMs = now - date;
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHour / 24);

    // Less than 1 minute ago
    if (diffSec < 60) {
        return 'Just now';
    }

    // Less than 1 hour ago
    if (diffMin < 60) {
        return `${diffMin} min${diffMin === 1 ? '' : 's'} ago`;
    }

    // Less than 24 hours ago
    if (diffHour < 24) {
        return `${diffHour} hour${diffHour === 1 ? '' : 's'} ago`;
    }

    // Less than 7 days ago
    if (diffDay < 7) {
        return `${diffDay} day${diffDay === 1 ? '' : 's'} ago`;
    }

    // Otherwise show date and time
    return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
    });
}

// Icons - only keeping ones that are actively used
function UserIcon({ className }) {
    return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" /></svg>;
}

function SparkleIcon({ className }) {
    return <svg className={className} fill="currentColor" viewBox="0 0 20 20"><path d="M10 2a.75.75 0 01.75.75v1.5a.75.75 0 01-1.5 0v-1.5A.75.75 0 0110 2zm0 13a.75.75 0 01.75.75v1.5a.75.75 0 01-1.5 0v-1.5A.75.75 0 0110 15zm-7-5a.75.75 0 01.75-.75h1.5a.75.75 0 010 1.5h-1.5A.75.75 0 013 10zm13 0a.75.75 0 01.75-.75h1.5a.75.75 0 010 1.5h-1.5A.75.75 0 0116 10z" /></svg>;
}

function SaveIcon({ className }) {
    return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0z" /></svg>;
}

function FileIcon({ className }) {
    return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" /></svg>;
}

function ChartIcon({ className }) {
    return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75z" /></svg>;
}

function SpreadsheetIcon({ className }) {
    return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M3.375 19.5h17.25m-17.25 0a1.125 1.125 0 01-1.125-1.125M3.375 19.5h7.5c.621 0 1.125-.504 1.125-1.125m-9.75 0V5.625m0 12.75v-1.5c0-.621.504-1.125 1.125-1.125m18.375 2.625V5.625m0 12.75c0 .621-.504 1.125-1.125 1.125m1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125m0 3.75h-7.5A1.125 1.125 0 0112 18.375m9.75-12.75c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125m19.5 0v1.5c0 .621-.504 1.125-1.125 1.125M2.25 5.625v1.5c0 .621.504 1.125 1.125 1.125m0 0h17.25m-17.25 0h7.5c.621 0 1.125.504 1.125 1.125M3.375 8.25c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125m17.25-3.75h-7.5c-.621 0-1.125.504-1.125 1.125m8.625-1.125c.621 0 1.125.504 1.125 1.125v1.5c0 .621-.504 1.125-1.125 1.125" /></svg>;
}
