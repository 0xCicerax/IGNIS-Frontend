import { useState, useEffect, memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { PLATFORMS, POOLS } from '../data';
import { 
    DualTokenIcon, 
    TypeBadge, 
    FeeBadge, 
    YieldBadge, 
    APRDisplay, 
    SkeletonPoolRow, 
    SkeletonPoolCard, 
    SkeletonStats,
    NoPoolsEmpty,
    NoSearchResultsEmpty,
    InfoTooltip,
    FadeIn,
} from '../components/ui';
import { AddLiquidityModal } from '../components/modals';
import { 
    PageContainer, 
    PageHeader, 
    Card,
    StatsGrid, 
    StatBox,
    InfoBanner,
    MEVCaptureBanner,
    FilterBar,
    FilterSearch,
    FilterToggleGroup,
    FilterSelect,
    FilterAction,
    Button,
    DataTable,
    TableHeader,
    TableHeaderCell,
    TableBody,
    TableRow,
    TableCell,
    TableContainer,
} from '../components/shared';
import { formatCurrency } from '../utils';

// ─────────────────────────────────────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────────────────────────────────────
const LOADING_DELAY = 1200;

const TYPE_FILTER_OPTIONS = [
    { value: 'all', label: 'All' },
    { value: 'CLAMM', label: 'CLAMM' },
    { value: 'LBAMM', label: 'LBAMM' },
    { value: 'yield', label: 'Yield' },
];

// ─────────────────────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────────────────────
export const PoolsPage = ({ isConnected, onConnect }) => {
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [typeFilter, setTypeFilter] = useState('all');
    const [platformFilter, setPlatformFilter] = useState('All');
    const [sortBy, setSortBy] = useState('tvl');
    const [sortDir, setSortDir] = useState('desc');
    const [addModalOpen, setAddModalOpen] = useState(false);
    const [selectedPool, setSelectedPool] = useState(null);

    // Simulate loading delay
    useEffect(() => {
        const timer = setTimeout(() => setIsLoading(false), LOADING_DELAY);
        return () => clearTimeout(timer);
    }, []);

    // ─────────────────────────────────────────────────────────────────────────
    // HANDLERS
    // ─────────────────────────────────────────────────────────────────────────
    const handleSort = (column) => {
        if (sortBy === column) {
            setSortDir(sortDir === 'desc' ? 'asc' : 'desc');
        } else {
            setSortBy(column);
            setSortDir('desc');
        }
    };

    const handlePoolClick = (pool) => {
        navigate(`/app/pool/${pool.id}`);
    };

    const handleAddLiquidity = (pool) => {
        setSelectedPool(pool);
        setAddModalOpen(true);
    };

    const handleNewPosition = () => {
        setSelectedPool(null);
        setAddModalOpen(true);
    };

    // ─────────────────────────────────────────────────────────────────────────
    // COMPUTED DATA
    // ─────────────────────────────────────────────────────────────────────────
    const filteredPools = POOLS.filter(p => 
        (typeFilter === 'all' || (typeFilter === 'yield' ? p.isYieldBearing : p.type === typeFilter)) && 
        (platformFilter === 'All' || p.platforms?.includes(platformFilter)) && 
        (p.token0.symbol.toLowerCase().includes(search.toLowerCase()) || 
         p.token1.symbol.toLowerCase().includes(search.toLowerCase()))
    ).sort((a, b) => {
        const aprA = a.apr + (a.aprEmissions || 0) + (a.aprYield || 0);
        const aprB = b.apr + (b.aprEmissions || 0) + (b.aprYield || 0);
        let diff = 0;
        if (sortBy === 'tvl') diff = b.tvl - a.tvl;
        else if (sortBy === 'volume') diff = b.volume24h - a.volume24h;
        else if (sortBy === 'fees') diff = b.fees24h - a.fees24h;
        else if (sortBy === 'apr') diff = aprB - aprA;
        return sortDir === 'asc' ? -diff : diff;
    });

    const totalTVL = POOLS.reduce((s, p) => s + p.tvl, 0);
    const totalVolume = POOLS.reduce((s, p) => s + p.volume24h, 0);
    const totalFees = POOLS.reduce((s, p) => s + p.fees24h, 0);
    
    // Mock MEV stats
    const mevCaptured24h = 15021;
    const mevCaptured7d = 95847;
    const mevToLPsPercent = 78;

    const platformOptions = PLATFORMS.map(p => ({
        value: p,
        label: p === 'All' ? 'All Platforms' : p,
    }));

    // ─────────────────────────────────────────────────────────────────────────
    // RENDER
    // ─────────────────────────────────────────────────────────────────────────
    return (
        <PageContainer>
            <PageHeader subtitle="Provide liquidity and earn trading fees + IGNIS rewards">
                <span className="text-gradient">Liquidity</span> Pools
            </PageHeader>

            {/* MEV Capture Banner */}
            <MEVCaptureBanner 
                mev24h={mevCaptured24h}
                mev7d={mevCaptured7d}
                lpPercent={mevToLPsPercent}
                formatCurrency={formatCurrency}
            />

            {/* Info Banner */}
            <InfoBanner 
                icon="💡" 
                variant="success"
                title="Yield-Bearing Pools Route Regular Trades"
            >
                Pools like <span style={{ color: '#22C55E' }}>aUSDC/fETH</span> automatically route any{' '}
                <span style={{ color: '#FFF' }}>USDC↔ETH</span> swap. LPs earn trading fees{' '}
                <strong>plus</strong> underlying yield.
            </InfoBanner>

            {/* Stats Grid */}
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
                        <StatBox label="Total Value Locked" value={formatCurrency(totalTVL)} />
                        <StatBox label="24h Volume" value={formatCurrency(totalVolume)} />
                        <StatBox label="24h Fees" value={formatCurrency(totalFees)} />
                        <StatBox label="Active Pools" value={POOLS.length.toString()} />
                    </>
                )}
            </StatsGrid>

            {/* Filters */}
            <FilterBar>
                <FilterSearch 
                    value={search}
                    onChange={setSearch}
                    placeholder="Search pools..."
                />
                <FilterToggleGroup 
                    options={TYPE_FILTER_OPTIONS}
                    value={typeFilter}
                    onChange={setTypeFilter}
                />
                <FilterSelect 
                    options={platformOptions}
                    value={platformFilter}
                    onChange={setPlatformFilter}
                />
            </FilterBar>

            {/* Desktop Table */}
            <div className="pool-row-desktop">
                <Card>
                    <TableContainer>
                        <DataTable>
                            <TableHeader>
                                <TableHeaderCell>Pool</TableHeaderCell>
                                <TableHeaderCell 
                                    align="right" 
                                    sortKey="tvl" 
                                    currentSort={sortBy} 
                                    sortDir={sortDir} 
                                    onSort={handleSort}
                                >
                                    TVL
                                </TableHeaderCell>
                                <TableHeaderCell 
                                    align="right" 
                                    sortKey="volume" 
                                    currentSort={sortBy} 
                                    sortDir={sortDir} 
                                    onSort={handleSort}
                                >
                                    Volume 24h
                                </TableHeaderCell>
                                <TableHeaderCell 
                                    align="right" 
                                    sortKey="fees" 
                                    currentSort={sortBy} 
                                    sortDir={sortDir} 
                                    onSort={handleSort}
                                >
                                    Fees 24h
                                </TableHeaderCell>
                                <TableHeaderCell 
                                    align="right" 
                                    sortKey="apr" 
                                    currentSort={sortBy} 
                                    sortDir={sortDir} 
                                    onSort={handleSort}
                                >
                                    APR
                                </TableHeaderCell>
                                <TableHeaderCell align="right" />
                            </TableHeader>
                            <TableBody>
                                {isLoading ? (
                                    <>
                                        <SkeletonPoolRow />
                                        <SkeletonPoolRow />
                                        <SkeletonPoolRow />
                                        <SkeletonPoolRow />
                                        <SkeletonPoolRow />
                                    </>
                                ) : (
                                    filteredPools.map(pool => (
                                        <PoolTableRow 
                                            key={pool.id} 
                                            pool={pool} 
                                            onClick={() => handlePoolClick(pool)}
                                            onAddLiquidity={() => handleAddLiquidity(pool)}
                                        />
                                    ))
                                )}
                            </TableBody>
                        </DataTable>
                    </TableContainer>
                </Card>
            </div>

            {/* Mobile Cards */}
            <div className="pool-card-mobile mobile-cards">
                {isLoading ? (
                    <>
                        <SkeletonPoolCard />
                        <SkeletonPoolCard />
                        <SkeletonPoolCard />
                    </>
                ) : (
                    filteredPools.map(pool => (
                        <PoolMobileCard 
                            key={pool.id} 
                            pool={pool} 
                            onClick={() => handlePoolClick(pool)} 
                        />
                    ))
                )}
            </div>

            {/* Add Liquidity Modal */}
            {addModalOpen && (
                <AddLiquidityModal 
                    isOpen={addModalOpen} 
                    onClose={() => setAddModalOpen(false)} 
                    pool={selectedPool} 
                    isConnected={isConnected} 
                    onConnect={onConnect} 
                />
            )}
        </PageContainer>
    );
};

