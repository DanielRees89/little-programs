import { useState, useRef, useEffect } from 'react';

/**
 * ThinkingBlock - Displays AI thinking/reasoning in a collapsible panel
 * 
 * @param {string} content - The thinking content text
 * @param {boolean} isStreaming - Whether content is still being streamed
 * @param {boolean} defaultExpanded - Initial expanded state
 */
export default function ThinkingBlock({ content, isStreaming = false, defaultExpanded = false }) {
    const [isExpanded, setIsExpanded] = useState(defaultExpanded);
    const contentRef = useRef(null);

    // Auto-scroll to bottom while streaming
    useEffect(() => {
        if (isStreaming && contentRef.current && isExpanded) {
            contentRef.current.scrollTop = contentRef.current.scrollHeight;
        }
    }, [content, isStreaming, isExpanded]);

    // Auto-expand when streaming starts
    useEffect(() => {
        if (isStreaming && !isExpanded) {
            setIsExpanded(true);
        }
    }, [isStreaming]);

    const safeContent = content || '';
    const lineCount = safeContent ? safeContent.split('\n').length : 0;
    const preview = safeContent ? (safeContent.split('\n')[0]?.substring(0, 60) || '') : '';

    // Don't render if no content and not streaming
    if (!content && !isStreaming) return null;

    return (
        <div className="my-3 rounded-lg overflow-hidden border border-punch-200">
            {/* Header - clickable to toggle */}
            <div
                className="flex items-center justify-between px-3 py-2 bg-punch-500 cursor-pointer select-none"
                onClick={() => setIsExpanded(!isExpanded)}
            >
                <div className="flex items-center gap-2 min-w-0 flex-1">
                    {/* Chevron indicator */}
                    <ChevronIcon 
                        className={`w-4 h-4 text-white/80 transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`}
                    />
                    
                    {/* Brain icon + label */}
                    <BrainIcon className="w-4 h-4 text-white/90" />
                    <span className="text-xs font-semibold text-white uppercase tracking-wider">
                        Thinking
                    </span>
                    
                    {/* Streaming indicator */}
                    {isStreaming && (
                        <span className="flex items-center gap-1 ml-2">
                            <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
                            <span className="text-xs text-white/70">reasoning...</span>
                        </span>
                    )}
                    
                    {/* Preview when collapsed */}
                    {!isExpanded && safeContent && (
                        <span className="text-xs text-white/60 truncate ml-2 font-mono">
                            {preview}...
                        </span>
                    )}
                    
                    {/* Line count when not streaming */}
                    {!isStreaming && safeContent && (
                        <span className="text-xs text-white/50 ml-auto mr-2">
                            {lineCount} {lineCount === 1 ? 'line' : 'lines'}
                        </span>
                    )}
                </div>
            </div>

            {/* Content area - collapsible */}
            {isExpanded && (
                <div
                    ref={contentRef}
                    className="bg-paper-50 p-4 max-h-[300px] overflow-y-auto"
                >
                    <pre className="text-[13px] text-paper-600 font-mono whitespace-pre-wrap break-words leading-relaxed m-0">
                        {safeContent}
                        {isStreaming && (
                            <span className="inline-block w-2 h-4 bg-punch-400 animate-pulse ml-0.5 align-middle" />
                        )}
                    </pre>
                </div>
            )}
        </div>
    );
}

function ChevronIcon({ className }) {
    return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
    );
}

function BrainIcon({ className }) {
    // Actual brain/thinking icon (Heroicons "light-bulb" style for thinking)
    return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 18v-5.25m0 0a6.01 6.01 0 001.5-.189m-1.5.189a6.01 6.01 0 01-1.5-.189m3.75 7.478a12.06 12.06 0 01-4.5 0m3.75 2.383a14.406 14.406 0 01-3 0M14.25 18v-.192c0-.983.658-1.823 1.508-2.316a7.5 7.5 0 10-7.517 0c.85.493 1.509 1.333 1.509 2.316V18" />
        </svg>
    );
}
