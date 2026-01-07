import { useState, useMemo, useEffect } from 'react';
import { formatCurrency, formatNumber } from '../utils';
import { Skeleton, SkeletonStats } from '../components/ui';
import {
    PageContainer,
    PageHeader,
    Card,
    CardHeader,
    CardBody,
    CardTitle,
    StatsGrid,
    StatBox,
    InfoBanner,
    TimeframeToggle,
    ChartLegend,
    ProgressBar,
    DataTable,
    TableHeader,
    TableHeaderCell,
    TableBody,
    TableRow,
    TableCell,
    TableContainer,
} from '../components/shared';

// ─────────────────────────────────────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────────────────────────────────────
const LOADING_DELAY = 1200;

const TOKEN_COLORS = {
    ETH: '#627EEA', WETH: '#627EEA', USDC: '#2775CA', USDT: '#26A17B',
    DAI: '#F5AC37', wstETH: '#00A3FF', cbETH: '#0052FF', rETH: '#CC9B7A', IGNIS: '#F5B041',
};

// ─────────────────────────────────────────────────────────────────────────────
// DATA GENERATORS
// ─────────────────────────────────────────────────────────────────────────────
const generateMEVHistory = () => {
    const data = [];
    const now = Date.now();
    for (let i = 29; i >= 0; i--) {
        const date = new Date(now - i * 24 * 60 * 60 * 1000);
        data.push({
            date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
            timestamp: date.getTime(),
            captured: Math.floor(8000 + Math.random() * 12000),
            toLPs: Math.floor(6000 + Math.random() * 9000),
            toProtocol: Math.floor(1500 + Math.random() * 3000),
        });
    }
    return data;
};

const TOP_MEV_POOLS = [
    { pair: 'ETH/USDC', token0: 'ETH', token1: 'USDC', mevCaptured24h: 4521, mevCaptured7d: 28453, volume24h: 12500000, lpShare: 78 },
    { pair: 'wstETH/ETH', token0: 'wstETH', token1: 'ETH', mevCaptured24h: 3892, mevCaptured7d: 24120, volume24h: 8900000, lpShare: 82 },
    { pair: 'cbETH/ETH', token0: 'cbETH', token1: 'ETH', mevCaptured24h: 2341, mevCaptured7d: 15230, volume24h: 5400000, lpShare: 75 },
    { pair: 'USDC/USDT', token0: 'USDC', token1: 'USDT', mevCaptured24h: 1823, mevCaptured7d: 11892, volume24h: 18200000, lpShare: 80 },
    { pair: 'rETH/ETH', token0: 'rETH', token1: 'ETH', mevCaptured24h: 1456, mevCaptured7d: 9234, volume24h: 3200000, lpShare: 77 },
    { pair: 'ETH/DAI', token0: 'ETH', token1: 'DAI', mevCaptured24h: 987, mevCaptured7d: 6543, volume24h: 2100000, lpShare: 79 },
];

const MEV_HISTORY = generateMEVHistory();

