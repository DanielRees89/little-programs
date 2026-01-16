import {
    LineChart as RechartsLineChart,
    BarChart as RechartsBarChart,
    PieChart as RechartsPieChart,
    AreaChart as RechartsAreaChart,
    ScatterChart as RechartsScatterChart,
    Line,
    Bar,
    Pie,
    Area,
    Scatter,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    Cell,
} from 'recharts';

// Color palette matching our design system
const COLORS = {
    punch: ['#FF6B47', '#FF8A6B', '#FFB39E', '#FFD4C7'],
    calm: ['#14B8A9', '#2DD4C3', '#5EEADB', '#99F6ED'],
    paper: ['#585654', '#787673', '#A8A6A3', '#D4D2CF'],
    mixed: ['#FF6B47', '#14B8A9', '#585654', '#FF8A6B', '#2DD4C3', '#787673'],
};

// Custom tooltip styling
const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload || !payload.length) return null;

    return (
        <div className="bg-paper-900 text-paper-100 px-3 py-2 rounded-soft shadow-lifted text-sm">
            {label && <p className="font-medium mb-1">{label}</p>}
            {payload.map((entry, index) => (
                <p key={index} style={{ color: entry.color }}>
                    {entry.name}: {typeof entry.value === 'number' ? entry.value.toLocaleString() : entry.value}
                </p>
            ))}
        </div>
    );
};

// Wrapper for consistent chart container
function ChartContainer({ children, title, subtitle, height = 300, className = '' }) {
    return (
        <div className={`bg-white rounded-card border border-paper-200 p-4 ${className}`}>
            {(title || subtitle) && (
                <div className="mb-4">
                    {title && (
                        <h3 className="font-display font-semibold text-paper-900">{title}</h3>
                    )}
                    {subtitle && (
                        <p className="text-paper-500 text-sm">{subtitle}</p>
                    )}
                </div>
            )}
            <div style={{ height }}>
                <ResponsiveContainer width="100%" height="100%">
                    {children}
                </ResponsiveContainer>
            </div>
        </div>
    );
}

// Line Chart
export function LineChart({
    data,
    xKey,
    yKeys,
    title,
    subtitle,
    height = 300,
    colors = 'mixed',
    showGrid = true,
    showLegend = true,
    className = '',
}) {
    const colorPalette = COLORS[colors] || COLORS.mixed;

    return (
        <ChartContainer title={title} subtitle={subtitle} height={height} className={className}>
            <RechartsLineChart data={data} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                {showGrid && <CartesianGrid strokeDasharray="3 3" stroke="#E8E6E3" />}
                <XAxis 
                    dataKey={xKey} 
                    tick={{ fill: '#787673', fontSize: 12 }}
                    axisLine={{ stroke: '#D4D2CF' }}
                    tickLine={{ stroke: '#D4D2CF' }}
                />
                <YAxis 
                    tick={{ fill: '#787673', fontSize: 12 }}
                    axisLine={{ stroke: '#D4D2CF' }}
                    tickLine={{ stroke: '#D4D2CF' }}
                />
                <Tooltip content={<CustomTooltip />} />
                {showLegend && <Legend />}
                {yKeys.map((key, index) => (
                    <Line
                        key={key}
                        type="monotone"
                        dataKey={key}
                        stroke={colorPalette[index % colorPalette.length]}
                        strokeWidth={2}
                        dot={{ fill: colorPalette[index % colorPalette.length], strokeWidth: 0, r: 4 }}
                        activeDot={{ r: 6, strokeWidth: 0 }}
                    />
                ))}
            </RechartsLineChart>
        </ChartContainer>
    );
}

