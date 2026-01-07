import '../../styles/swap.css';

/**
 * TWAP (Time-Weighted Average Price) settings panel
 */
export const TWAPSettings = ({ 
    totalTrades, 
    setTotalTrades, 
    tradeInterval, 
    setTradeInterval,
    sizePerTrade,
    fromSymbol,
}) => {
    const intervals = [
        { value: '1', label: '1 min' },
        { value: '5', label: '5 min' },
        { value: '15', label: '15 min' },
        { value: '30', label: '30 min' },
        { value: '60', label: '1 hour' },
    ];

    const totalDuration = totalTrades * parseInt(tradeInterval);

    return (
        <div className="twap-settings">
            <div className="twap-settings__title">TWAP Settings</div>
            
            <div className="twap-settings__grid">
                {/* Number of Trades */}
                <div>
                    <div className="twap-settings__field-label">Number of Trades</div>
                    <div className="twap-settings__counter">
                        <button 
                            onClick={() => setTotalTrades(Math.max(2, totalTrades - 1))} 
                            className="twap-settings__counter-btn"
                        >
                            -
                        </button>
                        <span className="twap-settings__counter-value">{totalTrades}</span>
                        <button 
                            onClick={() => setTotalTrades(Math.min(20, totalTrades + 1))} 
                            className="twap-settings__counter-btn"
                        >
                            +
                        </button>
                    </div>
                </div>

                {/* Interval */}
                <div>
                    <div className="twap-settings__field-label">Interval</div>
                    <select 
                        value={tradeInterval} 
                        onChange={e => setTradeInterval(e.target.value)} 
                        className="twap-settings__select"
                    >
                        {intervals.map(({ value, label }) => (
                            <option key={value} value={value}>{label}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Summary */}
            <div className="twap-settings__summary">
                <div className="twap-settings__summary-row">
                    <span className="twap-settings__summary-label">Size per trade</span>
                    <span className="twap-settings__summary-value">
                        {sizePerTrade.toFixed(4)} {fromSymbol}
                    </span>
                </div>
                <div className="twap-settings__summary-row">
                    <span className="twap-settings__summary-label">Total duration</span>
                    <span className="twap-settings__summary-value">{totalDuration} min</span>
                </div>
            </div>
        </div>
    );
};
