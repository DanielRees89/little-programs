import { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/Components/UI';

export default function ChatInput({ onSend, disabled = false, placeholder }) {
    const [message, setMessage] = useState('');
    const [attachedFiles, setAttachedFiles] = useState([]);
    const [isDragging, setIsDragging] = useState(false);
    const [fileValidationError, setFileValidationError] = useState(null);
    const textareaRef = useRef(null);
    const fileInputRef = useRef(null);
    // Track object URLs for cleanup
    const objectUrlsRef = useRef(new Map());

    // Auto-resize textarea
    useEffect(() => {
        const textarea = textareaRef.current;
        if (textarea) {
            textarea.style.height = 'auto';
            textarea.style.height = Math.min(textarea.scrollHeight, 200) + 'px';
        }
    }, [message]);

    // Cleanup object URLs on unmount
    useEffect(() => {
        return () => {
            // Revoke all object URLs when component unmounts
            objectUrlsRef.current.forEach((url) => {
                URL.revokeObjectURL(url);
            });
            objectUrlsRef.current.clear();
        };
    }, []);

    const handleSubmit = (e) => {
        e.preventDefault();
        if ((message.trim() || attachedFiles.length > 0) && !disabled) {
            onSend(message.trim(), attachedFiles);
            setMessage('');
            // Cleanup all object URLs when submitting
            objectUrlsRef.current.forEach((url) => {
                URL.revokeObjectURL(url);
            });
            objectUrlsRef.current.clear();
            setAttachedFiles([]);
            setFileValidationError(null);
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
        const validMimeTypes = [
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
            'application/octet-stream', // Allow this, but validate by extension
        ];

        // Extension-based validation as fallback for unreliable MIME types
        const validExtensions = [
            '.csv', '.pdf', '.png', '.jpg', '.jpeg', '.gif', '.webp',
            '.txt', '.json', '.xls', '.xlsx'
        ];

        const maxSize = 10 * 1024 * 1024; // 10MB
        const maxFiles = 5;
        const currentCount = attachedFiles.length;

        let rejectedFiles = [];
        let validFiles = [];

        for (const file of files) {
            const extension = '.' + (file.name.split('.').pop()?.toLowerCase() || '');
            const isMimeValid = validMimeTypes.includes(file.type);
            const isExtensionValid = validExtensions.includes(extension);

            // Accept if MIME type is valid, OR if extension is valid (for unreliable MIME types)
            const isTypeValid = isMimeValid || isExtensionValid;

            if (!isTypeValid) {
                rejectedFiles.push({ name: file.name, reason: 'Unsupported file type' });
            } else if (file.size > maxSize) {
                rejectedFiles.push({ name: file.name, reason: 'File too large (max 10MB)' });
            } else if (currentCount + validFiles.length >= maxFiles) {
                rejectedFiles.push({ name: file.name, reason: 'Maximum 5 files allowed' });
            } else {
                validFiles.push(file);
            }
        }

        // Show validation error if any files were rejected
        if (rejectedFiles.length > 0) {
            const errorMsg = rejectedFiles
                .map(f => `${f.name}: ${f.reason}`)
                .join(', ');
            setFileValidationError(errorMsg);
            // Auto-clear error after 5 seconds
            setTimeout(() => setFileValidationError(null), 5000);
        }

        if (validFiles.length > 0) {
            setAttachedFiles(prev => [...prev, ...validFiles].slice(0, maxFiles));
        }
    };

    const removeFile = (index) => {
        setAttachedFiles(prev => {
            const fileToRemove = prev[index];
            // Cleanup object URL for the removed file
            if (fileToRemove && objectUrlsRef.current.has(fileToRemove)) {
                URL.revokeObjectURL(objectUrlsRef.current.get(fileToRemove));
                objectUrlsRef.current.delete(fileToRemove);
            }
            return prev.filter((_, i) => i !== index);
        });
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

    // Handle clipboard paste for images
    const handlePaste = (e) => {
        const clipboardData = e.clipboardData;
        if (!clipboardData) return;

        const items = Array.from(clipboardData.items || []);
        const imageItems = items.filter(item => item.type.startsWith('image/'));

        if (imageItems.length > 0) {
            e.preventDefault(); // Prevent pasting image as text
            
            const files = imageItems
                .map(item => {
                    const file = item.getAsFile();
                    if (file) {
                        // Give pasted images a meaningful name with timestamp
                        const extension = file.type.split('/')[1] || 'png';
                        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
                        const newFile = new File([file], `pasted-image-${timestamp}.${extension}`, {
                            type: file.type,
                        });
                        return newFile;
                    }
                    return null;
                })
                .filter(Boolean);

            if (files.length > 0) {
                addFiles(files);
            }
        }
    };

    // Generate preview URL for image files (with caching to prevent memory leaks)
    const getFilePreview = useCallback((file) => {
        if (file.type.startsWith('image/')) {
            // Check if we already have a URL for this file
            if (objectUrlsRef.current.has(file)) {
                return objectUrlsRef.current.get(file);
            }
            // Create new URL and cache it
            const url = URL.createObjectURL(file);
            objectUrlsRef.current.set(file, url);
            return url;
        }
        return null;
    }, []);

    return (
        <form
            onSubmit={handleSubmit}
            className={`border-t border-paper-200 p-4 bg-white transition-colors ${isDragging ? 'bg-punch-50' : ''}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
        >
            {/* File validation error */}
            {fileValidationError && (
                <div className="mb-3 p-2 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm flex items-center justify-between">
                    <span className="flex items-center gap-2">
                        <AlertIcon className="w-4 h-4 flex-shrink-0" />
                        <span>{fileValidationError}</span>
                    </span>
                    <button
                        type="button"
                        onClick={() => setFileValidationError(null)}
                        className="p-1 hover:bg-red-100 rounded transition-colors"
                    >
                        <XIcon className="w-4 h-4" />
                    </button>
                </div>
            )}

            {/* Attached files preview */}
            {attachedFiles.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-3">
                    {attachedFiles.map((file, index) => {
                        const imagePreview = getFilePreview(file);
                        
                        return (
                            <div
                                key={index}
                                className={`relative group ${
                                    imagePreview 
                                        ? 'w-20 h-20 rounded-lg overflow-hidden border-2 border-paper-200' 
                                        : 'flex items-center gap-2 px-3 py-1.5 bg-paper-100 rounded-full'
                                }`}
                            >
                                {imagePreview ? (
                                    <>
                                        <img
                                            src={imagePreview}
                                            alt={file.name}
                                            className="w-full h-full object-cover"
                                        />
                                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center">
                                            <button
                                                type="button"
                                                onClick={() => removeFile(index)}
                                                className="p-1.5 bg-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                                            >
                                                <XIcon className="w-4 h-4 text-paper-600" />
                                            </button>
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <FileTypeIcon type={file.type} className="w-4 h-4 text-paper-500" />
                                        <span className="text-paper-700 max-w-[150px] truncate text-sm">
                                            {file.name}
                                        </span>
                                        <button
                                            type="button"
                                            onClick={() => removeFile(index)}
                                            className="p-0.5 hover:bg-paper-200 rounded-full transition-colors"
                                        >
                                            <XIcon className="w-3.5 h-3.5 text-paper-400" />
                                        </button>
                                    </>
                                )}
                            </div>
                        );
                    })}
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
                        onPaste={handlePaste}
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
                Press Enter to send • Shift+Enter for new line • Paste or drag images • Click 📎 to attach files
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

function AlertIcon({ className }) {
    return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
        </svg>
    );
}
