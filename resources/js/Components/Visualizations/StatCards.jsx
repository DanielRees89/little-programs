// Single stat card
export function StatCard({
    label,
    value,
    change,
    changeLabel,
    icon: Icon,
    variant = 'default',
    className = '',
}) {
    const variants = {
        default: {
            bg: 'bg-white',
            iconBg: 'bg-paper-100',
            iconColor: 'text-paper-600',
        },
        punch: {
            bg: 'bg-punch-50',
            iconBg: 'bg-punch-100',
            iconColor: 'text-punch-600',
        },
        calm: {
            bg: 'bg-calm-50',
            iconBg: 'bg-calm-100',
            iconColor: 'text-calm-600',
        },
    };

    const style = variants[variant] || variants.default;
    const isPositive = change > 0;
    const isNegative = change < 0;

    return (
        <div className={`${style.bg} rounded-card border border-paper-200 p-5 ${className}`}>
            <div className="flex items-start justify-between mb-3">
                <span className="text-paper-500 text-sm font-medium">{label}</span>
                {Icon && (
                    <div className={`w-10 h-10 ${style.iconBg} rounded-soft flex items-center justify-center`}>
                        <Icon className={`w-5 h-5 ${style.iconColor}`} />
                    </div>
                )}
            </div>
            
            <div className="flex items-end gap-3">
                <span className="font-display text-3xl font-bold text-paper-900">
                    {typeof value === 'number' ? value.toLocaleString() : value}
                </span>
                
                {change !== undefined && (
                    <div className={`
                        flex items-center gap-1 px-2 py-0.5 rounded-pill text-sm font-medium
                        ${isPositive ? 'bg-calm-100 text-calm-700' : ''}
                        ${isNegative ? 'bg-red-100 text-red-700' : ''}
                        ${!isPositive && !isNegative ? 'bg-paper-100 text-paper-600' : ''}
                    `}>
                        {isPositive && <ArrowUpIcon className="w-3 h-3" />}
                        {isNegative && <ArrowDownIcon className="w-3 h-3" />}
                        <span>{Math.abs(change)}%</span>
                    </div>
                )}
            </div>

            {changeLabel && (
                <p className="text-paper-400 text-sm mt-2">{changeLabel}</p>
            )}
        </div>
    );
}

// Grid of stat cards
export function StatCardGrid({ children, columns = 4, className = '' }) {
    const gridCols = {
        2: 'grid-cols-1 sm:grid-cols-2',
        3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
        4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4',
    };

    return (
        <div className={`grid ${gridCols[columns] || gridCols[4]} gap-4 ${className}`}>
            {children}
        </div>
    );
}

// Compact stat for inline use
export function StatInline({ label, value, className = '' }) {
    return (
        <div className={`flex items-center justify-between py-2 ${className}`}>
            <span className="text-paper-500">{label}</span>
            <span className="font-display font-semibold text-paper-900">
                {typeof value === 'number' ? value.toLocaleString() : value}
            </span>
        </div>
    );
}

// Stat list for vertical display
export function StatList({ stats, className = '' }) {
    return (
        <div className={`bg-white rounded-card border border-paper-200 divide-y divide-paper-100 ${className}`}>
            {stats.map((stat, index) => (
                <div key={index} className="px-5 py-3 flex items-center justify-between">
                    <span className="text-paper-600">{stat.label}</span>
                    <span className="font-display font-semibold text-paper-900">
                        {typeof stat.value === 'number' ? stat.value.toLocaleString() : stat.value}
                    </span>
                </div>
            ))}
        </div>
    );
}

// Progress stat with bar
export function StatProgress({
    label,
    value,
    max = 100,
    format = 'percent',
    color = 'punch',
    className = '',
}) {
    const percentage = Math.min((value / max) * 100, 100);
    
    const colors = {
        punch: 'bg-punch-500',
        calm: 'bg-calm-500',
        paper: 'bg-paper-500',
    };

    const displayValue = format === 'percent' 
        ? `${percentage.toFixed(0)}%`
        : `${value.toLocaleString()} / ${max.toLocaleString()}`;

    return (
        <div className={className}>
            <div className="flex items-center justify-between mb-2">
                <span className="text-paper-600 text-sm">{label}</span>
                <span className="font-display font-semibold text-paper-900 text-sm">
                    {displayValue}
                </span>
            </div>
            <div className="h-2 bg-paper-100 rounded-full overflow-hidden">
                <div 
                    className={`h-full ${colors[color]} rounded-full transition-all duration-500`}
                    style={{ width: `${percentage}%` }}
                />
            </div>
        </div>
    );
}

// Icons
function ArrowUpIcon({ className }) {
    return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 10l7-7m0 0l7 7m-7-7v18" />
        </svg>
    );
}

function ArrowDownIcon({ className }) {
    return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
        </svg>
    );
}
