import { useEffect, useCallback } from 'react';

const sizes = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
    full: 'max-w-[90vw]',
};

function Modal({
    isOpen,
    onClose,
    children,
    size = 'md',
    closeOnBackdrop = true,
    closeOnEscape = true,
}) {
    // Handle escape key
    const handleEscape = useCallback((e) => {
        if (e.key === 'Escape' && closeOnEscape) {
            onClose();
        }
    }, [onClose, closeOnEscape]);

    // Add/remove escape listener and lock body scroll
    useEffect(() => {
        if (isOpen) {
            document.addEventListener('keydown', handleEscape);
            document.body.style.overflow = 'hidden';
        }

        return () => {
            document.removeEventListener('keydown', handleEscape);
            document.body.style.overflow = 'unset';
        };
    }, [isOpen, handleEscape]);

    if (!isOpen) return null;

    const handleBackdropClick = (e) => {
        if (e.target === e.currentTarget && closeOnBackdrop) {
            onClose();
        }
    };

    return (
        <div 
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            onClick={handleBackdropClick}
        >
            {/* Backdrop */}
            <div className="absolute inset-0 bg-paper-900/50 backdrop-blur-sm animate-fade-in" />

            {/* Modal container */}
            <div 
                className={`
                    relative bg-white rounded-card shadow-lifted w-full
                    max-h-[90vh] overflow-hidden
                    animate-bounce-soft
                    ${sizes[size]}
                `}
            >
                {children}
            </div>
        </div>
    );
}

// Modal Header
function ModalHeader({ children, onClose, className = '' }) {
    return (
        <div className={`flex items-start justify-between p-5 border-b border-paper-200 ${className}`}>
            <div className="flex-1">
                {children}
            </div>
            {onClose && (
                <button
                    onClick={onClose}
                    className="p-2 hover:bg-paper-100 rounded-soft transition-colors -mr-2 -mt-2"
                >
                    <CloseIcon className="w-5 h-5 text-paper-400" />
                </button>
            )}
        </div>
    );
}

// Modal Title (for use inside ModalHeader)
function ModalTitle({ children, className = '' }) {
    return (
        <h2 className={`font-display font-semibold text-lg text-paper-900 ${className}`}>
            {children}
        </h2>
    );
}

// Modal Description (for use inside ModalHeader)
function ModalDescription({ children, className = '' }) {
    return (
        <p className={`text-paper-500 text-sm mt-1 ${className}`}>
            {children}
        </p>
    );
}

// Modal Body
function ModalBody({ children, className = '' }) {
    return (
        <div className={`p-5 overflow-y-auto max-h-[calc(90vh-180px)] ${className}`}>
            {children}
        </div>
    );
}

// Modal Footer
function ModalFooter({ children, className = '' }) {
    return (
        <div className={`flex items-center justify-end gap-3 p-5 border-t border-paper-200 bg-paper-50 ${className}`}>
            {children}
        </div>
    );
}

// Modal Icon (decorative icon for header)
function ModalIcon({ children, variant = 'default', className = '' }) {
    const variants = {
        default: 'bg-paper-100',
        punch: 'bg-punch-100',
        calm: 'bg-calm-100',
        danger: 'bg-red-100',
    };

    return (
        <div className={`w-10 h-10 rounded-card flex items-center justify-center ${variants[variant]} ${className}`}>
            {children}
        </div>
    );
}

function CloseIcon({ className }) {
    return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
    );
}

// Attach sub-components
Modal.Header = ModalHeader;
Modal.Title = ModalTitle;
Modal.Description = ModalDescription;
Modal.Body = ModalBody;
Modal.Footer = ModalFooter;
Modal.Icon = ModalIcon;

export default Modal;
