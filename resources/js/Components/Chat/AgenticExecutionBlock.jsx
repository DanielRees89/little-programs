import { useState } from 'react';
import { CodeBlock } from '@/Components/UI';

/**
 * AgenticExecutionBlock - Shows a single script execution attempt
 * 
 * @param {object} execution - Execution result object
 * @param {number} index - Execution attempt number
 * @param {boolean} isLatest - Whether this is the most recent execution
 */
export default function AgenticExecutionBlock({ execution, index, isLatest = false }) {
    const [isExpanded, setIsExpanded] = useState(isLatest);
    
    // Safely extract properties with defaults
    const success = execution?.success ?? false;
    const code = execution?.code || '';
    const output = execution?.output || '';
    const error = execution?.error || '';
    const charts = execution?.charts || [];
    const files = execution?.files || [];

    // Don't render if no execution data
    if (!execution) {
        return null;
    }

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
                    {/* Chevron */}
                    <ChevronIcon 
                        className={`w-4 h-4 text-white/80 transition-transform duration-200 ${
                            isExpanded ? 'rotate-90' : ''
                        }`}
                    />
                    
                    {/* Status icon */}
                    {success ? (
                        <CheckIcon className="w-4 h-4 text-white" />
                    ) : (
                        <XIcon className="w-4 h-4 text-white" />
                    )}
                    
                    <span className="text-xs font-semibold text-white uppercase tracking-wider">
                        Test {index + 1}: {success ? 'Passed' : 'Failed'}
                    </span>

                    {/* Generated files indicator */}
                    {success && (charts.length > 0 || files.length > 0) && (
                        <span className="text-xs text-white/70 ml-2">
                            {charts.length > 0 && `${charts.length} chart${charts.length > 1 ? 's' : ''}`}
                            {charts.length > 0 && files.length > 0 && ', '}
                            {files.length > 0 && `${files.length} file${files.length > 1 ? 's' : ''}`}
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
                                Code Executed
                            </div>
                            <div className="max-h-[200px] overflow-auto">
                                <CodeBlock code={code} language="python" showLineNumbers={false} maxHeight="200px" />
                            </div>
                        </div>
                    )}

                    {/* Output or Error */}
                    <div>
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
                        <div className="p-3 max-h-[150px] overflow-auto bg-white">
                            <pre className={`text-xs font-mono whitespace-pre-wrap break-words ${
                                success ? 'text-paper-600' : 'text-red-600'
                            }`}>
                                {success ? (output || '(No output)') : (error || 'Unknown error')}
                            </pre>
                        </div>
                    </div>

                    {/* Generated files */}
                    {success && (charts.length > 0 || files.length > 0) && (
                        <div className="px-3 py-2 bg-green-50 border-t border-green-100">
                            <div className="text-xs font-medium text-green-700 mb-1.5">
                                Generated Files:
                            </div>
                            <div className="flex flex-wrap gap-1.5">
                                {charts.map((chart, i) => (
                                    <span 
                                        key={`chart-${i}`}
                                        className="inline-flex items-center gap-1 px-2 py-0.5 bg-white rounded text-xs text-green-700 border border-green-200"
                                    >
                                        <ChartIcon className="w-3 h-3" />
                                        {chart.filename || `chart_${i + 1}`}
                                    </span>
                                ))}
                                {files.map((file, i) => (
                                    <span 
                                        key={`file-${i}`}
                                        className="inline-flex items-center gap-1 px-2 py-0.5 bg-white rounded text-xs text-green-700 border border-green-200"
                                    >
                                        <FileIcon className="w-3 h-3" />
                                        {file.filename || `file_${i + 1}`}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}
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
