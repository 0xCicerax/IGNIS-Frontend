/**
 * Timeframe toggle for charts (7d, 30d, 90d, etc.)
 */
export const TimeframeToggle = ({ 
    options = ['7d', '30d', '90d'],
    value,
    onChange,
    className = '',
}) => (
    <div className={`timeframe-toggle ${className}`}>
        {options.map(tf => (
            <button
                key={tf}
                onClick={() => onChange(tf)}
                className={`timeframe-toggle__btn ${value === tf ? 'timeframe-toggle__btn--active' : ''}`}
            >
                {tf}
            </button>
        ))}
    </div>
);

/**
 * Progress bar with fill
 */
export const ProgressBar = ({ 
    percent, 
    variant = 'success', // 'success' | 'gold'
    width = '100%',
    className = '',
}) => (
    <div className={`progress-bar ${className}`} style={{ width }}>
        <div 
            className={`progress-bar__fill progress-bar__fill--${variant}`} 
            style={{ width: `${percent}%` }} 
        />
    </div>
);

/**
 * Chart legend
 */
export const ChartLegend = ({ items, className = '' }) => (
    <div className={`chart-legend ${className}`}>
        {items.map((item, i) => (
            <div key={i} className="chart-legend__item">
                <div className={`chart-legend__dot chart-legend__dot--${item.color}`} />
                <span className="chart-legend__label">{item.label}</span>
            </div>
        ))}
    </div>
);

/**
 * Primary action button
 */
export const Button = ({ 
    children, 
    variant = 'primary', // 'primary' | 'secondary' | 'ghost'
    onClick,
    disabled = false,
    className = '',
    ...props
}) => (
    <button
        onClick={onClick}
        disabled={disabled}
        className={`btn btn--${variant} ${className}`}
        {...props}
    >
        {children}
    </button>
);
