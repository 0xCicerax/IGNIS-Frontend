/** Module */

export const COLORS = {
  // Brand Colors
  primary: '#F5B041',
  primaryDark: '#D4941C',
  primaryLight: 'rgba(245, 176, 65, 0.15)',
  primaryGlow: 'rgba(245, 176, 65, 0.3)',
  
  // Accent Colors
  fire: '#EF4444',
  fireLight: 'rgba(239, 68, 68, 0.1)',
  
  // Status Colors
  success: '#22C55E',
  successLight: 'rgba(34, 197, 94, 0.08)',
  successBorder: 'rgba(34, 197, 94, 0.2)',
  
  warning: '#F59E0B',
  warningLight: 'rgba(245, 158, 11, 0.1)',
  warningBorder: 'rgba(245, 158, 11, 0.3)',
  
  error: '#EF4444',
  errorLight: 'rgba(239, 68, 68, 0.1)',
  errorBorder: 'rgba(239, 68, 68, 0.3)',
  
  info: '#3B82F6',
  infoLight: 'rgba(59, 130, 246, 0.08)',
  infoBorder: 'rgba(59, 130, 246, 0.2)',
  
  // Purple (for TWAP/Limit features)
  purple: '#A855F7',
  purpleLight: 'rgba(168, 85, 247, 0.05)',
  purpleBorder: 'rgba(168, 85, 247, 0.15)',
  
  // Yield indicator
  yield: '#A78BFA',
  yieldLight: 'rgba(167, 139, 250, 0.1)',
  
  // Background Colors
  bgPrimary: '#0A0A0B',
  bgSecondary: '#141416',
  bgTertiary: '#1A1A1C',
  bgCard: 'rgba(25, 25, 28, 1)',
  bgCardDark: 'rgba(18, 18, 20, 1)',
  bgHover: 'rgba(255, 255, 255, 0.03)',
  bgInput: 'rgba(255, 255, 255, 0.02)',
  
  // Border Colors
  border: 'rgba(255, 255, 255, 0.06)',
  borderLight: 'rgba(255, 255, 255, 0.04)',
  borderInput: 'rgba(255, 255, 255, 0.1)',
  
  // Text Colors
  textPrimary: '#FFFFFF',
  textSecondary: '#A3A3A3',
  textMuted: '#8A8A8A',
  textDim: '#7A7A7A',
  textDisabled: '#404040',
};

export const GRADIENTS = {
  primary: 'linear-gradient(135deg, #F5B041, #D4941C)',
  fire: 'linear-gradient(135deg, #EF4444, #F97316, #F5B041)',
  card: 'linear-gradient(180deg, rgba(25,25,28,1) 0%, rgba(18,18,20,1) 100%)',
  cardAlt: 'linear-gradient(135deg, rgba(22,22,26,1), rgba(18,18,22,1))',
  header: 'linear-gradient(180deg, rgba(20,20,22,0.98) 0%, rgba(10,10,11,0.95) 100%)',
  buttonDisabled: 'rgba(255,255,255,0.03)',
  mev: 'linear-gradient(90deg, rgba(245,176,65,0.1), rgba(239,68,68,0.05))',
};

export const SPACING = {
  xs: '0.25rem',    // 4px
  sm: '0.5rem',     // 8px
  md: '0.75rem',    // 12px
  lg: '1rem',       // 16px
  xl: '1.25rem',    // 20px
  xxl: '1.5rem',    // 24px
  xxxl: '2rem',     // 32px
};

export const RADII = {
  sm: '6px',
  md: '8px',
  lg: '12px',
  xl: '14px',
  xxl: '16px',
  pill: '9999px',
};

export const FONTS = {
  primary: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
  display: "'Space Grotesk', sans-serif",
  mono: "'JetBrains Mono', monospace",
};

export const FONT_SIZES = {
  xs: '0.625rem',    // 10px
  sm: '0.75rem',     // 12px
  md: '0.8125rem',   // 13px
  base: '0.875rem',  // 14px
  lg: '0.9375rem',   // 15px
  xl: '1rem',        // 16px
  xxl: '1.125rem',   // 18px
  xxxl: '1.5rem',    // 24px
  display: '2rem',   // 32px
};