// Bar Chart
export function BarChart({
    data,
    xKey,
    yKeys,
    title,
    subtitle,
    height = 300,
    colors = 'mixed',
    showGrid = true,
    showLegend = true,
    stacked = false,
    horizontal = false,
    className = '',
}) {
    const colorPalette = COLORS[colors] || COLORS.mixed;
    const ChartComponent = RechartsBarChart;

    return (
        <ChartContainer title={title} subtitle={subtitle} height={height} className={className}>
            <ChartComponent 
                data={data} 
                layout={horizontal ? 'vertical' : 'horizontal'}
                margin={{ top: 5, right: 20, bottom: 5, left: horizontal ? 80 : 0 }}
            >
                {showGrid && <CartesianGrid strokeDasharray="3 3" stroke="#E8E6E3" />}
                {horizontal ? (
                    <>
                        <XAxis type="number" tick={{ fill: '#787673', fontSize: 12 }} />
                        <YAxis 
                            type="category" 
                            dataKey={xKey} 
                            tick={{ fill: '#787673', fontSize: 12 }}
                            width={80}
                        />
                    </>
                ) : (
                    <>
                        <XAxis 
                            dataKey={xKey} 
                            tick={{ fill: '#787673', fontSize: 12 }}
                            axisLine={{ stroke: '#D4D2CF' }}
                        />
                        <YAxis tick={{ fill: '#787673', fontSize: 12 }} />
                    </>
                )}
                <Tooltip content={<CustomTooltip />} />
                {showLegend && yKeys.length > 1 && <Legend />}
                {yKeys.map((key, index) => (
                    <Bar
                        key={key}
                        dataKey={key}
                        fill={colorPalette[index % colorPalette.length]}
                        stackId={stacked ? 'stack' : undefined}
                        radius={stacked ? 0 : [4, 4, 0, 0]}
                    />
                ))}
            </ChartComponent>
        </ChartContainer>
    );
}

// Pie Chart
export function PieChart({
    data,
    dataKey,
    nameKey,
    title,
    subtitle,
    height = 300,
    colors = 'mixed',
    showLegend = true,
    donut = false,
    className = '',
}) {
    const colorPalette = COLORS[colors] || COLORS.mixed;

    return (
        <ChartContainer title={title} subtitle={subtitle} height={height} className={className}>
            <RechartsPieChart>
                <Pie
                    data={data}
                    dataKey={dataKey}
                    nameKey={nameKey}
                    cx="50%"
                    cy="50%"
                    innerRadius={donut ? '50%' : 0}
                    outerRadius="80%"
                    paddingAngle={2}
                    label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                    labelLine={{ stroke: '#A8A6A3' }}
                >
                    {data.map((entry, index) => (
                        <Cell 
                            key={`cell-${index}`} 
                            fill={colorPalette[index % colorPalette.length]}
                        />
                    ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                {showLegend && <Legend />}
            </RechartsPieChart>
        </ChartContainer>
    );
}

// Area Chart
export function AreaChart({
    data,
    xKey,
    yKeys,
    title,
    subtitle,
    height = 300,
    colors = 'mixed',
    showGrid = true,
    showLegend = true,
    stacked = false,
    className = '',
}) {
    const colorPalette = COLORS[colors] || COLORS.mixed;

    return (
        <ChartContainer title={title} subtitle={subtitle} height={height} className={className}>
            <RechartsAreaChart data={data} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                {showGrid && <CartesianGrid strokeDasharray="3 3" stroke="#E8E6E3" />}
                <XAxis 
                    dataKey={xKey} 
                    tick={{ fill: '#787673', fontSize: 12 }}
                />
                <YAxis tick={{ fill: '#787673', fontSize: 12 }} />
                <Tooltip content={<CustomTooltip />} />
                {showLegend && <Legend />}
                {yKeys.map((key, index) => (
                    <Area
                        key={key}
                        type="monotone"
                        dataKey={key}
                        stroke={colorPalette[index % colorPalette.length]}
                        fill={colorPalette[index % colorPalette.length]}
                        fillOpacity={0.3}
                        stackId={stacked ? 'stack' : undefined}
                    />
                ))}
            </RechartsAreaChart>
        </ChartContainer>
    );
}

// Scatter Chart
export function ScatterChart({
    data,
    xKey,
    yKey,
    title,
    subtitle,
    height = 300,
    color = '#FF6B47',
    showGrid = true,
    className = '',
}) {
    return (
        <ChartContainer title={title} subtitle={subtitle} height={height} className={className}>
            <RechartsScatterChart margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                {showGrid && <CartesianGrid strokeDasharray="3 3" stroke="#E8E6E3" />}
                <XAxis 
                    dataKey={xKey} 
                    name={xKey}
                    tick={{ fill: '#787673', fontSize: 12 }}
                    type="number"
                />
                <YAxis 
                    dataKey={yKey} 
                    name={yKey}
                    tick={{ fill: '#787673', fontSize: 12 }}
                    type="number"
                />
                <Tooltip content={<CustomTooltip />} cursor={{ strokeDasharray: '3 3' }} />
                <Scatter data={data} fill={color}>
                    {data.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={color} />
                    ))}
                </Scatter>
            </RechartsScatterChart>
        </ChartContainer>
    );
}

export { COLORS, ChartContainer };
