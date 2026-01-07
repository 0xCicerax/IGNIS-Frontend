import { useState, useRef, useEffect, ReactNode } from 'react';

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────
type TooltipPosition = 'top' | 'bottom' | 'left' | 'right';

interface TooltipProps {
    content: ReactNode;
    children: ReactNode;
    position?: TooltipPosition;
    delay?: number;
    maxWidth?: number;
    className?: string;
}

interface InfoTooltipProps {
    content: ReactNode;
    size?: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// TOOLTIP COMPONENT
// ─────────────────────────────────────────────────────────────────────────────
export const Tooltip: React.FC<TooltipProps> = ({ 
    content, 
    children, 
    position = 'top',
    delay = 200,
    maxWidth = 280,
    className = '',
}) => {
    const [isVisible, setIsVisible] = useState(false);
    const [coords, setCoords] = useState({ x: 0, y: 0 });
    const triggerRef = useRef<HTMLDivElement>(null);
    const tooltipRef = useRef<HTMLDivElement>(null);
    const timeoutRef = useRef<NodeJS.Timeout>();

    const showTooltip = () => {
        timeoutRef.current = setTimeout(() => {
            setIsVisible(true);
            updatePosition();
        }, delay);
    };

    const hideTooltip = () => {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }
        setIsVisible(false);
    };

    const updatePosition = () => {
        if (!triggerRef.current || !tooltipRef.current) return;

        const triggerRect = triggerRef.current.getBoundingClientRect();
        const tooltipRect = tooltipRef.current.getBoundingClientRect();
        const scrollX = window.scrollX;
        const scrollY = window.scrollY;

        let x = 0, y = 0;

        switch (position) {
            case 'top':
                x = triggerRect.left + scrollX + (triggerRect.width / 2) - (tooltipRect.width / 2);
                y = triggerRect.top + scrollY - tooltipRect.height - 8;
                break;
            case 'bottom':
                x = triggerRect.left + scrollX + (triggerRect.width / 2) - (tooltipRect.width / 2);
                y = triggerRect.bottom + scrollY + 8;
                break;
            case 'left':
                x = triggerRect.left + scrollX - tooltipRect.width - 8;
                y = triggerRect.top + scrollY + (triggerRect.height / 2) - (tooltipRect.height / 2);
                break;
            case 'right':
                x = triggerRect.right + scrollX + 8;
                y = triggerRect.top + scrollY + (triggerRect.height / 2) - (tooltipRect.height / 2);
                break;
        }

        // Keep within viewport
        const padding = 12;
        x = Math.max(padding, Math.min(x, window.innerWidth - tooltipRect.width - padding));
        y = Math.max(padding, Math.min(y, window.innerHeight - tooltipRect.height - padding));

        setCoords({ x, y });
    };

    useEffect(() => {
        if (isVisible) {
            updatePosition();
            window.addEventListener('scroll', updatePosition);
            window.addEventListener('resize', updatePosition);
        }
        return () => {
            window.removeEventListener('scroll', updatePosition);
            window.removeEventListener('resize', updatePosition);
        };
    }, [isVisible]);

    useEffect(() => {
        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
        };
    }, []);

    return (
        <>
            <div
                ref={triggerRef}
                className={`tooltip-trigger ${className}`}
                onMouseEnter={showTooltip}
                onMouseLeave={hideTooltip}
                onFocus={showTooltip}
                onBlur={hideTooltip}
            >
                {children}
            </div>
            {isVisible && (
                <div
                    ref={tooltipRef}
                    className={`tooltip tooltip--${position}`}
                    style={{
                        position: 'fixed',
                        left: coords.x,
                        top: coords.y,
                        maxWidth,
                        zIndex: 9999,
                    }}
                >
                    <div className="tooltip__content">
                        {content}
                    </div>
                    <div className={`tooltip__arrow tooltip__arrow--${position}`} />
                </div>
            )}
        </>
    );
};