// ─────────────────────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────────────────────
export const AnalyticsPage = () => {
    const [timeframe, setTimeframe] = useState('30d');
    const [isLoading, setIsLoading] = useState(true);
    
    useEffect(() => {
        const timer = setTimeout(() => setIsLoading(false), LOADING_DELAY);
        return () => clearTimeout(timer);
    }, []);
    
    const totals = useMemo(() => {
        const total24h = TOP_MEV_POOLS.reduce((sum, p) => sum + p.mevCaptured24h, 0);
        const total7d = TOP_MEV_POOLS.reduce((sum, p) => sum + p.mevCaptured7d, 0);
        const totalAllTime = MEV_HISTORY.reduce((sum, d) => sum + d.captured, 0) + 1847000;
        const avgLPShare = TOP_MEV_POOLS.reduce((sum, p) => sum + p.lpShare, 0) / TOP_MEV_POOLS.length;
        return { total24h, total7d, totalAllTime, avgLPShare };
    }, []);

    const chartData = useMemo(() => {
        if (timeframe === '7d') return MEV_HISTORY.slice(-7);
        return MEV_HISTORY;
    }, [timeframe]);

    // ─────────────────────────────────────────────────────────────────────────
    // RENDER
    // ─────────────────────────────────────────────────────────────────────────
    return (
        <PageContainer>
            <PageHeader 
                align="left"
                subtitle="Track MEV captured by the protocol and distributed to liquidity providers"
            >
                <span style={{ background: 'linear-gradient(135deg, #F5B041, #E67E22)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                    MEV
                </span>{' '}Analytics
            </PageHeader>

            {/* Stats Cards */}
            <StatsGrid>
                {isLoading ? (
                    <>
                        <SkeletonStats />
                        <SkeletonStats />
                        <SkeletonStats />
                        <SkeletonStats />
                    </>
                ) : (
                    <>
                        <StatBox 
                            icon="🔥" 
                            label="MEV Captured (24h)" 
                            labelSize="small"
                            value={formatCurrency(totals.total24h)} 
                            color="gold" 
                        />
                        <StatBox 
                            icon="📈" 
                            label="MEV Captured (7d)" 
                            labelSize="small"
                            value={formatCurrency(totals.total7d)} 
                            color="gold" 
                        />
                        <StatBox 
                            icon="💰" 
                            label="Total MEV Captured" 
                            labelSize="small"
                            value={formatCurrency(totals.totalAllTime)} 
                            color="success" 
                        />
                        <StatBox 
                            icon="🎯" 
                            label="Avg. LP Share" 
                            labelSize="small"
                            value={`${totals.avgLPShare.toFixed(1)}%`} 
                            color="purple" 
                        />
                    </>
                )}
            </StatsGrid>

            {/* Chart Section */}
            <Card rounded="xl" style={{ marginBottom: '2rem' }}>
                <CardBody>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                        <div>
                            <CardTitle description="Daily MEV capture and LP distribution">
                                MEV Captured Over Time
                            </CardTitle>
                        </div>
                        <TimeframeToggle 
                            options={['7d', '30d', '90d']}
                            value={timeframe}
                            onChange={setTimeframe}
                        />
                    </div>

                    {isLoading ? (
                        <div style={{ height: 220, display: 'flex', alignItems: 'flex-end', gap: 4, padding: '0 1rem' }}>
                            {Array.from({ length: 15 }).map((_, i) => (
                                <Skeleton key={i} width={20} height={80 + Math.random() * 100} style={{ flex: 1 }} />
                            ))}
                        </div>
                    ) : (
                        <MEVChart data={chartData} height={220} />
                    )}

                    <ChartLegend 
                        items={[
                            { color: 'gold', label: 'Total Captured' },
                            { color: 'success', label: 'Distributed to LPs' },
                        ]}
                    />
                </CardBody>
            </Card>

            {/* Top Pools by MEV */}
            <Card rounded="xl">
                <CardHeader>
                    <CardTitle description="Pools generating the most MEV value for LPs">
                        Top Pools by MEV Capture
                    </CardTitle>
                </CardHeader>

                <TableContainer>
                    <DataTable>
                        <TableHeader>
                            <TableHeaderCell>Pool</TableHeaderCell>
                            <TableHeaderCell align="right">Volume (24h)</TableHeaderCell>
                            <TableHeaderCell align="right">MEV Captured (24h)</TableHeaderCell>
                            <TableHeaderCell align="right">MEV Captured (7d)</TableHeaderCell>
                            <TableHeaderCell align="right">LP Share</TableHeaderCell>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                Array.from({ length: 5 }).map((_, i) => (
                                    <MEVPoolSkeletonRow key={i} />
                                ))
                            ) : (
                                TOP_MEV_POOLS.map((pool, i) => (
                                    <MEVPoolRow key={pool.pair} pool={pool} index={i} />
                                ))
                            )}
                        </TableBody>
                    </DataTable>
                </TableContainer>
            </Card>

            {/* Info Box */}
            <div style={{ marginTop: '2rem' }}>
                <InfoBanner 
                    icon="💡" 
                    variant="warning"
                    title="How MEV Capture Works"
                >
                    IGNIS captures MEV (Maximal Extractable Value) that would otherwise be extracted by arbitrage bots. 
                    Instead of this value leaking to searchers, it's captured by the protocol and distributed back to 
                    liquidity providers as additional yield on top of trading fees.
                </InfoBanner>
            </div>
        </PageContainer>
    );
};

// ─────────────────────────────────────────────────────────────────────────────
// SUB-COMPONENTS
// ─────────────────────────────────────────────────────────────────────────────

