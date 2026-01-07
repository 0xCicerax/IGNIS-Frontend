import { useState, useEffect, memo } from 'react';
import { USER_POSITIONS, UserPosition } from '../data';
import type { Pool, PendingTransactions } from '../types';
import { 
    DualTokenIcon, 
    SkeletonStats, 
    SkeletonPositionCard, 
    SkeletonPositionRow,
    ConnectWalletEmpty,
    NoPositionsEmpty,
    InfoTooltip,
    FadeIn,
} from '../components/ui';
import { AddLiquidityModal, WithdrawModal } from '../components/modals';
import {
    PageContainer,
    StatsGrid,
    StatBox,
    Card,
    Button,
    DataTable,
    TableHeader,
    TableHeaderCell,
    TableBody,
    TableRow,
    TableCell,
    TableContainer,
} from '../components/shared';
import { formatCurrency, showTxToast } from '../utils';
import { useWallet } from '../contexts';

// ─────────────────────────────────────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────────────────────────────────────
const LOADING_DELAY = 1000;

// Helper to calculate range percentages based on current price
const calcRangePct = (pool: Pool, minPrice: number, maxPrice: number) => {
    const currentPrice = pool.token0.price / pool.token1.price;
    return {
        lowerPct: ((minPrice - currentPrice) / currentPrice) * 100,
        upperPct: ((maxPrice - currentPrice) / currentPrice) * 100
    };
};

// Range percentage badge component with min/max prices
const RangeBadges = ({ lowerPct, upperPct, minPrice, maxPrice }: { lowerPct: number; upperPct: number; minPrice?: number; maxPrice?: number }) => (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
            <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                padding: '0.25rem 0.5rem', 
                background: 'linear-gradient(135deg, rgba(239,68,68,0.15) 0%, rgba(239,68,68,0.05) 100%)', 
                borderRadius: 6, 
                border: '1px solid rgba(239,68,68,0.2)' 
            }}>
                <span style={{ fontFamily: 'JetBrains Mono', fontSize: '0.75rem', fontWeight: 700, color: '#EF4444' }}>
                    {lowerPct >= 0 ? '+' : ''}{lowerPct.toFixed(1)}%
                </span>
            </div>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#7A7A7A" strokeWidth="2">
                <path d="M5 12h14M12 5l7 7-7 7"/>
            </svg>
            <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                padding: '0.25rem 0.5rem', 
                background: 'linear-gradient(135deg, rgba(34,197,94,0.15) 0%, rgba(34,197,94,0.05) 100%)', 
                borderRadius: 6, 
                border: '1px solid rgba(34,197,94,0.2)' 
            }}>
                <span style={{ fontFamily: 'JetBrains Mono', fontSize: '0.75rem', fontWeight: 700, color: '#22C55E' }}>
                    +{upperPct.toFixed(1)}%
                </span>
            </div>
        </div>
        {minPrice !== undefined && maxPrice !== undefined && (
            <div style={{ fontSize: '0.625rem', color: '#7A7A7A', fontFamily: 'JetBrains Mono' }}>
                {minPrice < 1 ? minPrice.toFixed(6) : minPrice.toFixed(2)} ↔ {maxPrice < 1 ? maxPrice.toFixed(6) : maxPrice.toFixed(2)}
            </div>
        )}
    </div>
);