// ─────────────────────────────────────────────────────────────────────────────
// SUB-COMPONENTS
// ─────────────────────────────────────────────────────────────────────────────

const PoolTableRow = memo(({ pool, onClick, onAddLiquidity }) => (
    <TableRow onClick={onClick}>
        <TableCell>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <DualTokenIcon token0={pool.token0} token1={pool.token1} size={36} showProtocol={pool.isYieldBearing} />
                <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', marginBottom: '0.15rem' }}>
                        <span style={{ fontWeight: 600, fontSize: '0.875rem' }}>{pool.token0.symbol}/{pool.token1.symbol}</span>
                        <TypeBadge type={pool.type} />
                        <FeeBadge fee={pool.fee} />
                        {pool.isYieldBearing && <YieldBadge />}
                    </div>
                    <div style={{ fontSize: '0.625rem', color: '#22C55E' }}>Routes: {pool.routesTo}</div>
                    {pool.isYieldBearing && pool.platforms && (
                        <div style={{ fontSize: '0.625rem', color: '#A78BFA' }}>{pool.platforms.join(' • ')}</div>
                    )}
                </div>
            </div>
        </TableCell>
        <TableCell align="right" mono>{formatCurrency(pool.tvl)}</TableCell>
        <TableCell align="right" mono>{formatCurrency(pool.volume24h)}</TableCell>
        <TableCell align="right" mono>{formatCurrency(pool.fees24h)}</TableCell>
        <TableCell align="right"><APRDisplay pool={pool} /></TableCell>
        <TableCell align="right">
            <Button 
                variant="secondary" 
                onClick={e => { e.stopPropagation(); onAddLiquidity(); }}
            >
                Add
            </Button>
        </TableCell>
    </TableRow>
));

