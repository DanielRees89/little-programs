import { useState, useEffect, useRef } from 'react';
import hljs from 'highlight.js/lib/core';
import python from 'highlight.js/lib/languages/python';
import javascript from 'highlight.js/lib/languages/javascript';
import json from 'highlight.js/lib/languages/json';
import bash from 'highlight.js/lib/languages/bash';
import sql from 'highlight.js/lib/languages/sql';
import 'highlight.js/styles/github-dark.css';

// Register languages
hljs.registerLanguage('python', python);
hljs.registerLanguage('javascript', javascript);
hljs.registerLanguage('js', javascript);
hljs.registerLanguage('json', json);
hljs.registerLanguage('bash', bash);
hljs.registerLanguage('shell', bash);
hljs.registerLanguage('sql', sql);

export default function CodeBlock({
    code,
    language = 'python',
    title,
    onSave,
    onRun,
    showLineNumbers = true,
    maxHeight = '400px',
    className = '',
}) {
    const [copied, setCopied] = useState(false);
    const codeRef = useRef(null);

    // Apply syntax highlighting
    useEffect(() => {
        if (codeRef.current && code) {
            try {
                // Check if language is supported
                if (hljs.getLanguage(language)) {
                    const result = hljs.highlight(code, { language });
                    codeRef.current.innerHTML = result.value;
                } else {
                    // Fallback: escape HTML and display as plain text
                    codeRef.current.textContent = code;
                }
            } catch (err) {
                // Fallback on error
                codeRef.current.textContent = code;
            }
        }
    }, [code, language]);

    const handleCopy = async () => {
        try {
            // Try modern clipboard API first
            if (navigator.clipboard && window.isSecureContext) {
                await navigator.clipboard.writeText(code);
            } else {
                // Fallback for non-HTTPS or older browsers
                const textArea = document.createElement('textarea');
                textArea.value = code;
                textArea.style.position = 'fixed';
                textArea.style.left = '-999999px';
                document.body.appendChild(textArea);
                textArea.select();
                document.execCommand('copy');
                document.body.removeChild(textArea);
            }
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error('Failed to copy:', err);
        }
    };

    const lines = code.split('\n');

    return (
        <div className={`rounded-lg overflow-hidden bg-paper-900 ${className}`}>
            {/* Header */}
            <div className="flex items-center justify-between bg-paper-800 px-3 py-2 border-b border-paper-700">
                <div className="flex items-center gap-3 min-w-0">
                    {/* Language badge */}
                    <span className="px-2 py-0.5 bg-paper-700 text-paper-300 text-xs font-mono rounded flex-shrink-0">
                        {language}
                    </span>
                    {/* Title if provided */}
                    {title && (
                        <span className="text-paper-400 text-sm truncate">
                            {title}
                        </span>
                    )}
                </div>

                {/* Action buttons */}
                <div className="flex items-center gap-1 flex-shrink-0">
                    {/* Copy button */}
                    <button
                        onClick={handleCopy}
                        className="flex items-center gap-1.5 px-2 py-1 hover:bg-paper-700 rounded text-paper-400 hover:text-paper-200 transition-colors"
                        title="Copy code"
                    >
                        {copied ? (
                            <>
                                <CheckIcon className="w-4 h-4 text-calm-400" />
                                <span className="text-xs text-calm-400 hidden sm:inline">Copied!</span>
                            </>
                        ) : (
                            <>
                                <CopyIcon className="w-4 h-4" />
                                <span className="text-xs hidden sm:inline">Copy</span>
                            </>
                        )}
                    </button>

                    {/* Run button */}
                    {onRun && (
                        <button
                            onClick={onRun}
                            className="flex items-center gap-1.5 px-2 py-1 hover:bg-paper-700 rounded text-paper-400 hover:text-calm-400 transition-colors"
                            title="Run code"
                        >
                            <PlayIcon className="w-4 h-4" />
                            <span className="text-xs hidden sm:inline">Run</span>
                        </button>
                    )}

                    {/* Save button */}
                    {onSave && (
                        <button
                            onClick={onSave}
                            className="flex items-center gap-1.5 px-2 py-1 hover:bg-paper-700 rounded text-paper-400 hover:text-punch-400 transition-colors"
                            title="Save to library"
                        >
                            <SaveIcon className="w-4 h-4" />
                            <span className="text-xs hidden sm:inline">Save</span>
                        </button>
                    )}
                </div>
            </div>

            {/* Code content */}
            <div
                className="overflow-auto"
                style={{ maxHeight }}
            >
                <div className="p-4 font-mono text-sm leading-relaxed">
                    {showLineNumbers ? (
                        <div className="flex">
                            {/* Line numbers column */}
                            <div className="flex-shrink-0 pr-4 text-right select-none text-paper-600 border-r border-paper-700 mr-4">
                                {lines.map((_, index) => (
                                    <div key={index}>{index + 1}</div>
                                ))}
                            </div>
                            {/* Code column */}
                            <div className="flex-1 min-w-0 overflow-x-auto">
                                <pre className="text-paper-100">
                                    <code ref={codeRef} className="hljs" />
                                </pre>
                            </div>
                        </div>
                    ) : (
                        <pre className="text-paper-100 overflow-x-auto">
                            <code ref={codeRef} className="hljs" />
                        </pre>
                    )}
                </div>
            </div>
        </div>
    );
}