// ─────────────────────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────────────────────
export const LiquidityPage = ({ pendingTxs, onPositionClick }: { pendingTxs?: PendingTransactions; onPositionClick?: (poolId: number) => void }) => {
    const { isConnected, connect } = useWallet();
    
    const [isLoading, setIsLoading] = useState(true);
    const [addModalOpen, setAddModalOpen] = useState(false);
    const [withdrawModal, setWithdrawModal] = useState({ open: false, position: null });

    // Computed values
    const totalValue = USER_POSITIONS.reduce((s, p) => (
        s + (p.token0Amount * p.pool.token0.price) + (p.token1Amount * p.pool.token1.price)
    ), 0);
    const totalFeesEarned = USER_POSITIONS.reduce((s, p) => s + p.feesEarned, 0);
    const totalIgniEarned = USER_POSITIONS.reduce((s, p) => s + p.igniEarned, 0);

    useEffect(() => {
        const timer = setTimeout(() => setIsLoading(false), LOADING_DELAY);
        return () => clearTimeout(timer);
    }, []);

    // ─────────────────────────────────────────────────────────────────────────
    // HANDLERS
    // ─────────────────────────────────────────────────────────────────────────
    const handleClaimAll = async () => {
        const toastId = showTxToast.pending(`Claiming ${totalIgniEarned.toFixed(1)} IGNIS from all positions...`);
        await new Promise(r => setTimeout(r, 2000));
        showTxToast.success(
            `Claimed ${totalIgniEarned.toFixed(1)} IGNIS from all positions`, 
            '0x' + Math.random().toString(16).slice(2, 10), 
            toastId
        );
    };

    const handleClaimPosition = async (pos) => {
        const toastId = showTxToast.pending(`Claiming ${pos.igniEarned.toFixed(2)} IGNIS...`);
        await new Promise(r => setTimeout(r, 1500));
        showTxToast.success(
            `Claimed ${pos.igniEarned.toFixed(2)} IGNIS from ${pos.pool.token0.symbol}/${pos.pool.token1.symbol}`, 
            '0x' + Math.random().toString(16).slice(2, 10), 
            toastId
        );
    };

    const handleWithdraw = (pos) => {
        setWithdrawModal({ open: true, position: pos });
    };

    // ─────────────────────────────────────────────────────────────────────────
    // RENDER
    // ─────────────────────────────────────────────────────────────────────────
    return (
        <PageContainer style={{ maxWidth: 1100 }}>
            {/* Header */}
            <div className="liquidity-header">
                <div>
                    <h1 className="liquidity-header__title">My Liquidity</h1>
                    <p className="liquidity-header__subtitle">Manage your active positions</p>
                </div>
                <div className="liquidity-header__actions">
                    {totalIgniEarned > 0 && (
                        <Button variant="secondary" onClick={handleClaimAll}>
                            Claim All ({totalIgniEarned.toFixed(1)} IGNIS)
                        </Button>
                    )}
                </div>
            </div>

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
                        <StatBox label="Total Value" value={formatCurrency(totalValue)} />
                        <StatBox label="Fees Earned" value={formatCurrency(totalFeesEarned)} />
                        <StatBox label="Unclaimed IGNIS" value={totalIgniEarned.toFixed(2)} color="gold" />
                        <StatBox label="Positions" value={USER_POSITIONS.length.toString()} />
                    </>
                )}
            </StatsGrid>

            {/* Desktop Table */}
            <div className="position-row-desktop">
                <Card>
                    <TableContainer>
                        <DataTable>
                            <TableHeader>
                                <TableHeaderCell>Position</TableHeaderCell>
                                <TableHeaderCell align="center">Range</TableHeaderCell>
                                <TableHeaderCell align="right">Value</TableHeaderCell>
                                <TableHeaderCell align="right">APR</TableHeaderCell>
                                <TableHeaderCell align="right">IGNIS Rewards</TableHeaderCell>
                                <TableHeaderCell align="center">Status</TableHeaderCell>
                                <TableHeaderCell align="right" />
                            </TableHeader>
                            <TableBody>
                                {isLoading ? (
                                    <>
                                        <SkeletonPositionRow />
                                        <SkeletonPositionRow />
                                        <SkeletonPositionRow />
                                    </>
                                ) : (
                                    USER_POSITIONS.map(pos => (
                                        <PositionTableRow 
                                            key={pos.id} 
                                            position={pos} 
                                            onClaim={handleClaimPosition}
                                            onWithdraw={handleWithdraw}
                                            onPositionClick={onPositionClick}
                                        />
                                    ))
                                )}
                            </TableBody>
                        </DataTable>
                    </TableContainer>
                </Card>
            </div>

            {/* Mobile Cards */}
            <div className="position-card-mobile mobile-cards">
                {isLoading ? (
                    <>
                        <SkeletonPositionCard />
                        <SkeletonPositionCard />
                    </>
                ) : (
                    USER_POSITIONS.map(pos => (
                        <PositionMobileCard 
                            key={pos.id} 
                            position={pos} 
                            onWithdraw={handleWithdraw}
                            onPositionClick={onPositionClick}
                        />
                    ))
                )}
            </div>

            {/* Modals */}
            {addModalOpen && (
                <AddLiquidityModal 
                    isOpen={addModalOpen} 
                    onClose={() => setAddModalOpen(false)} 
                    pool={null} 
                    isConnected={isConnected} 
                    onConnect={connect} 
                />
            )}
            {withdrawModal.open && (
                <WithdrawModal 
                    isOpen={withdrawModal.open} 
                    onClose={() => setWithdrawModal({ open: false, position: null })} 
                    position={withdrawModal.position} 
                />
            )}
        </PageContainer>
    );
};

