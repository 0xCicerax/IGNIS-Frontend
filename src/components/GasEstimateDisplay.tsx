import { useMemo, useState } from 'react';
import { estimateGas, formatGasEstimateDetailed, TransactionType } from '../services/gasEstimator';
import { Tooltip } from './ui';

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────
interface GasEstimateDisplayProps {
    txType: TransactionType;
    ethPrice?: number;
    className?: string;
    showBreakdown?: boolean;
}

// ─────────────────────────────────────────────────────────────────────────────
// GAS ICON
// ─────────────────────────────────────────────────────────────────────────────
const GasIcon = ({ size = 14 }: { size?: number }) => (
    <svg 
        width={size} 
        height={size} 
        viewBox="0 0 24 24" 
        fill="none" 
        stroke="currentColor" 
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
    >
        <path d="M3 22V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v17" />
        <path d="M15 22V10a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2a2 2 0 0 1-2 2h-4" />
        <path d="M3 22h12" />
        <path d="M7 9h4" />
    </svg>
);

// ─────────────────────────────────────────────────────────────────────────────
// GAS BREAKDOWN TOOLTIP CONTENT
// ─────────────────────────────────────────────────────────────────────────────
const GasBreakdownContent = ({ 
    breakdown 
}: { 
    breakdown: { label: string; value: string }[] 
}) => (
    <div className="gas-breakdown">
        <div className="gas-breakdown__title">Gas Estimate</div>
        {breakdown.map((item, i) => (
            <div key={i} className="gas-breakdown__row">
                <span className="gas-breakdown__label">{item.label}</span>
                <span className="gas-breakdown__value">{item.value}</span>
            </div>
        ))}
        <div className="gas-breakdown__note">
            Based on current Base L2 gas prices
        </div>
    </div>
);

// ─────────────────────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────────────────────
export const GasEstimateDisplay: React.FC<GasEstimateDisplayProps> = ({
    txType,
    ethPrice = 2450,
    className = '',
    showBreakdown = true,
}) => {
    const estimate = useMemo(() => {
        return estimateGas(txType, ethPrice);
    }, [txType, ethPrice]);

    const formatted = useMemo(() => {
        return formatGasEstimateDetailed(estimate);
    }, [estimate]);

    const content = (
        <div className={`gas-estimate ${className}`}>
            <GasIcon size={12} />
            <span className="gas-estimate__value">{formatted.total}</span>
        </div>
    );

    if (!showBreakdown) {
        return content;
    }

    return (
        <Tooltip content={<GasBreakdownContent breakdown={formatted.breakdown} />}>
            {content}
        </Tooltip>
    );
};

// ─────────────────────────────────────────────────────────────────────────────
// INLINE GAS ESTIMATE (for swap details)
// ─────────────────────────────────────────────────────────────────────────────
interface InlineGasEstimateProps {
    txType: TransactionType;
    ethPrice?: number;
    label?: string;
}

export const InlineGasEstimate: React.FC<InlineGasEstimateProps> = ({
    txType,
    ethPrice = 2450,
    label = 'Network Fee',
}) => {
    const estimate = useMemo(() => estimateGas(txType, ethPrice), [txType, ethPrice]);
    const formatted = formatGasEstimateDetailed(estimate);

    return (
        <div className="gas-estimate-inline">
            <span className="gas-estimate-inline__label">{label}</span>
            <Tooltip content={<GasBreakdownContent breakdown={formatted.breakdown} />}>
                <span className="gas-estimate-inline__value">
                    <GasIcon size={12} />
                    {formatted.total}
                </span>
            </Tooltip>
        </div>
    );
};

// ─────────────────────────────────────────────────────────────────────────────
// STYLES (inline for now, can be moved to CSS)
// ─────────────────────────────────────────────────────────────────────────────
export const GasEstimateStyles = `
.gas-estimate {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 4px 8px;
    border-radius: 6px;
    background: rgba(255, 255, 255, 0.03);
    color: #8A8A8A;
    font-size: 0.75rem;
    font-family: 'JetBrains Mono', monospace;
    cursor: help;
    transition: all 0.15s ease;
}

.gas-estimate:hover {
    background: rgba(255, 255, 255, 0.05);
    color: #A3A3A3;
}

.gas-estimate__value {
    font-weight: 500;
}

.gas-estimate-inline {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 0.8125rem;
}

.gas-estimate-inline__label {
    color: #8A8A8A;
}

.gas-estimate-inline__value {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    color: #A3A3A3;
    font-family: 'JetBrains Mono', monospace;
    cursor: help;
}

.gas-estimate-inline__value:hover {
    color: #FFF;
}

.gas-breakdown {
    min-width: 180px;
}

.gas-breakdown__title {
    font-weight: 600;
    color: #FFF;
    margin-bottom: 0.75rem;
    padding-bottom: 0.5rem;
    border-bottom: 1px solid rgba(255, 255, 255, 0.06);
}

.gas-breakdown__row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.25rem 0;
    font-size: 0.75rem;
}

.gas-breakdown__label {
    color: #8A8A8A;
}

.gas-breakdown__value {
    font-family: 'JetBrains Mono', monospace;
    color: #A3A3A3;
}

.gas-breakdown__note {
    margin-top: 0.5rem;
    padding-top: 0.5rem;
    border-top: 1px solid rgba(255, 255, 255, 0.06);
    font-size: 0.6875rem;
    color: #7A7A7A;
    text-align: center;
}
`;

export default GasEstimateDisplay;
