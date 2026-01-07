import '../../styles/swap.css';

/**
 * Limit order settings panel
 */
export const LimitSettings = ({ 
    limitPrice, 
    setLimitPrice, 
    limitPriceType, 
    setLimitPriceType,
    expiry,
    setExpiry,
    fromSymbol,
    toSymbol,
}) => {
    const pricePresets = ['market', '+1%', '+5%', '+10%'];
    const expiryOptions = ['1h', '24h', '7d', '30d'];

    const handlePriceChange = (e) => {
        setLimitPrice(e.target.value);
        setLimitPriceType('custom');
    };

    return (
        <div className="limit-settings">
            <div className="limit-settings__title">Limit Price</div>
            
            {/* Price Presets */}
            <div className="limit-settings__presets">
                {pricePresets.map(type => (
                    <button 
                        key={type} 
                        onClick={() => setLimitPriceType(type)} 
                        className={`limit-settings__preset-btn ${limitPriceType === type ? 'limit-settings__preset-btn--active' : ''}`}
                    >
                        {type === 'market' ? 'Market' : type}
                    </button>
                ))}
            </div>

            {/* Price Input */}
            <div className="limit-settings__input-wrapper">
                <input 
                    type="text" 
                    value={limitPrice} 
                    onChange={handlePriceChange}
                    placeholder="0.00" 
                    className="limit-settings__input"
                />
                <span className="limit-settings__input-suffix">
                    {toSymbol}/{fromSymbol}
                </span>
            </div>

            {/* Expiry */}
            <div className="limit-settings__expiry">
                <span className="limit-settings__expiry-label">Expires in</span>
                {expiryOptions.map(e => (
                    <button 
                        key={e} 
                        onClick={() => setExpiry(e)} 
                        className={`limit-settings__expiry-btn ${expiry === e ? 'limit-settings__expiry-btn--active' : ''}`}
                    >
                        {e}
                    </button>
                ))}
            </div>
        </div>
    );
};
