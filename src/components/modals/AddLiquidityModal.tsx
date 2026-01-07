import { useState, useEffect } from 'react';
import { TOKENS } from '../../data';
import { TokenIcon, DualTokenIcon, FeeBadge, TypeBadge } from '../ui';
import { PriceRangeChart, RangeTypeSelector } from '../charts';
import { showTxToast } from '../../utils';
import { TIMING } from '../../constants';
import type { AddLiquidityModalProps, Token } from '../../types';

type LiquidityShape = 'spot' | 'curve' | 'bidask';

interface ShapeOption {
    id: LiquidityShape;
    label: string;
    icon: string;
}

export const AddLiquidityModal: React.FC<AddLiquidityModalProps> = ({ 
    isOpen, 
    onClose, 
    pool, 
    isConnected, 
    onConnect 
}) => {
    const [token0, setToken0] = useState<Token>(pool?.token0 || TOKENS[0]);
    const [token1, setToken1] = useState<Token>(pool?.token1 || TOKENS[1]);
    const [ammType, setAmmType] = useState(pool?.type || 'CLAMM');
    const [amount0, setAmount0] = useState('');
    const [amount1, setAmount1] = useState('');
    const [liquidityShape, setLiquidityShape] = useState<LiquidityShape>('spot');
    const [isPending, setIsPending] = useState(false);
    
    const currentPrice = token0 && token1 ? token0.price / token1.price : 1;
    const [minPrice, setMinPrice] = useState(currentPrice * 0.9);
    const [maxPrice, setMaxPrice] = useState(currentPrice * 1.1);
    const totalAPR = pool ? pool.apr + (pool.aprEmissions || 0) + (pool.aprYield || 0) : 20;
    const baseAPR = pool?.aprFees || 10;

    useEffect(() => {
        if (pool) {
            setToken0(pool.token0);
            setToken1(pool.token1);
            setAmmType(pool.type);
        }
    }, [pool]);

    useEffect(() => {
        const price = token0 && token1 ? token0.price / token1.price : 1;
        setMinPrice(price * 0.9);
        setMaxPrice(price * 1.1);
    }, [token0, token1]);

    if (!isOpen) return null;
    
    const amount0Value = parseFloat(amount0) || 0;
    const amount1Value = parseFloat(amount1) || 0;
    const totalValueUsd = (amount0Value * (token0?.price || 0)) + (amount1Value * (token1?.price || 0));
    const canSubmit = isConnected && amount0Value > 0 && amount1Value > 0;

    const handleAddLiquidity = async (): Promise<void> => {
        if (!isConnected) { onConnect(); return; }
        setIsPending(true);
        const toastId = showTxToast.pending(`Adding liquidity to ${token0?.symbol}/${token1?.symbol}...`);
        await new Promise(r => setTimeout(r, TIMING.TX_SIMULATION));
        showTxToast.success(`Added $${totalValueUsd.toLocaleString()} to ${token0?.symbol}/${token1?.symbol} pool`, '0x' + Math.random().toString(16).slice(2, 10), toastId);
        setIsPending(false);
        setAmount0(''); setAmount1('');
        onClose();
    };

    const shapes: ShapeOption[] = [
        { id: 'spot', label: 'Spot', icon: '▐▐▐▐▐' },
        { id: 'curve', label: 'Curve', icon: '▁▂▅▂▁' },
        { id: 'bidask', label: 'Bid-Ask', icon: '▌ ▐' }
    ];

    return (
        <div 
            onClick={onClose} 
            className="modal-overlay" 
            style={{ padding: '2vh 1rem', background: 'rgba(0,0,0,0.92)' }}
            role="presentation"
        >
            <div 
                onClick={e => e.stopPropagation()} 
                className="modal modal--large"
                role="dialog"
                aria-modal="true"
                aria-labelledby="add-liquidity-title"
            >
                <div className="liquidity-modal__breadcrumb">
                    <button 
                        onClick={onClose} 
                        className="liquidity-modal__breadcrumb-back"
                        aria-label="Go back"
                    >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M15 18l-6-6 6-6" />
                        </svg>
                    </button>
                    <span className="liquidity-modal__breadcrumb-link">Pools</span>
                    <span className="liquidity-modal__breadcrumb-sep">›</span>
                    <span className="liquidity-modal__breadcrumb-current">Add Liquidity</span>
                </div>

                <div className="liquidity-modal__pool-header">
                    <div className="liquidity-modal__pool-info">
                        <DualTokenIcon token0={token0} token1={token1} size={48} showProtocol />
                        <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem', flexWrap: 'wrap' }}>
                                <span className="liquidity-modal__pool-name">{token0?.symbol} / {token1?.symbol}</span>
                                <FeeBadge fee={pool?.fee || 0.30} />
                                <TypeBadge type={ammType} />
                            </div>
                            {pool?.routesTo && <div className="liquidity-modal__pool-meta">Routes: {pool.routesTo}</div>}
                            {pool?.isYieldBearing && pool?.platforms && (
                                <div className="liquidity-modal__pool-platforms">{pool.platforms.join(' • ')}</div>
                            )}
                        </div>
                    </div>
                    <div className="liquidity-modal__pool-stats">
                        <div className="liquidity-modal__stat">
                            <div className="liquidity-modal__stat-label">Current Price</div>
                            <div className="liquidity-modal__stat-value">{currentPrice.toFixed(currentPrice < 1 ? 6 : 2)}</div>
                        </div>
                        <div className="liquidity-modal__stat">
                            <div className="liquidity-modal__stat-label">Est. APR</div>
                            <div className="liquidity-modal__stat-value liquidity-modal__stat-value--apr">{totalAPR.toFixed(2)}%</div>
                        </div>
                    </div>
                </div>

                {pool?.isYieldBearing && (
                    <div className="liquidity-modal__yield-banner">
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
                            <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(167, 139, 250, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                <span style={{ fontSize: '1.125rem' }}>💰</span>
                            </div>
                            <div style={{ flex: 1 }}>
                                <div style={{ fontWeight: 600, fontSize: '0.875rem', marginBottom: '0.375rem', color: '#A78BFA' }}>Yield-Bearing Pool</div>
                                <div style={{ fontSize: '0.75rem', color: '#A3A3A3', marginBottom: '0.75rem' }}>
                                    This pool uses yield-bearing tokens from <span style={{ color: '#FFF' }}>{pool?.platforms?.join(' & ')}</span>.
                                    You earn swap fees <strong>plus</strong> the underlying yield from these protocols automatically.
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                <div className="liquidity-modal__grid">
                    <div className="liquidity-modal__chart-section">
                        <RangeTypeSelector currentPrice={currentPrice} setMinPrice={setMinPrice} setMaxPrice={setMaxPrice} baseAPR={baseAPR} />
                        <PriceRangeChart currentPrice={currentPrice} minPrice={minPrice} maxPrice={maxPrice} setMinPrice={setMinPrice} setMaxPrice={setMaxPrice} type={ammType} token0={token0} token1={token1} baseAPR={baseAPR} />
                        
                        <div className={`price-input-grid ${ammType === 'LBAMM' ? 'price-input-grid--3col' : 'price-input-grid--2col'}`}>
                            <div className="price-input-box">
                                <div className="price-input-box__label">Min Price</div>
                                <div className="price-input-box__controls">
                                    <button onClick={() => setMinPrice(minPrice * 0.98)} className="price-input-box__btn">−</button>
                                    <div className="price-input-box__value">{minPrice.toFixed(currentPrice < 1 ? 6 : 2)}</div>
                                    <button onClick={() => setMinPrice(minPrice * 1.02)} className="price-input-box__btn">+</button>
                                </div>
                            </div>
                            <div className="price-input-box">
                                <div className="price-input-box__label">Max Price</div>
                                <div className="price-input-box__controls">
                                    <button onClick={() => setMaxPrice(maxPrice * 0.98)} className="price-input-box__btn">−</button>
                                    <div className="price-input-box__value">{maxPrice.toFixed(currentPrice < 1 ? 6 : 2)}</div>
                                    <button onClick={() => setMaxPrice(maxPrice * 1.02)} className="price-input-box__btn">+</button>
                                </div>
                            </div>
                            {ammType === 'LBAMM' && (
                                <div className="price-input-box">
                                    <div className="price-input-box__label" style={{ color: '#8A8A8A' }}>Num Bins</div>
                                    <div className="price-input-box__value">51</div>
                                </div>
                            )}
                        </div>

                        {ammType === 'LBAMM' && (
                            <div className="shape-selector">
                                <div className="shape-selector__label">
                                    <span className="shape-selector__label-text">Liquidity Shape</span>
                                </div>
                                <div className="shape-selector__grid">
                                    {shapes.map(shape => (
                                        <button 
                                            key={shape.id} 
                                            onClick={() => setLiquidityShape(shape.id)} 
                                            className={`shape-selector__btn ${liquidityShape === shape.id ? 'shape-selector__btn--active' : ''}`}
                                        >
                                            <div className="shape-selector__icon">{shape.icon}</div>
                                            <div className="shape-selector__name">{shape.label}</div>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="liquidity-modal__deposit-section">
                        <div className="liquidity-modal__section-title">Deposit Amount</div>
                        
                        {[{ token: token0, amount: amount0, setAmount: setAmount0 }, { token: token1, amount: amount1, setAmount: setAmount1 }].map((item, i) => (
                            <div key={i} className="deposit-token">
                                <div className="deposit-token__header">
                                    <TokenIcon token={item.token} size={40} />
                                    <div className="deposit-token__info">
                                        <div className="deposit-token__symbol">{item.token?.symbol}</div>
                                        <div className="deposit-token__protocol">{item.token?.protocol || 'Base Chain'}</div>
                                    </div>
                                    <input 
                                        type="number" 
                                        value={item.amount} 
                                        onChange={e => item.setAmount(e.target.value)} 
                                        placeholder="0.00" 
                                        className="deposit-token__input"
                                    />
                                </div>
                                <div className="deposit-token__footer">
                                    <span className="deposit-token__balance">Balance: {item.token?.balance.toLocaleString()}</span>
                                    <button onClick={() => item.setAmount(item.token?.balance.toString() || '')} className="deposit-token__max-btn">MAX</button>
                                </div>
                            </div>
                        ))}

                        <div className="deposit-summary">
                            <div className="deposit-summary__row">
                                <span className="deposit-summary__label">Total</span>
                                <span className="deposit-summary__value">~${totalValueUsd.toLocaleString()}</span>
                            </div>
                            <div className="deposit-summary__row">
                                <span className="deposit-summary__label">Slippage</span>
                                <span className="deposit-summary__slippage">0.50%</span>
                            </div>
                            <button 
                                onClick={handleAddLiquidity} 
                                disabled={(!canSubmit && isConnected) || isPending}
                                className={`deposit-submit-btn ${canSubmit || !isConnected ? 'deposit-submit-btn--active' : 'deposit-submit-btn--disabled'} ${isPending ? 'deposit-submit-btn--pending' : ''}`}
                            >
                                {!isConnected ? 'Connect Wallet' : isPending ? 'Adding Liquidity...' : !canSubmit ? 'Enter amounts' : 'Add Liquidity'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
