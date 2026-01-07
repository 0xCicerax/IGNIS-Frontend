import { logger } from '../../utils/logger';
/**
 * @fileoverview Production-Ready Route Visualization Component
 * @module SwapRouteDisplay
 * @author Aurelia Protocol Team
 * 
 * @description
 * This component decodes and visualizes swap routes from the Aurelia Quoter API.
 * It handles both single-path and split routes, displaying the complete swap
 * path including pool types, fees, and token flows.
 * 
 * Data Flow:
 * 1. Frontend calls `/quote` endpoint with tokenIn, tokenOut, amount
 * 2. API returns QuoteResponse with encodedRoute (packed bytes)
 * 3. This component decodes and displays the route visually
 * 
 * Supported Actions:
 * - SWAP_CL (0): Concentrated Liquidity pool swap
 * - SWAP_BIN (1): Liquidity Book pool swap
 * - WRAP (2): Wrap native token to vault token
 * - UNWRAP (3): Unwrap vault token to native token
 * 
 * @example
 * ```tsx
 * import { SwapRouteDisplay } from './SwapRouteDisplay';
 * 
 * function SwapPage() {
 *   const { quote } = useSwapQuote({ tokenIn, tokenOut, amountIn });
 *   const { tokens } = useTokenRegistry();
 * 
 *   return (
 *     <SwapRouteDisplay
 *       quote={quote}
 *       tokenRegistry={tokens}
 *       loading={loading}
 *     />
 *   );
 * }
 * ```
 */

import React, { useState, useEffect, useMemo } from 'react';
import { ethers } from 'ethers';
import '../../styles/SwapRouteDisplay.css';

// TYPES - Match Quoter API Response

/**
 * Response from /quote API endpoint
 * @description Contains all data needed to execute a swap
 */
export interface QuoteResponse {
  /** Input token address */
  tokenIn: string;
  /** Output token address */
  tokenOut: string;
  /** Input amount in wei/smallest unit */
  amountIn: string;
  /** Expected output amount before slippage */
  expectedAmountOut: string;
  /** Minimum output after slippage tolerance */
  minAmountOut: string;
  /** Estimated gas for the transaction */
  gasEstimate: number;
  /** Price impact in basis points */
  priceImpactBps: number;
  /** Packed route bytes for GatewayRouter */
  encodedRoute: string;
  /** True if route splits across multiple paths */
  isSplit: boolean;
  /** Number of parallel paths (1 for single route) */
  splitCount: number;
  /** Quote creation timestamp */
  timestamp: number;
  /** Route data freshness timestamp */
  routeTimestamp: number;
  /** Number of blocks this quote is valid for */
  validForBlocks: number;
  /** Target contract address (GatewayRouter) */
  to: string;
  /** Encoded calldata for the swap transaction */
  calldata: string;
}

/**
 * Pool metadata from subgraph
 * @description Information about a liquidity pool
 */
export interface PoolInfo {
  /** Pool ID (bytes32 as hex string) */
  id: string;
  /** Pool type: Concentrated Liquidity or Liquidity Book */
  type: 'CL' | 'BIN';
  /** Token0 address (sorted lower) */
  token0: string;
  /** Token1 address (sorted higher) */
  token1: string;
  /** Fee tier in hundredths of bip (CL pools only) */
  fee?: number;
  /** Tick spacing (CL pools only) */
  tickSpacing?: number;
  /** Bin step in basis points (Bin pools only) */
  binStep?: number;
  /** Hooks contract address */
  hooks: string;
}

/**
 * Token metadata for display
 * @description Information about an ERC20 token
 */
export interface TokenInfo {
  /** Token contract address */
  address: string;
  /** Token symbol (e.g., "WETH") */
  symbol: string;
  /** Token name (e.g., "Wrapped Ether") */
  name: string;
  /** Token decimals (e.g., 18 for ETH, 6 for USDC) */
  decimals: number;
  /** Optional icon character or URL */
  icon?: string;
  /** Optional brand color (hex) */
  color?: string;
}

