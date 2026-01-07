/** Module */

import { forwardRef, type InputHTMLAttributes, type SelectHTMLAttributes, type ReactNode, type ChangeEvent } from 'react';
import styles from './Input.module.css';

type InputSize = 'sm' | 'md' | 'lg';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  size?: InputSize;
  error?: string | boolean;
}

/**
 * Base Input component
 */
export const Input = forwardRef<HTMLInputElement, InputProps>(({
  type = 'text',
  size = 'md',
  error,
  className = '',
  ...props
}, ref) => (
  <input
    ref={ref}
    type={type}
    className={`${styles.input} ${styles[`size-${size}`]} ${error ? styles.error : ''} ${className}`}
    {...props}
  />
));

Input.displayName = 'Input';

interface TokenAmountInputProps extends InputHTMLAttributes<HTMLInputElement> {}

/**
 * TokenAmountInput - large amount input for tokens
 */
export const TokenAmountInput = forwardRef<HTMLInputElement, TokenAmountInputProps>(({
  value,
  onChange,
  placeholder = '0.00',
  disabled = false,
  className = '',
  ...props
}, ref) => (
  <input
    ref={ref}
    type="text"
    inputMode="decimal"
    value={value}
    onChange={onChange}
    placeholder={placeholder}
    disabled={disabled}
    className={`${styles.tokenAmountInput} ${className}`}
    {...props}
  />
));

TokenAmountInput.displayName = 'TokenAmountInput';

interface SearchInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  value?: string;
  onChange?: (e: ChangeEvent<HTMLInputElement>) => void;
  onClear?: () => void;
}

/**
 * SearchInput - with search icon
 */
export const SearchInput = forwardRef<HTMLInputElement, SearchInputProps>(({
  value,
  onChange,
  onClear,
  placeholder = 'Search...',
  className = '',
  ...props
}, ref) => (
  <div className={`${styles.searchWrapper} ${className}`}>
    <svg className={styles.searchIcon} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.35-4.35" />
    </svg>
    <input
      ref={ref}
      type="text"
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      className={styles.searchInput}
      {...props}
    />
    {value && onClear && (
      <button type="button" onClick={onClear} className={styles.clearButton} aria-label="Clear search">
        ×
      </button>
    )}
  </div>
));

SearchInput.displayName = 'SearchInput';

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  children?: ReactNode;
  size?: InputSize;
}

/**
 * Select component
 */
export const Select = forwardRef<HTMLSelectElement, SelectProps>(({
  children,
  size = 'md',
  className = '',
  ...props
}, ref) => (
  <select
    ref={ref}
    className={`${styles.select} ${styles[`size-${size}`]} ${className}`}
    {...props}
  >
    {children}
  </select>
));

Select.displayName = 'Select';

interface StepperProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  label?: string;
  className?: string;
}

/**
 * Stepper input - for numeric values with +/- buttons
 */
export const Stepper = ({
  value,
  onChange,
  min = 1,
  max = 100,
  step = 1,
  label,
  className = '',
}: StepperProps) => {
  const handleDecrement = () => {
    const newValue = Math.max(min, value - step);
    onChange(newValue);
  };

  const handleIncrement = () => {
    const newValue = Math.min(max, value + step);
    onChange(newValue);
  };

  return (
    <div className={`${styles.stepper} ${className}`}>
      {label && <div className={styles.stepperLabel}>{label}</div>}
      <div className={styles.stepperControls}>
        <button
          type="button"
          onClick={handleDecrement}
          disabled={value <= min}
          className={styles.stepperButton}
          aria-label="Decrease"
        >
          -
        </button>
        <span className={styles.stepperValue}>{value}</span>
        <button
          type="button"
          onClick={handleIncrement}
          disabled={value >= max}
          className={styles.stepperButton}
          aria-label="Increase"
        >
          +
        </button>
      </div>
    </div>
  );
};

interface RangeSliderProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  value: number;
  onChange: (e: ChangeEvent<HTMLInputElement>) => void;
  min?: number;
  max?: number;
  step?: number;
  label?: string;
  formatValue?: (value: number) => string | number;
}

/**
 * Range slider with label
 */
export const RangeSlider = forwardRef<HTMLInputElement, RangeSliderProps>(({
  value,
  onChange,
  min = 0,
  max = 100,
  step = 1,
  label,
  formatValue = (v) => v,
  className = '',
  ...props
}, ref) => (
  <div className={`${styles.rangeWrapper} ${className}`}>
    {label && (
      <div className={styles.rangeHeader}>
        <span className={styles.rangeLabel}>{label}</span>
        <span className={styles.rangeValue}>{formatValue(value)}</span>
      </div>
    )}
    <input
      ref={ref}
      type="range"
      value={value}
      onChange={onChange}
      min={min}
      max={max}
      step={step}
      className={styles.rangeInput}
      {...props}
    />
  </div>
));

RangeSlider.displayName = 'RangeSlider';
