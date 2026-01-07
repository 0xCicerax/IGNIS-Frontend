import type { ReactNode } from 'react';

interface StatBoxProps {
    label: string;
    value: string | ReactNode;
    icon?: ReactNode;
    color?: 'default' | 'gold' | 'success' | 'purple';
    labelSize?: 'default' | 'small';
    className?: string;
}

/**
 * Reusable StatBox component for displaying metrics
 * Uses semantic <figure> for self-contained stat display
 */
export const StatBox = ({ 
    label, 
    value, 
    icon,
    color = 'default',
    labelSize = 'default',
    className = '',
}: StatBoxProps) => {
    const valueColorClass = color === 'gold' ? 'stat-box__value--gold' 
        : color === 'success' ? 'stat-box__value--success'
        : color === 'purple' ? 'stat-box__value--purple'
        : '';
    
    const labelClass = labelSize === 'small' ? 'stat-box__label--small' : 'stat-box__label';

    return (
        <figure className={`stat-box ${className}`} role="group" aria-label={label}>
            {icon ? (
                <figcaption className="stat-box--with-icon">
                    <span className="stat-box__icon" aria-hidden="true">{icon}</span>
                    <span className={labelClass}>{label}</span>
                </figcaption>
            ) : (
                <figcaption className={labelClass}>{label}</figcaption>
            )}
            <data className={`stat-box__value ${valueColorClass}`} value={typeof value === 'string' ? value : undefined}>
                {value}
            </data>
        </figure>
    );
};

interface StatsGridProps {
    children?: ReactNode;
    className?: string;
}

/**
 * Grid container for stat boxes
 */
export const StatsGrid = ({ children, className = '' }: StatsGridProps) => (
    <div className={`stats-grid ${className}`} role="group" aria-label="Statistics">
        {children}
    </div>
);