/**
 * Decoded route step
 * @description A single hop in the swap route
 */
export interface DecodedStep {
  /** Action type */
  action: 'SWAP_CL' | 'SWAP_BIN' | 'WRAP' | 'UNWRAP';
  /** Numeric action code (0-3) */
  actionCode: number;
  /** Input token for this step */
  tokenIn: string;
  /** Output token for this step */
  tokenOut: string;
  /** Pool-specific data */
  poolData: CLPoolData | BinPoolData | VaultData;
}

/**
 * Concentrated Liquidity pool data
 * @description Data specific to CL pool swaps
 */
interface CLPoolData {
  /** Pool type identifier */
  type: 'CL';
  /** Token0 address (sorted) */
  token0: string;
  /** Token1 address (sorted) */
  token1: string;
  /** Fee tier in hundredths of bip */
  fee: number;
  /** Tick spacing */
  tickSpacing: number;
  /** Hooks contract address */
  hooks: string;
  /** Swap direction: true = token0→token1 */
  zeroForOne: boolean;
}

/**
 * Liquidity Book pool data
 * @description Data specific to Bin pool swaps
 */
interface BinPoolData {
  /** Pool type identifier */
  type: 'BIN';
  /** Token0 address (sorted) */
  token0: string;
  /** Token1 address (sorted) */
  token1: string;
  /** Bin step in basis points / 10 */
  binStep: number;
  /** Hooks contract address */
  hooks: string;
  /** Swap direction: true = tokenX→tokenY */
  swapForY: boolean;
}

/**
 * Vault wrap/unwrap data
 * @description Data for ERC4626 vault operations
 */
interface VaultData {
  /** Data type identifier */
  type: 'VAULT';
  /** ERC4626 vault address */
  vault: string;
  /** Whether to use gateway buffer */
  useBuffer: boolean;
}

/**
 * Fully decoded route structure
 * @description Complete decoded route with all paths
 */
export interface DecodedRoute {
  /** True if route splits across multiple paths */
  isSplit: boolean;
  /** Array of route paths (1 for single, multiple for split) */
  routes: {
    /** Steps in this path */
    steps: DecodedStep[];
    /** Amount allocated to this path (split routes only) */
    amount?: string;
  }[];
  /** Total number of steps across all paths */
  totalSteps: number;
}

// ROUTE DECODER - Decodes packed bytes from quoter

/**
 * Action code to action name mapping
 * @internal
 */
const ACTION_NAMES: Record<number, DecodedStep['action']> = {
  0: 'SWAP_CL',
  1: 'SWAP_BIN',
  2: 'WRAP',
  3: 'UNWRAP',
};

/**
 * Decodes the encodedRoute from quoter API
 * 
 * @description
 * Parses the packed bytes returned by the quoter into a structured format.
 * Handles both single routes and split routes.
 * 
 * Format - Single Route:
 * `[numSteps:1][step1][step2]...`
 * Each step: `[action:1][tokenIn:20][tokenOut:20][poolDataLen:2][poolData]`
 * 
 * Format - Split Route:
 * `[0x00][0x01][numRoutes:1][routeLen:2][route1][amt1:32][routeLen:2][route2][amt2:32]...`
 * 
 * @param encodedRoute - Hex string from quoter API (with or without 0x prefix)
 * @returns Decoded route structure
 * 
 * @example
 * ```typescript
 * const decoded = decodeEncodedRoute(quote.encodedRoute);
 * console.log(decoded.isSplit); // false
 * console.log(decoded.routes[0].steps[0].action); // "SWAP_CL"
 * ```
 */
export function decodeEncodedRoute(encodedRoute: string): DecodedRoute {
  const data = encodedRoute.startsWith('0x') ? encodedRoute.slice(2) : encodedRoute;
  
  // Check for split encoding marker [0x00][0x01]
  if (data.length >= 4 && data.slice(0, 4) === '0001') {
    return decodeSplitRoute(data);
  }
  
  return {
    isSplit: false,
    routes: [{ steps: decodeSingleRoute(data) }],
    totalSteps: decodeSingleRoute(data).length,
  };
}