// ─────────────────────────────────────────────────────────────────────────────
// SUB-COMPONENTS
// ─────────────────────────────────────────────────────────────────────────────

const PositionTableRow = memo(({ position, onClaim, onWithdraw, onPositionClick }: { position: UserPosition; onClaim: (pos: UserPosition) => void; onWithdraw: (pos: UserPosition) => void; onPositionClick?: (poolId: number) => void }) => {
    const pos = position;
    const value = (pos.token0Amount * pos.pool.token0.price) + (pos.token1Amount * pos.pool.token1.price);
    const posAPR = pos.pool.apr + (pos.pool.aprEmissions || 0) + (pos.pool.aprYield || 0);
    const rangePct = calcRangePct(pos.pool, pos.minPrice, pos.maxPrice);

    return (
        <TableRow 
            onClick={() => onPositionClick && onPositionClick(pos.pool.id)}
            style={{ cursor: 'pointer' }}
            className="position-row--clickable"
        >
            <TableCell>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <DualTokenIcon token0={pos.pool.token0} token1={pos.pool.token1} size={36} />
                    <div>
                        <div style={{ fontWeight: 600, marginBottom: '0.125rem' }}>
                            {pos.pool.token0.symbol}/{pos.pool.token1.symbol}
                        </div>
                        <div style={{ fontSize: '0.625rem', color: '#7A7A7A' }}>
                            {pos.pool.type}
                        </div>
                    </div>
                </div>
            </TableCell>
            <TableCell align="center">
                <RangeBadges 
                    lowerPct={rangePct.lowerPct} 
                    upperPct={rangePct.upperPct} 
                    minPrice={pos.minPrice}
                    maxPrice={pos.maxPrice}
                />
            </TableCell>
            <TableCell align="right" mono>{formatCurrency(value)}</TableCell>
            <TableCell align="right">
                <span style={{ fontFamily: 'JetBrains Mono', fontWeight: 600, color: '#22C55E' }}>
                    {posAPR.toFixed(2)}%
                </span>
            </TableCell>
            <TableCell align="right">
                {pos.igniEarned > 0 ? (
                    <div className="position-table__ignis-cell">
                        <span style={{ fontFamily: 'JetBrains Mono', fontWeight: 600, color: '#F5B041' }}>
                            {pos.igniEarned.toFixed(2)}
                        </span>
                        <Button variant="primary" onClick={(e) => { e.stopPropagation(); onClaim(pos); }} style={{ padding: '0.3rem 0.625rem', fontSize: '0.6875rem' }}>
                            Claim
                        </Button>
                    </div>
                ) : (
                    <span style={{ color: '#7A7A7A' }}>—</span>
                )}
            </TableCell>
            <TableCell align="center">
                <span 
                    style={{ 
                        display: 'inline-flex', 
                        alignItems: 'center', 
                        gap: '0.25rem', 
                        padding: '0.25rem 0.5rem', 
                        borderRadius: 5, 
                        fontSize: '0.625rem', 
                        fontWeight: 600, 
                        background: pos.inRange ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)', 
                        color: pos.inRange ? '#22C55E' : '#EF4444' 
                    }}
                >
                    <span style={{ width: 5, height: 5, borderRadius: '50%', background: pos.inRange ? '#22C55E' : '#EF4444' }} />
                    {pos.inRange ? 'In Range' : 'Out of Range'}
                </span>
            </TableCell>
            <TableCell align="right">
                <Button variant="danger" onClick={(e) => { e.stopPropagation(); onWithdraw(pos); }} className="btn--danger">
                    Withdraw
                </Button>
            </TableCell>
        </TableRow>
    );
});

