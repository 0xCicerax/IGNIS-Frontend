import { TokenIcon } from '../ui';
import '../../styles/swap.css';

/**
 * Token input field with selector, balance, and max button
 * When readOnly (output field), uses aria-live to announce value changes
 */
export const TokenInput = ({ 
    label,
    token,
    value,
    onChange,
    onTokenSelect,
    error,
    usdValue,
    readOnly = false,
    showMaxButton = true,
    onMax,
    id,
}) => {
    const inputId = id || `token-input-${label?.toLowerCase().replace(/\s+/g, '-')}`;
    
    return (
        <div className="token-input">
            <label htmlFor={inputId} className="token-input__label">{label}</label>
            <div className={`token-input__container ${error ? 'token-input__container--error' : ''}`}>
                <div className="token-input__row">
                    <input 
                        id={inputId}
                        type="text" 
                        inputMode="decimal"
                        value={value} 
                        onChange={e => onChange?.(e.target.value)} 
                        placeholder="0.00" 
                        readOnly={readOnly}
                        className="token-input__field"
                        aria-invalid={!!error}
                        aria-describedby={error ? `${inputId}-error` : undefined}
                    />
                    <button 
                        onClick={onTokenSelect} 
                        className="token-input__selector"
                        aria-label={`Select ${label?.toLowerCase()} token. Currently ${token?.symbol || 'none selected'}`}
                    >
                        <TokenIcon token={token} size={28} />
                        {token?.symbol}
                        <span className="token-input__selector-arrow" aria-hidden="true">▼</span>
                    </button>
                </div>
                <div className="token-input__footer">
                    <span 
                        id={error ? `${inputId}-error` : undefined}
                        className={`token-input__usd ${error ? 'token-input__usd--error' : ''}`}
                        role={error ? 'alert' : undefined}
                    >
                        {error || `≈ $${usdValue?.toLocaleString(undefined, { maximumFractionDigits: 2 }) || '0.00'}`}
                    </span>
                    <div className="token-input__balance-row">
                        <span className="token-input__balance">
                            Balance: {token?.balance?.toLocaleString() || '0'}
                        </span>
                        {showMaxButton && onMax && (
                            <button 
                                onClick={onMax} 
                                className="token-input__max-btn"
                                aria-label="Use maximum balance"
                            >
                                MAX
                            </button>
                        )}
                    </div>
                </div>
            </div>
            {/* Announce output value changes to screen readers */}
            {readOnly && value && (
                <div 
                    aria-live="polite" 
                    aria-atomic="true"
                    style={{ position: 'absolute', width: '1px', height: '1px', overflow: 'hidden', clip: 'rect(0,0,0,0)' }}
                >
                    {`You will receive approximately ${value} ${token?.symbol || 'tokens'}`}
                </div>
            )}
        </div>
    );
};

/**
 * Swap direction arrow button
 */
export const SwapArrowButton = ({ onClick }) => (
    <div className="swap-arrow">
        <button 
            onClick={onClick} 
            className="swap-arrow__btn"
            aria-label="Switch token direction"
        >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <path d="M12 5v14M5 12l7 7 7-7"/>
            </svg>
        </button>
    </div>
);
