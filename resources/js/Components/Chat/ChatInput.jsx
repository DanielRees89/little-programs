import { useState, useRef, useEffect } from 'react';
import { Button } from '@/Components/UI';

export default function ChatInput({ onSend, disabled = false, placeholder }) {
    const [message, setMessage] = useState('');
    const [attachedFiles, setAttachedFiles] = useState([]);
    const [isDragging, setIsDragging] = useState(false);
    const textareaRef = useRef(null);
    const fileInputRef = useRef(null);

    // Auto-resize textarea
    useEffect(() => {
        const textarea = textareaRef.current;
        if (textarea) {
            textarea.style.height = 'auto';
            textarea.style.height = Math.min(textarea.scrollHeight, 200) + 'px';
        }
    }, [message]);

    const handleSubmit = (e) => {
        e.preventDefault();
        if ((message.trim() || attachedFiles.length > 0) && !disabled) {
            onSend(message.trim(), attachedFiles);
            setMessage('');
            setAttachedFiles([]);
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSubmit(e);
        }
    };

    const handleFileSelect = (e) => {
        const files = Array.from(e.target.files || []);
        addFiles(files);
        // Reset input so same file can be selected again
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const addFiles = (files) => {
        const validFiles = files.filter(file => {
            const validTypes = [
                'text/csv',
                'application/pdf',
                'image/png',
                'image/jpeg',
                'image/gif',
                'image/webp',
                'text/plain',
                'application/json',
                'application/vnd.ms-excel',
                'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            ];
            const maxSize = 10 * 1024 * 1024; // 10MB
            return validTypes.includes(file.type) && file.size <= maxSize;
        });

        setAttachedFiles(prev => [...prev, ...validFiles].slice(0, 5)); // Max 5 files
    };

    const removeFile = (index) => {
        setAttachedFiles(prev => prev.filter((_, i) => i !== index));
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = (e) => {
        e.preventDefault();
        setIsDragging(false);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setIsDragging(false);
        const files = Array.from(e.dataTransfer.files || []);
        addFiles(files);
    };

    return (
        <form 
            onSubmit={handleSubmit} 
            className={`border-t border-paper-200 p-4 bg-white transition-colors ${isDragging ? 'bg-punch-50' : ''}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
        >
            {/* Attached files preview */}
            {attachedFiles.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-3">
                    {attachedFiles.map((file, index) => (
                        <div
                            key={index}
                            className="flex items-center gap-2 px-3 py-1.5 bg-paper-100 rounded-full text-sm"
                        >
                            <FileTypeIcon type={file.type} className="w-4 h-4 text-paper-500" />
                            <span className="text-paper-700 max-w-[150px] truncate">
                                {file.name}
                            </span>
                            <button
                                type="button"
                                onClick={() => removeFile(index)}
                                className="p-0.5 hover:bg-paper-200 rounded-full transition-colors"
                            >
                                <XIcon className="w-3.5 h-3.5 text-paper-400" />
                            </button>
                        </div>
                    ))}
                </div>
            )}

            <div className="flex gap-3 items-end">
                {/* File upload button */}
                <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={disabled}
                    className="flex-shrink-0 p-3 text-paper-400 hover:text-paper-600 hover:bg-paper-100 rounded-card transition-colors disabled:opacity-50"
                    title="Attach file (CSV, PDF, image)"
                >
                    <PaperclipIcon className="w-5 h-5" />
                </button>
                <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept=".csv,.pdf,.png,.jpg,.jpeg,.gif,.webp,.txt,.json,.xls,.xlsx"
                    onChange={handleFileSelect}
                    className="hidden"
                />

                <div className="flex-1 relative">
                    <textarea
                        ref={textareaRef}
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder={placeholder || "Describe what you want to analyze..."}
                        disabled={disabled}
                        rows={1}
                        className={`
                            w-full px-4 py-3
                            bg-paper-50
                            border-2 
                            ${isDragging ? 'border-punch-400' : 'border-paper-200'}
                            rounded-card
                            text-paper-900
                            placeholder:text-paper-400
                            focus:border-punch-500 focus:outline-none
                            transition-colors
                            resize-none
                            disabled:opacity-50 disabled:cursor-not-allowed
                        `}
                    />
                </div>
                <Button
                    type="submit"
                    size="lg"
                    disabled={(!message.trim() && attachedFiles.length === 0) || disabled}
                    className="flex-shrink-0"
                >
                    <SendIcon className="w-5 h-5" />
                </Button>
            </div>
            <p className="text-paper-400 text-xs mt-2 text-center">
                Press Enter to send • Shift+Enter for new line • Drag files or click 📎 to attach
            </p>
        </form>
    );
}

function FileTypeIcon({ type, className }) {
    if (type.startsWith('image/')) {
        return (
            <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
            </svg>
        );
    }
    if (type === 'application/pdf') {
        return (
            <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
            </svg>
        );
    }
    // Default: CSV/data file icon
    return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.375 19.5h17.25m-17.25 0a1.125 1.125 0 0 1-1.125-1.125M3.375 19.5h7.5c.621 0 1.125-.504 1.125-1.125m-9.75 0V5.625m0 12.75v-1.5c0-.621.504-1.125 1.125-1.125m18.375 2.625V5.625m0 12.75c0 .621-.504 1.125-1.125 1.125m1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125m0 3.75h-7.5A1.125 1.125 0 0 1 12 18.375m9.75-12.75c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125m19.5 0v1.5c0 .621-.504 1.125-1.125 1.125M2.25 5.625v1.5c0 .621.504 1.125 1.125 1.125m0 0h17.25m-17.25 0h7.5c.621 0 1.125.504 1.125 1.125M3.375 8.25c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125m17.25-3.75h-7.5c-.621 0-1.125.504-1.125 1.125m8.625-1.125c.621 0 1.125.504 1.125 1.125v1.5c0 .621-.504 1.125-1.125 1.125" />
        </svg>
    );
}

function SendIcon({ className }) {
    return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
        </svg>
    );
}

function PaperclipIcon({ className }) {
    return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="m18.375 12.739-7.693 7.693a4.5 4.5 0 0 1-6.364-6.364l10.94-10.94A3 3 0 1 1 19.5 7.372L8.552 18.32m.009-.01-.01.01m5.699-9.941-7.81 7.81a1.5 1.5 0 0 0 2.112 2.13" />
        </svg>
    );
}

function XIcon({ className }) {
    return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
        </svg>
    );
}
