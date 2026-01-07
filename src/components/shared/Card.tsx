/**
 * Reusable Card component with optional header
 */
export const Card = ({ 
    children, 
    className = '',
    rounded = 'default', // 'default' | 'xl' | '2xl'
    clickable = false,
    onClick,
    ...props 
}) => {
    const roundedClass = rounded === 'xl' ? 'card--rounded-xl' : rounded === '2xl' ? 'card--rounded-2xl' : '';
    const clickableClass = clickable ? 'card--clickable' : '';
    
    return (
        <div 
            className={`card ${roundedClass} ${clickableClass} ${className}`}
            onClick={onClick}
            {...props}
        >
            {children}
        </div>
    );
};

export const CardHeader = ({ children, className = '' }) => (
    <div className={`card__header ${className}`}>
        {children}
    </div>
);

export const CardBody = ({ children, className = '' }) => (
    <div className={`card__body ${className}`}>
        {children}
    </div>
);

export const CardTitle = ({ children, description, className = '' }) => (
    <>
        <h2 className={`card__title ${className}`}>{children}</h2>
        {description && <p className="card__description">{description}</p>}
    </>
);