/**
 * Decode a single (non-split) route
 * @internal
 * @param data - Hex string without 0x prefix
 * @returns Array of decoded steps
 */
function decodeSingleRoute(data: string): DecodedStep[] {
  const steps: DecodedStep[] = [];
  let offset = 0;
  
  // Number of steps (1 byte = 2 hex chars)
  const numSteps = parseInt(data.slice(offset, offset + 2), 16);
  offset += 2;
  
  for (let i = 0; i < numSteps; i++) {
    // Action (1 byte)
    const actionCode = parseInt(data.slice(offset, offset + 2), 16);
    offset += 2;
    
    // TokenIn (20 bytes = 40 hex chars)
    const tokenIn = '0x' + data.slice(offset, offset + 40);
    offset += 40;
    
    // TokenOut (20 bytes)
    const tokenOut = '0x' + data.slice(offset, offset + 40);
    offset += 40;
    
    // Pool data length (2 bytes = 4 hex chars)
    const poolDataLen = parseInt(data.slice(offset, offset + 4), 16);
    offset += 4;
    
    // Pool data (variable length)
    const poolDataHex = '0x' + data.slice(offset, offset + poolDataLen * 2);
    offset += poolDataLen * 2;
    
    const poolData = decodePoolData(actionCode, poolDataHex);
    
    steps.push({
      action: ACTION_NAMES[actionCode] || 'SWAP_CL',
      actionCode,
      tokenIn,
      tokenOut,
      poolData,
    });
  }
  
  return steps;
}

/**
 * Decode a split route with multiple paths
 * @internal
 * @param data - Hex string without 0x prefix
 * @returns Decoded route with multiple paths
 */
function decodeSplitRoute(data: string): DecodedRoute {
  let offset = 4; // Skip [0x00][0x01] marker
  
  // Number of routes (1 byte)
  const numRoutes = parseInt(data.slice(offset, offset + 2), 16);
  offset += 2;
  
  const routes: { steps: DecodedStep[]; amount?: string }[] = [];
  let totalSteps = 0;
  
  for (let i = 0; i < numRoutes; i++) {
    // Route length (2 bytes)
    const routeLen = parseInt(data.slice(offset, offset + 4), 16);
    offset += 4;
    
    // Route data
    const routeData = data.slice(offset, offset + routeLen * 2);
    offset += routeLen * 2;
    
    // Amount (32 bytes = 64 hex chars)
    const amountHex = data.slice(offset, offset + 64);
    offset += 64;
    const amount = BigInt('0x' + amountHex).toString();
    
    const steps = decodeSingleRoute(routeData);
    totalSteps += steps.length;
    
    routes.push({ steps, amount });
  }
  
  return { isSplit: true, routes, totalSteps };
}

/**
 * Decode pool-specific data based on action type
 * @internal
 * @param action - Action code (0-3)
 * @param poolDataHex - ABI-encoded pool data with 0x prefix
 * @returns Decoded pool data
 * @throws Error if action code is unknown
 */
function decodePoolData(action: number, poolDataHex: string): CLPoolData | BinPoolData | VaultData {
  const abiCoder = ethers.AbiCoder.defaultAbiCoder();
  
  if (action === 2 || action === 3) {
    // WRAP or UNWRAP: abi.encode(address vault, bool useBuffer)
    const decoded = abiCoder.decode(['address', 'bool'], poolDataHex);
    return {
      type: 'VAULT',
      vault: decoded[0],
      useBuffer: decoded[1],
    };
  }
  
  if (action === 0) {
    // SWAP_CL: abi.encode(address token0, address token1, uint24 fee, int24 tickSpacing, address hooks, bool zeroForOne)
    const decoded = abiCoder.decode(
      ['address', 'address', 'uint24', 'int24', 'address', 'bool'],
      poolDataHex
    );
    return {
      type: 'CL',
      token0: decoded[0],
      token1: decoded[1],
      fee: Number(decoded[2]),
      tickSpacing: Number(decoded[3]),
      hooks: decoded[4],
      zeroForOne: decoded[5],
    };
  }
  
  if (action === 1) {
    // SWAP_BIN: abi.encode(address token0, address token1, uint16 binStep, address hooks, bool swapForY)
    const decoded = abiCoder.decode(
      ['address', 'address', 'uint16', 'address', 'bool'],
      poolDataHex
    );
    return {
      type: 'BIN',
      token0: decoded[0],
      token1: decoded[1],
      binStep: Number(decoded[2]),
      hooks: decoded[3],
      swapForY: decoded[4],
    };
  }
  
  throw new Error(`Unknown action: ${action}`);
}

