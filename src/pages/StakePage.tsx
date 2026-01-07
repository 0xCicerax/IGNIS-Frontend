import { useState } from 'react';
import { USER_LOCKS } from '../data';
import { LockIgnisModal, SplitMergeModal } from '../components/modals';
import { 
    ConnectWalletEmpty,
    NoStakesEmpty,
    InfoTooltip,
    FadeIn,
} from '../components/ui';
import {
    PageContainer,
    PageHeader,
    Card,
    CardBody,
    StatsGrid,
    StatBox,
    Button,
    ProgressBar,
} from '../components/shared';
import { formatNumber, formatCurrency, showTxToast } from '../utils';
import { useWallet } from '../contexts';
import type { PendingTransactions } from '../types';
import type { UserLock } from '../types/veIGNI';
import '../styles/split-merge.css';

// ─────────────────────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────────────────────
export const StakePage = ({ pendingTxs }: { pendingTxs?: PendingTransactions }) => {
    const { isConnected, connect } = useWallet();
    
    const [lockModalOpen, setLockModalOpen] = useState(false);
    const [splitMergeModalOpen, setSplitMergeModalOpen] = useState(false);
    
    // Constants
    const igniBalance = 10000;
    const igniPrice = 2.00;
    const totalLocked = USER_LOCKS.reduce((s, l) => s + l.lockedIgni, 0);
    const totalVeIgni = USER_LOCKS.reduce((s, l) => s + l.veIgni, 0);

    // ─────────────────────────────────────────────────────────────────────────
    // HANDLERS
    // ─────────────────────────────────────────────────────────────────────────
    const handleClaimRewards = async () => {
        const toastId = showTxToast.pending('Claiming rewards...');
        await new Promise(r => setTimeout(r, 1500));
        showTxToast.success('Claimed 96.55 IGNIS rewards!', '0x' + Math.random().toString(16).slice(2, 10), toastId);
    };

    const handleExtend = async (lock) => {
        const toastId = showTxToast.pending(`Extending lock #${lock.id}...`);
        await new Promise(r => setTimeout(r, 1500));
        showTxToast.success(`Extended lock #${lock.id} duration`, '0x' + Math.random().toString(16).slice(2, 10), toastId);
    };

    const handleAddToLock = async (lock) => {
        const toastId = showTxToast.pending(`Adding to lock #${lock.id}...`);
        await new Promise(r => setTimeout(r, 1500));
        showTxToast.success(`Added IGNIS to lock #${lock.id}`, '0x' + Math.random().toString(16).slice(2, 10), toastId);
    };

    // ─────────────────────────────────────────────────────────────────────────
    // NOT CONNECTED STATE
    // ─────────────────────────────────────────────────────────────────────────
    if (!isConnected) {
        return (
            <PageContainer style={{ maxWidth: 1100 }}>
                <ConnectWalletEmpty 
                    onConnect={connect} 
                    message="Connect your wallet to lock IGNIS tokens and earn veIGNIS for governance, fee sharing, and boosted rewards."
                />
            </PageContainer>
        );
    }

    // ─────────────────────────────────────────────────────────────────────────
    // RENDER
    // ─────────────────────────────────────────────────────────────────────────
    return (
        <PageContainer style={{ maxWidth: 1100 }}>
            {/* Header */}
            <PageHeader subtitle="Lock IGNIS to receive veIGNIS for governance, fees, and rewards">
                <span className="text-gradient">ve</span>IGNIS{' '}
                <span style={{ fontWeight: 400, color: '#8A8A8A' }}>Staking</span>
            </PageHeader>

            {/* Stats Grid */}
            <StatsGrid>
                <StatBox 
                    label="Your IGNIS" 
                    labelSize="small"
                    value={formatNumber(igniBalance)} 
                    style={{ textAlign: 'center' }}
                />
                <StatBox 
                    label="Your veIGNIS" 
                    labelSize="small"
                    value={formatNumber(totalVeIgni)} 
                    color="purple"
                    style={{ textAlign: 'center' }}
                />
                <StatBox 
                    label="Total veIGNIS" 
                    labelSize="small"
                    value="2.5M" 
                    style={{ textAlign: 'center' }}
                />
                <StatBox 
                    label="APR" 
                    labelSize="small"
                    value="38%" 
                    color="success"
                    style={{ textAlign: 'center' }}
                />
            </StatsGrid>

            {/* Two Column Layout */}
            <div className="two-column-layout">
                {/* Lock IGNIS Card */}
                <Card rounded="xl">
                    <CardBody>
                        <h3 className="card__title" style={{ color: '#A3A3A3', marginBottom: '1.25rem' }}>Lock IGNIS</h3>
                        <div style={{ textAlign: 'center', padding: '2rem 1rem' }}>
                            <div style={{ fontSize: '0.9rem', color: '#8A8A8A', marginBottom: '1rem' }}>
                                Lock your IGNIS tokens to receive veIGNIS voting power and earn protocol rewards
                            </div>
                            <Button variant="primary" onClick={() => setLockModalOpen(true)} style={{ padding: '1rem 2.5rem', fontSize: '1rem' }}>
                                Lock IGNIS
                            </Button>
                        </div>
                        
                        {/* Benefits Section */}
                        <div style={{ marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px solid rgba(255,255,255,0.04)' }}>
                            <h4 style={{ fontSize: '0.8rem', color: '#7A7A7A', marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                veIGNIS Benefits
                            </h4>
                            <div className="benefits-grid">
                                {BENEFITS.map((b, i) => (
                                    <div key={i} className="benefit-item">
                                        <div className="benefit-item__title">{b.title}</div>
                                        <div className="benefit-item__desc">{b.desc}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </CardBody>
                </Card>

                {/* Claimable Rewards Card */}
                <Card rounded="xl">
                    <CardBody>
                        <h3 className="card__title" style={{ color: '#A3A3A3', marginBottom: '1.25rem' }}>Claimable Rewards</h3>
                        <div className="rewards-list">
                            {REWARDS.map((r, i) => (
                                <div key={i} className="reward-row">
                                    <span className="reward-row__label">{r.label}</span>
                                    <span className="reward-row__value">{r.value}</span>
                                </div>
                            ))}
                            <div className="rewards-total">
                                <div>
                                    <div className="rewards-total__label">Total Claimable</div>
                                    <div className="rewards-total__sub">≈ $193.10</div>
                                </div>
                                <span className="rewards-total__value">96.55 IGNIS</span>
                            </div>
                        </div>
                        <Button variant="primary" onClick={handleClaimRewards} style={{ width: '100%', padding: '0.85rem', fontSize: '0.95rem' }}>
                            Claim All Rewards
                        </Button>
                    </CardBody>
                </Card>
            </div>

            {/* Weekly Earnings Section */}
            <div className="weekly-earnings">
                <div className="weekly-earnings__header">
                    <h3 className="weekly-earnings__title">Average Weekly Earnings</h3>
                    <div className="weekly-earnings__apr-badge">
                        <span className="weekly-earnings__apr-label">Avg 7d APR </span>
                        <span className="weekly-earnings__apr-value">38.2%</span>
                    </div>
                </div>
                <p style={{ fontSize: '0.8rem', color: '#7A7A7A', marginBottom: '1.25rem' }}>
                    Based on your earnings from the last 7 days
                </p>
                <StatsGrid>
                    {WEEKLY_EARNINGS.map((item, i) => (
                        <div key={i} className={`earning-item ${item.isTotal ? 'earning-item--total' : ''}`}>
                            <div className="earning-item__label">{item.label}</div>
                            <div className="earning-item__value">{item.value}</div>
                            <div className="earning-item__usd">≈ {item.usd}</div>
                        </div>
                    ))}
                </StatsGrid>
            </div>

            {/* Locks Table Section */}
            <div style={{ marginTop: '2rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                    <h3 style={{ fontFamily: 'Space Grotesk', fontSize: '1.1rem', fontWeight: 600, color: '#A3A3A3' }}>
                        Your veIGNIS Locks
                    </h3>
                    {USER_LOCKS.length >= 2 && (
                        <Button 
                            variant="secondary" 
                            onClick={() => setSplitMergeModalOpen(true)}
                            style={{ padding: '0.5rem 1rem', fontSize: '0.8rem' }}
                        >
                            ✂️ Split / Merge
                        </Button>
                    )}
                </div>
                <p style={{ fontSize: '0.8rem', color: '#7A7A7A', marginBottom: '0.75rem' }}>
                    veIGNIS decays linearly from lock start to unlock date
                </p>
                
                <div className="locks-table">
                    {/* Header */}
                    <div className="locks-table__header">
                        {['#', 'Locked IGNIS', 'veIGNIS', 'Multiplier', 'Unlock Date', 'Time Left', 'Actions'].map(h => (
                            <span key={h} className="locks-table__header-cell">{h}</span>
                        ))}
                    </div>
                    
                    {/* Rows */}
                    {USER_LOCKS.map((lock) => (
                        <LockRow 
                            key={lock.id} 
                            lock={lock} 
                            onExtend={handleExtend}
                            onAdd={handleAddToLock}
                        />
                    ))}
                    
                    {/* Total Row */}
                    <div className="locks-table__row locks-table__row--total">
                        <div style={{ fontWeight: 600, color: '#7A7A7A' }}>Total</div>
                        <div className="locks-table__amount">{formatNumber(totalLocked)} IGNIS</div>
                        <div className="locks-table__veignis">{formatNumber(totalVeIgni)}</div>
                        <div></div>
                        <div></div>
                        <div></div>
                        <Button variant="primary" onClick={() => setLockModalOpen(true)} style={{ padding: '0.5rem 0.8rem', fontSize: '0.75rem' }}>
                            + New Lock
                        </Button>
                    </div>
                </div>
            </div>

            {/* Lock Modal */}
            {lockModalOpen && (
                <LockIgnisModal 
                    isOpen={lockModalOpen} 
                    onClose={() => setLockModalOpen(false)} 
                    igniBalance={igniBalance} 
                />
            )}
            
            {/* Split/Merge Modal */}
            <SplitMergeModal
                isOpen={splitMergeModalOpen}
                onClose={() => setSplitMergeModalOpen(false)}
                locks={USER_LOCKS.map(lock => ({
                    id: lock.id,
                    tokenId: BigInt(lock.id),
                    lockedAmount: lock.lockedIgni,
                    lockedAmountRaw: BigInt(Math.floor(lock.lockedIgni * 1e18)),
                    votingPower: lock.veIgni,
                    votingPowerRaw: BigInt(Math.floor(lock.veIgni * 1e18)),
                    initialVotingPower: lock.initialVeIgni,
                    multiplier: `${(lock.veIgni / lock.lockedIgni).toFixed(2)}x`,
                    unlockDate: lock.unlockDate,
                    isPerma: lock.isPerma,
                    progress: (1 - (lock.veIgni / lock.initialVeIgni)) * 100,
                    hasVoted: false,
                } as UserLock))}
                tokens={{ baseToken: 'IGNIS', votingToken: 'veIGNIS', decimals: 18 }}
                contractAddress="0x0000000000000000000000000000000000000000"
                onSuccess={() => {
                    setSplitMergeModalOpen(false);
                    showTxToast.success('Split/Merge completed successfully!', '0x' + Math.random().toString(16).slice(2, 10));
                }}
            />
        </PageContainer>
    );
};

// ─────────────────────────────────────────────────────────────────────────────
// SUB-COMPONENTS
// ─────────────────────────────────────────────────────────────────────────────

const LockRow = ({ lock, onExtend, onAdd }) => {
    const progressColor = lock.isPerma ? '#A78BFA' : lock.progress > 70 ? '#F59E0B' : '#22C55E';
    const timeRemaining = lock.isPerma ? 100 : (100 - lock.progress);

    return (
        <div className="locks-table__row">
            <div className="locks-table__id">#{lock.id}</div>
            <div>
                <div className="locks-table__amount">{lock.lockedIgni.toLocaleString()} IGNIS</div>
                <div className="locks-table__amount-usd">≈ ${(lock.lockedIgni * 2).toLocaleString()}</div>
            </div>
            <div>
                <div className="locks-table__veignis">{formatNumber(lock.veIgni)}</div>
                {!lock.isPerma && (
                    <div style={{ fontSize: '0.65rem', color: '#7A7A7A' }}>of {formatNumber(lock.initialVeIgni)}</div>
                )}
            </div>
            <div className="locks-table__multiplier">{lock.multiplier}x</div>
            <div>
                {lock.isPerma ? (
                    <span className="locks-table__perma"><span>♾️</span> Permanent</span>
                ) : (
                    <div>
                        <div style={{ fontFamily: 'Space Grotesk', fontWeight: 500 }}>
                            {lock.unlockDate.toLocaleDateString()}
                        </div>
                        <div style={{ fontSize: '0.7rem', color: '#7A7A7A' }}>
                            {Math.ceil((lock.unlockDate - new Date()) / (1000 * 60 * 60 * 24))} days left
                        </div>
                    </div>
                )}
            </div>
            <div>
                <div className="locks-table__progress">
                    <div className="locks-table__progress-bar">
                        <div 
                            className="locks-table__progress-fill" 
                            style={{ width: `${timeRemaining}%`, background: progressColor }} 
                        />
                    </div>
                    <span className="locks-table__progress-text" style={{ color: progressColor }}>
                        {timeRemaining}%
                    </span>
                </div>
                {lock.isPerma && (
                    <div style={{ fontSize: '0.65rem', color: '#A78BFA', marginTop: '0.2rem' }}>No decay</div>
                )}
            </div>
            <div className="locks-table__actions">
                {!lock.isPerma && (
                    <>
                        <button className="btn--outline" onClick={() => onExtend(lock)}>Extend</button>
                        <button className="btn--outline" onClick={() => onAdd(lock)}>Add</button>
                    </>
                )}
                {lock.isPerma && (
                    <button className="btn--outline" onClick={() => onAdd(lock)}>Add More</button>
                )}
            </div>
        </div>
    );
};

// ─────────────────────────────────────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────────────────────────────────────

const BENEFITS = [
    { title: 'Governance', desc: 'Vote on protocol decisions' },
    { title: 'Fee Share', desc: 'Share of DEX fees' },
    { title: 'MEV Share', desc: 'MEV capture revenue' },
    { title: 'IGNIS Rewards', desc: 'Additional emissions' },
];

const REWARDS = [
    { label: 'Fee Share', value: '45.25 IGNIS' },
    { label: 'MEV Share', value: '18.50 IGNIS' },
    { label: 'Staking Rewards', value: '32.80 IGNIS' },
];

const WEEKLY_EARNINGS = [
    { label: 'Fee Share', value: '21.25 IGNIS', usd: '$42.50' },
    { label: 'MEV Share', value: '9.10 IGNIS', usd: '$18.20' },
    { label: 'Staking Rewards', value: '15.80 IGNIS', usd: '$31.60' },
    { label: 'Total Weekly', value: '46.15 IGNIS', usd: '$92.30', isTotal: true },
];
