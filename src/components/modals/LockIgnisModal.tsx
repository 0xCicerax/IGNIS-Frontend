import { useState } from 'react';
import { formatNumber, showTxToast } from '../../utils';
import { TIMING, THRESHOLDS } from '../../constants';
import type { LockIgnisModalProps } from '../../types';

export const LockIgnisModal: React.FC<LockIgnisModalProps> = ({ 
    isOpen, 
    onClose, 
    igniBalance = 10000 
}) => {
    const [amount, setAmount] = useState('');
    const [lockWeeks, setLockWeeks] = useState(THRESHOLDS.staking.defaultLockWeeks);
    const [isPermaLock, setIsPermaLock] = useState(false);
    const [isPending, setIsPending] = useState(false);
    
    const inputAmount = parseFloat(amount) || 0;
    const maxWeeks = THRESHOLDS.staking.maxLockWeeks;
    const multiplier = isPermaLock ? 1.0 : lockWeeks / maxWeeks;
    const veIgniReceived = inputAmount * multiplier;
    
    const getLockLabel = (weeks: number): string => {
        if (weeks < 4) return `${weeks} week${weeks > 1 ? 's' : ''}`;
        if (weeks < 52) return `${Math.round(weeks / 4)} month${weeks > 4 ? 's' : ''}`;
        return `${(weeks / 52).toFixed(1)} year${weeks >= 104 ? 's' : ''}`;
    };
    
    const handleLock = async (): Promise<void> => {
        setIsPending(true);
        const toastId = showTxToast.pending(`Locking ${formatNumber(inputAmount)} IGNIS for ${isPermaLock ? 'forever' : getLockLabel(lockWeeks)}...`);
        await new Promise(r => setTimeout(r, TIMING.TX_SIMULATION));
        showTxToast.success(`Locked ${formatNumber(inputAmount)} IGNIS → ${formatNumber(veIgniReceived)} veIGNIS`, '0x' + Math.random().toString(16).slice(2, 10), toastId);
        setIsPending(false);
        setAmount('');
        onClose();
    };
    
    if (!isOpen) return null;
    
    const canSubmit = inputAmount > 0 && !isPending;
    
    return (
        <div 
            onClick={onClose} 
            className="modal-overlay modal-overlay--centered"
            role="presentation"
        >
            <div 
                onClick={e => e.stopPropagation()} 
                className="modal" 
                style={{ maxWidth: 440 }}
                role="dialog"
                aria-modal="true"
                aria-labelledby="lock-ignis-title"
            >
                <div className="modal__header">
                    <h3 id="lock-ignis-title" className="modal__title">Lock IGNIS for veIGNIS</h3>
                    <button 
                        onClick={onClose} 
                        disabled={isPending} 
                        className="modal__close-btn modal__close-btn--text"
                        style={{ opacity: isPending ? 0.5 : 1 }}
                        aria-label="Close lock modal"
                    >
                        ×
                    </button>
                </div>
                <div className="modal__body">
                    <div className="lock-modal__input-section">
                        <div className="lock-modal__input-header">
                            <label htmlFor="lock-amount" className="lock-modal__input-label">Amount to Lock</label>
                            <span className="lock-modal__input-balance">Balance: {igniBalance.toLocaleString()} IGNIS</span>
                        </div>
                        <div className="lock-modal__input-wrapper">
                            <input 
                                id="lock-amount"
                                type="number" 
                                value={amount} 
                                onChange={e => setAmount(e.target.value)} 
                                placeholder="0.0" 
                                disabled={isPending} 
                                className="lock-modal__input"
                                aria-describedby="lock-balance"
                            />
                            <button 
                                onClick={() => setAmount(igniBalance.toString())} 
                                disabled={isPending} 
                                className="lock-modal__max-btn"
                                aria-label="Use maximum balance"
                            >
                                MAX
                            </button>
                            <div className="lock-modal__token-badge" aria-hidden="true">IGNIS</div>
                        </div>
                    </div>
                    
                    <div className="lock-modal__input-section">
                        <div className="lock-modal__period-header">
                            <span className="lock-modal__period-label">Lock Period</span>
                            <span className="lock-modal__period-value">
                                {isPermaLock ? 'Forever' : getLockLabel(lockWeeks)}
                            </span>
                        </div>
                        {!isPermaLock && (
                            <>
                                <input 
                                    type="range" 
                                    min={THRESHOLDS.staking.minLockWeeks}
                                    max={maxWeeks} 
                                    value={lockWeeks} 
                                    onChange={e => setLockWeeks(parseInt(e.target.value))} 
                                    disabled={isPending}
                                    style={{ marginBottom: '0.5rem' }}
                                />
                                <div className="lock-modal__slider-labels">
                                    <span>1 week</span><span>1 year</span><span>2 years</span><span>4 years</span>
                                </div>
                            </>
                        )}
                        <label className={`lock-modal__perma-option ${isPermaLock ? 'lock-modal__perma-option--active' : ''}`}>
                            <input 
                                type="checkbox" 
                                checked={isPermaLock} 
                                onChange={e => setIsPermaLock(e.target.checked)} 
                                disabled={isPending} 
                                className="lock-modal__perma-checkbox"
                            />
                            <div>
                                <div className="lock-modal__perma-title">Perma-Lock (1:1 Ratio)</div>
                                <div className="lock-modal__perma-desc">Lock forever for maximum veIGNIS</div>
                            </div>
                        </label>
                    </div>
                    
                    <div className="lock-modal__summary">
                        <div className="lock-modal__summary-row">
                            <span className="lock-modal__summary-label">Lock Multiplier</span>
                            <span className="lock-modal__summary-value lock-modal__summary-value--purple">
                                {(multiplier * 100).toFixed(1)}%
                            </span>
                        </div>
                        <div className="lock-modal__summary-row">
                            <span className="lock-modal__summary-label">veIGNIS Received</span>
                            <span className="lock-modal__summary-value lock-modal__summary-value--bold">
                                {formatNumber(veIgniReceived)} veIGNIS
                            </span>
                        </div>
                        <div className="lock-modal__summary-row">
                            <span className="lock-modal__summary-label">Unlock Date</span>
                            <span className="lock-modal__summary-value">
                                {isPermaLock ? '♾️ Never' : new Date(Date.now() + lockWeeks * 7 * 86400000).toLocaleDateString()}
                            </span>
                        </div>
                    </div>
                    
                    <button 
                        onClick={handleLock} 
                        disabled={!canSubmit}
                        className={`deposit-submit-btn ${canSubmit ? 'deposit-submit-btn--active' : 'deposit-submit-btn--disabled'} ${isPending ? 'deposit-submit-btn--pending' : ''}`}
                    >
                        {isPending ? 'Locking...' : 'Lock IGNIS'}
                    </button>
                </div>
            </div>
        </div>
    );
};
