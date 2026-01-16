const illustrations = {
    scripts: (
        <svg className="w-24 h-24" viewBox="0 0 96 96" fill="none">
            {/* Cute stacked papers illustration */}
            <rect x="20" y="24" width="48" height="56" rx="4" className="fill-paper-200" transform="rotate(-6 20 24)" />
            <rect x="24" y="20" width="48" height="56" rx="4" className="fill-paper-100 stroke-paper-300" strokeWidth="2" />
            <path d="M34 36h28M34 44h20M34 52h24" className="stroke-paper-400" strokeWidth="2" strokeLinecap="round" />
            <circle cx="68" cy="64" r="12" className="fill-punch-100 stroke-punch-400" strokeWidth="2" />
            <path d="M65 64l3 3 5-6" className="stroke-punch-500" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    ),
    data: (
        <svg className="w-24 h-24" viewBox="0 0 96 96" fill="none">
            {/* Cute CSV/spreadsheet illustration */}
            <rect x="16" y="20" width="64" height="56" rx="4" className="fill-paper-100 stroke-paper-300" strokeWidth="2" />
            <path d="M16 36h64" className="stroke-paper-300" strokeWidth="2" />
            <path d="M40 36v40M60 36v40" className="stroke-paper-200" strokeWidth="2" />
            <circle cx="28" cy="28" r="4" className="fill-punch-400" />
            <circle cx="48" cy="28" r="4" className="fill-calm-400" />
            <circle cx="68" cy="28" r="4" className="fill-paper-400" />
            <path d="M24 48h12M44 48h12M24 60h12M44 60h12M64 48h12" className="stroke-paper-400" strokeWidth="2" strokeLinecap="round" />
        </svg>
    ),
    chat: (
        <svg className="w-24 h-24" viewBox="0 0 96 96" fill="none">
            {/* Cute chat bubbles illustration */}
            <rect x="12" y="24" width="44" height="32" rx="8" className="fill-paper-200" />
            <path d="M20 56l-4 12 12-8" className="fill-paper-200" />
            <circle cx="26" cy="40" r="3" className="fill-paper-400" />
            <circle cx="34" cy="40" r="3" className="fill-paper-400" />
            <circle cx="42" cy="40" r="3" className="fill-paper-400" />
            <rect x="40" y="44" width="44" height="28" rx="8" className="fill-punch-100 stroke-punch-300" strokeWidth="2" />
            <path d="M76 72l4 10-10-6" className="fill-punch-100 stroke-punch-300" strokeWidth="2" />
            <path d="M50 54h24M50 62h16" className="stroke-punch-400" strokeWidth="2" strokeLinecap="round" />
        </svg>
    ),
    results: (
        <svg className="w-24 h-24" viewBox="0 0 96 96" fill="none">
            {/* Cute results/chart illustration */}
            <rect x="16" y="20" width="64" height="56" rx="4" className="fill-paper-100 stroke-paper-300" strokeWidth="2" />
            <rect x="24" y="48" width="10" height="20" rx="2" className="fill-calm-300" />
            <rect x="38" y="36" width="10" height="32" rx="2" className="fill-calm-400" />
            <rect x="52" y="44" width="10" height="24" rx="2" className="fill-punch-300" />
            <rect x="66" y="28" width="10" height="40" rx="2" className="fill-punch-400" />
            <circle cx="76" cy="24" r="8" className="fill-white stroke-paper-300" strokeWidth="2" />
            <path d="M73 24l2 2 4-5" className="stroke-calm-500" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    ),
    search: (
        <svg className="w-24 h-24" viewBox="0 0 96 96" fill="none">
            {/* Cute magnifying glass illustration */}
            <circle cx="42" cy="42" r="20" className="fill-paper-100 stroke-paper-300" strokeWidth="3" />
            <path d="M56 56l18 18" className="stroke-paper-400" strokeWidth="4" strokeLinecap="round" />
            <circle cx="42" cy="42" r="10" className="stroke-paper-300" strokeWidth="2" strokeDasharray="4 4" />
            <path d="M38 38l8 0M38 46l12 0" className="stroke-punch-400" strokeWidth="2" strokeLinecap="round" />
        </svg>
    ),
};

const EmptyState = ({
    illustration = 'scripts',
    title = "Nothing here yet",
    description = "Get started by creating something new.",
    action,
    className = '',
}) => {
    return (
        <div className={`flex flex-col items-center justify-center py-12 px-6 ${className}`}>
            {/* Illustration */}
            <div className="mb-6 animate-bounce-soft">
                {illustrations[illustration] || illustrations.scripts}
            </div>

            {/* Text */}
            <h3 className="font-display font-semibold text-xl text-paper-800 text-center mb-2">
                {title}
            </h3>
            <p className="text-paper-500 text-center max-w-sm mb-6">
                {description}
            </p>

            {/* Action button */}
            {action && (
                <div className="animate-fade-in">
                    {action}
                </div>
            )}
        </div>
    );
};

export default EmptyState;