const MEVChart = ({ data, height = 200 }) => {
    const maxValue = Math.max(...data.map(d => d.captured));
    
    return (
        <div style={{ height, display: 'flex', alignItems: 'flex-end', gap: 4, padding: '0 0.5rem' }}>
            {data.map((d, i) => {
                const barHeight = (d.captured / maxValue) * (height - 40);
                const lpHeight = (d.toLPs / maxValue) * (height - 40);
                return (
                    <div 
                        key={i} 
                        style={{ 
                            flex: 1, 
                            display: 'flex', 
                            flexDirection: 'column', 
                            alignItems: 'center',
                            gap: 4,
                        }}
                    >
                        <div 
                            style={{ 
                                width: '100%', 
                                height: barHeight,
                                background: 'linear-gradient(180deg, rgba(245,176,65,0.8) 0%, rgba(245,176,65,0.3) 100%)',
                                borderRadius: '4px 4px 0 0',
                                position: 'relative',
                                minHeight: 4,
                            }}
                            title={`${d.date}: $${d.captured.toLocaleString()} captured`}
                        >
                            <div 
                                style={{
                                    position: 'absolute',
                                    bottom: 0,
                                    width: '100%',
                                    height: lpHeight,
                                    background: 'linear-gradient(180deg, #22C55E 0%, rgba(34,197,94,0.5) 100%)',
                                    borderRadius: '4px 4px 0 0',
                                }}
                                title={`$${d.toLPs.toLocaleString()} to LPs`}
                            />
                        </div>
                        {i % 5 === 0 && (
                            <span style={{ fontSize: '0.5rem', color: '#7A7A7A', whiteSpace: 'nowrap' }}>
                                {d.date.split(' ')[1]}
                            </span>
                        )}
                    </div>
                );
            })}
        </div>
    );
};

const TokenPairIcon = ({ token0, token1, size = 32 }) => (
    <div style={{ display: 'flex', alignItems: 'center' }}>
        <div style={{ 
            width: size, height: size, borderRadius: '50%', 
            background: TOKEN_COLORS[token0] || '#7A7A7A',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: size * 0.4, fontWeight: 700, color: '#FFF',
            border: '2px solid #141416',
        }}>
            {token0.slice(0, 2)}
        </div>
        <div style={{ 
            width: size, height: size, borderRadius: '50%', 
            background: TOKEN_COLORS[token1] || '#7A7A7A',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: size * 0.4, fontWeight: 700, color: '#FFF',
            marginLeft: -size * 0.3,
            border: '2px solid #141416',
        }}>
            {token1.slice(0, 2)}
        </div>
    </div>
);

const MEVPoolRow = ({ pool, index }) => (
    <TableRow striped>
        <TableCell>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <TokenPairIcon token0={pool.token0} token1={pool.token1} size={36} />
                <div>
                    <div style={{ fontWeight: 600 }}>{pool.pair}</div>
                    <div style={{ fontSize: '0.75rem', color: '#7A7A7A' }}>0.3% fee</div>
                </div>
            </div>
        </TableCell>
        <TableCell align="right" mono style={{ color: '#A3A3A3' }}>
            {formatCurrency(pool.volume24h)}
        </TableCell>
        <TableCell align="right">
            <span style={{ fontFamily: 'JetBrains Mono', fontWeight: 600, color: '#F5B041' }}>
                {formatCurrency(pool.mevCaptured24h)}
            </span>
        </TableCell>
        <TableCell align="right">
            <span style={{ fontFamily: 'JetBrains Mono', fontWeight: 600, color: '#F5B041' }}>
                {formatCurrency(pool.mevCaptured7d)}
            </span>
        </TableCell>
        <TableCell align="right">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.5rem' }}>
                <ProgressBar percent={pool.lpShare} variant="success" width={60} />
                <span style={{ fontFamily: 'JetBrains Mono', fontWeight: 600, color: '#22C55E', fontSize: '0.875rem' }}>
                    {pool.lpShare}%
                </span>
            </div>
        </TableCell>
    </TableRow>
);

const MEVPoolSkeletonRow = () => (
    <TableRow>
        <TableCell>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ display: 'flex' }}>
                    <Skeleton width={36} height={36} borderRadius="50%" />
                    <Skeleton width={36} height={36} borderRadius="50%" style={{ marginLeft: -10 }} />
                </div>
                <div>
                    <Skeleton width={80} height={16} style={{ marginBottom: 4 }} />
                    <Skeleton width={50} height={12} />
                </div>
            </div>
        </TableCell>
        <TableCell><Skeleton height={20} width={80} style={{ marginLeft: 'auto' }} /></TableCell>
        <TableCell><Skeleton height={20} width={60} style={{ marginLeft: 'auto' }} /></TableCell>
        <TableCell><Skeleton height={20} width={60} style={{ marginLeft: 'auto' }} /></TableCell>
        <TableCell><Skeleton height={20} width={70} style={{ marginLeft: 'auto' }} /></TableCell>
    </TableRow>
);

export default AnalyticsPage;