export const SHADOWS = {
  sm: '0 2px 8px rgba(0, 0, 0, 0.3)',
  md: '0 4px 12px rgba(0, 0, 0, 0.4)',
  lg: '0 8px 32px rgba(0, 0, 0, 0.5)',
  xl: '0 20px 60px rgba(0, 0, 0, 0.5)',
  glow: '0 4px 12px rgba(245, 176, 65, 0.3)',
  success: '0 0 10px #22C55E',
};

export const TRANSITIONS = {
  fast: '0.1s ease',
  normal: '0.15s ease',
  slow: '0.2s ease',
  smooth: '0.3s ease',
};

export const TIMING = {
  // Loading states
  LOADING_DELAY: 1200,        // Skeleton loading simulation
  LOADING_DELAY_SHORT: 800,   // Quick loading states
  
  // Transactions
  TX_SIMULATION: 2000,        // Demo transaction simulation
  TX_CONFIRMATION: 1500,      // Confirmation delay
  
  // Quotes & prices
  QUOTE_COUNTDOWN: 30,        // Seconds before quote expires
  QUOTE_LATENCY: 500,         // Demo quote fetch latency
  PRICE_REFRESH: 10000,       // Price refresh interval (10s)
  
  // UI
  DEBOUNCE: 300,              // Input debounce
  TOAST_DURATION: 4000,       // Toast display duration
  ANIMATION_DURATION: 200,    // CSS transition duration
};

// Legacy alias for backwards compatibility
export const ANIMATION_DURATION = {
  loading: TIMING.LOADING_DELAY,
  debounce: TIMING.DEBOUNCE,
  toast: TIMING.TOAST_DURATION,
  txSimulation: TIMING.TX_SIMULATION,
  quoteLatency: TIMING.QUOTE_LATENCY,
};

export const THRESHOLDS = {
  // Price impact levels
  priceImpact: {
    low: 1,      // Below this is green
    medium: 5,   // Between low-medium is yellow, above is red
  },
  
  // Slippage
  slippage: {
    min: 0.01,
    max: 50,
    default: 0.5,
    warning: 5,  // Show warning above this
  },
  
  // APR tiers
  apr: {
    low: 5,
    medium: 15,
    high: 30,
  },
  
  // Staking
  staking: {
    minAmount: 1,
    maxLockWeeks: 208,        // 4 years max lock
    minLockWeeks: 1,
    defaultLockWeeks: 52,     // 1 year default
  },
  
  // Gas buffer for native token
  gasBuffer: 0.005,
  
  // Dust threshold
  dustThreshold: 0.000001,
};

export const LAYOUT = {
  maxWidth: {
    swap: 480,
    page: 1200,
    header: 1400,
  },
  headerHeight: 80,
  mobileBreakpoint: 900,
};

export const POOL_TYPES = {
  CLAMM: { label: 'CLAMM', color: '#3B82F6' },
  LBAMM: { label: 'LBAMM', color: '#8B5CF6' },
};

export const SWAP_MODES = {
  swap: { label: 'SWAP', color: COLORS.primary },
  twap: { label: 'TWAP', color: COLORS.info },
  limit: { label: 'LIMIT', color: COLORS.purple },
};

/**
 * Get price impact color based on percentage
 */
export function getPriceImpactColor(impact) {
  if (impact > THRESHOLDS.priceImpact.medium) return COLORS.error;
  if (impact > THRESHOLDS.priceImpact.low) return COLORS.warning;
  return COLORS.success;
}

/**
 * Get APR tier info
 */
export function getAPRTierInfo(apr) {
  if (apr >= THRESHOLDS.apr.high) return { tier: 'high', color: COLORS.success };
  if (apr >= THRESHOLDS.apr.medium) return { tier: 'medium', color: COLORS.warning };
  return { tier: 'low', color: COLORS.textMuted };
}
