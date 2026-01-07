/** Module */

import { forwardRef, type HTMLAttributes, type ReactNode } from 'react';
import styles from './Card.module.css';

type CardVariant = 'default' | 'gradient' | 'bordered' | 'glass';
type CardPadding = 'none' | 'sm' | 'md' | 'lg' | 'xl';
type CardRadius = 'sm' | 'md' | 'lg' | 'xl';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children?: ReactNode;
  variant?: CardVariant;
  padding?: CardPadding;
  radius?: CardRadius;
  hoverable?: boolean;
  ariaLabel?: string;
}

/**
 * Base Card component
 */
export const Card = forwardRef<HTMLDivElement, CardProps>(({ 
  children, 
  variant = 'default',
  padding = 'md',
  radius = 'lg',
  className = '',
  onClick,
  hoverable = false,
  ariaLabel,
  ...props 
}, ref) => {
  const classNames = [
    styles.card,
    styles[`variant-${variant}`],
    styles[`padding-${padding}`],
    styles[`radius-${radius}`],
    hoverable && styles.hoverable,
    onClick && styles.clickable,
    className,
  ].filter(Boolean).join(' ');

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (onClick && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault();
      onClick(e as unknown as React.MouseEvent<HTMLDivElement>);
    }
  };

  return (
    <div 
      ref={ref} 
      className={classNames} 
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? handleKeyDown : undefined}
      aria-label={ariaLabel}
      {...props}
    >
      {children}
    </div>
  );
});

Card.displayName = 'Card';

interface CardHeaderProps extends HTMLAttributes<HTMLDivElement> {
  children?: ReactNode;
  title?: string;
  subtitle?: string;
  action?: ReactNode;
}

/**
 * Card Header
 */
export const CardHeader = ({ 
  children, 
  title, 
  subtitle,
  action,
  className = '',
  ...props 
}: CardHeaderProps) => (
  <div className={`${styles.cardHeader} ${className}`} {...props}>
    <div className={styles.cardHeaderContent}>
      {title && <h3 className={styles.cardTitle}>{title}</h3>}
      {subtitle && <p className={styles.cardSubtitle}>{subtitle}</p>}
      {children}
    </div>
    {action && <div className={styles.cardHeaderAction}>{action}</div>}
  </div>
);

interface CardSectionProps extends HTMLAttributes<HTMLDivElement> {
  children?: ReactNode;
}

/**
 * Card Body
 */
export const CardBody = ({ children, className = '', ...props }: CardSectionProps) => (
  <div className={`${styles.cardBody} ${className}`} {...props}>
    {children}
  </div>
);

/**
 * Card Footer
 */
export const CardFooter = ({ children, className = '', ...props }: CardSectionProps) => (
  <div className={`${styles.cardFooter} ${className}`} {...props}>
    {children}
  </div>
);

/**
 * Swap Card - specialized card for swap interface
 */
export const SwapCard = ({ children, className = '', ...props }: CardSectionProps) => (
  <Card variant="gradient" padding="none" radius="xl" className={`${styles.swapCard} ${className}`} {...props}>
    {children}
  </Card>
);

type PanelVariant = 'default' | 'info' | 'warning' | 'purple' | 'mev';

interface PanelProps extends HTMLAttributes<HTMLDivElement> {
  children?: ReactNode;
  variant?: PanelVariant;
  title?: string;
}

/**
 * Panel - for settings, TWAP, limit sections
 */
export const Panel = ({ 
  children, 
  variant = 'default',
  title,
  className = '',
  ...props 
}: PanelProps) => (
  <div className={`${styles.panel} ${styles[`panel-${variant}`]} ${className}`} {...props}>
    {title && <div className={styles.panelTitle}>{title}</div>}
    {children}
  </div>
);

interface InputCardProps extends HTMLAttributes<HTMLDivElement> {
  children?: ReactNode;
  error?: boolean;
}

/**
 * Input Card - styled input container
 */
export const InputCard = ({ 
  children, 
  error = false,
  className = '',
  ...props 
}: InputCardProps) => (
  <div 
    className={`${styles.inputCard} ${error ? styles.inputCardError : ''} ${className}`} 
    {...props}
  >
    {children}
  </div>
);
