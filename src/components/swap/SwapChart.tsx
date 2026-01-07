import { useState, useMemo } from 'react';

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────
interface Token {
    symbol: string;
    price: number;
}

interface SwapChartProps {
    fromToken: Token | null;
    toToken: Token | null;
}

type Timeframe = '24H' | '7D' | '30D';

interface DataPoint {
    timestamp: number;
    rate: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// MOCK DATA GENERATOR (simulates subgraph response)
// ─────────────────────────────────────────────────────────────────────────────
const generateMockPriceData = (
    baseRate: number,
    timeframe: Timeframe
): DataPoint[] => {
    const now = Date.now();
    const points: DataPoint[] = [];
    
    const config = {
        '24H': { duration: 24 * 60 * 60 * 1000, interval: 60 * 60 * 1000, volatility: 0.02 },
        '7D': { duration: 7 * 24 * 60 * 60 * 1000, interval: 4 * 60 * 60 * 1000, volatility: 0.05 },
        '30D': { duration: 30 * 24 * 60 * 60 * 1000, interval: 24 * 60 * 60 * 1000, volatility: 0.10 },
    };
    
    const { duration, interval, volatility } = config[timeframe];
    const numPoints = Math.floor(duration / interval);
    
    let currentRate = baseRate * (1 - volatility / 2 + Math.random() * volatility);
    
    for (let i = 0; i < numPoints; i++) {
        const timestamp = now - duration + (i * interval);
        const change = (Math.random() - 0.5) * volatility * baseRate * 0.1;
        currentRate = Math.max(currentRate + change, baseRate * 0.8);
        currentRate = Math.min(currentRate, baseRate * 1.2);
        points.push({ timestamp, rate: currentRate });
    }
    
    // Ensure last point is close to current rate
    points.push({ timestamp: now, rate: baseRate });
    
    return points;
};

// ─────────────────────────────────────────────────────────────────────────────
// CHART COMPONENT
// ─────────────────────────────────────────────────────────────────────────────
export const SwapChart: React.FC<SwapChartProps> = ({ fromToken, toToken }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const [timeframe, setTimeframe] = useState<Timeframe>('7D');
    const [hoveredPoint, setHoveredPoint] = useState<DataPoint | null>(null);

    // Current rate
    const currentRate = useMemo(() => {
        if (!fromToken || !toToken) return 0;
        return fromToken.price / toToken.price;
    }, [fromToken, toToken]);

    // Generate price data
    const priceData = useMemo(() => {
        if (!currentRate) return [];
        return generateMockPriceData(currentRate, timeframe);
    }, [currentRate, timeframe]);

    // Calculate 24h change
    const change24h = useMemo(() => {
        if (priceData.length < 2) return { value: 0, percent: 0 };
        const oldRate = priceData[0].rate;
        const newRate = priceData[priceData.length - 1].rate;
        return {
            value: newRate - oldRate,
            percent: ((newRate - oldRate) / oldRate) * 100,
        };
    }, [priceData]);

    // Chart dimensions
    const width = 320;
    const height = 120;
    const padding = { top: 10, right: 10, bottom: 20, left: 10 };
    const chartWidth = width - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;

    // Scale data to chart
    const scaledPath = useMemo(() => {
        if (priceData.length < 2) return '';
        
        const minRate = Math.min(...priceData.map(d => d.rate));
        const maxRate = Math.max(...priceData.map(d => d.rate));
        const rateRange = maxRate - minRate || 1;
        
        const minTime = priceData[0].timestamp;
        const maxTime = priceData[priceData.length - 1].timestamp;
        const timeRange = maxTime - minTime || 1;
        
        return priceData.map((point, i) => {
            const x = padding.left + ((point.timestamp - minTime) / timeRange) * chartWidth;
            const y = padding.top + chartHeight - ((point.rate - minRate) / rateRange) * chartHeight;
            return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
        }).join(' ');
    }, [priceData, chartWidth, chartHeight]);

    // Area fill path
    const areaPath = useMemo(() => {
        if (!scaledPath) return '';
        const firstX = padding.left;
        const lastX = padding.left + chartWidth;
        const bottom = padding.top + chartHeight;
        return `${scaledPath} L ${lastX} ${bottom} L ${firstX} ${bottom} Z`;
    }, [scaledPath, chartWidth, chartHeight]);

    if (!fromToken || !toToken) return null;

    const isPositive = change24h.percent >= 0;

    return (
        <div className="swap-chart">
            {/* Header - Always visible */}
            <div 
                className="swap-chart__header"
                onClick={() => setIsExpanded(!isExpanded)}
            >
                <div className="swap-chart__pair">
                    <span className="swap-chart__pair-text">
                        {fromToken.symbol}/{toToken.symbol}
                    </span>
                    <span className="swap-chart__rate">
                        1 {fromToken.symbol} = {currentRate.toLocaleString(undefined, { 
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 6 
                        })} {toToken.symbol}
                    </span>
                </div>
                <div className="swap-chart__change-row">
                    <span className={`swap-chart__change ${isPositive ? 'swap-chart__change--up' : 'swap-chart__change--down'}`}>
                        {isPositive ? '▲' : '▼'} {Math.abs(change24h.percent).toFixed(2)}%
                    </span>
                    <span className="swap-chart__expand-icon">
                        {isExpanded ? '▾' : '▸'}
                    </span>
                </div>
            </div>

            {/* Expanded Chart */}
            {isExpanded && (
                <div className="swap-chart__body">
                    {/* Timeframe Toggle */}
                    <div className="swap-chart__timeframes">
                        {(['24H', '7D', '30D'] as Timeframe[]).map(tf => (
                            <button
                                key={tf}
                                className={`swap-chart__tf-btn ${timeframe === tf ? 'swap-chart__tf-btn--active' : ''}`}
                                onClick={() => setTimeframe(tf)}
                            >
                                {tf}
                            </button>
                        ))}
                    </div>

                    {/* SVG Chart */}
                    <svg 
                        className="swap-chart__svg" 
                        viewBox={`0 0 ${width} ${height}`}
                        preserveAspectRatio="none"
                    >
                        {/* Gradient */}
                        <defs>
                            <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop 
                                    offset="0%" 
                                    stopColor={isPositive ? '#22C55E' : '#EF4444'} 
                                    stopOpacity="0.3" 
                                />
                                <stop 
                                    offset="100%" 
                                    stopColor={isPositive ? '#22C55E' : '#EF4444'} 
                                    stopOpacity="0" 
                                />
                            </linearGradient>
                        </defs>

                        {/* Area Fill */}
                        <path
                            d={areaPath}
                            fill="url(#chartGradient)"
                        />

                        {/* Line */}
                        <path
                            d={scaledPath}
                            fill="none"
                            stroke={isPositive ? '#22C55E' : '#EF4444'}
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        />
                    </svg>

                    {/* Hover info */}
                    {hoveredPoint && (
                        <div className="swap-chart__tooltip">
                            {hoveredPoint.rate.toFixed(6)} {toToken.symbol}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default SwapChart;
