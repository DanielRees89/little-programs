import { forwardRef } from 'react';

const variants = {
    primary: `
        bg-punch-500 text-white
        hover:bg-punch-600
        active:bg-punch-700
        shadow-soft hover:shadow-lifted
    `,
    secondary: `
        bg-paper-200 text-paper-800
        hover:bg-paper-300
        active:bg-paper-400
        border border-paper-300
    `,
    ghost: `
        bg-transparent text-paper-700
        hover:bg-paper-200
        active:bg-paper-300
    `,
    calm: `
        bg-calm-500 text-white
        hover:bg-calm-600
        active:bg-calm-700
        shadow-soft hover:shadow-lifted
    `,
};

const sizes = {
    sm: 'px-3 py-1.5 text-sm rounded-soft',
    md: 'px-4 py-2 text-base rounded-soft',
    lg: 'px-6 py-3 text-lg rounded-card',
    pill: 'px-6 py-2 text-base rounded-pill',
};

const Button = forwardRef(({
    children,
    variant = 'primary',
    size = 'md',
    className = '',
    disabled = false,
    loading = false,
    icon: Icon,
    iconPosition = 'left',
    ...props
}, ref) => {
    const baseStyles = `
        inline-flex items-center justify-center gap-2
        font-display font-semibold
        transition-all duration-200
        btn-bounce
        disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none
        focus-visible:ring-2 focus-visible:ring-punch-500 focus-visible:ring-offset-2
    `;

    return (
        <button
            ref={ref}
            disabled={disabled || loading}
            className={`
                ${baseStyles}
                ${variants[variant]}
                ${sizes[size]}
                ${className}
            `}
            {...props}
        >
            {loading ? (
                <>
                    <Spinner />
                    <span>Working...</span>
                </>
            ) : (
                <>
                    {Icon && iconPosition === 'left' && <Icon className="w-5 h-5" />}
                    {children}
                    {Icon && iconPosition === 'right' && <Icon className="w-5 h-5" />}
                </>
            )}
        </button>
    );
});

Button.displayName = 'Button';

// Little spinning loader
const Spinner = () => (
    <svg
        className="animate-spin h-5 w-5"
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
    >
        <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
        />
        <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        />
    </svg>
);

export default Button;
