import { useEffect, useCallback } from 'react';

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────
interface ShortcutConfig {
    key: string;
    ctrl?: boolean;
    meta?: boolean;
    shift?: boolean;
    handler: () => void;
    description: string;
}

interface UseKeyboardShortcutsOptions {
    enabled?: boolean;
}

// ─────────────────────────────────────────────────────────────────────────────
// HOOK
// ─────────────────────────────────────────────────────────────────────────────
export const useKeyboardShortcuts = (
    shortcuts: ShortcutConfig[],
    options: UseKeyboardShortcutsOptions = {}
) => {
    const { enabled = true } = options;

    const handleKeyDown = useCallback((event: KeyboardEvent) => {
        if (!enabled) return;

        // Don't trigger shortcuts when typing in inputs
        const target = event.target as HTMLElement;
        const isInput = target.tagName === 'INPUT' || 
                       target.tagName === 'TEXTAREA' || 
                       target.isContentEditable;

        for (const shortcut of shortcuts) {
            const keyMatch = event.key.toLowerCase() === shortcut.key.toLowerCase();
            const ctrlMatch = shortcut.ctrl ? (event.ctrlKey || event.metaKey) : !event.ctrlKey;
            const metaMatch = shortcut.meta ? event.metaKey : true;
            const shiftMatch = shortcut.shift ? event.shiftKey : !event.shiftKey;

            // Allow Escape even in inputs
            if (shortcut.key === 'Escape' && keyMatch) {
                event.preventDefault();
                shortcut.handler();
                return;
            }

            // Skip other shortcuts if in input
            if (isInput && shortcut.key !== 'Escape') continue;

            if (keyMatch && ctrlMatch && metaMatch && shiftMatch) {
                event.preventDefault();
                shortcut.handler();
                return;
            }
        }
    }, [shortcuts, enabled]);

    useEffect(() => {
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [handleKeyDown]);
};

// ─────────────────────────────────────────────────────────────────────────────
// GLOBAL SHORTCUTS HOOK
// ─────────────────────────────────────────────────────────────────────────────
interface GlobalShortcutHandlers {
    onEscape?: () => void;
    onSearch?: () => void;
    onHelp?: () => void;
    onNavigate?: (path: string) => void;
}

// Track G key for G+X navigation sequences
let gKeyPressed = false;
let gKeyTimeout: NodeJS.Timeout | null = null;

export const useGlobalShortcuts = (handlers: GlobalShortcutHandlers) => {
    const shortcuts: ShortcutConfig[] = [];

    if (handlers.onEscape) {
        shortcuts.push({
            key: 'Escape',
            handler: handlers.onEscape,
            description: 'Close modal / Cancel',
        });
    }

    if (handlers.onSearch) {
        shortcuts.push({
            key: '/',
            handler: handlers.onSearch,
            description: 'Focus search',
        });
    }

    if (handlers.onHelp) {
        shortcuts.push({
            key: '?',
            shift: true,
            handler: handlers.onHelp,
            description: 'Show keyboard shortcuts',
        });
    }

    useKeyboardShortcuts(shortcuts);

    // Handle G+X navigation sequences
    useEffect(() => {
        if (!handlers.onNavigate) return;

        const handleKeyDown = (e: KeyboardEvent) => {
            const target = e.target as HTMLElement;
            const isInput = target.tagName === 'INPUT' || 
                           target.tagName === 'TEXTAREA' || 
                           target.isContentEditable;
            
            if (isInput) return;

            const key = e.key.toLowerCase();

            // First key: G
            if (key === 'g' && !gKeyPressed) {
                gKeyPressed = true;
                if (gKeyTimeout) clearTimeout(gKeyTimeout);
                gKeyTimeout = setTimeout(() => {
                    gKeyPressed = false;
                }, 1000); // 1 second to press second key
                return;
            }

            // Second key after G
            if (gKeyPressed) {
                gKeyPressed = false;
                if (gKeyTimeout) clearTimeout(gKeyTimeout);

                const navMap: Record<string, string> = {
                    's': '/app/swap',
                    'p': '/app/pools',
                    'l': '/app/liquidity',
                    'd': '/app/depth',
                    'a': '/app/analytics',
                    'o': '/app/portfolio',
                    't': '/app/stake',
                };

                if (navMap[key]) {
                    e.preventDefault();
                    handlers.onNavigate(navMap[key]);
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [handlers.onNavigate]);
};

// ─────────────────────────────────────────────────────────────────────────────
// MODAL SHORTCUTS HOOK  
// ─────────────────────────────────────────────────────────────────────────────
interface ModalShortcutHandlers {
    onClose: () => void;
    onConfirm?: () => void;
}

export const useModalShortcuts = (handlers: ModalShortcutHandlers, isOpen: boolean) => {
    const shortcuts: ShortcutConfig[] = [
        {
            key: 'Escape',
            handler: handlers.onClose,
            description: 'Close modal',
        },
    ];

    if (handlers.onConfirm) {
        shortcuts.push({
            key: 'Enter',
            handler: handlers.onConfirm,
            description: 'Confirm action',
        });
    }

    useKeyboardShortcuts(shortcuts, { enabled: isOpen });
};

// ─────────────────────────────────────────────────────────────────────────────
// SHORTCUTS LIST (for help modal)
// ─────────────────────────────────────────────────────────────────────────────
export const KEYBOARD_SHORTCUTS = [
    { keys: ['Esc'], description: 'Close modal / Cancel' },
    { keys: ['Enter'], description: 'Confirm action' },
    { keys: ['/'], description: 'Focus search' },
    { keys: ['?'], description: 'Show shortcuts' },
    { keys: ['G', 'S'], description: 'Go to Swap' },
    { keys: ['G', 'P'], description: 'Go to Pools' },
    { keys: ['F'], description: 'Flip tokens (Swap)' },
    { keys: ['M'], description: 'Max amount (Swap)' },
];

// ─────────────────────────────────────────────────────────────────────────────
// SWAP PAGE SHORTCUTS HOOK
// ─────────────────────────────────────────────────────────────────────────────
interface SwapShortcutHandlers {
    onFlip?: () => void;
    onMax?: () => void;
    onConnect?: () => void;
}

export const useSwapShortcuts = (handlers: SwapShortcutHandlers, enabled = true) => {
    const shortcuts: ShortcutConfig[] = [];

    if (handlers.onFlip) {
        shortcuts.push({
            key: 'f',
            handler: handlers.onFlip,
            description: 'Flip tokens',
        });
    }

    if (handlers.onMax) {
        shortcuts.push({
            key: 'm',
            handler: handlers.onMax,
            description: 'Use max amount',
        });
    }

    if (handlers.onConnect) {
        shortcuts.push({
            key: 'c',
            handler: handlers.onConnect,
            description: 'Connect wallet',
        });
    }

    useKeyboardShortcuts(shortcuts, { enabled });
};

export default useKeyboardShortcuts;
