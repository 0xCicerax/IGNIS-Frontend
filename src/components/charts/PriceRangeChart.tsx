import { useState, useRef, useMemo, useEffect } from 'react';
import { generateCandlesticks, generateLiquidityDepth } from '../../utils';

export const PriceRangeChart = ({ currentPrice, minPrice, maxPrice, setMinPrice, setMaxPrice, _type, token0, token1, baseAPR }) => {
    const chartRef = useRef(null);
    const [dragging, setDragging] = useState(null);
    const [hoveredCandle, setHoveredCandle] = useState(null);
    const [activeTimeframe, setActiveTimeframe] = useState('1M');
    const candles = useMemo(() => generateCandlesticks(currentPrice, 35), [currentPrice]);
    const liquidityDepth = useMemo(() => generateLiquidityDepth(currentPrice, 50), [currentPrice]);
    const allPrices = [...candles.flatMap(c => [c.high, c.low]), minPrice, maxPrice];
    const priceMin = Math.min(...allPrices) * 0.98;
    const priceMax = Math.max(...allPrices) * 1.02;
    const priceRange = priceMax - priceMin;
    const priceToY = (p) => ((priceMax - p) / priceRange) * 100;
    const yToPrice = (y) => priceMax - (y / 100) * priceRange;
    const getPercentFromCurrent = (price) => {
        const pct = ((price - currentPrice) / currentPrice) * 100;
        return pct >= 0 ? `+${pct.toFixed(1)}%` : `${pct.toFixed(1)}%`;
    };

    useEffect(() => {
        const handleMouseMove = (e) => {
            if (!dragging || !chartRef.current) return;
            const rect = chartRef.current.getBoundingClientRect();
            const y = Math.max(0, Math.min(100, ((e.clientY - rect.top) / rect.height) * 100));
            const price = yToPrice(y);
            if (dragging === 'min' && price < maxPrice * 0.99) setMinPrice(Math.max(priceMin, price));
            else if (dragging === 'max' && price > minPrice * 1.01) setMaxPrice(Math.min(priceMax, price));
        };
        const handleMouseUp = () => setDragging(null);
        if (dragging) {
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleMouseUp);
            return () => {
                window.removeEventListener('mousemove', handleMouseMove);
                window.removeEventListener('mouseup', handleMouseUp);
            };
        }
    }, [dragging, minPrice, maxPrice, priceMin, priceMax]);

    const chartWidth = 75;
    const depthWidth = 20;
    const candleWidth = chartWidth / candles.length * 0.7;

    return (
        <div className="price-chart">
            <div className="price-chart__header">
                <div className="price-chart__title">
                    <span className="price-chart__title-text">Price Chart</span>
                    <span className="price-chart__current">
                        Current: <span className="price-chart__current-value">{currentPrice.toFixed(currentPrice < 1 ? 6 : 2)}</span> {token1?.symbol}/{token0?.symbol}
                    </span>
                </div>
                <div className="price-chart__timeframes">
                    {['1D', '7D', '1M'].map(tf => (
                        <button 
                            key={tf} 
                            onClick={() => setActiveTimeframe(tf)}
                            className={`price-chart__tf-btn ${tf === activeTimeframe ? 'price-chart__tf-btn--active' : ''}`}
                        >
                            {tf}
                        </button>
                    ))}
                </div>
            </div>
            <div 
                ref={chartRef} 
                className={`price-chart__canvas ${dragging ? 'price-chart__canvas--dragging' : 'price-chart__canvas--crosshair'}`}
            >
                <svg width="100%" height="100%" style={{ position: 'absolute', left: 0, top: 0 }}>
                    <defs>
                        <linearGradient id="rangeGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                            <stop offset="0%" stopColor="rgba(167, 139, 250, 0.2)" />
                            <stop offset="50%" stopColor="rgba(167, 139, 250, 0.1)" />
                            <stop offset="100%" stopColor="rgba(167, 139, 250, 0.2)" />
                        </linearGradient>
                        <linearGradient id="depthGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor="rgba(245, 176, 65, 0.3)" />
                            <stop offset="100%" stopColor="rgba(245, 176, 65, 0.05)" />
                        </linearGradient>
                    </defs>
                    {[0.2, 0.4, 0.6, 0.8].map(y => (
                        <g key={y}>
                            <line x1="0" y1={`${y * 100}%`} x2="100%" y2={`${y * 100}%`} stroke="rgba(255,255,255,0.03)" strokeDasharray="4,4" />
                            <text x="2%" y={`${y * 100 - 1}%`} fill="#404040" fontSize="9" fontFamily="JetBrains Mono">{yToPrice(y * 100).toFixed(currentPrice < 1 ? 5 : 0)}</text>
                        </g>
                    ))}
                    {liquidityDepth.map((bin, i) => {
                        const y = priceToY(bin.price);
                        const barHeight = 100 / liquidityDepth.length * 0.9;
                        const barWidth = (bin.depth / 120) * depthWidth;
                        if (y < 0 || y > 100) return null;
                        return (
                            <rect key={i} x={`${100 - depthWidth - 2 + (depthWidth - barWidth)}%`} y={`${y - barHeight / 2}%`} width={`${barWidth}%`} height={`${barHeight}%`} fill={bin.isActive ? 'url(#depthGradient)' : 'rgba(255,255,255,0.06)'} rx="2" />
                        );
                    })}
                    <rect x="3%" y={`${priceToY(maxPrice)}%`} width={`${chartWidth + 2}%`} height={`${priceToY(minPrice) - priceToY(maxPrice)}%`} fill="url(#rangeGradient)" stroke="rgba(167, 139, 250, 0.4)" strokeWidth="1" rx="4" />
                    {candles.map((c, i) => {
                        const x = 3 + (i / candles.length) * chartWidth;
                        const isGreen = c.close >= c.open;
                        const color = isGreen ? '#22C55E' : '#EF4444';
                        const bodyTop = priceToY(Math.max(c.open, c.close));
                        const bodyBottom = priceToY(Math.min(c.open, c.close));
                        const bodyHeight = Math.max(0.5, bodyBottom - bodyTop);
                        const isHovered = hoveredCandle === i;
                        return (
                            <g key={i} onMouseEnter={() => setHoveredCandle(i)} onMouseLeave={() => setHoveredCandle(null)} style={{ cursor: 'pointer' }}>
                                <line x1={`${x + candleWidth / 2}%`} y1={`${priceToY(c.high)}%`} x2={`${x + candleWidth / 2}%`} y2={`${priceToY(c.low)}%`} stroke={color} strokeWidth={isHovered ? 2 : 1} />
                                <rect x={`${x}%`} y={`${bodyTop}%`} width={`${candleWidth}%`} height={`${bodyHeight}%`} fill={color} rx="1" opacity={isHovered ? 1 : 0.85} />
                            </g>
                        );
                    })}
                    <line x1="0" y1={`${priceToY(currentPrice)}%`} x2="100%" y2={`${priceToY(currentPrice)}%`} stroke="#22C55E" strokeWidth="2" strokeDasharray="6,4" />
                </svg>
                
                {/* Current Price Label */}
                <div className="price-chart__price-label price-chart__price-label--current" style={{ top: `${priceToY(currentPrice)}%` }}>
                    {currentPrice.toFixed(currentPrice < 1 ? 6 : 2)}
                </div>
                
                {/* Max Price Handle */}
                <div onMouseDown={() => setDragging('max')} className="price-chart__drag-handle" style={{ top: `${priceToY(maxPrice)}%` }}>
                    <div className="price-chart__drag-line">
                        <div className="price-chart__drag-line-bar" />
                        <div className="price-chart__drag-knob">▲</div>
                    </div>
                </div>
                <div className="price-chart__price-label price-chart__price-label--range" style={{ top: `${priceToY(maxPrice)}%` }}>
                    <div className="price-chart__price-label-value">{maxPrice.toFixed(currentPrice < 1 ? 6 : 2)}</div>
                    <div className="price-chart__price-label-pct">{getPercentFromCurrent(maxPrice)}</div>
                </div>
                
                {/* Min Price Handle */}
                <div onMouseDown={() => setDragging('min')} className="price-chart__drag-handle" style={{ top: `${priceToY(minPrice)}%` }}>
                    <div className="price-chart__drag-line">
                        <div className="price-chart__drag-line-bar" />
                        <div className="price-chart__drag-knob">▼</div>
                    </div>
                </div>
                <div className="price-chart__price-label price-chart__price-label--range" style={{ top: `${priceToY(minPrice)}%` }}>
                    <div className="price-chart__price-label-value">{minPrice.toFixed(currentPrice < 1 ? 6 : 2)}</div>
                    <div className="price-chart__price-label-pct">{getPercentFromCurrent(minPrice)}</div>
                </div>
                
                {/* Tooltip */}
                {hoveredCandle !== null && (
                    <div className="price-chart__tooltip" style={{ left: `${3 + (hoveredCandle / candles.length) * chartWidth + candleWidth}%`, top: 10 }}>
                        <div className="price-chart__tooltip-title">Day {hoveredCandle + 1}</div>
                        <div className="price-chart__tooltip-grid">
                            <span className="price-chart__tooltip-label">O:</span>
                            <span className="price-chart__tooltip-value">{candles[hoveredCandle].open.toFixed(2)}</span>
                            <span className="price-chart__tooltip-label">H:</span>
                            <span className="price-chart__tooltip-value price-chart__tooltip-value--high">{candles[hoveredCandle].high.toFixed(2)}</span>
                            <span className="price-chart__tooltip-label">L:</span>
                            <span className="price-chart__tooltip-value price-chart__tooltip-value--low">{candles[hoveredCandle].low.toFixed(2)}</span>
                            <span className="price-chart__tooltip-label">C:</span>
                            <span className="price-chart__tooltip-value">{candles[hoveredCandle].close.toFixed(2)}</span>
                        </div>
                    </div>
                )}
            </div>
            <div className="price-chart__legend">
                <span className="price-chart__legend-item">
                    <span className="price-chart__legend-color price-chart__legend-color--current" /> Current Price
                </span>
                <span className="price-chart__legend-item">
                    <span className="price-chart__legend-color price-chart__legend-color--range" /> Your Range
                </span>
                <span className="price-chart__legend-item">
                    <span className="price-chart__legend-color price-chart__legend-color--depth" /> Liquidity Depth
                </span>
            </div>
        </div>
    );
};
