import { useState, useCallback } from 'react';

const DropZone = ({
    onFileDrop,
    accept = '.csv',
    maxSize = 10 * 1024 * 1024, // 10MB default
    className = '',
    disabled = false,
}) => {
    const [isDragging, setIsDragging] = useState(false);
    const [error, setError] = useState(null);

    const handleDrag = useCallback((e) => {
        e.preventDefault();
        e.stopPropagation();
    }, []);

    const handleDragIn = useCallback((e) => {
        e.preventDefault();
        e.stopPropagation();
        if (!disabled) {
            setIsDragging(true);
            setError(null);
        }
    }, [disabled]);

    const handleDragOut = useCallback((e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
    }, []);

    const validateFile = (file) => {
        if (!file.name.endsWith('.csv')) {
            return 'Oops! We only accept CSV files for now.';
        }
        if (file.size > maxSize) {
            return `That file is too chunky! Max size is ${Math.round(maxSize / 1024 / 1024)}MB.`;
        }
        return null;
    };

    const handleDrop = useCallback((e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);

        if (disabled) return;

        const files = e.dataTransfer?.files;
        if (files && files.length > 0) {
            const file = files[0];
            const validationError = validateFile(file);
            
            if (validationError) {
                setError(validationError);
                return;
            }

            setError(null);
            onFileDrop?.(file);
        }
    }, [disabled, maxSize, onFileDrop]);

    const handleFileSelect = useCallback((e) => {
        const files = e.target.files;
        if (files && files.length > 0) {
            const file = files[0];
            const validationError = validateFile(file);
            
            if (validationError) {
                setError(validationError);
                return;
            }

            setError(null);
            onFileDrop?.(file);
        }
        // Reset input so same file can be selected again
        e.target.value = '';
    }, [maxSize, onFileDrop]);

    return (
        <div className={className}>
            <label
                onDragEnter={handleDragIn}
                onDragLeave={handleDragOut}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                className={`
                    relative
                    flex flex-col items-center justify-center
                    w-full min-h-[200px]
                    p-8
                    border-2 border-dashed
                    rounded-card
                    cursor-pointer
                    transition-all duration-200
                    ${isDragging
                        ? 'border-punch-500 bg-punch-50 drop-target-active'
                        : 'border-paper-300 bg-paper-50 hover:border-paper-400 hover:bg-paper-100'
                    }
                    ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
                    ${error ? 'border-red-300 bg-red-50' : ''}
                `}
            >
                <input
                    type="file"
                    accept={accept}
                    onChange={handleFileSelect}
                    disabled={disabled}
                    className="sr-only"
                />

                {/* Icon */}
                <div className={`
                    mb-4 p-4 rounded-full
                    transition-all duration-200
                    ${isDragging ? 'bg-punch-100 scale-110' : 'bg-paper-200'}
                `}>
                    <FileIcon isDragging={isDragging} />
                </div>

                {/* Text */}
                <p className="font-display font-semibold text-lg text-paper-800 text-center mb-1">
                    {isDragging ? "Drop it like it's hot!" : "Drop your data here"}
                </p>
                <p className="text-paper-500 text-sm text-center">
                    {isDragging ? "We're ready for it" : "or click to browse your files"}
                </p>

                {/* File type hint */}
                <div className="mt-4 flex items-center gap-2">
                    <span className="px-2 py-1 bg-paper-200 text-paper-600 text-xs font-mono rounded">
                        .csv
                    </span>
                    <span className="text-paper-400 text-xs">
                        up to {Math.round(maxSize / 1024 / 1024)}MB
                    </span>
                </div>
            </label>

            {/* Error message */}
            {error && (
                <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-soft">
                    <p className="text-red-600 text-sm flex items-center gap-2">
                        <SadFaceIcon />
                        {error}
                    </p>
                </div>
            )}
        </div>
    );
};

// Cute file icon that animates
const FileIcon = ({ isDragging }) => (
    <svg
        className={`w-8 h-8 transition-colors duration-200 ${isDragging ? 'text-punch-500' : 'text-paper-500'}`}
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
    >
        <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
        />
    </svg>
);

const SadFaceIcon = () => (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
        />
    </svg>
);

export default DropZone;
