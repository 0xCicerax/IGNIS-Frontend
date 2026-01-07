import { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { POOLS, TOKENS } from '../data';
import type { Token, Pool } from '../types';
import { TokenIcon } from '../components/ui';
import { AddLiquidityModal } from '../components/modals';
import { formatCurrency, formatNumber } from '../utils';

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────
interface PoolDetailPageProps {
    isConnected: boolean;
    onConnect: () => void;
}

type ChartTimeframe = '24H' | '7D' | '30D' | 'ALL';
type ChartMetric = 'tvl' | 'volume' | 'fees';

interface SwapData {
    id: string;
    timestamp: number;
    sender: string;
    fromToken: Token;
    toToken: Token;
    fromAmount: string;
    toAmount: string;
    valueUSD: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// MOCK DATA GENERATORS (replace with subgraph queries)
// ─────────────────────────────────────────────────────────────────────────────
const generateChartData = (baseValue: number, timeframe: ChartTimeframe, volatility: number = 0.1) => {
    const now = Date.now();
    const points: { timestamp: number; value: number }[] = [];
    
    const config = {
        '24H': { duration: 24 * 60 * 60 * 1000, interval: 60 * 60 * 1000 },
        '7D': { duration: 7 * 24 * 60 * 60 * 1000, interval: 4 * 60 * 60 * 1000 },
        '30D': { duration: 30 * 24 * 60 * 60 * 1000, interval: 24 * 60 * 60 * 1000 },
        'ALL': { duration: 90 * 24 * 60 * 60 * 1000, interval: 24 * 60 * 60 * 1000 },
    };
    
    const { duration, interval } = config[timeframe];
    const numPoints = Math.floor(duration / interval);
    
    let value = baseValue * (0.7 + Math.random() * 0.3);
    
    for (let i = 0; i < numPoints; i++) {
        const timestamp = now - duration + (i * interval);
        const change = (Math.random() - 0.5) * volatility * baseValue * 0.05;
        value = Math.max(value + change, baseValue * 0.5);
        value = Math.min(value, baseValue * 1.5);
        points.push({ timestamp, value });
    }
    
    points.push({ timestamp: now, value: baseValue });
    return points;
};

const generateRecentSwaps = (pool: Pool): SwapData[] => {
    const swaps: SwapData[] = [];
    const now = Date.now();
    
    for (let i = 0; i < 10; i++) {
        const isToken0ToToken1 = Math.random() > 0.5;
        const amount0 = (Math.random() * 5 + 0.1).toFixed(4);
        const amount1 = (parseFloat(amount0) * (pool.token0.price / pool.token1.price)).toFixed(2);
        
        swaps.push({
            id: `swap-${i}`,
            timestamp: now - i * 300000 - Math.random() * 300000,
            sender: `0x${Math.random().toString(16).slice(2, 10)}...${Math.random().toString(16).slice(2, 6)}`,
            fromToken: isToken0ToToken1 ? pool.token0 : pool.token1,
            toToken: isToken0ToToken1 ? pool.token1 : pool.token0,
            fromAmount: isToken0ToToken1 ? amount0 : amount1,
            toAmount: isToken0ToToken1 ? amount1 : amount0,
            valueUSD: parseFloat(amount0) * pool.token0.price,
        });
    }
    
    return swaps;
};

const generateTopLPs = (tvl: number) => {
    const lps = [];
    let remaining = tvl;
    
    for (let i = 0; i < 5; i++) {
        const share = remaining * (0.3 + Math.random() * 0.2);
        remaining -= share;
        
        lps.push({
            address: `0x${Math.random().toString(16).slice(2, 10)}...${Math.random().toString(16).slice(2, 6)}`,
            liquidity: share,
            share: (share / tvl) * 100,
        });
    }
    
    return lps.sort((a, b) => b.liquidity - a.liquidity);
};

// ─────────────────────────────────────────────────────────────────────────────
// SUBCOMPONENTS
// ─────────────────────────────────────────────────────────────────────────────
const DualTokenIcon = ({ token0, token1, size = 40 }: { token0: Token; token1: Token; size?: number }) => (
    <div style={{ display: 'flex', alignItems: 'center' }}>
        <div style={{ 
            width: size, 
            height: size, 
            borderRadius: '50%', 
            background: token0.color || '#627EEA',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 700,
            fontSize: size * 0.4,
            border: '2px solid #0A0A0B',
        }}>
            {token0.icon || token0.symbol[0]}
        </div>
        <div style={{ 
            width: size, 
            height: size, 
            borderRadius: '50%', 
            background: token1.color || '#2775CA',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 700,
            fontSize: size * 0.4,
            marginLeft: -size * 0.3,
            border: '2px solid #0A0A0B',
        }}>
            {token1.icon || token1.symbol[0]}
        </div>
    </div>
);

const StatCard = ({ label, value, subValue, change }: { 
    label: string; 
    value: string; 
    subValue?: string;
    change?: { value: number; isPositive: boolean };
}) => (
    <div className="pool-detail__stat-card">
        <div className="pool-detail__stat-label">{label}</div>
        <div className="pool-detail__stat-value">{value}</div>
        {subValue && <div className="pool-detail__stat-sub">{subValue}</div>}
        {change && (
            <div className={`pool-detail__stat-change ${change.isPositive ? 'pool-detail__stat-change--up' : 'pool-detail__stat-change--down'}`}>
                {change.isPositive ? '▲' : '▼'} {Math.abs(change.value).toFixed(2)}%
            </div>
        )}
    </div>
);

const MiniChart = ({ data, color, height = 60 }: { data: { timestamp: number; value: number }[]; color: string; height?: number }) => {
    if (data.length < 2) return null;
    
    const width = 300;
    const padding = { top: 5, right: 5, bottom: 5, left: 5 };
    const chartWidth = width - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;
    
    const minValue = Math.min(...data.map(d => d.value));
    const maxValue = Math.max(...data.map(d => d.value));
    const valueRange = maxValue - minValue || 1;
    
    const minTime = data[0].timestamp;
    const maxTime = data[data.length - 1].timestamp;
    const timeRange = maxTime - minTime || 1;
    
    const path = data.map((point, i) => {
        const x = padding.left + ((point.timestamp - minTime) / timeRange) * chartWidth;
        const y = padding.top + chartHeight - ((point.value - minValue) / valueRange) * chartHeight;
        return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
    }).join(' ');
    
    const areaPath = `${path} L ${padding.left + chartWidth} ${padding.top + chartHeight} L ${padding.left} ${padding.top + chartHeight} Z`;
    
    return (
        <svg viewBox={`0 0 ${width} ${height}`} style={{ width: '100%', height }}>
            <defs>
                <linearGradient id={`gradient-${color}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={color} stopOpacity="0.3" />
                    <stop offset="100%" stopColor={color} stopOpacity="0" />
                </linearGradient>
            </defs>
            <path d={areaPath} fill={`url(#gradient-${color})`} />
            <path d={path} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" />
        </svg>
    );
};

// ─────────────────────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────────────────────
export const PoolDetailPage: React.FC<PoolDetailPageProps> = ({ isConnected, onConnect }) => {
    const { poolId } = useParams<{ poolId: string }>();
    const navigate = useNavigate();
    
    const [chartTimeframe, setChartTimeframe] = useState<ChartTimeframe>('7D');
    const [chartMetric, setChartMetric] = useState<ChartMetric>('tvl');
    const [addLiquidityOpen, setAddLiquidityOpen] = useState(false);
    
    // Find pool by ID
    const pool = useMemo(() => {
        return POOLS.find(p => p.id === poolId);
    }, [poolId]);
    
    // Generate mock data
    const chartData = useMemo(() => {
        if (!pool) return [];
        const baseValue = chartMetric === 'tvl' ? pool.tvl : chartMetric === 'volume' ? pool.volume24h : pool.volume24h * 0.003;
        return generateChartData(baseValue, chartTimeframe, chartMetric === 'volume' ? 0.3 : 0.1);
    }, [pool, chartTimeframe, chartMetric]);
    
    const recentSwaps = useMemo(() => {
        if (!pool) return [];
        return generateRecentSwaps(pool);
    }, [pool]);
    
    const topLPs = useMemo(() => {
        if (!pool) return [];
        return generateTopLPs(pool.tvl);
    }, [pool]);
    
    // User positions (mock) - users can have multiple positions with different ranges
    const userPositions = useMemo(() => {
        if (!isConnected || !pool) return null;
        // Current price (this would come from oracle/pool in production)
        const currentPrice = pool.token0.price / pool.token1.price;
        // Simulate price has drifted - positions were created at slightly different price
        const originalPrice = currentPrice * 1.02; // Price was 2% higher when positions were created
        
        // Position 1: Originally set at ±5% from original price
        const pos1Min = originalPrice * 0.95;
        const pos1Max = originalPrice * 1.05;
        // Calculate current % from current price
        const pos1LowerPct = ((pos1Min - currentPrice) / currentPrice) * 100;
        const pos1UpperPct = ((pos1Max - currentPrice) / currentPrice) * 100;
        
        // Position 2: Originally set at ±20% from original price  
        const pos2Min = originalPrice * 0.80;
        const pos2Max = originalPrice * 1.20;
        const pos2LowerPct = ((pos2Min - currentPrice) / currentPrice) * 100;
        const pos2UpperPct = ((pos2Max - currentPrice) / currentPrice) * 100;
        
        return [
            { 
                id: 'pos-1',
                liquidity: pool.tvl * 0.0015, 
                share: 0.15, 
                unclaimedRewards: 12.5,
                inRange: currentPrice >= pos1Min && currentPrice <= pos1Max,
                rangeMin: pos1Min.toFixed(4),
                rangeMax: pos1Max.toFixed(4),
                rangeLowerPct: pos1LowerPct,
                rangeUpperPct: pos1UpperPct
            },
            { 
                id: 'pos-2',
                liquidity: pool.tvl * 0.0008, 
                share: 0.08, 
                unclaimedRewards: 5.2,
                inRange: currentPrice >= pos2Min && currentPrice <= pos2Max,
                rangeMin: pos2Min.toFixed(4),
                rangeMax: pos2Max.toFixed(4),
                rangeLowerPct: pos2LowerPct,
                rangeUpperPct: pos2UpperPct
            }
        ];
    }, [isConnected, pool]);
    
    if (!pool) {
        return (
            <div className="pool-detail">
                <div className="pool-detail__not-found">
                    <h2>Pool Not Found</h2>
                    <p>The pool you're looking for doesn't exist.</p>
                    <button onClick={() => navigate('/app/pools')} className="pool-detail__back-btn">
                        ← Back to Pools
                    </button>
                </div>
            </div>
        );
    }
    
    const formatTime = (timestamp: number) => {
        const diff = Date.now() - timestamp;
        if (diff < 60000) return 'Just now';
        if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
        if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
        return `${Math.floor(diff / 86400000)}d ago`;
    };

    return (
        <div className="pool-detail">
            {/* Header */}
            <div className="pool-detail__header">
                <button onClick={() => navigate('/app/pools')} className="pool-detail__back-btn">
                    ← Back
                </button>
                
                <div className="pool-detail__title-row">
                    <DualTokenIcon token0={pool.token0} token1={pool.token1} size={48} />
                    <div className="pool-detail__title-info">
                        <h1 className="pool-detail__title">
                            {pool.token0.symbol}/{pool.token1.symbol}
                        </h1>
                        <div className="pool-detail__badges">
                            <span className={`pool-detail__badge pool-detail__badge--${pool.type.toLowerCase()}`}>
                                {pool.type}
                            </span>
                            <span className="pool-detail__badge pool-detail__badge--fee">
                                {pool.fee}% fee
                            </span>
                            {pool.isYieldBearing && (
                                <span className="pool-detail__badge pool-detail__badge--yield">
                                    Yield-Bearing
                                </span>
                            )}
                        </div>
                    </div>
                </div>
            </div>
            
            {/* Stats Row */}
            <div className="pool-detail__stats-row">
                <StatCard 
                    label="TVL" 
                    value={formatCurrency(pool.tvl)}
                    change={{ value: 2.4, isPositive: true }}
                />
                <StatCard 
                    label="24h Volume" 
                    value={formatCurrency(pool.volume24h)}
                    change={{ value: 8.2, isPositive: true }}
                />
                <StatCard 
                    label="24h Fees" 
                    value={formatCurrency(pool.volume24h * 0.003)}
                />
                <StatCard 
                    label="APR" 
                    value={`${pool.apr.toFixed(2)}%`}
                    subValue={pool.isYieldBearing ? 'Includes underlying yield' : 'Trading fees'}
                />
            </div>
            
            {/* Add Liquidity Button */}
            <div style={{ marginBottom: '1.5rem', display: 'flex', gap: '1rem', alignItems: 'center', justifyContent: 'center' }}>
                <button 
                    onClick={() => isConnected ? setAddLiquidityOpen(true) : onConnect()}
                    style={{ 
                        padding: '1rem 2.5rem', 
                        borderRadius: 14, 
                        border: 'none', 
                        background: 'linear-gradient(135deg, #F5B041, #D4941C)', 
                        color: '#000', 
                        fontSize: '1rem', 
                        fontWeight: 700, 
                        cursor: 'pointer', 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '0.5rem', 
                        boxShadow: '0 4px 20px rgba(245, 176, 65, 0.3)' 
                    }}
                >
                    <span style={{ fontSize: '1.25rem' }}>+</span>
                    Add Liquidity
                </button>
                <span style={{ 
                    padding: '0.5rem 1rem', 
                    background: 'rgba(255,255,255,0.05)', 
                    borderRadius: 8, 
                    fontSize: '0.875rem', 
                    color: '#A3A3A3' 
                }}>
                    {pool.type === 'CLAMM' ? 'Concentrated Liquidity' : 'Liquidity Book AMM'}
                </span>
            </div>
            
            {/* Your Positions (shown if connected) */}
            {isConnected && (
                <div style={{ 
                    maxWidth: 700, 
                    margin: '0 auto 1.5rem', 
                    padding: '1.25rem', 
                    background: 'linear-gradient(180deg, rgba(25, 25, 28, 1) 0%, rgba(18, 18, 20, 1) 100%)', 
                    border: '1px solid rgba(255, 255, 255, 0.06)', 
                    borderRadius: 16 
                }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                        <h3 style={{ 
                            fontSize: '0.875rem', 
                            fontWeight: 600, 
                            color: '#A3A3A3', 
                            textTransform: 'uppercase', 
                            letterSpacing: '0.05em' 
                        }}>Your Positions</h3>
                        {userPositions && (
                            <span style={{ fontSize: '0.75rem', color: '#8A8A8A' }}>
                                {userPositions.length} active position{userPositions.length > 1 ? 's' : ''}
                            </span>
                        )}
                    </div>
                    
                    {userPositions && userPositions.length > 0 ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            {userPositions.map((pos, idx) => (
                                <div key={pos.id} style={{ 
                                    padding: '1rem', 
                                    background: 'rgba(255,255,255,0.02)', 
                                    borderRadius: 12, 
                                    border: '1px solid rgba(255,255,255,0.04)' 
                                }}>
                                    {/* Position header with stylish range percentage badges */}
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                            <span style={{ fontSize: '0.875rem', fontWeight: 600, color: '#FFF' }}>
                                                Position #{idx + 1}
                                            </span>
                                            {/* Stylish percentage range badges */}
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                                                {/* Lower bound badge */}
                                                <div style={{ 
                                                    display: 'flex', 
                                                    alignItems: 'center', 
                                                    padding: '0.375rem 0.625rem', 
                                                    background: 'linear-gradient(135deg, rgba(239,68,68,0.15) 0%, rgba(239,68,68,0.05) 100%)', 
                                                    borderRadius: 8, 
                                                    border: '1px solid rgba(239,68,68,0.2)' 
                                                }}>
                                                    <span style={{ 
                                                        fontFamily: 'JetBrains Mono', 
                                                        fontSize: '0.8125rem', 
                                                        fontWeight: 700, 
                                                        color: '#EF4444', 
                                                        letterSpacing: '-0.02em' 
                                                    }}>
                                                        {pos.rangeLowerPct >= 0 ? '+' : ''}{pos.rangeLowerPct.toFixed(1)}%
                                                    </span>
                                                </div>
                                                {/* Arrow separator */}
                                                <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="#7A7A7A" strokeWidth={2}>
                                                    <path d="M5 12h14M12 5l7 7-7 7" />
                                                </svg>
                                                {/* Upper bound badge */}
                                                <div style={{ 
                                                    display: 'flex', 
                                                    alignItems: 'center', 
                                                    padding: '0.375rem 0.625rem', 
                                                    background: 'linear-gradient(135deg, rgba(34,197,94,0.15) 0%, rgba(34,197,94,0.05) 100%)', 
                                                    borderRadius: 8, 
                                                    border: '1px solid rgba(34,197,94,0.2)' 
                                                }}>
                                                    <span style={{ 
                                                        fontFamily: 'JetBrains Mono', 
                                                        fontSize: '0.8125rem', 
                                                        fontWeight: 700, 
                                                        color: '#22C55E', 
                                                        letterSpacing: '-0.02em' 
                                                    }}>
                                                        +{pos.rangeUpperPct.toFixed(1)}%
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                        <span style={{ 
                                            display: 'flex', 
                                            alignItems: 'center', 
                                            gap: '0.375rem', 
                                            padding: '0.25rem 0.625rem', 
                                            background: pos.inRange ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)', 
                                            borderRadius: 6, 
                                            color: pos.inRange ? '#22C55E' : '#EF4444', 
                                            fontSize: '0.75rem', 
                                            fontWeight: 600 
                                        }}>
                                            <span style={{ 
                                                width: 6, 
                                                height: 6, 
                                                borderRadius: '50%', 
                                                background: pos.inRange ? '#22C55E' : '#EF4444' 
                                            }} />
                                            {pos.inRange ? 'In Range' : 'Out of Range'}
                                        </span>
                                    </div>
                                    
                                    {/* Price range display */}
                                    <div style={{ 
                                        display: 'flex', 
                                        alignItems: 'center', 
                                        gap: '0.5rem', 
                                        marginBottom: '0.75rem', 
                                        padding: '0.5rem 0.75rem', 
                                        background: 'rgba(0,0,0,0.2)', 
                                        borderRadius: 8 
                                    }}>
                                        <span style={{ fontSize: '0.6875rem', color: '#7A7A7A', textTransform: 'uppercase' }}>Price Range:</span>
                                        <span style={{ fontFamily: 'JetBrains Mono', fontSize: '0.8125rem', color: '#A3A3A3' }}>{pos.rangeMin}</span>
                                        <span style={{ color: '#7A7A7A' }}>↔</span>
                                        <span style={{ fontFamily: 'JetBrains Mono', fontSize: '0.8125rem', color: '#A3A3A3' }}>{pos.rangeMax}</span>
                                        <span style={{ fontSize: '0.6875rem', color: '#7A7A7A' }}>{pool.token1.symbol}/{pool.token0.symbol}</span>
                                    </div>
                                    
                                    {/* Stats row */}
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '0.75rem' }}>
                                        {[
                                            { label: 'Liquidity', value: formatCurrency(pos.liquidity) },
                                            { label: 'Pool Share', value: `${pos.share.toFixed(4)}%` },
                                            { label: 'Unclaimed Rewards', value: `${pos.unclaimedRewards.toFixed(2)} IGNI`, highlight: true }
                                        ].map((item, i) => (
                                            <div key={i} style={{ textAlign: 'center' }}>
                                                <div style={{ fontSize: '0.6875rem', color: '#7A7A7A', marginBottom: '0.25rem', textTransform: 'uppercase' }}>
                                                    {item.label}
                                                </div>
                                                <div style={{ 
                                                    fontFamily: 'JetBrains Mono', 
                                                    fontWeight: 600, 
                                                    fontSize: '0.875rem',
                                                    color: item.highlight ? '#F5B041' : '#FFF' 
                                                }}>
                                                    {item.value}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    
                                    {/* Action buttons */}
                                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                                        <button 
                                            onClick={() => setAddLiquidityOpen(true)} 
                                            style={{ 
                                                flex: 1, 
                                                padding: '0.625rem', 
                                                borderRadius: 8, 
                                                border: 'none', 
                                                background: 'linear-gradient(135deg, #F5B041, #D4941C)', 
                                                color: '#000', 
                                                fontWeight: 600, 
                                                fontSize: '0.8125rem',
                                                cursor: 'pointer' 
                                            }}
                                        >
                                            Increase
                                        </button>
                                        <button 
                                            style={{ 
                                                flex: 1, 
                                                padding: '0.625rem', 
                                                borderRadius: 8, 
                                                border: '1px solid rgba(255,255,255,0.1)', 
                                                background: 'rgba(255,255,255,0.03)', 
                                                color: '#A3A3A3', 
                                                fontWeight: 600, 
                                                fontSize: '0.8125rem',
                                                cursor: 'pointer' 
                                            }}
                                        >
                                            Withdraw
                                        </button>
                                        {pos.unclaimedRewards > 0 && (
                                            <button 
                                                style={{ 
                                                    flex: 1, 
                                                    padding: '0.625rem', 
                                                    borderRadius: 8, 
                                                    border: '1px solid rgba(245,176,65,0.3)', 
                                                    background: 'rgba(245,176,65,0.1)', 
                                                    color: '#F5B041', 
                                                    fontWeight: 600, 
                                                    fontSize: '0.8125rem',
                                                    cursor: 'pointer' 
                                                }}
                                            >
                                                Claim
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div style={{ textAlign: 'center', padding: '1rem', color: '#7A7A7A' }}>
                            <p>You don't have any positions in this pool yet</p>
                        </div>
                    )}
                </div>
            )}
            
            {/* Main Content Grid */}
            <div className="pool-detail__content">
                {/* Left Column - Charts */}
                <div className="pool-detail__charts">
                    <div className="pool-detail__chart-card">
                        <div className="pool-detail__chart-header">
                            <div className="pool-detail__chart-tabs">
                                {(['tvl', 'volume', 'fees'] as ChartMetric[]).map(metric => (
                                    <button
                                        key={metric}
                                        className={`pool-detail__chart-tab ${chartMetric === metric ? 'pool-detail__chart-tab--active' : ''}`}
                                        onClick={() => setChartMetric(metric)}
                                    >
                                        {metric.toUpperCase()}
                                    </button>
                                ))}
                            </div>
                            <div className="pool-detail__timeframe-tabs">
                                {(['24H', '7D', '30D', 'ALL'] as ChartTimeframe[]).map(tf => (
                                    <button
                                        key={tf}
                                        className={`pool-detail__tf-tab ${chartTimeframe === tf ? 'pool-detail__tf-tab--active' : ''}`}
                                        onClick={() => setChartTimeframe(tf)}
                                    >
                                        {tf}
                                    </button>
                                ))}
                            </div>
                        </div>
                        
                        <div className="pool-detail__chart-value">
                            {formatCurrency(chartData[chartData.length - 1]?.value || 0)}
                        </div>
                        
                        <div className="pool-detail__chart-container">
                            <MiniChart 
                                data={chartData} 
                                color={chartMetric === 'tvl' ? '#22C55E' : chartMetric === 'volume' ? '#3B82F6' : '#F5B041'}
                                height={200}
                            />
                        </div>
                    </div>
                    
                    {/* Recent Swaps */}
                    <div className="pool-detail__swaps-card">
                        <h3 className="pool-detail__section-title">Recent Swaps</h3>
                        <div className="pool-detail__swaps-list">
                            {recentSwaps.map(swap => (
                                <div key={swap.id} className="pool-detail__swap-row">
                                    <div className="pool-detail__swap-info">
                                        <span className="pool-detail__swap-action">
                                            {swap.fromAmount} {swap.fromToken.symbol} → {swap.toAmount} {swap.toToken.symbol}
                                        </span>
                                        <span className="pool-detail__swap-address">{swap.sender}</span>
                                    </div>
                                    <div className="pool-detail__swap-meta">
                                        <span className="pool-detail__swap-value">{formatCurrency(swap.valueUSD)}</span>
                                        <span className="pool-detail__swap-time">{formatTime(swap.timestamp)}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
                
                {/* Right Column - LPs & Info */}
                <div className="pool-detail__sidebar">
                    {/* Top LPs */}
                    <div className="pool-detail__lps-card">
                        <h3 className="pool-detail__section-title">Top Liquidity Providers</h3>
                        <div className="pool-detail__lps-list">
                            {topLPs.map((lp, i) => (
                                <div key={lp.address} className="pool-detail__lp-row">
                                    <span className="pool-detail__lp-rank">#{i + 1}</span>
                                    <span className="pool-detail__lp-address">{lp.address}</span>
                                    <span className="pool-detail__lp-value">{formatCurrency(lp.liquidity)}</span>
                                    <span className="pool-detail__lp-share">{lp.share.toFixed(2)}%</span>
                                </div>
                            ))}
                        </div>
                    </div>
                    
                    {/* Pool Info */}
                    <div className="pool-detail__info-card">
                        <h3 className="pool-detail__section-title">Pool Information</h3>
                        <div className="pool-detail__info-row">
                            <span>Pool Address</span>
                            <span className="pool-detail__info-mono">0x1234...5678</span>
                        </div>
                        <div className="pool-detail__info-row">
                            <span>{pool.token0.symbol}</span>
                            <span className="pool-detail__info-mono">0xAbCd...EfGh</span>
                        </div>
                        <div className="pool-detail__info-row">
                            <span>{pool.token1.symbol}</span>
                            <span className="pool-detail__info-mono">0x9876...5432</span>
                        </div>
                        <div className="pool-detail__info-row">
                            <span>Created</span>
                            <span>Dec 15, 2024</span>
                        </div>
                        
                        {/* Mini Order Book */}
                        <div className="pool-detail__mini-orderbook">
                            <div className="pool-detail__mini-ob-header">
                                <span className="pool-detail__mini-ob-title">Order Book</span>
                                <span className="pool-detail__mini-ob-spread">0.05% spread</span>
                            </div>
                            <div className="pool-detail__mini-ob-table">
                                {/* Asks (top 5) */}
                                {[5,4,3,2,1].map(i => (
                                    <div key={`ask-${i}`} className="pool-detail__mini-ob-row pool-detail__mini-ob-row--ask">
                                        <span className="pool-detail__mini-ob-price">
                                            {(pool.token0.price * (1 + i * 0.001)).toFixed(2)}
                                        </span>
                                        <span className="pool-detail__mini-ob-size">
                                            {(Math.random() * 10 + 1).toFixed(2)}
                                        </span>
                                    </div>
                                ))}
                                {/* Spread */}
                                <div className="pool-detail__mini-ob-row pool-detail__mini-ob-row--spread">
                                    {pool.token0.price.toFixed(2)} {pool.token1.symbol}
                                </div>
                                {/* Bids (top 5) */}
                                {[1,2,3,4,5].map(i => (
                                    <div key={`bid-${i}`} className="pool-detail__mini-ob-row pool-detail__mini-ob-row--bid">
                                        <span className="pool-detail__mini-ob-price">
                                            {(pool.token0.price * (1 - i * 0.001)).toFixed(2)}
                                        </span>
                                        <span className="pool-detail__mini-ob-size">
                                            {(Math.random() * 10 + 1).toFixed(2)}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            {/* Add Liquidity Modal */}
            {addLiquidityOpen && (
                <AddLiquidityModal
                    isOpen={addLiquidityOpen}
                    onClose={() => setAddLiquidityOpen(false)}
                    pool={pool}
                    isConnected={isConnected}
                    onConnect={onConnect}
                />
            )}
        </div>
    );
};

export default PoolDetailPage;
