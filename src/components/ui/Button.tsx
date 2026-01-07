/** Module */

import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';
import styles from './Button.module.css';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'success' | 'info';
type ButtonSize = 'sm' | 'md' | 'lg' | 'xl';
type IconPosition = 'left' | 'right';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children?: ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  loading?: boolean;
  icon?: ReactNode;
  iconPosition?: IconPosition;
}

/**
 * Primary Button component
 */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(({
  children,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  disabled = false,
  loading = false,
  icon,
  iconPosition = 'left',
  className = '',
  ...props
}, ref) => {
  const classNames = [
    styles.button,
    styles[`variant-${variant}`],
    styles[`size-${size}`],
    fullWidth && styles.fullWidth,
    disabled && styles.disabled,
    loading && styles.loading,
    className,
  ].filter(Boolean).join(' ');

  return (
    <button
      ref={ref}
      className={classNames}
      disabled={disabled || loading}
      {...props}
    >
      {loading && <span className={styles.spinner}>⟳</span>}
      {icon && iconPosition === 'left' && !loading && (
        <span className={styles.iconLeft}>{icon}</span>
      )}
      <span className={styles.content}>{children}</span>
      {icon && iconPosition === 'right' && (
        <span className={styles.iconRight}>{icon}</span>
      )}
    </button>
  );
});

Button.displayName = 'Button';

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children?: ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
}

/**
 * Icon Button - square button with just an icon
 */
export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(({
  children,
  variant = 'ghost',
  size = 'md',
  className = '',
  ...props
}, ref) => {
  const classNames = [
    styles.iconButton,
    styles[`variant-${variant}`],
    styles[`iconSize-${size}`],
    className,
  ].filter(Boolean).join(' ');

  return (
    <button ref={ref} className={classNames} {...props}>
      {children}
    </button>
  );
});

IconButton.displayName = 'IconButton';

interface ToggleGroupProps extends React.HTMLAttributes<HTMLDivElement> {
  children?: ReactNode;
}

/**
 * Toggle Button Group
 */
export const ToggleGroup = ({ children, className = '', ...props }: ToggleGroupProps) => (
  <div className={`${styles.toggleGroup} ${className}`} {...props}>
    {children}
  </div>
);

interface ToggleButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children?: ReactNode;
  active?: boolean;
  variant?: 'default' | 'primary';
}

/**
 * Toggle Button - for mode selectors, tabs, etc.
 */
export const ToggleButton = forwardRef<HTMLButtonElement, ToggleButtonProps>(({
  children,
  active = false,
  variant = 'default',
  className = '',
  ...props
}, ref) => {
  const classNames = [
    styles.toggleButton,
    active && styles.toggleActive,
    active && variant === 'primary' && styles.toggleActivePrimary,
    className,
  ].filter(Boolean).join(' ');

  return (
    <button ref={ref} className={classNames} {...props}>
      {children}
    </button>
  );
});

ToggleButton.displayName = 'ToggleButton';

interface ChipButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children?: ReactNode;
  active?: boolean;
  size?: 'sm' | 'md';
  variant?: 'default' | 'primary' | 'info' | 'purple';
}

/**
 * Chip/Tag Button - for quick selections
 */
export const ChipButton = forwardRef<HTMLButtonElement, ChipButtonProps>(({
  children,
  active = false,
  size = 'sm',
  variant = 'default',
  className = '',
  ...props
}, ref) => {
  const classNames = [
    styles.chip,
    styles[`chipSize-${size}`],
    styles[`chipVariant-${variant}`],
    active && styles.chipActive,
    className,
  ].filter(Boolean).join(' ');

  return (
    <button ref={ref} className={classNames} {...props}>
      {children}
    </button>
  );
});

ChipButton.displayName = 'ChipButton';

interface LinkButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children?: ReactNode;
}

/**
 * Link Button - looks like a link
 */
export const LinkButton = forwardRef<HTMLButtonElement, LinkButtonProps>(({
  children,
  className = '',
  ...props
}, ref) => (
  <button ref={ref} className={`${styles.linkButton} ${className}`} {...props}>
    {children}
  </button>
));

LinkButton.displayName = 'LinkButton';

interface MaxButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {}

/**
 * Max Button - for setting max amount
 */
export const MaxButton = forwardRef<HTMLButtonElement, MaxButtonProps>(({ className = '', ...props }, ref) => (
  <button ref={ref} className={`${styles.maxButton} ${className}`} {...props}>
    MAX
  </button>
));

MaxButton.displayName = 'MaxButton';
