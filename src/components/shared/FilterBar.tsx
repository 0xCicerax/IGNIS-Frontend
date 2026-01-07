/**
 * Reusable FilterBar component with search, toggles, and dropdowns
 */
export const FilterBar = ({ children, className = '' }) => (
    <div className={`filter-bar ${className}`} role="search">
        {children}
    </div>
);

/**
 * Search input for FilterBar
 */
export const FilterSearch = ({ 
    value, 
    onChange, 
    placeholder = 'Search...',
    className = '',
    ariaLabel = 'Search',
}) => (
    <div className={`filter-bar__search ${className}`}>
        <svg 
            className="filter-bar__search-icon" 
            width="14" 
            height="14" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2"
            aria-hidden="true"
        >
            <circle cx="11" cy="11" r="8"/>
            <path d="m21 21-4.35-4.35"/>
        </svg>
        <input 
            type="text" 
            value={value} 
            onChange={e => onChange(e.target.value)} 
            placeholder={placeholder}
            className="filter-bar__search-input"
            aria-label={ariaLabel}
        />
    </div>
);

/**
 * Toggle button group for FilterBar
 */
export const FilterToggleGroup = ({ 
    options, // Array of { value, label }
    value,
    onChange,
    className = '',
    ariaLabel = 'Filter options',
}) => (
    <div className={`filter-bar__toggle-group ${className}`} role="group" aria-label={ariaLabel}>
        {options.map(option => (
            <button 
                key={option.value} 
                onClick={() => onChange(option.value)} 
                className={`filter-bar__toggle-btn ${value === option.value ? 'filter-bar__toggle-btn--active' : ''}`}
                aria-pressed={value === option.value}
            >
                {option.label}
            </button>
        ))}
    </div>
);

/**
 * Select dropdown for FilterBar
 */
export const FilterSelect = ({ 
    options, // Array of { value, label }
    value,
    onChange,
    className = '',
    ariaLabel = 'Select option',
}) => (
    <select 
        value={value} 
        onChange={e => onChange(e.target.value)} 
        className={`filter-bar__select ${className}`}
        aria-label={ariaLabel}
    >
        {options.map(option => (
            <option key={option.value} value={option.value}>
                {option.label}
            </option>
        ))}
    </select>
);

/**
 * Action button slot (right side)
 */
export const FilterAction = ({ children, className = '' }) => (
    <div className={`filter-bar__action ${className}`}>
        {children}
    </div>
);
