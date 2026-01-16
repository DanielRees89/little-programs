import { useState } from 'react';
import { Button } from '@/Components/UI';
import { LineChart, BarChart, PieChart, AreaChart, ScatterChart } from './Charts';
import { StatCard, StatCardGrid, StatList, StatProgress } from './StatCards';
import { DataTable } from './DataTable';

export function OutputPanel({ output, className = '' }) {
    const [activeTab, setActiveTab] = useState(0);

    if (!output) return null;

    // If output is a simple string, render as text
    if (typeof output === 'string') {
        return <TextOutput content={output} className={className} />;
    }

    // If output has sections, render tabs
    const sections = output.sections || [output];

    return (
        <div className={`bg-white rounded-card border border-paper-200 overflow-hidden ${className}`}>
            {/* Tabs if multiple sections */}
            {sections.length > 1 && (
                <div className="border-b border-paper-200 px-4">
                    <div className="flex gap-1 overflow-x-auto">
                        {sections.map((section, index) => (
                            <button
                                key={index}
                                onClick={() => setActiveTab(index)}
                                className={`
                                    px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors
                                    ${activeTab === index
                                        ? 'border-punch-500 text-punch-600'
                                        : 'border-transparent text-paper-500 hover:text-paper-700'
                                    }
                                `}
                            >
                                {section.title || `Output ${index + 1}`}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Content */}
            <div className="p-5">
                <OutputSection section={sections[activeTab]} />
            </div>
        </div>
    );
}

// Render a single output section
function OutputSection({ section }) {
    if (!section) return null;

    switch (section.type) {
        case 'text':
            return <TextOutput content={section.content} />;
        
        case 'stats':
            return <StatsOutput stats={section.stats} layout={section.layout} />;
        
        case 'chart':
            return <ChartOutput chart={section.chart} />;
        
        case 'table':
            return (
                <DataTable
                    data={section.data}
                    columns={section.columns}
                    title={section.title}
                    filterable={section.filterable}
                    sortable={section.sortable}
                />
            );
        
        case 'mixed':
            return <MixedOutput items={section.items} />;
        
        default:
            // Try to auto-detect content type
            if (typeof section.content === 'string') {
                return <TextOutput content={section.content} />;
            }
            return <TextOutput content={JSON.stringify(section, null, 2)} />;
    }
}

// Text output (terminal style)
function TextOutput({ content, className = '' }) {
    return (
        <div className={`bg-paper-900 rounded-card p-4 overflow-auto max-h-[500px] ${className}`}>
            <pre className="text-paper-100 text-sm font-mono whitespace-pre-wrap leading-relaxed">
                {content}
            </pre>
        </div>
    );
}

// Stats output
function StatsOutput({ stats, layout = 'grid' }) {
    if (layout === 'list') {
        return <StatList stats={stats} />;
    }

    return (
        <StatCardGrid columns={Math.min(stats.length, 4)}>
            {stats.map((stat, index) => (
                <StatCard
                    key={index}
                    label={stat.label}
                    value={stat.value}
                    change={stat.change}
                    changeLabel={stat.changeLabel}
                    variant={stat.variant}
                />
            ))}
        </StatCardGrid>
    );
}

// Chart output
function ChartOutput({ chart }) {
    const { type, ...props } = chart;

    switch (type) {
        case 'line':
            return <LineChart {...props} />;
        case 'bar':
            return <BarChart {...props} />;
        case 'pie':
            return <PieChart {...props} />;
        case 'area':
            return <AreaChart {...props} />;
        case 'scatter':
            return <ScatterChart {...props} />;
        default:
            return <p className="text-paper-500">Unknown chart type: {type}</p>;
    }
}

// Mixed output (multiple items in one section)
function MixedOutput({ items }) {
    return (
        <div className="space-y-6">
            {items.map((item, index) => (
                <OutputSection key={index} section={item} />
            ))}
        </div>
    );
}

// Export options component
export function OutputExportBar({ output, fileName = 'analysis_result', onExport }) {
    const [exporting, setExporting] = useState(null);

    const handleExport = async (format) => {
        setExporting(format);
        try {
            await onExport(format, output, fileName);
        } catch (error) {
            console.error('Export failed:', error);
        }
        setExporting(null);
    };

    return (
        <div className="flex items-center gap-2 p-4 bg-paper-50 border-t border-paper-200">
            <span className="text-paper-500 text-sm mr-2">Export as:</span>
            
            <ExportButton
                format="txt"
                label="Text"
                icon={TextIcon}
                onClick={() => handleExport('txt')}
                loading={exporting === 'txt'}
            />
            <ExportButton
                format="csv"
                label="CSV"
                icon={TableIcon}
                onClick={() => handleExport('csv')}
                loading={exporting === 'csv'}
            />
            <ExportButton
                format="xlsx"
                label="Excel"
                icon={ExcelIcon}
                onClick={() => handleExport('xlsx')}
                loading={exporting === 'xlsx'}
            />
            <ExportButton
                format="pdf"
                label="PDF"
                icon={PdfIcon}
                onClick={() => handleExport('pdf')}
                loading={exporting === 'pdf'}
            />
            <ExportButton
                format="png"
                label="Image"
                icon={ImageIcon}
                onClick={() => handleExport('png')}
                loading={exporting === 'png'}
            />
        </div>
    );
}

function ExportButton({ format, label, icon: Icon, onClick, loading }) {
    return (
        <button
            onClick={onClick}
            disabled={loading}
            className={`
                flex items-center gap-1.5 px-3 py-1.5 
                bg-white border border-paper-200 rounded-soft
                text-sm text-paper-600
                hover:bg-paper-50 hover:border-paper-300
                disabled:opacity-50
                transition-colors
            `}
        >
            {loading ? (
                <LoadingSpinner className="w-4 h-4" />
            ) : (
                <Icon className="w-4 h-4" />
            )}
            <span>{label}</span>
        </button>
    );
}

// Result summary header
export function OutputHeader({ 
    title, 
    subtitle, 
    status = 'success', 
    duration, 
    timestamp,
    className = '' 
}) {
    const statusConfig = {
        success: { icon: CheckIcon, color: 'text-calm-500', bg: 'bg-calm-50', label: 'Completed' },
        error: { icon: XIcon, color: 'text-red-500', bg: 'bg-red-50', label: 'Failed' },
        warning: { icon: WarningIcon, color: 'text-amber-500', bg: 'bg-amber-50', label: 'Completed with warnings' },
    };

    const config = statusConfig[status] || statusConfig.success;
    const StatusIcon = config.icon;

    return (
        <div className={`flex items-start justify-between p-5 border-b border-paper-200 ${className}`}>
            <div className="flex items-start gap-3">
                <div className={`w-10 h-10 ${config.bg} rounded-card flex items-center justify-center`}>
                    <StatusIcon className={`w-5 h-5 ${config.color}`} />
                </div>
                <div>
                    <h3 className="font-display font-semibold text-paper-900">
                        {title || 'Analysis Result'}
                    </h3>
                    {subtitle && (
                        <p className="text-paper-500 text-sm">{subtitle}</p>
                    )}
                </div>
            </div>
            
            <div className="flex items-center gap-4 text-sm text-paper-500">
                {duration && (
                    <span className="flex items-center gap-1">
                        <ClockIcon className="w-4 h-4" />
                        {duration}
                    </span>
                )}
                {timestamp && (
                    <span>
                        {new Date(timestamp).toLocaleString()}
                    </span>
                )}
            </div>
        </div>
    );
}

// Icons
function TextIcon({ className }) {
    return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
        </svg>
    );
}

function TableIcon({ className }) {
    return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.375 19.5h17.25m-17.25 0a1.125 1.125 0 01-1.125-1.125M3.375 19.5h7.5c.621 0 1.125-.504 1.125-1.125m-9.75 0V5.625m0 12.75v-1.5c0-.621.504-1.125 1.125-1.125m18.375 2.625V5.625m0 12.75c0 .621-.504 1.125-1.125 1.125m1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125m0 3.75h-7.5A1.125 1.125 0 0112 18.375" />
        </svg>
    );
}

function ExcelIcon({ className }) {
    return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 17.25v1.007a3 3 0 01-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0115 18.257V17.25m6-12V15a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 15V5.25m18 0A2.25 2.25 0 0018.75 3H5.25A2.25 2.25 0 003 5.25m18 0V12a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 12V5.25" />
        </svg>
    );
}

function PdfIcon({ className }) {
    return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
        </svg>
    );
}

function ImageIcon({ className }) {
    return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
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

function XIcon({ className }) {
    return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
    );
}

function WarningIcon({ className }) {
    return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
        </svg>
    );
}

function ClockIcon({ className }) {
    return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
    );
}

function LoadingSpinner({ className }) {
    return (
        <svg className={`animate-spin ${className}`} fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
    );
}
