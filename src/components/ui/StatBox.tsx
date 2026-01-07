/** Module */

import styles from './StatBox.module.css';

/**
 * StatBox - displays a labeled statistic
 */
export const StatBox = ({
  label,
  value,
  subValue,
  trend,           // 'up' | 'down' | null
  trendValue,
  size = 'md',     // 'sm' | 'md' | 'lg'
  variant = 'default', // 'default' | 'card' | 'inline'
  valueColor,
  className = '',
  ...props
}) => {
  const classNames = [
    styles.statBox,
    styles[`size-${size}`],
    styles[`variant-${variant}`],
    className,
  ].filter(Boolean).join(' ');

  return (
    <div className={classNames} {...props}>
      <div className={styles.label}>{label}</div>
      <div className={styles.value} style={valueColor ? { color: valueColor } : undefined}>
        {value}
        {trend && (
          <span className={`${styles.trend} ${styles[`trend-${trend}`]}`}>
            {trend === 'up' ? '↑' : '↓'} {trendValue}
          </span>
        )}
      </div>
      {subValue && <div className={styles.subValue}>{subValue}</div>}
    </div>
  );
};

/**
 * StatGrid - grid container for multiple stats
 */
export const StatGrid = ({
  children,
  columns = 4,
  gap = 'md',
  className = '',
  ...props
}) => (
  <div
    className={`${styles.statGrid} ${styles[`gap-${gap}`]} ${className}`}
    style={{ '--columns': columns }}
    {...props}
  >
    {children}
  </div>
);

/**
 * DetailRow - for swap/transaction details
 */
export const DetailRow = ({
  label,
  value,
  valueColor,
  tooltip,
  isLast = false,
  className = '',
  ...props
}) => (
  <div
    className={`${styles.detailRow} ${isLast ? styles.detailRowLast : ''} ${className}`}
    {...props}
  >
    <span className={styles.detailLabel}>
      {label}
      {tooltip && (
        <span className={styles.tooltip} title={tooltip}>
          ⓘ
        </span>
      )}
    </span>
    <span className={styles.detailValue} style={valueColor ? { color: valueColor } : undefined}>
      {value}
    </span>
  </div>
);

/**
 * DetailsPanel - container for detail rows
 */
export const DetailsPanel = ({ children, className = '', ...props }) => (
  <div className={`${styles.detailsPanel} ${className}`} {...props}>
    {children}
  </div>
);

/**
 * AlertBox - for warnings, info messages
 */
export const AlertBox = ({
  children,
  variant = 'warning', // 'info' | 'warning' | 'error' | 'success'
  icon,
  className = '',
  ...props
}) => (
  <div className={`${styles.alertBox} ${styles[`alert-${variant}`]} ${className}`} {...props}>
    {icon && <span className={styles.alertIcon}>{icon}</span>}
    <span className={styles.alertContent}>{children}</span>
  </div>
);
