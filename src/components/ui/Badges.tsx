export const TypeBadge = ({ type }) => {
    const isLBAMM = type === 'LBAMM';
    return (
        <span style={{ padding: '0.2rem 0.5rem', borderRadius: 5, fontSize: '0.625rem', fontWeight: 700, background: isLBAMM ? 'rgba(139, 92, 246, 0.15)' : 'rgba(59, 130, 246, 0.15)', color: isLBAMM ? '#A78BFA' : '#60A5FA', border: `1px solid ${isLBAMM ? 'rgba(139, 92, 246, 0.3)' : 'rgba(59, 130, 246, 0.3)'}` }}>{type}</span>
    );
};

export const FeeBadge = ({ fee }) => (
    <span style={{ padding: '0.15rem 0.4rem', borderRadius: 4, fontSize: '0.625rem', fontWeight: 600, background: 'rgba(255,255,255,0.06)', color: '#FFF' }}>{fee}%</span>
);

export const YieldBadge = () => (
    <span style={{ padding: '0.2rem 0.5rem', borderRadius: 5, fontSize: '0.625rem', fontWeight: 700, background: 'rgba(34, 197, 94, 0.15)', color: '#22C55E', border: '1px solid rgba(34, 197, 94, 0.3)' }}>YIELD</span>
);
