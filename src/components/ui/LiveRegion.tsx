/**
 * LiveRegion - Accessible announcements for screen readers
 * 
 * Use aria-live regions to announce dynamic content changes to screen reader users.
 * 
 * @example
 * // Announce when quote updates
 * <LiveRegion>
 *   {quote && `You'll receive ${quote.amount} ETH`}
 * </LiveRegion>
 * 
 * @example
 * // Announce errors immediately
 * <LiveRegion assertive>
 *   {error && `Error: ${error}`}
 * </LiveRegion>
 * 
 * @example
 * // Visually hidden announcement
 * <LiveRegion srOnly>
 *   {isLoading ? 'Loading...' : 'Content loaded'}
 * </LiveRegion>
 */

import { memo, useEffect, useRef, useState } from 'react';

interface LiveRegionProps {
    /** Content to announce */
    children: React.ReactNode;
    /** Use assertive for important/error messages that should interrupt */
    assertive?: boolean;
    /** Visually hide the region (still announced to screen readers) */
    srOnly?: boolean;
    /** Delay before announcing (ms) - helps batch rapid updates */
    delay?: number;
    /** Additional CSS class */
    className?: string;
    /** Role override (default: status for polite, alert for assertive) */
    role?: 'status' | 'alert' | 'log';
}

/**
 * LiveRegion component for accessible announcements
 */
export const LiveRegion = memo(({
    children,
    assertive = false,
    srOnly = false,
    delay = 0,
    className = '',
    role,
}: LiveRegionProps) => {
    const [content, setContent] = useState(children);
    const timeoutRef = useRef<NodeJS.Timeout>();

    useEffect(() => {
        if (delay > 0) {
            timeoutRef.current = setTimeout(() => {
                setContent(children);
            }, delay);
            return () => {
                if (timeoutRef.current) {
                    clearTimeout(timeoutRef.current);
                }
            };
        } else {
            setContent(children);
        }
    }, [children, delay]);

    const srOnlyStyles: React.CSSProperties = srOnly ? {
        position: 'absolute',
        width: '1px',
        height: '1px',
        padding: 0,
        margin: '-1px',
        overflow: 'hidden',
        clip: 'rect(0, 0, 0, 0)',
        whiteSpace: 'nowrap',
        border: 0,
    } : {};

    const computedRole = role ?? (assertive ? 'alert' : 'status');

    return (
        <div
            role={computedRole}
            aria-live={assertive ? 'assertive' : 'polite'}
            aria-atomic="true"
            className={className}
            style={srOnlyStyles}
        >
            {content}
        </div>
    );
});

LiveRegion.displayName = 'LiveRegion';

/**
 * Visually hidden text for screen readers only
 */
export const SrOnly = memo(({ children }: { children: React.ReactNode }) => (
    <span
        style={{
            position: 'absolute',
            width: '1px',
            height: '1px',
            padding: 0,
            margin: '-1px',
            overflow: 'hidden',
            clip: 'rect(0, 0, 0, 0)',
            whiteSpace: 'nowrap',
            border: 0,
        }}
    >
        {children}
    </span>
));

SrOnly.displayName = 'SrOnly';

/**
 * Hook to announce messages to screen readers
 * Creates a temporary live region that announces the message
 */
export function useAnnounce() {
    const announce = (message: string, assertive = false) => {
        // Create a temporary element
        const el = document.createElement('div');
        el.setAttribute('role', assertive ? 'alert' : 'status');
        el.setAttribute('aria-live', assertive ? 'assertive' : 'polite');
        el.setAttribute('aria-atomic', 'true');
        el.style.cssText = `
            position: absolute;
            width: 1px;
            height: 1px;
            padding: 0;
            margin: -1px;
            overflow: hidden;
            clip: rect(0, 0, 0, 0);
            white-space: nowrap;
            border: 0;
        `;
        
        document.body.appendChild(el);
        
        // Set content after a brief delay to ensure screen reader picks it up
        setTimeout(() => {
            el.textContent = message;
        }, 100);
        
        // Clean up after announcement
        setTimeout(() => {
            document.body.removeChild(el);
        }, 1000);
    };

    return { announce };
}

export default LiveRegion;
