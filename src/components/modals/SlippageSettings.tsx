import { useState } from 'react';
import { THRESHOLDS } from '../../constants';
import type { SlippageSettingsProps } from '../../types';

export const SlippageSettings: React.FC<SlippageSettingsProps> = ({ 
    isOpen, 
    onClose, 
    slippage, 
    setSlippage, 
    deadline, 
    setDeadline 
}) => {
    const [customSlippage, setCustomSlippage] = useState('');
    const presets = [0.1, 0.5, 1.0];

    if (!isOpen) return null;

    const handleCustomSlippage = (value: string): void => {
        setCustomSlippage(value);
        const parsed = parseFloat(value);
        if (!isNaN(parsed) && parsed >= THRESHOLDS.slippage.min && parsed <= THRESHOLDS.slippage.max) {
            setSlippage(parsed);
        }
    };

    const isHighSlippage = slippage > THRESHOLDS.slippage.warning;
    const isVeryHighSlippage = slippage > THRESHOLDS.slippage.warning * 2;

    return (
        <div 
            onClick={onClose} 
            className="modal-overlay modal-overlay--centered"
            role="presentation"
        >
            <div 
                onClick={e => e.stopPropagation()} 
                className="modal" 
                style={{ padding: '1.5rem' }}
                role="dialog"
                aria-modal="true"
                aria-labelledby="slippage-settings-title"
            >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <h3 id="slippage-settings-title" className="modal__title">Transaction Settings</h3>
                    <button 
                        onClick={onClose} 
                        className="modal__close-btn"
                        aria-label="Close settings"
                    >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                            <path d="M18 6L6 18M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <div className="slippage-section">
                    <div className="slippage-section__label">
                        <span id="slippage-label" className="slippage-section__label-text">Slippage Tolerance</span>
                        <div className="tooltip-container" style={{ cursor: 'help' }}>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#7A7A7A" strokeWidth="2" aria-hidden="true">
                                <circle cx="12" cy="12" r="10" /><path d="M12 16v-4M12 8h.01" />
                            </svg>
                            <div className="tooltip" style={{ width: 220 }} role="tooltip">
                                <div style={{ fontSize: '0.75rem', color: '#A3A3A3' }}>
                                    Your transaction will revert if the price changes unfavorably by more than this percentage.
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div className="slippage-presets" role="group" aria-labelledby="slippage-label">
                        {presets.map(preset => (
                            <button
                                key={preset}
                                onClick={() => { setSlippage(preset); setCustomSlippage(''); }}
                                className={`slippage-preset-btn ${slippage === preset && !customSlippage ? 'slippage-preset-btn--active' : ''}`}
                                aria-pressed={slippage === preset && !customSlippage}
                            >
                                {preset}%
                            </button>
                        ))}
                        <div className="slippage-custom">
                            <input
                                type="number"
                                value={customSlippage}
                                onChange={e => handleCustomSlippage(e.target.value)}
                                placeholder="Custom"
                                className={`slippage-custom__input ${customSlippage ? 'slippage-custom__input--active' : ''}`}
                                aria-label="Custom slippage percentage"
                            />
                            <span className="slippage-custom__suffix" aria-hidden="true">%</span>
                        </div>
                    </div>

                    {isVeryHighSlippage && (
                        <div className="tx-warning tx-warning--error">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2">
                                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                                <line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
                            </svg>
                            <span className="tx-warning__text">Very high slippage. Your transaction may be frontrun.</span>
                        </div>
                    )}
                    {isHighSlippage && !isVeryHighSlippage && (
                        <div className="tx-warning tx-warning--warning">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" strokeWidth="2">
                                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                                <line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
                            </svg>
                            <span className="tx-warning__text">High slippage. Proceed with caution.</span>
                        </div>
                    )}
                </div>

                <div className="slippage-section">
                    <div className="slippage-section__label">
                        <span className="slippage-section__label-text">Transaction Deadline</span>
                        <div className="tooltip-container" style={{ cursor: 'help' }}>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#7A7A7A" strokeWidth="2">
                                <circle cx="12" cy="12" r="10" /><path d="M12 16v-4M12 8h.01" />
                            </svg>
                            <div className="tooltip" style={{ width: 220 }}>
                                <div style={{ fontSize: '0.75rem', color: '#A3A3A3' }}>
                                    Your transaction will revert if it is pending for more than this period of time.
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div className="slippage-deadline">
                        <input
                            type="number"
                            value={deadline}
                            onChange={e => setDeadline(Math.max(1, Math.min(60, parseInt(e.target.value) || 20)))}
                            className="slippage-deadline__input"
                        />
                        <span className="slippage-deadline__suffix">minutes</span>
                    </div>
                </div>

                <div className="slippage-summary">
                    <div className="slippage-summary__row">
                        <span className="slippage-summary__label">Slippage</span>
                        <span className={`slippage-summary__value ${isHighSlippage ? 'slippage-summary__value--warning' : 'slippage-summary__value--success'}`}>
                            {slippage}%
                        </span>
                    </div>
                    <div className="slippage-summary__row">
                        <span className="slippage-summary__label">Deadline</span>
                        <span className="slippage-summary__value">{deadline} min</span>
                    </div>
                </div>
            </div>
        </div>
    );
};