const PoolMobileCard = memo(({ pool, onClick }) => {
    const totalAPR = pool.apr + (pool.aprEmissions || 0) + (pool.aprYield || 0);
    
    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onClick();
        }
    };
    
    return (
        <div 
            className="mobile-card" 
            onClick={onClick}
            role="button"
            tabIndex={0}
            onKeyDown={handleKeyDown}
            aria-label={`View ${pool.token0.symbol}/${pool.token1.symbol} pool with ${totalAPR.toFixed(1)}% APR`}
        >
            <div className="mobile-card__header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <DualTokenIcon token0={pool.token0} token1={pool.token1} size={42} showProtocol={pool.isYieldBearing} />
                    <div>
                        <div style={{ fontWeight: 700, marginBottom: '0.2rem' }}>{pool.token0.symbol}/{pool.token1.symbol}</div>
                        <div style={{ display: 'flex', gap: '0.3rem', flexWrap: 'wrap' }}>
                            <TypeBadge type={pool.type} />
                            {pool.isYieldBearing && <YieldBadge />}
                        </div>
                        <div style={{ fontSize: '0.5625rem', color: '#22C55E', marginTop: '0.25rem' }}>Routes: {pool.routesTo}</div>
                        {pool.isYieldBearing && pool.platforms && (
                            <div style={{ fontSize: '0.5625rem', color: '#A78BFA' }}>{pool.platforms.join(' • ')}</div>
                        )}
                    </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '1.375rem', fontWeight: 700, color: '#22C55E', fontFamily: 'Space Grotesk' }}>
                        {totalAPR.toFixed(1)}%
                    </div>
                    <div style={{ fontSize: '0.625rem', color: '#8A8A8A' }}>APR</div>
                </div>
            </div>
            <div className="mobile-card__stats">
                <div className="mobile-card__stat">
                    <div className="mobile-card__stat-label">TVL</div>
                    <div className="mobile-card__stat-value">{formatCurrency(pool.tvl)}</div>
                </div>
                <div className="mobile-card__stat">
                    <div className="mobile-card__stat-label">Volume</div>
                    <div className="mobile-card__stat-value">{formatCurrency(pool.volume24h)}</div>
                </div>
                <div className="mobile-card__stat">
                    <div className="mobile-card__stat-label">Fees</div>
                    <div className="mobile-card__stat-value">{formatCurrency(pool.fees24h)}</div>
                </div>
            </div>
        </div>
    );
});
