import { forwardRef } from 'react';

const Input = forwardRef(({
    label,
    error,
    hint,
    className = '',
    id,
    ...props
}, ref) => {
    const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;

    return (
        <div className="w-full">
            {label && (
                <label
                    htmlFor={inputId}
                    className="block font-display font-medium text-paper-800 mb-1.5"
                >
                    {label}
                </label>
            )}
            
            <input
                ref={ref}
                id={inputId}
                className={`
                    w-full
                    px-4 py-2.5
                    bg-white
                    border-2 border-paper-300
                    rounded-soft
                    text-paper-900
                    placeholder:text-paper-400
                    transition-all duration-200
                    hover:border-paper-400
                    focus:border-punch-500
                    focus:ring-0
                    focus:outline-none
                    disabled:bg-paper-100
                    disabled:cursor-not-allowed
                    ${error ? 'border-red-400 hover:border-red-500 focus:border-red-500' : ''}
                    ${className}
                `}
                {...props}
            />

            {hint && !error && (
                <p className="mt-1.5 text-sm text-paper-500">
                    {hint}
                </p>
            )}

            {error && (
                <p className="mt-1.5 text-sm text-red-600 flex items-center gap-1">
                    <WarningIcon />
                    {error}
                </p>
            )}
        </div>
    );
});

Input.displayName = 'Input';

// Textarea variant
const Textarea = forwardRef(({
    label,
    error,
    hint,
    className = '',
    rows = 4,
    id,
    ...props
}, ref) => {
    const inputId = id || `textarea-${Math.random().toString(36).substr(2, 9)}`;

    return (
        <div className="w-full">
            {label && (
                <label
                    htmlFor={inputId}
                    className="block font-display font-medium text-paper-800 mb-1.5"
                >
                    {label}
                </label>
            )}
            
            <textarea
                ref={ref}
                id={inputId}
                rows={rows}
                className={`
                    w-full
                    px-4 py-3
                    bg-white
                    border-2 border-paper-300
                    rounded-soft
                    text-paper-900
                    placeholder:text-paper-400
                    transition-all duration-200
                    hover:border-paper-400
                    focus:border-punch-500
                    focus:ring-0
                    focus:outline-none
                    resize-none
                    disabled:bg-paper-100
                    disabled:cursor-not-allowed
                    ${error ? 'border-red-400 hover:border-red-500 focus:border-red-500' : ''}
                    ${className}
                `}
                {...props}
            />

            {hint && !error && (
                <p className="mt-1.5 text-sm text-paper-500">
                    {hint}
                </p>
            )}

            {error && (
                <p className="mt-1.5 text-sm text-red-600 flex items-center gap-1">
                    <WarningIcon />
                    {error}
                </p>
            )}
        </div>
    );
});

Textarea.displayName = 'Textarea';

// Small warning icon for errors
const WarningIcon = () => (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
    </svg>
);

Input.Textarea = Textarea;

export default Input;
