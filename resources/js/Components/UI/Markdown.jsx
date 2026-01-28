import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import 'highlight.js/styles/github-dark.css';

export default function Markdown({ content, className = '' }) {
    if (!content) return null;

    return (
        <div className={`markdown-content ${className}`}>
            <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                rehypePlugins={[rehypeHighlight]}
                components={{
                    // Headings
                    h1: ({ children }) => (
                        <h1 className="text-xl font-display font-bold text-paper-900 mt-6 mb-3 first:mt-0">
                            {children}
                        </h1>
                    ),
                    h2: ({ children }) => (
                        <h2 className="text-lg font-display font-bold text-paper-900 mt-5 mb-2 first:mt-0">
                            {children}
                        </h2>
                    ),
                    h3: ({ children }) => (
                        <h3 className="text-base font-display font-semibold text-paper-900 mt-4 mb-2 first:mt-0">
                            {children}
                        </h3>
                    ),
                    h4: ({ children }) => (
                        <h4 className="text-sm font-display font-semibold text-paper-800 mt-3 mb-1 first:mt-0">
                            {children}
                        </h4>
                    ),

                    // Paragraphs
                    p: ({ children }) => (
                        <p className="text-paper-700 leading-relaxed mb-3 last:mb-0">
                            {children}
                        </p>
                    ),

                    // Lists
                    ul: ({ children }) => (
                        <ul className="list-disc list-outside ml-5 mb-3 space-y-1 text-paper-700">
                            {children}
                        </ul>
                    ),
                    ol: ({ children }) => (
                        <ol className="list-decimal list-outside ml-5 mb-3 space-y-1 text-paper-700">
                            {children}
                        </ol>
                    ),
                    li: ({ children }) => (
                        <li className="leading-relaxed pl-1">
                            {children}
                        </li>
                    ),

                    // Blockquotes
                    blockquote: ({ children }) => (
                        <blockquote className="border-l-4 border-punch-300 bg-punch-50 pl-4 py-2 my-3 text-paper-600 italic rounded-r-soft">
                            {children}
                        </blockquote>
                    ),

                    // Code
                    code: ({ inline, className, children, ...props }) => {
                        if (inline) {
                            return (
                                <code
                                    className="px-1.5 py-0.5 bg-paper-100 text-punch-600 text-sm font-mono rounded"
                                    {...props}
                                >
                                    {children}
                                </code>
                            );
                        }

                        // Extract language from className (e.g., "language-python")
                        const match = /language-(\w+)/.exec(className || '');
                        const language = match ? match[1] : 'text';

                        return (
                            <CodeBlockWithCopy language={language} className={className}>
                                {children}
                            </CodeBlockWithCopy>
                        );
                    },
                    pre: ({ children }) => <>{children}</>,

                    // Links
                    a: ({ href, children }) => (
                        <a
                            href={href}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-punch-600 hover:text-punch-700 underline underline-offset-2"
                        >
                            {children}
                        </a>
                    ),

                    // Bold and Italic
                    strong: ({ children }) => (
                        <strong className="font-semibold text-paper-900">{children}</strong>
                    ),
                    em: ({ children }) => (
                        <em className="italic">{children}</em>
                    ),

                    // Horizontal Rule
                    hr: () => <hr className="my-4 border-paper-200" />,

                    // Tables
                    table: ({ children }) => (
                        <div className="my-3 overflow-x-auto rounded-lg border border-paper-200">
                            <table className="w-full text-sm">{children}</table>
                        </div>
                    ),
                    thead: ({ children }) => (
                        <thead className="bg-paper-100 border-b border-paper-200">
                            {children}
                        </thead>
                    ),
                    tbody: ({ children }) => <tbody>{children}</tbody>,
                    tr: ({ children }) => (
                        <tr className="border-b border-paper-100 last:border-0">{children}</tr>
                    ),
                    th: ({ children }) => (
                        <th className="px-4 py-2 text-left font-semibold text-paper-800">
                            {children}
                        </th>
                    ),
                    td: ({ children }) => (
                        <td className="px-4 py-2 text-paper-700">{children}</td>
                    ),

                    // Images
                    img: ({ src, alt }) => (
                        <img
                            src={src}
                            alt={alt || ''}
                            className="max-w-full h-auto rounded-lg my-3"
                        />
                    ),
                }}
            >
                {content}
            </ReactMarkdown>
        </div>
    );
}

/**
 * Code block component with copy feedback
 */
function CodeBlockWithCopy({ language, className, children }) {
    const [copied, setCopied] = useState(false);

    const handleCopy = async () => {
        try {
            const text = String(children).replace(/\n$/, '');
            // Try modern clipboard API first
            if (navigator.clipboard && window.isSecureContext) {
                await navigator.clipboard.writeText(text);
            } else {
                // Fallback for non-HTTPS or older browsers
                const textArea = document.createElement('textarea');
                textArea.value = text;
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
        <div className="my-3 rounded-lg overflow-hidden bg-paper-900">
            <div className="flex items-center justify-between px-4 py-2 bg-paper-800 border-b border-paper-700">
                <span className="text-xs text-paper-400 font-mono uppercase">
                    {language}
                </span>
                <button
                    onClick={handleCopy}
                    className="text-xs text-paper-400 hover:text-paper-200 transition-colors flex items-center gap-1"
                >
                    {copied ? (
                        <>
                            <CheckIcon className="w-3.5 h-3.5 text-green-400" />
                            <span className="text-green-400">Copied!</span>
                        </>
                    ) : (
                        <>
                            <CopyIcon className="w-3.5 h-3.5" />
                            <span>Copy</span>
                        </>
                    )}
                </button>
            </div>
            <pre className="p-4 overflow-x-auto">
                <code className={`text-sm font-mono leading-relaxed hljs ${className || ''}`}>
                    {children}
                </code>
            </pre>
        </div>
    );
}

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
