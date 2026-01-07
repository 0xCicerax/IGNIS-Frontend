export const TokenIcon = ({ token, size = 32, showProtocol = false }) => (
    <div style={{ position: 'relative' }}>
        <div style={{ width: size, height: size, borderRadius: '50%', background: `linear-gradient(135deg, ${token.color}40, ${token.color}20)`, border: `2px solid ${token.color}60`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: size * 0.4, fontWeight: 700, color: token.color, flexShrink: 0 }}>{token.icon}</div>
        {showProtocol && token.protocol && (<div style={{ position: 'absolute', bottom: -2, right: -4, background: '#1A1A1C', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 4, padding: '1px 4px', fontSize: 8, fontWeight: 600, color: token.color }}>{token.protocol}</div>)}
    </div>
);

export const DualTokenIcon = ({ token0, token1, size = 32, showProtocol = false }) => (
    <div style={{ display: 'flex', alignItems: 'center' }}>
        <TokenIcon token={token0} size={size} showProtocol={showProtocol} />
        <div style={{ marginLeft: -size * 0.25 }}>
            <TokenIcon token={token1} size={size} showProtocol={showProtocol} />
        </div>
    </div>
);
