import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

interface ShortcutItem {
    keys: string[];
    description: string;
}

interface ShortcutGroup {
    title: string;
    shortcuts: ShortcutItem[];
}

const SHORTCUT_GROUPS: ShortcutGroup[] = [
    {
        title: 'Navigation',
        shortcuts: [
            { keys: ['G', 'S'], description: 'Go to Swap' },
            { keys: ['G', 'P'], description: 'Go to Pools' },
            { keys: ['G', 'L'], description: 'Go to Liquidity' },
            { keys: ['G', 'D'], description: 'Go to Depth' },
            { keys: ['G', 'A'], description: 'Go to Analytics' },
        ],
    },
    {
        title: 'Actions',
        shortcuts: [
            { keys: ['/'], description: 'Focus search' },
            { keys: ['Esc'], description: 'Close modal / Cancel' },
            { keys: ['Enter'], description: 'Confirm action' },
            { keys: ['?'], description: 'Toggle this help' },
        ],
    },
    {
        title: 'Swap Page',
        shortcuts: [
            { keys: ['F'], description: 'Flip tokens' },
            { keys: ['M'], description: 'Use max amount' },
            { keys: ['C'], description: 'Connect wallet' },
        ],
    },
    {
        title: 'Accessibility',
        shortcuts: [
            { keys: ['Tab'], description: 'Navigate forward' },
            { keys: ['Shift', 'Tab'], description: 'Navigate backward' },
            { keys: ['Space'], description: 'Activate button' },
        ],
    },
];

interface KeyboardShortcutsModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const KeyboardShortcutsModal = ({ isOpen, onClose }: KeyboardShortcutsModalProps) => {
    const modalRef = useRef<HTMLDivElement>(null);

    // Close on escape
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape' || e.key === '?') {
                onClose();
            }
        };

        if (isOpen) {
            document.addEventListener('keydown', handleKeyDown);
            document.body.style.overflow = 'hidden';
        }

        return () => {
            document.removeEventListener('keydown', handleKeyDown);
            document.body.style.overflow = '';
        };
    }, [isOpen, onClose]);

    // Focus trap
    useEffect(() => {
        if (isOpen && modalRef.current) {
            modalRef.current.focus();
        }
    }, [isOpen]);

    if (!isOpen) return null;

    return createPortal(
        <div 
            className="shortcuts-modal-overlay"
            onClick={onClose}
            style={{
                position: 'fixed',
                inset: 0,
                background: 'rgba(0, 0, 0, 0.8)',
                backdropFilter: 'blur(4px)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 9999,
                padding: '1rem',
            }}
        >
            <div
                ref={modalRef}
                role="dialog"
                aria-modal="true"
                aria-labelledby="shortcuts-title"
                tabIndex={-1}
                onClick={(e) => e.stopPropagation()}
                style={{
                    background: 'linear-gradient(180deg, rgba(28, 28, 32, 1) 0%, rgba(20, 20, 24, 1) 100%)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    borderRadius: '16px',
                    padding: '1.5rem',
                    maxWidth: '500px',
                    width: '100%',
                    maxHeight: '80vh',
                    overflow: 'auto',
                    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
                }}
            >
                {/* Header */}
                <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    marginBottom: '1.5rem',
                    paddingBottom: '1rem',
                    borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
                }}>
                    <h2 
                        id="shortcuts-title"
                        style={{ 
                            margin: 0, 
                            fontSize: '1.25rem', 
                            fontWeight: 600,
                            color: '#fff',
                        }}
                    >
                        Keyboard Shortcuts
                    </h2>
                    <button
                        onClick={onClose}
                        aria-label="Close shortcuts"
                        style={{
                            background: 'rgba(255, 255, 255, 0.05)',
                            border: 'none',
                            borderRadius: '8px',
                            color: '#8A8A8A',
                            cursor: 'pointer',
                            padding: '0.5rem',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            transition: 'all 0.15s',
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
                            e.currentTarget.style.color = '#fff';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                            e.currentTarget.style.color = '#8A8A8A';
                        }}
                    >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M18 6L6 18M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Shortcut Groups */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    {SHORTCUT_GROUPS.map((group) => (
                        <div key={group.title}>
                            <h3 style={{ 
                                margin: '0 0 0.75rem 0', 
                                fontSize: '0.75rem', 
                                fontWeight: 600,
                                textTransform: 'uppercase',
                                letterSpacing: '0.05em',
                                color: '#F5B041',
                            }}>
                                {group.title}
                            </h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                {group.shortcuts.map((shortcut) => (
                                    <ShortcutRow 
                                        key={shortcut.description} 
                                        keys={shortcut.keys} 
                                        description={shortcut.description} 
                                    />
                                ))}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Footer hint */}
                <div style={{ 
                    marginTop: '1.5rem', 
                    paddingTop: '1rem',
                    borderTop: '1px solid rgba(255, 255, 255, 0.06)',
                    textAlign: 'center',
                    color: '#7A7A7A',
                    fontSize: '0.8125rem',
                }}>
                    Press <Kbd>?</Kbd> to toggle this help
                </div>
            </div>
        </div>,
        document.body
    );
};

/**
 * Single shortcut row
 */
const ShortcutRow = ({ keys, description }: ShortcutItem) => (
    <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        padding: '0.375rem 0',
    }}>
        <span style={{ color: '#A3A3A3', fontSize: '0.875rem' }}>{description}</span>
        <div style={{ display: 'flex', gap: '0.25rem', alignItems: 'center' }}>
            {keys.map((key, i) => (
                <span key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <Kbd>{key}</Kbd>
                    {i < keys.length - 1 && (
                        <span style={{ color: '#7A7A7A', fontSize: '0.75rem' }}>then</span>
                    )}
                </span>
            ))}
        </div>
    </div>
);

/**
 * Keyboard key visual
 */
const Kbd = ({ children }: { children: React.ReactNode }) => (
    <kbd style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        minWidth: '24px',
        height: '24px',
        padding: '0 0.5rem',
        background: 'rgba(255, 255, 255, 0.06)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: '6px',
        color: '#E5E5E5',
        fontSize: '0.75rem',
        fontFamily: 'inherit',
        fontWeight: 500,
        boxShadow: '0 2px 0 rgba(0, 0, 0, 0.2)',
    }}>
        {children}
    </kbd>
);

export default KeyboardShortcutsModal;
