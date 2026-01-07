import type { CSSProperties } from 'react';

interface SkeletonProps {
    width?: number | string;
    height?: number | string;
    borderRadius?: number | string;
    style?: CSSProperties;
}

// Base skeleton with shimmer animation
export const Skeleton = ({ width, height, borderRadius = 8, style = {} }: SkeletonProps) => {
    return (
        <div
            style={{
                width: width || '100%',
                height: height || 20,
                borderRadius,
                background: 'linear-gradient(90deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.08) 50%, rgba(255,255,255,0.03) 100%)',
                backgroundSize: '200% 100%',
                animation: 'shimmer 1.5s infinite',
                ...style,
            }}
        />
    );
};

interface SkeletonTextProps {
    lines?: number;
    width?: number | string;
}

// Text skeleton
export const SkeletonText = ({ lines = 1, width = '100%' }: SkeletonTextProps) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        {Array.from({ length: lines }).map((_, i) => (
            <Skeleton 
                key={i} 
                height={16} 
                width={i === lines - 1 && lines > 1 ? '60%' : width} 
            />
        ))}
    </div>
);

interface SkeletonCardProps {
    height?: number | string;
}

// Card skeleton
export const SkeletonCard = ({ height = 120 }: SkeletonCardProps) => (
    <div style={{
        background: 'linear-gradient(180deg, rgba(25,25,28,1) 0%, rgba(18,18,20,1) 100%)',
        border: '1px solid rgba(255,255,255,0.04)',
        borderRadius: 16,
        padding: '1rem',
        height,
    }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
            <Skeleton width={42} height={42} borderRadius="50%" />
            <div style={{ flex: 1 }}>
                <Skeleton width="60%" height={16} style={{ marginBottom: '0.5rem' }} />
                <Skeleton width="40%" height={12} />
            </div>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
            <Skeleton height={24} style={{ flex: 1 }} />
            <Skeleton height={24} style={{ flex: 1 }} />
            <Skeleton height={24} style={{ flex: 1 }} />
        </div>
    </div>
);

// Pool row skeleton
export const SkeletonPoolRow = () => (
    <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
        <td style={{ padding: '1rem 1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ display: 'flex' }}>
                    <Skeleton width={36} height={36} borderRadius="50%" />
                    <Skeleton width={36} height={36} borderRadius="50%" style={{ marginLeft: -10 }} />
                </div>
                <div>
                    <Skeleton width={100} height={16} style={{ marginBottom: '0.25rem' }} />
                    <Skeleton width={60} height={12} />
                </div>
            </div>
        </td>
        <td style={{ padding: '0.875rem' }}><Skeleton height={20} /></td>
        <td style={{ padding: '0.875rem' }}><Skeleton height={20} /></td>
        <td style={{ padding: '0.875rem' }}><Skeleton height={20} /></td>
        <td style={{ padding: '0.875rem' }}><Skeleton height={20} /></td>
        <td style={{ padding: '0.875rem 1rem' }}><Skeleton width={60} height={28} borderRadius={6} /></td>
    </tr>
);

// Mobile pool card skeleton
export const SkeletonPoolCard = () => (
    <div style={{
        background: 'linear-gradient(135deg, rgba(22,22,26,1), rgba(18,18,22,1))',
        border: '1px solid rgba(255,255,255,0.04)',
        borderRadius: 16,
        padding: '1rem',
    }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.875rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ display: 'flex' }}>
                    <Skeleton width={42} height={42} borderRadius="50%" />
                    <Skeleton width={42} height={42} borderRadius="50%" style={{ marginLeft: -12 }} />
                </div>
                <div>
                    <Skeleton width={100} height={18} style={{ marginBottom: '0.5rem' }} />
                    <Skeleton width={60} height={14} />
                </div>
            </div>
            <div style={{ textAlign: 'right' }}>
                <Skeleton width={60} height={24} style={{ marginBottom: '0.25rem' }} />
                <Skeleton width={30} height={12} />
            </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem' }}>
            <Skeleton height={50} borderRadius={8} />
            <Skeleton height={50} borderRadius={8} />
            <Skeleton height={50} borderRadius={8} />
        </div>
    </div>
);

// Position card skeleton
export const SkeletonPositionCard = () => (
    <div style={{
        background: 'linear-gradient(135deg, rgba(22,22,26,1), rgba(18,18,22,1))',
        border: '1px solid rgba(255,255,255,0.04)',
        borderRadius: 16,
        padding: '1rem',
    }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
            <div style={{ display: 'flex' }}>
                <Skeleton width={42} height={42} borderRadius="50%" />
                <Skeleton width={42} height={42} borderRadius="50%" style={{ marginLeft: -12 }} />
            </div>
            <div style={{ flex: 1 }}>
                <Skeleton width={120} height={18} style={{ marginBottom: '0.5rem' }} />
                <Skeleton width={60} height={14} />
            </div>
            <div style={{ textAlign: 'right' }}>
                <Skeleton width={50} height={20} style={{ marginBottom: '0.25rem' }} />
                <Skeleton width={30} height={12} />
            </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.5rem', marginBottom: '0.875rem' }}>
            <Skeleton height={45} borderRadius={8} />
            <Skeleton height={45} borderRadius={8} />
            <Skeleton height={45} borderRadius={8} />
            <Skeleton height={45} borderRadius={8} />
        </div>
        <Skeleton height={38} borderRadius={10} />
    </div>
);

// Position row skeleton for table
export const SkeletonPositionRow = () => (
    <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
        <td style={{ padding: '0.875rem 1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ display: 'flex' }}>
                    <Skeleton width={36} height={36} borderRadius="50%" />
                    <Skeleton width={36} height={36} borderRadius="50%" style={{ marginLeft: -10 }} />
                </div>
                <div>
                    <Skeleton width={100} height={16} style={{ marginBottom: '0.25rem' }} />
                    <Skeleton width={80} height={12} />
                </div>
            </div>
        </td>
        <td style={{ padding: '0.875rem' }}><Skeleton height={20} /></td>
        <td style={{ padding: '0.875rem' }}><Skeleton height={20} /></td>
        <td style={{ padding: '0.875rem' }}><Skeleton height={20} /></td>
        <td style={{ padding: '0.875rem' }}><Skeleton height={20} /></td>
        <td style={{ padding: '0.875rem' }}><Skeleton width={70} height={24} borderRadius={5} /></td>
        <td style={{ padding: '0.875rem 1rem' }}><Skeleton width={80} height={28} borderRadius={6} /></td>
    </tr>
);

// Stats card skeleton
export const SkeletonStats = () => (
    <div style={{
        padding: '1rem 1.25rem',
        background: 'linear-gradient(180deg, rgba(25,25,28,1) 0%, rgba(18,18,20,1) 100%)',
        border: '1px solid rgba(255,255,255,0.04)',
        borderRadius: 14,
    }}>
        <Skeleton width="50%" height={14} style={{ marginBottom: '0.5rem' }} />
        <Skeleton width="80%" height={28} />
    </div>
);

interface SpinnerProps {
    size?: number;
    color?: string;
}

// Inline loading spinner
export const Spinner = ({ size = 20, color = '#F5B041' }: SpinnerProps) => (
    <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        style={{ animation: 'spin 1s linear infinite' }}
        aria-label="Loading"
    >
        <circle
            cx="12"
            cy="12"
            r="10"
            stroke="rgba(255,255,255,0.1)"
            strokeWidth="3"
            fill="none"
        />
        <circle
            cx="12"
            cy="12"
            r="10"
            stroke={color}
            strokeWidth="3"
            fill="none"
            strokeDasharray="31.4 31.4"
            strokeLinecap="round"
        />
    </svg>
);

interface PageLoaderProps {
    message?: string;
}

// Full page loading state
export const PageLoader = ({ message = 'Loading...' }: PageLoaderProps) => (
    <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 400,
        gap: '1rem',
    }}>
        <Spinner size={40} />
        <span style={{ color: '#8A8A8A', fontSize: '0.875rem' }}>{message}</span>
    </div>
);

// Add CSS keyframes to document
if (typeof document !== 'undefined') {
    const style = document.createElement('style');
    style.textContent = `
        @keyframes shimmer {
            0% { background-position: 200% 0; }
            100% { background-position: -200% 0; }
        }
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
    `;
    document.head.appendChild(style);
}
