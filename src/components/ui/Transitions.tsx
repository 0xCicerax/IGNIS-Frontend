import { ReactNode, useEffect, useState, useRef } from 'react';

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────
type TransitionType = 'fade' | 'slide-up' | 'slide-left' | 'scale' | 'none';

interface PageTransitionProps {
    children: ReactNode;
    transitionKey: string;
    type?: TransitionType;
    duration?: number;
    className?: string;
}

interface FadeInProps {
    children: ReactNode;
    delay?: number;
    duration?: number;
    className?: string;
}

interface StaggerChildrenProps {
    children: ReactNode[];
    staggerDelay?: number;
    initialDelay?: number;
    className?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// PAGE TRANSITION
// ─────────────────────────────────────────────────────────────────────────────
export const PageTransition: React.FC<PageTransitionProps> = ({
    children,
    transitionKey,
    type = 'fade',
    duration = 200,
    className = '',
}) => {
    const [displayChildren, setDisplayChildren] = useState(children);
    const [transitionStage, setTransitionStage] = useState<'enter' | 'exit' | 'idle'>('idle');
    const previousKeyRef = useRef(transitionKey);

    useEffect(() => {
        if (transitionKey !== previousKeyRef.current) {
            // Start exit animation
            setTransitionStage('exit');
            
            // After exit, update content and start enter
            const exitTimer = setTimeout(() => {
                setDisplayChildren(children);
                setTransitionStage('enter');
                previousKeyRef.current = transitionKey;
                
                // Reset to idle after enter
                const enterTimer = setTimeout(() => {
                    setTransitionStage('idle');
                }, duration);
                
                return () => clearTimeout(enterTimer);
            }, duration);
            
            return () => clearTimeout(exitTimer);
        } else {
            setDisplayChildren(children);
        }
    }, [children, transitionKey, duration]);

    const getTransitionClass = () => {
        if (type === 'none') return '';
        
        const baseClass = `page-transition page-transition--${type}`;
        
        switch (transitionStage) {
            case 'exit':
                return `${baseClass} page-transition--exit`;
            case 'enter':
                return `${baseClass} page-transition--enter`;
            default:
                return `${baseClass} page-transition--idle`;
        }
    };

    return (
        <div 
            className={`${getTransitionClass()} ${className}`}
            style={{ '--transition-duration': `${duration}ms` } as React.CSSProperties}
        >
            {displayChildren}
        </div>
    );
};

// ─────────────────────────────────────────────────────────────────────────────
// FADE IN (for individual elements)
// ─────────────────────────────────────────────────────────────────────────────
export const FadeIn: React.FC<FadeInProps> = ({
    children,
    delay = 0,
    duration = 300,
    className = '',
}) => {
    const [isVisible, setIsVisible] = useState(false);
    const elementRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const timer = setTimeout(() => setIsVisible(true), delay);
        return () => clearTimeout(timer);
    }, [delay]);

    return (
        <div
            ref={elementRef}
            className={`fade-in ${isVisible ? 'fade-in--visible' : ''} ${className}`}
            style={{
                '--fade-duration': `${duration}ms`,
                '--fade-delay': `${delay}ms`,
            } as React.CSSProperties}
        >
            {children}
        </div>
    );
};

// ─────────────────────────────────────────────────────────────────────────────
// STAGGER CHILDREN (animate children one by one)
// ─────────────────────────────────────────────────────────────────────────────
export const StaggerChildren: React.FC<StaggerChildrenProps> = ({
    children,
    staggerDelay = 50,
    initialDelay = 0,
    className = '',
}) => {
    return (
        <div className={`stagger-container ${className}`}>
            {children.map((child, index) => (
                <FadeIn 
                    key={index} 
                    delay={initialDelay + (index * staggerDelay)}
                    duration={300}
                >
                    {child}
                </FadeIn>
            ))}
        </div>
    );
};

// ─────────────────────────────────────────────────────────────────────────────
// SLIDE IN (from direction)
// ─────────────────────────────────────────────────────────────────────────────
type SlideDirection = 'up' | 'down' | 'left' | 'right';

interface SlideInProps {
    children: ReactNode;
    direction?: SlideDirection;
    delay?: number;
    duration?: number;
    distance?: number;
    className?: string;
}

export const SlideIn: React.FC<SlideInProps> = ({
    children,
    direction = 'up',
    delay = 0,
    duration = 400,
    distance = 20,
    className = '',
}) => {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => setIsVisible(true), delay);
        return () => clearTimeout(timer);
    }, [delay]);

    return (
        <div
            className={`slide-in slide-in--${direction} ${isVisible ? 'slide-in--visible' : ''} ${className}`}
            style={{
                '--slide-duration': `${duration}ms`,
                '--slide-distance': `${distance}px`,
            } as React.CSSProperties}
        >
            {children}
        </div>
    );
};

// ─────────────────────────────────────────────────────────────────────────────
// SCALE IN
// ─────────────────────────────────────────────────────────────────────────────
interface ScaleInProps {
    children: ReactNode;
    delay?: number;
    duration?: number;
    initialScale?: number;
    className?: string;
}

export const ScaleIn: React.FC<ScaleInProps> = ({
    children,
    delay = 0,
    duration = 300,
    initialScale = 0.95,
    className = '',
}) => {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => setIsVisible(true), delay);
        return () => clearTimeout(timer);
    }, [delay]);

    return (
        <div
            className={`scale-in ${isVisible ? 'scale-in--visible' : ''} ${className}`}
            style={{
                '--scale-duration': `${duration}ms`,
                '--initial-scale': initialScale,
            } as React.CSSProperties}
        >
            {children}
        </div>
    );
};

// ─────────────────────────────────────────────────────────────────────────────
// ANIMATED NUMBER (count up/down)
// ─────────────────────────────────────────────────────────────────────────────
interface AnimatedNumberProps {
    value: number;
    duration?: number;
    formatter?: (value: number) => string;
    className?: string;
}

export const AnimatedNumber: React.FC<AnimatedNumberProps> = ({
    value,
    duration = 500,
    formatter = (v) => v.toLocaleString(),
    className = '',
}) => {
    const [displayValue, setDisplayValue] = useState(value);
    const previousValueRef = useRef(value);

    useEffect(() => {
        const startValue = previousValueRef.current;
        const endValue = value;
        const diff = endValue - startValue;
        
        if (diff === 0) return;

        const startTime = performance.now();
        
        const animate = (currentTime: number) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            // Ease out cubic
            const eased = 1 - Math.pow(1 - progress, 3);
            
            setDisplayValue(startValue + (diff * eased));
            
            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                previousValueRef.current = endValue;
            }
        };
        
        requestAnimationFrame(animate);
    }, [value, duration]);

    return (
        <span className={`animated-number ${className}`}>
            {formatter(displayValue)}
        </span>
    );
};

// ─────────────────────────────────────────────────────────────────────────────
// PULSE (attention grabber)
// ─────────────────────────────────────────────────────────────────────────────
interface PulseProps {
    children: ReactNode;
    active?: boolean;
    color?: string;
    className?: string;
}

export const Pulse: React.FC<PulseProps> = ({
    children,
    active = true,
    color = 'var(--color-gold)',
    className = '',
}) => (
    <div 
        className={`pulse-wrapper ${active ? 'pulse-wrapper--active' : ''} ${className}`}
        style={{ '--pulse-color': color } as React.CSSProperties}
    >
        {children}
        {active && <span className="pulse-ring" />}
    </div>
);
