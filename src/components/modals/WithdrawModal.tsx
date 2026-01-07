import { useState } from 'react';
import { DualTokenIcon } from '../ui';
import { formatCurrency, showTxToast } from '../../utils';
import { TIMING } from '../../constants';
import type { WithdrawModalProps } from '../../types';

export const WithdrawModal: React.FC<WithdrawModalProps> = ({ isOpen, onClose, position }) => {
    const [withdrawPercent, setWithdrawPercent] = useState(100);
    const [isPending, setIsPending] = useState(false);
    
    if (!isOpen || !position) return null;
    
    const value = (position.token0Amount * position.pool.token0.price) + (position.token1Amount * position.pool.token1.price);
    const withdrawValue = value * (withdrawPercent / 100);
    
    const handleWithdraw = async (): Promise<void> => {
        setIsPending(true);
        const toastId = showTxToast.pending(`Withdrawing ${withdrawPercent}% of ${position.pool.token0.symbol}/${position.pool.token1.symbol}...`);
        await new Promise(r => setTimeout(r, TIMING.TX_SIMULATION));
        showTxToast.success(`Withdrew ${formatCurrency(withdrawValue)} from ${position.pool.token0.symbol}/${position.pool.token1.symbol}`, '0x' + Math.random().toString(16).slice(2, 10), toastId);
        setIsPending(false);
        onClose();
    };
    
    return (
        <div 
            onClick={onClose} 
            className="modal-overlay modal-overlay--centered"
            role="presentation"
        >
            <div 
                onClick={e => e.stopPropagation()} 
                className="modal"
                role="dialog"
                aria-modal="true"
                aria-labelledby="withdraw-modal-title"
            >
                <div className="modal__header">
                    <h3 id="withdraw-modal-title" className="modal__title">Withdraw Position</h3>
                    <button 
                        onClick={onClose} 
                        disabled={isPending} 
                        className="modal__close-btn modal__close-btn--text"
                        style={{ opacity: isPending ? 0.5 : 1 }}
                        aria-label="Close withdraw modal"
                    >
                        ×
                    </button>
                </div>
                <div className="modal__body">
                    <div className="withdraw-modal__position">
                        <DualTokenIcon token0={position.pool.token0} token1={position.pool.token1} size={44} />
                        <div>
                            <div className="withdraw-modal__position-name">
                                {position.pool.token0.symbol}/{position.pool.token1.symbol}
                            </div>
                            <div className="withdraw-modal__position-value">Value: {formatCurrency(value)}</div>
                        </div>
                    </div>
                    
                    <div className="lock-modal__input-section">
                        <div className="withdraw-modal__slider-header">
                            <label htmlFor="withdraw-slider" className="withdraw-modal__slider-label">Withdraw Amount</label>
                            <span className="withdraw-modal__slider-value" aria-live="polite">{withdrawPercent}%</span>
                        </div>
                        <input 
                            id="withdraw-slider"
                            type="range" 
                            min="1" 
                            max="100" 
                            value={withdrawPercent} 
                            onChange={e => setWithdrawPercent(parseInt(e.target.value))} 
                            disabled={isPending}
                            aria-valuemin={1}
                            aria-valuemax={100}
                            aria-valuenow={withdrawPercent}
                            aria-valuetext={`${withdrawPercent}%`}
                        />
                        <div className="withdraw-modal__presets" role="group" aria-label="Quick select percentage">
                            {[25, 50, 75, 100].map(pct => (
                                <button 
                                    key={pct} 
                                    onClick={() => setWithdrawPercent(pct)} 
                                    disabled={isPending}
                                    className={`withdraw-modal__preset-btn ${withdrawPercent === pct ? 'withdraw-modal__preset-btn--active' : ''}`}
                                    aria-pressed={withdrawPercent === pct}
                                >
                                    {pct}%
                                </button>
                            ))}
                        </div>
                    </div>
                    
                    <div className="withdraw-modal__receive">
                        <div className="withdraw-modal__receive-row">
                            <span className="withdraw-modal__receive-label">You will receive</span>
                            <span className="withdraw-modal__receive-value">{formatCurrency(withdrawValue)}</span>
                        </div>
                    </div>
                    
                    <button 
                        onClick={handleWithdraw} 
                        disabled={isPending}
                        className={`deposit-submit-btn deposit-submit-btn--active ${isPending ? 'deposit-submit-btn--pending' : ''}`}
                    >
                        {isPending ? 'Withdrawing...' : `Withdraw ${withdrawPercent}%`}
                    </button>
                </div>
            </div>
        </div>
    );
};
