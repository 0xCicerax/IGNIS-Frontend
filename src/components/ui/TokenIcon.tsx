// Token icon imports - add more as needed
import ethIcon from '../../assets/tokens/ETH.svg';
import wethIcon from '../../assets/tokens/WETH.svg';
import usdcIcon from '../../assets/tokens/USDC.svg';
import usdtIcon from '../../assets/tokens/USDT.svg';
import wbtcIcon from '../../assets/tokens/WBTC.svg';
import bnbIcon from '../../assets/tokens/BNB.svg';
import ausdcIcon from '../../assets/tokens/aUSDC.svg';
import fraxIcon from '../../assets/tokens/FRAX.svg';
import frxethIcon from '../../assets/tokens/frxETH.svg';
import stethIcon from '../../assets/tokens/stETH.svg';
import daiIcon from '../../assets/tokens/DAI.svg';

// Map symbols to imported SVGs
const TOKEN_ICONS: Record<string, string> = {
    ETH: ethIcon,
    WETH: wethIcon,
    USDC: usdcIcon,
    USDT: usdtIcon,
    WBTC: wbtcIcon,
    BNB: bnbIcon,
    aUSDC: ausdcIcon,
    FRAX: fraxIcon,
    frxETH: frxethIcon,
    stETH: stethIcon,
    DAI: daiIcon,
};

export const TokenIcon = ({ token, size = 32, showProtocol = false }) => {
    const iconSrc = token?.symbol ? TOKEN_ICONS[token.symbol] : null;
    
    return (
        <div style={{ position: 'relative', flexShrink: 0 }}>
            {iconSrc ? (
                <img 
                    src={iconSrc} 
                    alt={token.symbol}
                    style={{ 
                        width: size, 
                        height: size, 
                        borderRadius: '50%',
                        objectFit: 'contain',
                    }} 
                />
            ) : (
                <div 
                    style={{ 
                        width: size, 
                        height: size, 
                        borderRadius: '50%', 
                        background: `linear-gradient(135deg, ${token?.color || '#627EEA'}40, ${token?.color || '#627EEA'}20)`, 
                        border: `2px solid ${token?.color || '#627EEA'}60`, 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center', 
                        fontSize: size * 0.4, 
                        fontWeight: 700, 
                        color: token?.color || '#627EEA',
                    }}
                >
                    {token?.icon || token?.symbol?.charAt(0) || '?'}
                </div>
            )}
            {showProtocol && token?.protocol && (
                <div 
                    style={{ 
                        position: 'absolute', 
                        bottom: -2, 
                        right: -4, 
                        background: '#1A1A1C', 
                        border: '1px solid rgba(255,255,255,0.1)', 
                        borderRadius: 4, 
                        padding: '1px 4px', 
                        fontSize: 8, 
                        fontWeight: 600, 
                        color: token.color 
                    }}
                >
                    {token.protocol}
                </div>
            )}
        </div>
    );
};

export const DualTokenIcon = ({ token0, token1, size = 32, showProtocol = false }) => (
    <div style={{ display: 'flex', alignItems: 'center' }}>
        <TokenIcon token={token0} size={size} showProtocol={showProtocol} />
        <div style={{ marginLeft: -size * 0.25, zIndex: 1 }}>
            <TokenIcon token={token1} size={size} showProtocol={showProtocol} />
        </div>
    </div>
);
