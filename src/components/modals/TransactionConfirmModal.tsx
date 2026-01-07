import { useState, useEffect } from 'react';
import { TIMING, THRESHOLDS } from '../../constants';
import type { TransactionConfirmModalProps } from '../../types';

interface DetailRowProps {
    label: string;
    value: string;
    valueClass?: string;
}

const DetailRow: React.FC<DetailRowProps> = ({ label, value, valueClass = '' }) => (
    <div className="tx-details__row">
        <span className="tx-details__label">{label}</span>
        <span className={`tx-details__value ${valueClass}`}>{value}</span>
    </div>
);

export const TransactionConfirmModal: React.FC<TransactionConfirmModalProps> = ({ 
    isOpen, 
    onClose, 
    onConfirm,
    type = 'swap',
    fromToken,
    toToken,
    fromAmount,
    toAmount,
    rate,
    priceImpact = 0,
    slippage = 0.5,
    _deadline = 20,
    minReceived,
    networkFee = '~$0.42',
    route,
    totalTrades,
    tradeInterval,
    limitPrice,
    expiry,
    _pool,
    _lockDuration,
    _veAmount,
    isPending = false,
}) => {
    const [countdown, setCountdown] = useState<number | null>(null);

    // Only run countdown for swaps with valid quote data
    const hasValidQuote = fromToken && toToken && fromAmount && toAmount;

    useEffect(() => {
        if (isOpen && type === 'swap' && !isPending && hasValidQuote) {
            setCountdown(TIMING.QUOTE_COUNTDOWN);
            const timer = setInterval(() => {
                setCountdown(prev => {
                    if (prev === null || prev <= 1) {
                        clearInterval(timer);
                        onClose();
                        return null;
                    }
                    return prev - 1;
                });
            }, 1000);
            return () => clearInterval(timer);
        } else if (!isOpen) {
            setCountdown(null);
        }
    }, [isOpen, type, isPending, onClose, hasValidQuote]);

    if (!isOpen) return null;

    const isHighImpact = priceImpact > THRESHOLDS.priceImpact.low;
    const isVeryHighImpact = priceImpact > THRESHOLDS.priceImpact.medium;

    const titles: Record<string, string> = {
        swap: 'Confirm Swap',
        twap: 'Confirm TWAP Order',
        limit: 'Confirm Limit Order',
        addLiquidity: 'Confirm Add Liquidity',
        removeLiquidity: 'Confirm Remove Liquidity',
        stake: 'Confirm Lock',
        claim: 'Confirm Claim',
    };

    const getImpactClass = (): string => {
        if (isVeryHighImpact) return 'tx-details__value--error';
        if (isHighImpact) return 'tx-details__value--warning';
        return 'tx-details__value--success';
    };

    return (
        <div 
            onClick={onClose} 
            className="modal-overlay modal-overlay--centered modal-overlay--high-z"
            role="presentation"
        >
            <div 
                onClick={e => e.stopPropagation()} 
                className="modal"
                role="dialog"
                aria-modal="true"
                aria-labelledby="tx-confirm-title"
            >
                <div className="modal__header">
                    <h3 id="tx-confirm-title" className="modal__title">{titles[type]}</h3>
                    <button 
                        onClick={onClose} 
                        disabled={isPending} 
                        className="modal__close-btn"
                        style={{ opacity: isPending ? 0.5 : 1, cursor: isPending ? 'not-allowed' : 'pointer' }}
                        aria-label="Close confirmation"
                    >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                            <path d="M18 6L6 18M6 6l12 12"/>
                        </svg>
                    </button>
                </div>

                <div className="modal__body">
                    {(type === 'swap' || type === 'twap' || type === 'limit') && fromToken && toToken && (
                        <>
                            <div className="tx-token-box">
                                <div className="tx-token-box__label">You pay</div>
                                <div className="tx-token-box__content">
                                    <span className="tx-token-box__amount">{fromAmount}</span>
                                    <div className="tx-token-box__token">
                                        <div 
                                            className="tx-token-box__token-icon" 
                                            style={{ background: `linear-gradient(135deg, ${fromToken.color || '#627EEA'}, ${fromToken.color || '#627EEA'}88)` }}
                                        >
                                            {fromToken.icon}
                                        </div>
                                        <span className="tx-token-box__token-symbol">{fromToken.symbol}</span>
                                    </div>
                                </div>
                                <div className="tx-token-box__usd">
                                    ≈ ${(parseFloat(fromAmount || '0') * (fromToken.price || 0)).toLocaleString(undefined, { maximumFractionDigits: 2 })}
                                </div>
                            </div>

                            <div className="tx-arrow">
                                <div className="tx-arrow__icon">
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M12 5v14M5 12l7 7 7-7"/>
                                    </svg>
                                </div>
                            </div>

                            <div className="tx-token-box tx-token-box--receive">
                                <div className="tx-token-box__label">You receive</div>
                                <div className="tx-token-box__content">
                                    <span className="tx-token-box__amount tx-token-box__amount--receive">
                                        {parseFloat(toAmount || '0').toLocaleString(undefined, { maximumFractionDigits: 6 })}
                                    </span>
                                    <div className="tx-token-box__token">
                                        <div 
                                            className="tx-token-box__token-icon" 
                                            style={{ background: `linear-gradient(135deg, ${toToken.color || '#2775CA'}, ${toToken.color || '#2775CA'}88)` }}
                                        >
                                            {toToken.icon}
                                        </div>
                                        <span className="tx-token-box__token-symbol">{toToken.symbol}</span>
                                    </div>
                                </div>
                                <div className="tx-token-box__usd">
                                    ≈ ${(parseFloat(toAmount || '0') * (toToken.price || 0)).toLocaleString(undefined, { maximumFractionDigits: 2 })}
                                </div>
                            </div>
                        </>
                    )}

                    {isVeryHighImpact && (
                        <div className="tx-warning tx-warning--error" role="alert">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2" className="tx-warning__icon" aria-hidden="true">
                                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                                <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
                            </svg>
                            <div>
                                <div className="tx-warning__title">High Price Impact!</div>
                                <div className="tx-warning__text">This trade will move the market price by {priceImpact.toFixed(2)}%</div>
                            </div>
                        </div>
                    )}
                    {isHighImpact && !isVeryHighImpact && (
                        <div className="tx-warning tx-warning--warning" role="alert">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" strokeWidth="2" className="tx-warning__icon" aria-hidden="true">
                                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                                <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
                            </svg>
                            <span className="tx-warning__text">Price impact is {priceImpact.toFixed(2)}%. Proceed with caution.</span>
                        </div>
                    )}

                    <div className="tx-details">
                        {type === 'swap' && fromToken && toToken && (
                            <>
                                <DetailRow label="Rate" value={`1 ${fromToken.symbol} = ${parseFloat(String(rate || 0)).toLocaleString(undefined, { maximumFractionDigits: 6 })} ${toToken.symbol}`} />
                                <DetailRow label="Price Impact" value={`${priceImpact.toFixed(2)}%`} valueClass={getImpactClass()} />
                                <DetailRow label="Min. Received" value={`${minReceived || (parseFloat(toAmount || '0') * (1 - slippage/100)).toFixed(4)} ${toToken.symbol}`} />
                                <DetailRow label="Slippage" value={`${slippage}%`} />
                                <DetailRow label="Network Fee" value={networkFee} />
                                {route && <DetailRow label="Route" value={route} valueClass="tx-details__value--gold" />}
                            </>
                        )}
                        {type === 'twap' && fromToken && toToken && (
                            <>
                                <DetailRow label="Total Trades" value={String(totalTrades)} />
                                <DetailRow label="Trade Interval" value={`${tradeInterval} min`} />
                                <DetailRow label="Size per Trade" value={`${(parseFloat(fromAmount || '0') / (totalTrades || 1)).toFixed(4)} ${fromToken.symbol}`} />
                                <DetailRow label="Estimated Output" value={`${parseFloat(toAmount || '0').toFixed(4)} ${toToken.symbol}`} />
                                <DetailRow label="Slippage per Trade" value={`${slippage}%`} />
                            </>
                        )}
                        {type === 'limit' && fromToken && toToken && (
                            <>
                                <DetailRow label="Limit Price" value={`${limitPrice} ${toToken.symbol}/${fromToken.symbol}`} />
                                <DetailRow label="Current Price" value={`${parseFloat(String(rate || 0)).toFixed(6)} ${toToken.symbol}/${fromToken.symbol}`} />
                                <DetailRow 
                                    label="Difference" 
                                    value={`${((parseFloat(limitPrice || '0') / parseFloat(String(rate || 1)) - 1) * 100).toFixed(2)}%`} 
                                    valueClass={parseFloat(limitPrice || '0') > (rate || 0) ? 'tx-details__value--success' : 'tx-details__value--error'} 
                                />
                                <DetailRow label="Expiry" value={expiry || ''} />
                            </>
                        )}
                    </div>

                    {countdown && !isPending && (
                        <div className="tx-countdown">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>
                            </svg>
                            Quote updates in {countdown}s
                        </div>
                    )}

                    {isPending && (
                        <div className="tx-pending" role="status" aria-live="polite">
                            <svg viewBox="0 0 24 24" className="tx-pending__spinner" aria-hidden="true">
                                <circle cx="12" cy="12" r="10" stroke="rgba(255,255,255,0.1)" strokeWidth="3" fill="none"/>
                                <circle cx="12" cy="12" r="10" stroke="#F5B041" strokeWidth="3" fill="none" strokeDasharray="31.4 31.4" strokeLinecap="round"/>
                            </svg>
                            <div className="tx-pending__title">Waiting for confirmation</div>
                            <div className="tx-pending__subtitle">Confirm this transaction in your wallet</div>
                        </div>
                    )}

                    {!isPending && (
                        <button 
                            onClick={onConfirm} 
                            className={`tx-confirm-btn ${isVeryHighImpact ? 'tx-confirm-btn--danger' : 'tx-confirm-btn--primary'}`}
                        >
                            {isVeryHighImpact ? 'Swap Anyway' : type === 'swap' ? 'Confirm Swap' : type === 'twap' ? 'Confirm TWAP' : type === 'limit' ? 'Confirm Limit Order' : 'Confirm'}
                        </button>
                    )}
                </div>
            </div>
            
            <style>{`
                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
            `}</style>
        </div>
    );
};