// UTILITIES

/**
 * Format address for display (truncated)
 * @param addr - Full address
 * @returns Truncated address (e.g., "0x1234...5678")
 */
const formatAddress = (addr: string): string =>
  `${addr.slice(0, 6)}...${addr.slice(-4)}`;

/**
 * Format amount with K/M suffixes
 * @param val - Value as string or number
 * @param decimals - Decimal places to show
 * @returns Formatted string (e.g., "1.5M", "250K")
 */
const formatAmount = (val: string | number, decimals = 2): string => {
  const num = typeof val === 'string' ? parseFloat(val) : val;
  if (!isFinite(num) || isNaN(num)) return '0.00';
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(2)}M`;
  if (num >= 1_000) return `${(num / 1_000).toFixed(decimals)}K`;
  return num.toFixed(decimals);
};

/**
 * Format CL pool fee for display
 * @param fee - Fee in hundredths of a bip (e.g., 3000 = 0.30%)
 * @returns Formatted percentage string
 */
const formatFee = (fee: number): string => {
  return `${(fee / 10000).toFixed(2)}%`;
};

/**
 * Format Bin pool step for display
 * @param binStep - Bin step in basis points / 10 (e.g., 15 = 0.15%)
 * @returns Formatted percentage string
 */
const formatBinStep = (binStep: number): string => {
  return `${(binStep / 100).toFixed(2)}%`;
};

// SUB-COMPONENTS

/**
 * Props for TokenNode component
 */
interface TokenNodeProps {
  /** Token information */
  token: TokenInfo;
  /** Optional amount to display */
  amount?: string;
  /** Use smaller size variant */
  small?: boolean;
}

/**
 * Token icon and amount display
 * @description Renders a circular token icon with optional amount below
 */
const TokenNode: React.FC<TokenNodeProps> = ({ token, amount, small }) => {
  const color = token.color || '#627EEA';
  
  return (
    <div className="srd-token-node">
      <div
        className={`srd-token-icon ${small ? 'srd-token-icon--small' : ''}`}
        style={{
          background: `${color}15`,
          borderColor: color,
          color: color,
        }}
      >
        {token.icon || token.symbol.charAt(0)}
      </div>
      {amount && (
        <div className="srd-token-amount">
          <div className={`srd-token-value ${small ? 'srd-token-value--small' : ''}`}>
            {formatAmount(amount, 4)}
          </div>
          <div className="srd-token-symbol">{token.symbol}</div>
        </div>
      )}
    </div>
  );
};

/**
 * Props for StepBadge component
 */
interface StepBadgeProps {
  /** Decoded step data */
  step: DecodedStep;
  /** Token registry for looking up symbols */
  tokenRegistry: Record<string, TokenInfo>;
}

/**
 * Step badge showing pool type and pair
 * @description Renders a colored badge indicating the pool type and trading pair
 */
const StepBadge: React.FC<StepBadgeProps> = ({ step, tokenRegistry }) => {
  /**
   * Generate label text for the step
   * @returns Formatted label (e.g., "WETH/USDC 0.30%")
   */
  const getStepLabel = (): string => {
    if (step.action === 'WRAP') return 'Wrap';
    if (step.action === 'UNWRAP') return 'Unwrap';
    
    const poolData = step.poolData;
    if (poolData.type === 'CL') {
      const token0 = tokenRegistry[poolData.token0.toLowerCase()];
      const token1 = tokenRegistry[poolData.token1.toLowerCase()];
      return `${token0?.symbol || '?'}/${token1?.symbol || '?'} ${formatFee(poolData.fee)}`;
    }
    if (poolData.type === 'BIN') {
      const token0 = tokenRegistry[poolData.token0.toLowerCase()];
      const token1 = tokenRegistry[poolData.token1.toLowerCase()];
      return `${token0?.symbol || '?'}/${token1?.symbol || '?'} ${formatBinStep(poolData.binStep)}`;
    }
    return 'Unknown';
  };
  
  const typeColor = step.action === 'SWAP_CL' 
    ? '#22C55E' 
    : step.action === 'SWAP_BIN' 
      ? '#A855F7' 
      : '#F5B041';
  
  const typeLabel = step.action === 'SWAP_CL' 
    ? 'CL' 
    : step.action === 'SWAP_BIN' 
      ? 'LB' 
      : step.action;
  
  return (
    <div className="srd-step-badge">
      <div className="srd-step-dot" style={{ background: typeColor }} />
      <span 
        className="srd-step-type" 
        style={{ background: `${typeColor}20`, color: typeColor }}
      >
        {typeLabel}
      </span>
      <span className="srd-step-label">{getStepLabel()}</span>
    </div>
  );
};

/**
 * Props for FlowLine component
 */
interface FlowLineProps {
  /** Show animated dot */
  animated?: boolean;
  /** Vertical orientation */
  vertical?: boolean;
}

/**
 * Animated flow line between nodes
 * @description Renders a connecting line with optional animated dot
 */
const FlowLine: React.FC<FlowLineProps> = ({ animated, vertical }) => (
  <div className={`srd-flow-line ${vertical ? 'srd-flow-line--vertical' : ''}`}>
    {animated && !vertical && <div className="srd-flow-dot" />}
  </div>
);

// MAIN COMPONENT

/**
 * Props for SwapRouteDisplay component
 */
export interface SwapRouteDisplayProps {
  /** Quote response from API (null if no quote) */
  quote: QuoteResponse | null;
  /** Token registry keyed by lowercase address */
  tokenRegistry: Record<string, TokenInfo>;
  /** Additional CSS class names */
  className?: string;
  /** Show loading state */
  loading?: boolean;
}

/**
 * Swap Route Display Component
 * 
 * @description
 * Visualizes the complete swap route from a quote response. Shows:
 * - Input and output tokens with amounts
 * - Each swap step with pool type and fee
 * - Split routes with percentage allocation
 * - Animated flow lines for visual clarity
 * 
 * @example
 * ```tsx
 * <SwapRouteDisplay
 *   quote={quoteResponse}
 *   tokenRegistry={tokenLookup}
 *   loading={isLoading}
 *   className="my-route-display"
 * />
 * ```
 */
export const SwapRouteDisplay: React.FC<SwapRouteDisplayProps> = ({
  quote,
  tokenRegistry,
  className,
  loading,
}) => {
  const [decodedRoute, setDecodedRoute] = useState<DecodedRoute | null>(null);

  // Decode route when quote changes
  useEffect(() => {
    if (quote?.encodedRoute) {
      try {
        const decoded = decodeEncodedRoute(quote.encodedRoute);
        setDecodedRoute(decoded);
      } catch (err: unknown) {
        logger.error('Route decode failed', err);
        setDecodedRoute(null);
      }
    } else {
      setDecodedRoute(null);
    }
  }, [quote?.encodedRoute]);

  // Get token info from registry
  const tokenIn = useMemo(() => 
    quote ? tokenRegistry[quote.tokenIn.toLowerCase()] : null,
    [quote, tokenRegistry]
  );
  
  const tokenOut = useMemo(() => 
    quote ? tokenRegistry[quote.tokenOut.toLowerCase()] : null,
    [quote, tokenRegistry]
  );

  // Loading state
  if (loading) {
    return (
      <div className={`srd-container srd-container--loading ${className || ''}`}>
        <div className="srd-loading">
          <div className="srd-loading-spinner" />
          <span>Finding best route...</span>
        </div>
      </div>
    );
  }

  // No quote state
  if (!quote || !decodedRoute) {
    return (
      <div className={`srd-container srd-container--empty ${className || ''}`}>
        <div className="srd-empty">
          Enter an amount to see the swap route
        </div>
      </div>
    );
  }

  /**
   * Create fallback token info for unknown tokens
   * @param address - Token address
   * @returns TokenInfo with truncated address as symbol
   */
  const fallbackToken = (address: string): TokenInfo => ({
    address,
    symbol: formatAddress(address),
    name: 'Unknown Token',
    decimals: 18,
    color: '#888',
  });

  const inToken = tokenIn || fallbackToken(quote.tokenIn);
  const outToken = tokenOut || fallbackToken(quote.tokenOut);

  return (
    <div className={`srd-container ${className || ''}`}>
      {/* Header */}
      <div className="srd-header">
        <h3 className="srd-title">Route</h3>
        <div className="srd-meta">
          <span className="srd-steps">{decodedRoute.totalSteps} hop{decodedRoute.totalSteps !== 1 ? 's' : ''}</span>
          {decodedRoute.isSplit && (
            <span className="srd-split-badge">
              Split ({decodedRoute.routes.length} paths)
            </span>
          )}
        </div>
      </div>

      {/* Single Route */}
      {!decodedRoute.isSplit && (
        <div className="srd-single-route">
          <TokenNode token={inToken} amount={quote.amountIn} />
          <FlowLine animated />
          
          {decodedRoute.routes[0].steps.map((step, idx) => (
            <React.Fragment key={idx}>
              <StepBadge step={step} tokenRegistry={tokenRegistry} />
              <FlowLine animated />
            </React.Fragment>
          ))}
          
          <TokenNode token={outToken} amount={quote.expectedAmountOut} />
        </div>
      )}

      {/* Split Route */}
      {decodedRoute.isSplit && (
        <div className="srd-split-route">
          <div className="srd-split-start">
            <TokenNode token={inToken} amount={quote.amountIn} />
          </div>
          
          <div className="srd-split-paths">
            {decodedRoute.routes.map((route, routeIdx) => {
              const percentage = quote.amountIn && route.amount
                ? ((BigInt(route.amount) * 100n) / BigInt(quote.amountIn)).toString()
                : '?';
              
              return (
                <div key={routeIdx} className="srd-split-path">
                  <div className="srd-split-percent">{percentage}%</div>
                  <FlowLine />
                  {route.steps.map((step, stepIdx) => (
                    <React.Fragment key={stepIdx}>
                      <StepBadge step={step} tokenRegistry={tokenRegistry} />
                      <FlowLine />
                    </React.Fragment>
                  ))}
                </div>
              );
            })}
          </div>
          
          <div className="srd-split-end">
            <TokenNode token={outToken} amount={quote.expectedAmountOut} />
          </div>
        </div>
      )}

      {/* Quote Details */}
      <div className="srd-details">
        <div className="srd-detail">
          <span className="srd-detail-label">Price Impact</span>
          <span className={`srd-detail-value ${quote.priceImpactBps > 100 ? 'srd-detail-value--warning' : ''}`}>
            {(quote.priceImpactBps / 100).toFixed(2)}%
          </span>
        </div>
        <div className="srd-detail">
          <span className="srd-detail-label">Min. Received</span>
          <span className="srd-detail-value">
            {formatAmount(quote.minAmountOut, 4)} {outToken.symbol}
          </span>
        </div>
        <div className="srd-detail">
          <span className="srd-detail-label">Gas Estimate</span>
          <span className="srd-detail-value">
            {quote.gasEstimate.toLocaleString()} gas
          </span>
        </div>
      </div>
    </div>
  );
};

export default SwapRouteDisplay;