// ─────────────────────────────────────────────────────────────────────────────
// INFO TOOLTIP (icon + tooltip combo)
// ─────────────────────────────────────────────────────────────────────────────
export const InfoTooltip: React.FC<InfoTooltipProps> = ({ content, size = 14 }) => (
    <Tooltip content={content} position="top">
        <span className="info-tooltip-icon" style={{ width: size, height: size }}>
            <svg viewBox="0 0 16 16" fill="currentColor" width={size} height={size}>
                <path d="M8 0a8 8 0 100 16A8 8 0 008 0zm0 14.5a6.5 6.5 0 110-13 6.5 6.5 0 010 13z" opacity="0.5"/>
                <path d="M8 6.5a.75.75 0 01.75.75v4a.75.75 0 01-1.5 0v-4A.75.75 0 018 6.5zM8 4a1 1 0 100 2 1 1 0 000-2z"/>
            </svg>
        </span>
    </Tooltip>
);

// ─────────────────────────────────────────────────────────────────────────────
// APR BREAKDOWN TOOLTIP
// ─────────────────────────────────────────────────────────────────────────────
interface APRBreakdownProps {
    baseAPR: number;
    emissionsAPR?: number;
    yieldAPR?: number;
    boostMultiplier?: number;
}

export const APRBreakdownTooltip: React.FC<APRBreakdownProps> = ({
    baseAPR,
    emissionsAPR = 0,
    yieldAPR = 0,
    boostMultiplier = 1,
}) => {
    const totalAPR = (baseAPR + emissionsAPR + yieldAPR) * boostMultiplier;
    
    return (
        <div className="apr-breakdown">
            <div className="apr-breakdown__title">APR Breakdown</div>
            <div className="apr-breakdown__row">
                <span>Trading Fees</span>
                <span className="apr-breakdown__value">{baseAPR.toFixed(2)}%</span>
            </div>
            {emissionsAPR > 0 && (
                <div className="apr-breakdown__row">
                    <span>IGNIS Emissions</span>
                    <span className="apr-breakdown__value apr-breakdown__value--gold">{emissionsAPR.toFixed(2)}%</span>
                </div>
            )}
            {yieldAPR > 0 && (
                <div className="apr-breakdown__row">
                    <span>Underlying Yield</span>
                    <span className="apr-breakdown__value apr-breakdown__value--purple">{yieldAPR.toFixed(2)}%</span>
                </div>
            )}
            {boostMultiplier > 1 && (
                <div className="apr-breakdown__row apr-breakdown__row--boost">
                    <span>veIGNIS Boost</span>
                    <span className="apr-breakdown__value apr-breakdown__value--boost">{boostMultiplier.toFixed(2)}x</span>
                </div>
            )}
            <div className="apr-breakdown__total">
                <span>Total APR</span>
                <span className="apr-breakdown__total-value">{totalAPR.toFixed(2)}%</span>
            </div>
        </div>
    );
};

// ─────────────────────────────────────────────────────────────────────────────
// FEE BREAKDOWN TOOLTIP  
// ─────────────────────────────────────────────────────────────────────────────
interface FeeBreakdownProps {
    swapFee: number;
    protocolFee: number;
    lpShare: number;
    mevShare?: number;
}

export const FeeBreakdownTooltip: React.FC<FeeBreakdownProps> = ({
    swapFee,
    protocolFee,
    lpShare,
    mevShare = 0,
}) => (
    <div className="fee-breakdown">
        <div className="fee-breakdown__title">Fee Distribution</div>
        <div className="fee-breakdown__row">
            <span>Swap Fee</span>
            <span className="fee-breakdown__value">{(swapFee * 100).toFixed(2)}%</span>
        </div>
        <div className="fee-breakdown__divider" />
        <div className="fee-breakdown__row">
            <span>→ To LPs</span>
            <span className="fee-breakdown__value">{lpShare}%</span>
        </div>
        <div className="fee-breakdown__row">
            <span>→ To Protocol</span>
            <span className="fee-breakdown__value">{protocolFee}%</span>
        </div>
        {mevShare > 0 && (
            <div className="fee-breakdown__row">
                <span>→ MEV Capture</span>
                <span className="fee-breakdown__value">{mevShare}%</span>
            </div>
        )}
    </div>
);
