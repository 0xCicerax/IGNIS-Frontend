import { useMemo } from 'react';
import { getSwapGasEstimate, formatGasEstimate } from '../../services/gasEstimator';
import '../../styles/swap.css';

/**
 * Swap transaction details panel
 * Uses aria-live to announce rate changes to screen readers
 */
export const SwapDetails = ({ 
    fromToken,
    toToken,
    rate,
    priceImpact,
    minReceived,
    slippage,
    needsApproval = false,
}) => {
    // Dynamic gas estimate
    const gasEstimate = useMemo(() => {
        return getSwapGasEstimate(needsApproval, fromToken?.price || 2450);
    }, [needsApproval, fromToken?.price]);

    const networkFee = formatGasEstimate(gasEstimate);

    const getPriceImpactClass = () => {
        if (priceImpact > 5) return 'swap-details__value--error';
        if (priceImpact > 1) return 'swap-details__value--warning';
        return 'swap-details__value--success';
    };

    return (
        <div className="swap-details" role="region" aria-label="Swap details">
            {/* Live region for screen reader announcements of rate changes */}
            <div 
                aria-live="polite" 
                aria-atomic="true"
                style={{ position: 'absolute', width: '1px', height: '1px', overflow: 'hidden', clip: 'rect(0,0,0,0)' }}
            >
                {rate > 0 && `Rate: 1 ${fromToken?.symbol} equals ${rate.toFixed(6)} ${toToken?.symbol}. Minimum received: ${minReceived.toFixed(4)} ${toToken?.symbol}`}
            </div>
            
            <DetailRow 
                label="Rate" 
                value={`1 ${fromToken?.symbol} = ${rate.toLocaleString(undefined, { maximumFractionDigits: 6 })} ${toToken?.symbol}`} 
            />
            <DetailRow 
                label="Price Impact" 
                value={`${priceImpact.toFixed(2)}%`} 
                valueClass={getPriceImpactClass()}
            />
            <DetailRow 
                label="Min. Received" 
                value={`${minReceived.toFixed(4)} ${toToken?.symbol}`} 
            />
            <DetailRow 
                label="Slippage" 
                value={`${slippage}%`} 
                valueClass="swap-details__value--gold"
            />
            <DetailRow 
                label="Network Fee" 
                value={networkFee}
                tooltip={`L2 execution + L1 data fee (${gasEstimate.gasUnits.toLocaleString()} gas)`}
                isLast 
            />
        </div>
    );
};

/**
 * Single detail row
 */
const DetailRow = ({ label, value, valueClass = '', tooltip, isLast = false }) => (
    <div className={`swap-details__row ${isLast ? 'swap-details__row--last' : ''}`}>
        <span className="swap-details__label">{label}</span>
        <span className={`swap-details__value ${valueClass}`} title={tooltip}>
            {value}
        </span>
    </div>
);

/**
 * Price impact warning banner
 * Uses role="alert" to immediately announce to screen readers
 */
export const PriceImpactWarning = ({ priceImpact }) => {
    if (priceImpact <= 1) return null;

    const isHigh = priceImpact > 5;
    const warningClass = isHigh ? 'price-impact-warning--high' : 'price-impact-warning--medium';
    const textClass = isHigh ? 'price-impact-warning__text--high' : 'price-impact-warning__text--medium';
    const strokeColor = isHigh ? '#EF4444' : '#F59E0B';

    return (
        <div 
            className={`price-impact-warning ${warningClass}`}
            role="alert"
            aria-live="assertive"
        >
            <WarningIcon color={strokeColor} />
            <span className={`price-impact-warning__text ${textClass}`}>
                {isHigh 
                    ? `High price impact: ${priceImpact.toFixed(2)}%` 
                    : `Price impact: ${priceImpact.toFixed(2)}%`
                }
            </span>
        </div>
    );
};

/**
 * Approval required notice
 * Uses aria-live to announce approval status changes
 */
export const ApprovalNotice = ({ tokenSymbol, isApproving }) => (
    <div className="approval-notice" role="status" aria-live="polite">
        <div className={`approval-notice__dot ${isApproving ? 'approval-notice__dot--pulsing' : ''}`} aria-hidden="true" />
        <span className="approval-notice__text">
            {isApproving 
                ? `Approving ${tokenSymbol}...` 
                : `Approval required to trade ${tokenSymbol}`
            }
        </span>
    </div>
);

/**
 * Submit button for swap actions
 */
export const SwapSubmitButton = ({ 
    text, 
    onClick, 
    disabled, 
    isApproval = false,
    isPending = false,
}) => {
    let btnClass = 'swap-submit-btn';
    
    if (disabled) {
        btnClass += ' swap-submit-btn--disabled';
    } else if (isApproval) {
        btnClass += ' swap-submit-btn--approval';
    } else {
        btnClass += ' swap-submit-btn--primary';
    }
    
    if (isPending) {
        btnClass += ' swap-submit-btn--pending';
    }

    return (
        <button 
            onClick={onClick} 
            disabled={disabled} 
            className={btnClass}
        >
            {isPending && <span className="swap-submit-btn__spinner">⟳</span>}
            {text}
        </button>
    );
};

const WarningIcon = ({ color }) => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
        <line x1="12" y1="9" x2="12" y2="13"/>
        <line x1="12" y1="17" x2="12.01" y2="17"/>
    </svg>
);
