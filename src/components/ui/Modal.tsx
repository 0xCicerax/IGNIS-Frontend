/** Module */

import { useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import styles from './Modal.module.css';

/**
 * Modal Backdrop
 */
export const ModalBackdrop = ({ onClick, children }) => (
  <div 
    className={styles.backdrop} 
    onClick={onClick}
    role="presentation"
  >
    {children}
  </div>
);

/**
 * Modal Container
 */
export const Modal = ({
  isOpen,
  onClose,
  children,
  size = 'md',      // 'sm' | 'md' | 'lg' | 'xl' | 'full'
  closeOnBackdrop = true,
  closeOnEscape = true,
  className = '',
  ariaLabelledBy,
  ariaDescribedBy,
}) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const previousActiveElement = useRef<HTMLElement | null>(null);

  // Handle escape key
  const handleEscape = useCallback((e) => {
    if (e.key === 'Escape' && closeOnEscape) {
      onClose();
    }
  }, [onClose, closeOnEscape]);

  // Focus trap
  const handleTabKey = useCallback((e: KeyboardEvent) => {
    if (e.key !== 'Tab' || !modalRef.current) return;

    const focusableElements = modalRef.current.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const firstElement = focusableElements[0] as HTMLElement;
    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

    if (e.shiftKey && document.activeElement === firstElement) {
      e.preventDefault();
      lastElement?.focus();
    } else if (!e.shiftKey && document.activeElement === lastElement) {
      e.preventDefault();
      firstElement?.focus();
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      // Save current focus
      previousActiveElement.current = document.activeElement as HTMLElement;
      
      // Add event listeners
      document.addEventListener('keydown', handleEscape);
      document.addEventListener('keydown', handleTabKey);
      document.body.style.overflow = 'hidden';
      
      // Focus first focusable element
      setTimeout(() => {
        const firstFocusable = modalRef.current?.querySelector(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        ) as HTMLElement;
        firstFocusable?.focus();
      }, 0);
    }
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.removeEventListener('keydown', handleTabKey);
      document.body.style.overflow = '';
      
      // Restore focus
      if (previousActiveElement.current) {
        previousActiveElement.current.focus();
      }
    };
  }, [isOpen, handleEscape, handleTabKey]);

  if (!isOpen) return null;

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget && closeOnBackdrop) {
      onClose();
    }
  };

  return createPortal(
    <div 
      className={styles.backdrop} 
      onClick={handleBackdropClick}
      role="presentation"
    >
      <div 
        ref={modalRef}
        className={`${styles.modal} ${styles[`size-${size}`]} ${className}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby={ariaLabelledBy}
        aria-describedby={ariaDescribedBy}
      >
        {children}
      </div>
    </div>,
    document.body
  );
};

/**
 * Modal Header
 */
export const ModalHeader = ({
  title,
  subtitle,
  onClose,
  children,
  className = '',
  id,
}) => (
  <div className={`${styles.header} ${className}`}>
    <div className={styles.headerContent}>
      {title && <h3 id={id} className={styles.title}>{title}</h3>}
      {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
      {children}
    </div>
    {onClose && (
      <button 
        className={styles.closeButton} 
        onClick={onClose}
        aria-label="Close modal"
        type="button"
      >
        ×
      </button>
    )}
  </div>
);

/**
 * Modal Body
 */
export const ModalBody = ({ children, className = '', scrollable = true }) => (
  <div className={`${styles.body} ${scrollable ? styles.scrollable : ''} ${className}`}>
    {children}
  </div>
);

/**
 * Modal Footer
 */
export const ModalFooter = ({ children, className = '' }) => (
  <div className={`${styles.footer} ${className}`}>
    {children}
  </div>
);

/**
 * Modal Section - for grouping content
 */
export const ModalSection = ({ title, children, className = '' }) => (
  <div className={`${styles.section} ${className}`}>
    {title && <div className={styles.sectionTitle}>{title}</div>}
    {children}
  </div>
);
