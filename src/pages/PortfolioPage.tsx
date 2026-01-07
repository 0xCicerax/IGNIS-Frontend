import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
    TOKENS,
    USER_POSITIONS, 
    USER_LOCKS, 
    PORTFOLIO_HISTORY,
    RECENT_ACTIVITY,
    getWalletValue,
    getLPValue,
    getStakingValue,
    getTotalPortfolioValue,
    getUnclaimedRewards,
    get24hChange,
    get7dChange,
} from '../data';
import { 
    TokenIcon, 
    DualTokenIcon, 
    SkeletonStats,
    ConnectWalletEmpty,
    NoPositionsEmpty,
    NoAssetsEmpty,
    NoActivityEmpty,
    InfoTooltip,
    FadeIn,
    SlideIn,
    AnimatedNumber,
} from '../components/ui';
import { 
    PageContainer, 
    Card, 
    CardBody, 
    Button,
    StatsGrid,
} from '../components/shared';
import { formatCurrency, formatNumber, showTxToast } from '../utils';
import { useWallet } from '../contexts';
import { TIMING } from '../constants';

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────
type TimeFrame = '24h' | '7d' | '30d' | 'all';

// ─────────────────────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────────────────────
export const PortfolioPage = () => {
    const navigate = useNavigate();
    const { isConnected, connect } = useWallet();
    const [isLoading, setIsLoading] = useState(true);
    const [timeframe, setTimeframe] = useState<TimeFrame>('7d');

    // Portfolio values
    const totalValue = getTotalPortfolioValue();
    const walletValue = getWalletValue();
    const lpValue = getLPValue();
    const stakingValue = getStakingValue();
    const { fees: unclaimedFees, ignis: unclaimedIgnis } = getUnclaimedRewards();
    const change24h = get24hChange();
    const change7d = get7dChange();

    // Asset allocation for donut chart
    const allocation = useMemo(() => [
        { label: 'Wallet', value: walletValue, color: '#627EEA', percent: (walletValue / totalValue) * 100 },
        { label: 'LP Positions', value: lpValue, color: '#22C55E', percent: (lpValue / totalValue) * 100 },
        { label: 'Staking', value: stakingValue, color: '#A78BFA', percent: (stakingValue / totalValue) * 100 },
    ], [walletValue, lpValue, stakingValue, totalValue]);

    // Top tokens by value
    const topTokens = useMemo(() => {
        return [...TOKENS]
            .map(t => ({ ...t, value: t.balance * t.price }))
            .filter(t => t.value > 0)
            .sort((a, b) => b.value - a.value)
            .slice(0, 5);
    }, []);

    useEffect(() => {
        const timer = setTimeout(() => setIsLoading(false), TIMING.LOADING_DELAY);
        return () => clearTimeout(timer);
    }, []);

    // ─────────────────────────────────────────────────────────────────────────
    // HANDLERS
    // ─────────────────────────────────────────────────────────────────────────
    const handleClaimAll = async () => {
        const total = unclaimedFees + (unclaimedIgnis * 2);
        const toastId = showTxToast.pending(`Claiming ${formatCurrency(total)} in rewards...`);
        await new Promise(r => setTimeout(r, TIMING.TX_SIMULATION));
        showTxToast.success(`Claimed ${formatCurrency(total)} in rewards!`, '0x' + Math.random().toString(16).slice(2, 10), toastId);
    };

    // ─────────────────────────────────────────────────────────────────────────
    // NOT CONNECTED STATE
    // ─────────────────────────────────────────────────────────────────────────
    if (!isConnected) {
        return (
            <PageContainer style={{ maxWidth: 1200 }}>
                <ConnectWalletEmpty 
                    onConnect={connect} 
                    message="Connect your wallet to view your complete portfolio dashboard, track your positions, and claim rewards."
                />
            </PageContainer>
        );
    }

    // ─────────────────────────────────────────────────────────────────────────
    // RENDER
    // ─────────────────────────────────────────────────────────────────────────
    return (
        <PageContainer style={{ maxWidth: 1200 }}>
            {/* Header */}
            <div className="portfolio-header">
                <div>
                    <h1 className="portfolio-header__title">Portfolio</h1>
                    <p className="portfolio-header__subtitle">Overview of your DeFi positions</p>
                </div>
                {(unclaimedFees > 0 || unclaimedIgnis > 0) && (
                    <Button variant="primary" onClick={handleClaimAll}>
                        Claim All Rewards
                    </Button>
                )}
            </div>

            {/* Net Worth Section */}
            <Card className="portfolio-networth">
                <CardBody>
                    <div className="portfolio-networth__content">
                        <div className="portfolio-networth__main">
                            <div className="portfolio-networth__label">Net Worth</div>
                            {isLoading ? (
                                <div className="skeleton" style={{ height: 48, width: 200 }} />
                            ) : (
                                <div className="portfolio-networth__value">{formatCurrency(totalValue)}</div>
                            )}
                            <div className="portfolio-networth__changes">
                                <ChangeIndicator label="24h" change={change24h} />
                                <ChangeIndicator label="7d" change={change7d} />
                            </div>
                        </div>
                        
                        <div className="portfolio-networth__chart">
                            <PortfolioChart data={PORTFOLIO_HISTORY} timeframe={timeframe} />
                            <div className="portfolio-chart__timeframes">
                                {(['24h', '7d', '30d', 'all'] as TimeFrame[]).map(tf => (
                                    <button
                                        key={tf}
                                        onClick={() => setTimeframe(tf)}
                                        className={`portfolio-chart__tf-btn ${timeframe === tf ? 'portfolio-chart__tf-btn--active' : ''}`}
                                    >
                                        {tf.toUpperCase()}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </CardBody>
            </Card>

            {/* Three Column Stats */}
            <div className="portfolio-stats-grid">
                {isLoading ? (
                    <>
                        <SkeletonStats />
                        <SkeletonStats />
                        <SkeletonStats />
                    </>
                ) : (
                    <>
                        <PortfolioStatCard 
                            icon="💼"
                            title="Wallet"
                            value={formatCurrency(walletValue)}
                            subtitle={`${topTokens.length} assets`}
                            onClick={() => {}}
                            color="#627EEA"
                        />
                        <PortfolioStatCard 
                            icon="💧"
                            title="LP Positions"
                            value={formatCurrency(lpValue)}
                            subtitle={`${USER_POSITIONS.length} positions`}
                            onClick={() => navigate('/app/liquidity')}
                            color="#22C55E"
                            badge={unclaimedFees > 0 ? `+${formatCurrency(unclaimedFees)} fees` : undefined}
                        />
                        <PortfolioStatCard 
                            icon="🔒"
                            title="Staking"
                            value={formatCurrency(stakingValue)}
                            subtitle={`${formatNumber(USER_LOCKS.reduce((s, l) => s + l.veIgni, 0))} veIGNIS`}
                            onClick={() => navigate('/app/stake')}
                            color="#A78BFA"
                            badge={unclaimedIgnis > 0 ? `+${unclaimedIgnis.toFixed(1)} IGNIS` : undefined}
                        />
                    </>
                )}
            </div>

            {/* Main Grid: Allocation + Positions */}
            <div className="portfolio-main-grid">
                {/* Left Column: Allocation & Top Assets */}
                <div className="portfolio-left-col">
                    {/* Asset Allocation */}
                    <Card>
                        <CardBody>
                            <h3 className="card__section-title">Asset Allocation</h3>
                            <div className="allocation-content">
                                <DonutChart data={allocation} />
                                <div className="allocation-legend">
                                    {allocation.map(item => (
                                        <div key={item.label} className="allocation-legend__item">
                                            <div className="allocation-legend__color" style={{ background: item.color }} />
                                            <div className="allocation-legend__info">
                                                <span className="allocation-legend__label">{item.label}</span>
                                                <span className="allocation-legend__value">{formatCurrency(item.value)}</span>
                                            </div>
                                            <span className="allocation-legend__percent">{item.percent.toFixed(1)}%</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </CardBody>
                    </Card>

                    {/* Top Assets */}
                    <Card>
                        <CardBody>
                            <div className="card__section-header">
                                <h3 className="card__section-title">Top Assets</h3>
                                <button className="card__section-link">View All →</button>
                            </div>
                            <div className="top-assets-list">
                                {topTokens.map((token, i) => (
                                    <div key={token.symbol} className="top-asset-row">
                                        <div className="top-asset-row__rank">{i + 1}</div>
                                        <TokenIcon token={token} size={36} showProtocol />
                                        <div className="top-asset-row__info">
                                            <div className="top-asset-row__symbol">{token.symbol}</div>
                                            <div className="top-asset-row__balance">
                                                {token.balance.toLocaleString(undefined, { maximumFractionDigits: 4 })}
                                            </div>
                                        </div>
                                        <div className="top-asset-row__value">
                                            {formatCurrency(token.value)}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardBody>
                    </Card>
                </div>

                {/* Right Column: Positions & Activity */}
                <div className="portfolio-right-col">
                    {/* LP Positions Summary */}
                    <Card>
                        <CardBody>
                            <div className="card__section-header">
                                <h3 className="card__section-title">LP Positions</h3>
                                <button className="card__section-link" onClick={() => navigate('/app/liquidity')}>
                                    Manage →
                                </button>
                            </div>
                            <div className="positions-summary-list">
                                {USER_POSITIONS.slice(0, 3).map(pos => {
                                    const value = (pos.token0Amount * pos.pool.token0.price) + (pos.token1Amount * pos.pool.token1.price);
                                    const apr = pos.pool.apr + (pos.pool.aprEmissions || 0) + (pos.pool.aprYield || 0);
                                    return (
                                        <div key={pos.id} className="position-summary-row">
                                            <DualTokenIcon token0={pos.pool.token0} token1={pos.pool.token1} size={36} />
                                            <div className="position-summary-row__info">
                                                <div className="position-summary-row__name">
                                                    {pos.pool.token0.symbol}/{pos.pool.token1.symbol}
                                                </div>
                                                <div className="position-summary-row__meta">
                                                    <span className={pos.inRange ? 'text-success' : 'text-warning'}>
                                                        {pos.inRange ? '● In Range' : '○ Out of Range'}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="position-summary-row__stats">
                                                <div className="position-summary-row__value">{formatCurrency(value)}</div>
                                                <div className="position-summary-row__apr text-success">{apr.toFixed(1)}% APR</div>
                                            </div>
                                        </div>
                                    );
                                })}
                                {USER_POSITIONS.length > 3 && (
                                    <button className="positions-view-all" onClick={() => navigate('/app/liquidity')}>
                                        View all {USER_POSITIONS.length} positions
                                    </button>
                                )}
                            </div>
                        </CardBody>
                    </Card>

                    {/* Unclaimed Rewards */}
                    {(unclaimedFees > 0 || unclaimedIgnis > 0) && (
                        <Card className="rewards-card">
                            <CardBody>
                                <h3 className="card__section-title">Unclaimed Rewards</h3>
                                <div className="rewards-summary">
                                    {unclaimedFees > 0 && (
                                        <div className="reward-item">
                                            <span className="reward-item__label">LP Fees</span>
                                            <span className="reward-item__value">{formatCurrency(unclaimedFees)}</span>
                                        </div>
                                    )}
                                    {unclaimedIgnis > 0 && (
                                        <div className="reward-item">
                                            <span className="reward-item__label">IGNIS Rewards</span>
                                            <span className="reward-item__value reward-item__value--gold">
                                                {unclaimedIgnis.toFixed(2)} IGNIS
                                            </span>
                                        </div>
                                    )}
                                    <div className="reward-item reward-item--total">
                                        <span className="reward-item__label">Total Value</span>
                                        <span className="reward-item__value">
                                            {formatCurrency(unclaimedFees + (unclaimedIgnis * 2))}
                                        </span>
                                    </div>
                                </div>
                                <Button variant="primary" onClick={handleClaimAll} style={{ width: '100%', marginTop: '1rem' }}>
                                    Claim All
                                </Button>
                            </CardBody>
                        </Card>
                    )}

                    {/* Recent Activity */}
                    <Card>
                        <CardBody>
                            <div className="card__section-header">
                                <h3 className="card__section-title">Recent Activity</h3>
                                <button className="card__section-link">View All →</button>
                            </div>
                            <div className="activity-list">
                                {RECENT_ACTIVITY.slice(0, 5).map(activity => (
                                    <ActivityRow key={activity.id} activity={activity} />
                                ))}
                            </div>
                        </CardBody>
                    </Card>
                </div>
            </div>
        </PageContainer>
    );
};

// ─────────────────────────────────────────────────────────────────────────────
// SUB-COMPONENTS
// ─────────────────────────────────────────────────────────────────────────────

interface ChangeIndicatorProps {
    label: string;
    change: { value: number; percent: number };
}

const ChangeIndicator: React.FC<ChangeIndicatorProps> = ({ label, change }) => {
    const isPositive = change.value >= 0;
    return (
        <div className={`change-indicator ${isPositive ? 'change-indicator--positive' : 'change-indicator--negative'}`}>
            <span className="change-indicator__label">{label}</span>
            <span className="change-indicator__value">
                {isPositive ? '+' : ''}{formatCurrency(change.value)}
            </span>
            <span className="change-indicator__percent">
                ({isPositive ? '+' : ''}{change.percent.toFixed(2)}%)
            </span>
        </div>
    );
};

interface PortfolioStatCardProps {
    icon: string;
    title: string;
    value: string;
    subtitle: string;
    onClick: () => void;
    color: string;
    badge?: string;
}

const PortfolioStatCard: React.FC<PortfolioStatCardProps> = ({ icon, title, value, subtitle, onClick, color, badge }) => (
    <Card className="portfolio-stat-card" onClick={onClick} style={{ cursor: 'pointer' }}>
        <CardBody>
            <div className="portfolio-stat-card__header">
                <div className="portfolio-stat-card__icon" style={{ background: `${color}15`, color }}>{icon}</div>
                <div className="portfolio-stat-card__title">{title}</div>
                {badge && <div className="portfolio-stat-card__badge">{badge}</div>}
            </div>
            <div className="portfolio-stat-card__value">{value}</div>
            <div className="portfolio-stat-card__subtitle">{subtitle}</div>
        </CardBody>
    </Card>
);

interface DonutChartProps {
    data: { label: string; value: number; color: string; percent: number }[];
}

const DonutChart: React.FC<DonutChartProps> = ({ data }) => {
    const total = data.reduce((sum, d) => sum + d.value, 0);
    const radius = 35;
    const circumference = 2 * Math.PI * radius;
    
    let cumulativePercent = 0;
    
    const segments = data.map(item => {
        const percent = item.value / total;
        const startPercent = cumulativePercent;
        cumulativePercent += percent;
        return { ...item, percent, startPercent };
    });

    return (
        <div className="donut-chart">
            <svg viewBox="0 0 100 100" className="donut-chart__svg">
                {segments.map((seg, i) => {
                    const strokeDasharray = `${seg.percent * circumference} ${circumference}`;
                    const strokeDashoffset = -seg.startPercent * circumference;
                    
                    return (
                        <circle
                            key={i}
                            cx="50"
                            cy="50"
                            r={radius}
                            fill="none"
                            stroke={seg.color}
                            strokeWidth="12"
                            strokeDasharray={strokeDasharray}
                            strokeDashoffset={strokeDashoffset}
                            transform="rotate(-90 50 50)"
                            className="donut-chart__segment"
                        />
                    );
                })}
            </svg>
            <div className="donut-chart__center">
                <div className="donut-chart__center-value">{formatCurrency(total)}</div>
                <div className="donut-chart__center-label">Total</div>
            </div>
        </div>
    );
};

interface PortfolioChartProps {
    data: typeof PORTFOLIO_HISTORY;
    timeframe: TimeFrame;
}

const PortfolioChart: React.FC<PortfolioChartProps> = ({ data, timeframe }) => {
    const filteredData = useMemo(() => {
        if (timeframe === '24h') return data.slice(-2);
        if (timeframe === '7d') return data.slice(-7);
        if (timeframe === '30d') return data.slice(-30);
        return data;
    }, [data, timeframe]);

    if (filteredData.length < 2) return null;

    const values = filteredData.map(d => d.totalValue);
    const min = Math.min(...values) * 0.98;
    const max = Math.max(...values) * 1.02;
    const range = max - min;

    const points = filteredData.map((d, i) => {
        const x = (i / (filteredData.length - 1)) * 100;
        const y = 100 - ((d.totalValue - min) / range) * 100;
        return `${x},${y}`;
    }).join(' ');

    const isUp = filteredData[filteredData.length - 1].totalValue >= filteredData[0].totalValue;
    const color = isUp ? '#22C55E' : '#EF4444';

    return (
        <div className="portfolio-chart">
            <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="portfolio-chart__svg">
                <defs>
                    <linearGradient id="chartGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor={color} stopOpacity="0.3" />
                        <stop offset="100%" stopColor={color} stopOpacity="0" />
                    </linearGradient>
                </defs>
                <polygon
                    points={`0,100 ${points} 100,100`}
                    fill="url(#chartGradient)"
                />
                <polyline
                    points={points}
                    fill="none"
                    stroke={color}
                    strokeWidth="0.5"
                    vectorEffect="non-scaling-stroke"
                />
            </svg>
        </div>
    );
};

interface ActivityRowProps {
    activity: typeof RECENT_ACTIVITY[0];
}

const ActivityRow: React.FC<ActivityRowProps> = ({ activity }) => {
    const icons: Record<string, string> = {
        swap: '🔄',
        add_liquidity: '💧',
        remove_liquidity: '📤',
        stake: '🔒',
        claim: '🎁',
        receive: '📥',
    };

    const formatTime = (date: Date) => {
        const diff = Date.now() - date.getTime();
        const hours = Math.floor(diff / (1000 * 60 * 60));
        if (hours < 1) return 'Just now';
        if (hours < 24) return `${hours}h ago`;
        const days = Math.floor(hours / 24);
        return `${days}d ago`;
    };

    return (
        <div className="activity-row">
            <div className="activity-row__icon">{icons[activity.type] || '📋'}</div>
            <div className="activity-row__info">
                <div className="activity-row__title">{activity.title}</div>
                <div className="activity-row__desc">{activity.description}</div>
            </div>
            <div className="activity-row__right">
                <div className={`activity-row__value ${activity.value.startsWith('+') ? 'activity-row__value--positive' : ''}`}>
                    {activity.value}
                </div>
                <div className="activity-row__time">{formatTime(activity.timestamp)}</div>
            </div>
        </div>
    );
};