const PositionMobileCard = memo(({ position, onWithdraw, onPositionClick }: { position: UserPosition; onWithdraw: (pos: UserPosition) => void; onPositionClick?: (poolId: number) => void }) => {
    const pos = position;
    const value = (pos.token0Amount * pos.pool.token0.price) + (pos.token1Amount * pos.pool.token1.price);
    const posAPR = pos.pool.apr + (pos.pool.aprEmissions || 0) + (pos.pool.aprYield || 0);
    const rangePct = calcRangePct(pos.pool, pos.minPrice, pos.maxPrice);

    return (
        <div 
            className="mobile-card position-card--clickable"
            onClick={() => onPositionClick && onPositionClick(pos.pool.id)}
            style={{ cursor: 'pointer' }}
        >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
                <DualTokenIcon token0={pos.pool.token0} token1={pos.pool.token1} size={42} />
                <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, marginBottom: '0.2rem' }}>
                        {pos.pool.token0.symbol}/{pos.pool.token1.symbol}
                    </div>
                    <span 
                        style={{ 
                            display: 'inline-flex', 
                            alignItems: 'center', 
                            gap: '0.25rem', 
                            padding: '0.2rem 0.5rem', 
                            borderRadius: 5, 
                            fontSize: '0.5625rem', 
                            fontWeight: 600, 
                            background: pos.inRange ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)', 
                            color: pos.inRange ? '#22C55E' : '#EF4444' 
                        }}
                    >
                        <span style={{ width: 4, height: 4, borderRadius: '50%', background: pos.inRange ? '#22C55E' : '#EF4444' }} />
                        {pos.inRange ? 'In Range' : 'Out of Range'}
                    </span>
                </div>
                <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '1.125rem', fontWeight: 700, color: '#22C55E', fontFamily: 'Space Grotesk' }}>
                        {posAPR.toFixed(1)}%
                    </div>
                    <div style={{ fontSize: '0.5625rem', color: '#7A7A7A' }}>APR</div>
                </div>
            </div>
            
            {/* Range badges */}
            <div style={{ 
                display: 'flex', 
                flexDirection: 'column',
                alignItems: 'center', 
                gap: '0.375rem', 
                marginBottom: '0.75rem', 
                padding: '0.5rem', 
                background: 'rgba(0,0,0,0.2)', 
                borderRadius: 8 
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                    <div style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        padding: '0.3rem 0.5rem', 
                        background: 'linear-gradient(135deg, rgba(239,68,68,0.15) 0%, rgba(239,68,68,0.05) 100%)', 
                        borderRadius: 6, 
                        border: '1px solid rgba(239,68,68,0.2)' 
                    }}>
                        <span style={{ fontFamily: 'JetBrains Mono', fontSize: '0.75rem', fontWeight: 700, color: '#EF4444' }}>
                            {rangePct.lowerPct >= 0 ? '+' : ''}{rangePct.lowerPct.toFixed(1)}%
                        </span>
                    </div>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#7A7A7A" strokeWidth="2">
                        <path d="M5 12h14M12 5l7 7-7 7"/>
                    </svg>
                    <div style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        padding: '0.3rem 0.5rem', 
                        background: 'linear-gradient(135deg, rgba(34,197,94,0.15) 0%, rgba(34,197,94,0.05) 100%)', 
                        borderRadius: 6, 
                        border: '1px solid rgba(34,197,94,0.2)' 
                    }}>
                        <span style={{ fontFamily: 'JetBrains Mono', fontSize: '0.75rem', fontWeight: 700, color: '#22C55E' }}>
                            +{rangePct.upperPct.toFixed(1)}%
                        </span>
                    </div>
                </div>
                <div style={{ fontSize: '0.625rem', color: '#7A7A7A', fontFamily: 'JetBrains Mono' }}>
                    {pos.minPrice < 1 ? pos.minPrice.toFixed(6) : pos.minPrice.toFixed(2)} ↔ {pos.maxPrice < 1 ? pos.maxPrice.toFixed(6) : pos.maxPrice.toFixed(2)}
                </div>
            </div>
            
            <div className="mobile-card__stats" style={{ gridTemplateColumns: 'repeat(3, 1fr)', marginBottom: '0.875rem' }}>
                <div className="mobile-card__stat">
                    <div className="mobile-card__stat-label">Value</div>
                    <div className="mobile-card__stat-value">{formatCurrency(value)}</div>
                </div>
                <div className="mobile-card__stat">
                    <div className="mobile-card__stat-label">IGNIS Rewards</div>
                    <div className="mobile-card__stat-value" style={{ color: pos.igniEarned > 0 ? '#F5B041' : '#7A7A7A' }}>
                        {pos.igniEarned > 0 ? pos.igniEarned.toFixed(2) : '—'}
                    </div>
                </div>
                <div className="mobile-card__stat">
                    <div className="mobile-card__stat-label">Type</div>
                    <div className="mobile-card__stat-value">{pos.pool.type}</div>
                </div>
            </div>
            <button 
                onClick={(e) => { e.stopPropagation(); onWithdraw(pos); }} 
                className="btn btn--danger"
                style={{ width: '100%', padding: '0.625rem', borderRadius: 10 }}
            >
                Withdraw
            </button>
        </div>
    );
});