// Compact version for inline/chat use
export function CodeBlockCompact({ code, language = 'python', onSave }) {
    const [copied, setCopied] = useState(false);
    const codeRef = useRef(null);

    // Apply syntax highlighting
    useEffect(() => {
        if (codeRef.current && code) {
            try {
                if (hljs.getLanguage(language)) {
                    const result = hljs.highlight(code, { language });
                    codeRef.current.innerHTML = result.value;
                } else {
                    codeRef.current.textContent = code;
                }
            } catch (err) {
                codeRef.current.textContent = code;
            }
        }
    }, [code, language]);

    const handleCopy = async () => {
        try {
            if (navigator.clipboard && window.isSecureContext) {
                await navigator.clipboard.writeText(code);
            } else {
                const textArea = document.createElement('textarea');
                textArea.value = code;
                textArea.style.position = 'fixed';
                textArea.style.left = '-999999px';
                document.body.appendChild(textArea);
                textArea.select();
                document.execCommand('copy');
                document.body.removeChild(textArea);
            }
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error('Failed to copy:', err);
        }
    };

    return (
        <div className="mt-3 rounded-lg overflow-hidden bg-paper-900">
            {/* Header */}
            <div className="flex items-center justify-between bg-paper-800 px-3 py-1.5">
                <span className="text-xs text-paper-400 font-mono">{language}</span>
                <div className="flex items-center gap-1">
                    <button
                        onClick={handleCopy}
                        className="p-1 hover:bg-paper-700 rounded transition-colors"
                        title="Copy code"
                    >
                        {copied ? (
                            <CheckIcon className="w-3.5 h-3.5 text-calm-400" />
                        ) : (
                            <CopyIcon className="w-3.5 h-3.5 text-paper-400" />
                        )}
                    </button>
                    {onSave && (
                        <button
                            onClick={onSave}
                            className="p-1 hover:bg-paper-700 rounded transition-colors"
                            title="Save to library"
                        >
                            <SaveIcon className="w-3.5 h-3.5 text-paper-400 hover:text-punch-400" />
                        </button>
                    )}
                </div>
            </div>

            {/* Code content */}
            <div className="p-3 overflow-x-auto">
                <pre className="text-sm font-mono text-paper-100 leading-relaxed">
                    <code ref={codeRef} className="hljs" />
                </pre>
            </div>
        </div>
    );
}

// Icons
function CopyIcon({ className }) {
    return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.666 3.888A2.25 2.25 0 0013.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 01-.75.75H9a.75.75 0 01-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 01-2.25 2.25H6.75A2.25 2.25 0 014.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 011.927-.184" />
        </svg>
    );
}

function CheckIcon({ className }) {
    return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
        </svg>
    );
}

function SaveIcon({ className }) {
    return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0z" />
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
