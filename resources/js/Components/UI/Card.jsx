const variants = {
    default: `
        bg-white
        border border-paper-200
        shadow-card
    `,
    elevated: `
        bg-white
        shadow-lifted
    `,
    outlined: `
        bg-paper-50
        border-2 border-paper-300
        border-dashed
    `,
    interactive: `
        bg-white
        border border-paper-200
        shadow-card
        card-interactive
        hover:shadow-card-hover
        cursor-pointer
    `,
    script: `
        bg-white
        border-2 border-paper-300
        shadow-card
        card-interactive
        hover:shadow-card-hover
        hover:border-punch-400
        cursor-pointer
    `,
};

const Card = ({
    children,
    variant = 'default',
    className = '',
    padding = 'md',
    ...props
}) => {
    const paddingSizes = {
        none: '',
        sm: 'p-3',
        md: 'p-5',
        lg: 'p-6',
    };

    return (
        <div
            className={`
                rounded-card
                ${variants[variant]}
                ${paddingSizes[padding]}
                ${className}
            `}
            {...props}
        >
            {children}
        </div>
    );
};

// Sub-components for structured cards
const CardHeader = ({ children, className = '' }) => (
    <div className={`mb-4 ${className}`}>
        {children}
    </div>
);

const CardTitle = ({ children, className = '' }) => (
    <h3 className={`font-display font-semibold text-xl text-paper-900 ${className}`}>
        {children}
    </h3>
);

const CardDescription = ({ children, className = '' }) => (
    <p className={`text-paper-600 text-sm mt-1 ${className}`}>
        {children}
    </p>
);

const CardContent = ({ children, className = '' }) => (
    <div className={className}>
        {children}
    </div>
);

const CardFooter = ({ children, className = '' }) => (
    <div className={`mt-4 pt-4 border-t border-paper-200 ${className}`}>
        {children}
    </div>
);

// Badge for card corners (like "New" or "Python")
const CardBadge = ({ children, variant = 'default', className = '' }) => {
    const badgeVariants = {
        default: 'bg-paper-200 text-paper-700',
        punch: 'bg-punch-100 text-punch-700',
        calm: 'bg-calm-100 text-calm-700',
    };

    return (
        <span
            className={`
                inline-flex items-center
                px-2 py-0.5
                text-xs font-semibold font-display
                rounded-pill
                ${badgeVariants[variant]}
                ${className}
            `}
        >
            {children}
        </span>
    );
};

Card.Header = CardHeader;
Card.Title = CardTitle;
Card.Description = CardDescription;
Card.Content = CardContent;
Card.Footer = CardFooter;
Card.Badge = CardBadge;

export default Card;
