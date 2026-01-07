/**
 * Reusable InfoBanner component for announcements and tips
 */
export const InfoBanner = ({ 
    icon = '💡',
    title, 
    children, 
    variant = 'success', // 'success' | 'gold' | 'warning'
    className = '',
}) => {
    return (
        <div className={`info-banner info-banner--${variant} ${className}`}>
            <div className={`info-banner__icon info-banner__icon--${variant}`}>
                {icon}
            </div>
            <div className="info-banner__content">
                {title && <div className="info-banner__title">{title}</div>}
                <div className="info-banner__text">{children}</div>
            </div>
        </div>
    );
};

/**
 * MEV Capture Banner - specialized variant
 */
export const MEVCaptureBanner = ({ 
    mev24h, 
    mev7d, 
    lpPercent,
    formatCurrency,
}) => {
    return (
        <div className="info-banner info-banner--gold" style={{ justifyContent: 'space-between', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div className="info-banner__icon info-banner__icon--gold" style={{ width: 44, height: 44, borderRadius: 12, fontSize: '1.5rem' }}>
                    🔥
                </div>
                <div>
                    <div className="info-banner__title">MEV Captured for LPs</div>
                    <div className="info-banner__text" style={{ marginTop: 0 }}>
                        Value that would be lost to arbitrage bots on other DEXs
                    </div>
                </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
                <MEVStat label="24h" value={formatCurrency(mev24h)} />
                <MEVStat label="7d" value={formatCurrency(mev7d)} />
                <MEVStatWithProgress label="To LPs" percent={lpPercent} />
            </div>
        </div>
    );
};

const MEVStat = ({ label, value }) => (
    <div style={{ textAlign: 'center' }}>
        <div style={{ fontFamily: 'Space Grotesk', fontSize: '1.25rem', fontWeight: 700, color: '#F5B041' }}>
            {value}
        </div>
        <div style={{ fontSize: '0.6875rem', color: '#7A7A7A', textTransform: 'uppercase' }}>{label}</div>
    </div>
);

const MEVStatWithProgress = ({ label, percent }) => (
    <div style={{ textAlign: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
            <div className="progress-bar" style={{ width: 50 }}>
                <div className="progress-bar__fill progress-bar__fill--success" style={{ width: `${percent}%` }} />
            </div>
            <span style={{ fontFamily: 'Space Grotesk', fontWeight: 700, color: '#22C55E' }}>
                {percent}%
            </span>
        </div>
        <div style={{ fontSize: '0.6875rem', color: '#7A7A7A', textTransform: 'uppercase' }}>{label}</div>
    </div>
);
