import type { ReactNode } from 'react';

interface PageHeaderProps {
    title?: string;
    subtitle?: string;
    align?: 'center' | 'left';
    children?: ReactNode;
    className?: string;
}

/**
 * Reusable PageHeader component
 * Uses semantic <header> element for page title area
 */
export const PageHeader = ({ 
    title, 
    subtitle, 
    align = 'center',
    children,
    className = '',
}: PageHeaderProps) => {
    const alignClass = align === 'left' ? 'page-header--left' : '';
    
    return (
        <header className={`page-header ${alignClass} ${className}`}>
            <h1 className="page-header__title">
                {children || title}
            </h1>
            {subtitle && <p className="page-header__subtitle">{subtitle}</p>}
        </header>
    );
};

interface PageContainerProps {
    children?: ReactNode;
    size?: 'default' | 'narrow' | 'medium';
    className?: string;
}

/**
 * Page container with max-width
 * Wraps page content in semantic <section>
 */
export const PageContainer = ({ 
    children, 
    size = 'default',
    className = '',
}: PageContainerProps) => {
    const sizeClass = size === 'narrow' ? 'page-container--narrow' 
        : size === 'medium' ? 'page-container--medium' 
        : '';
    
    return (
        <section className={`page-container ${sizeClass} ${className}`}>
            {children}
        </section>
    );
};
