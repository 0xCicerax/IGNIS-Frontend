export const APRDisplay = ({ pool, size = 'normal' }) => {
    const totalAPR = pool.apr + (pool.aprEmissions || 0) + (pool.aprYield || 0);
    const fontSize = size === 'large' ? '1.375rem' : '0.9375rem';
    return (
        <div className="tooltip-container" style={{ cursor: 'pointer' }}>
            <div style={{ fontSize, fontWeight: 600, color: '#22C55E', fontFamily: 'JetBrains Mono', display: 'flex', alignItems: 'center', gap: 4 }}>
                {totalAPR.toFixed(2)}%
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ opacity: 0.5 }}>
                    <circle cx="12" cy="12" r="10" />
                    <path d="M12 16v-4M12 8h.01" />
                </svg>
            </div>
            <div className="tooltip">
                <div style={{ fontSize: '0.75rem', fontWeight: 600, marginBottom: '0.75rem' }}>APR Breakdown</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem' }}>
                        <span style={{ color: '#A3A3A3' }}>Swap Fees</span>
                        <span style={{ fontFamily: 'JetBrains Mono' }}>{pool.aprFees?.toFixed(2) || pool.apr.toFixed(2)}%</span>
                    </div>
                    {pool.aprEmissions > 0 && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem' }}>
                            <span style={{ color: '#A3A3A3' }}>IGNIS Emissions</span>
                            <span style={{ color: '#F5B041', fontFamily: 'JetBrains Mono' }}>+{pool.aprEmissions.toFixed(2)}%</span>
                        </div>
                    )}
                    {pool.aprYield > 0 && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem' }}>
                            <span style={{ color: '#A3A3A3' }}>Underlying Yield</span>
                            <span style={{ color: '#22C55E', fontFamily: 'JetBrains Mono' }}>+{pool.aprYield.toFixed(2)}%</span>
                        </div>
                    )}
                    <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '0.5rem', marginTop: '0.25rem', display: 'flex', justifyContent: 'space-between', fontWeight: 600 }}>
                        <span>Total APR</span>
                        <span style={{ color: '#22C55E', fontFamily: 'JetBrains Mono' }}>{totalAPR.toFixed(2)}%</span>
                    </div>
                </div>
            </div>
        </div>
    );
};
