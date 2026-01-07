import { logger } from '../utils/logger';
/**
 * @fileoverview Production hooks for fetching swap quotes from Aurelia Quoter API
 * @module useSwapQuote
 * @author Aurelia Protocol Team
 * 
 * @description
 * This module provides React hooks for interacting with the Aurelia Quoter API:
 * - `useSwapQuote`: Fetch swap quotes with debouncing
 * - `useTokenRegistry`: Fetch and cache token metadata
 * - `useQuotePolling`: Auto-refresh quotes at intervals
 * 
 * The hooks handle loading states, errors, and automatic retries.
 * 
 * @example
 * ```tsx
 * import { useSwapQuote, useTokenRegistry } from './useSwapQuote';
 * 
 * function SwapInterface() {
 *   const { tokens } = useTokenRegistry();
 *   const { quote, loading, error } = useSwapQuote({
 *     tokenIn: '0xUSDC...',
 *     tokenOut: '0xWETH...',
 *     amountIn: '1000000000',
 *   });
 * 
 *   if (loading) return <Spinner />;
 *   if (error) return <Error message={error} />;
 *   if (quote) return <QuoteDisplay quote={quote} tokens={tokens} />;
 * }
 * ```
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import type { QuoteResponse, TokenInfo } from '../components/swap/SwapRouteDisplay';

// CONFIGURATION

/**
 * Quoter API base URL
 * @description Configure via REACT_APP_QUOTER_API_URL environment variable
 * @default "https://api.aurelia.finance"
 */
export const QUOTER_API_URL = process.env.REACT_APP_QUOTER_API_URL || 'https://api.aurelia.finance';

/**
 * Default slippage tolerance in basis points
 * @description 50 = 0.50% slippage
 * @default 50
 */
export const DEFAULT_SLIPPAGE_BPS = 50;

/**
 * Debounce delay for quote fetching in milliseconds
 * @description Prevents excessive API calls while typing
 * @default 300
 */
export const QUOTE_DEBOUNCE_MS = 300;

/**
 * Quote polling interval in milliseconds
 * @description How often to refresh quotes automatically
 * @default 10000 (10 seconds)
 */
export const QUOTE_POLL_INTERVAL_MS = 10000;

/**
 * Maximum retry attempts for failed requests
 * @default 3
 */
export const MAX_RETRIES = 3;

// TYPES

/**
 * Options for useSwapQuote hook
 */
interface UseSwapQuoteOptions {
  /** Input token address */
  tokenIn: string | null;
  /** Output token address */
  tokenOut: string | null;
  /** Input amount in smallest units (wei for ETH, etc.) */
  amountIn: string;
  /** Slippage tolerance in basis points (default: 50 = 0.5%) */
  slippageBps?: number;
  /** Recipient address for swap output (optional) */
  recipient?: string;
  /** Enable/disable fetching (default: true) */
  enabled?: boolean;
}

/**
 * Return type for useSwapQuote hook
 */
interface UseSwapQuoteResult {
  /** Quote response from API (null if loading or error) */
  quote: QuoteResponse | null;
  /** True while fetching quote */
  loading: boolean;
  /** Error message if request failed */
  error: string | null;
  /** Manually trigger a quote refresh */
  refetch: () => Promise<void>;
}

/**
 * Return type for useTokenRegistry hook
 */
interface UseTokenRegistryResult {
  /** Token registry keyed by lowercase address */
  tokens: Record<string, TokenInfo>;
  /** True while loading tokens */
  loading: boolean;
  /** Error message if fetch failed */
  error: string | null;
  /** Manually refresh token list */
  refetch: () => Promise<void>;
}

/**
 * Options for useQuotePolling hook
 */
interface UseQuotePollingOptions extends UseSwapQuoteOptions {
  /** Polling interval in ms (default: 10000) */
  pollInterval?: number;
}

// SWAP QUOTE HOOK

/**
 * Hook for fetching swap quotes from the Aurelia Quoter API
 * 
 * @description
 * Fetches quotes with automatic debouncing to prevent excessive API calls.
 * Includes error handling and retry logic.
 * 
 * @param options - Hook configuration options
 * @returns Quote data, loading state, error, and refetch function
 * 
 * @example
 * ```tsx
 * const { quote, loading, error, refetch } = useSwapQuote({
 *   tokenIn: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831', // USDC
 *   tokenOut: '0x82aF49447D8a07e3bd95BD0d56f35241523fBab1', // WETH
 *   amountIn: '1000000000', // 1000 USDC (6 decimals)
 *   slippageBps: 50, // 0.5%
 * });
 * 
 * if (loading) return <Spinner />;
 * if (error) return <div>Error: {error}</div>;
 * if (quote) {
 *   console.log('Expected out:', quote.expectedAmountOut);
 *   console.log('Min out:', quote.minAmountOut);
 * }
 * ```
 */
export function useSwapQuote({
  tokenIn,
  tokenOut,
  amountIn,
  slippageBps = DEFAULT_SLIPPAGE_BPS,
  recipient,
  enabled = true,
}: UseSwapQuoteOptions): UseSwapQuoteResult {
  const [quote, setQuote] = useState<QuoteResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const retryCountRef = useRef(0);

  /**
   * Fetch quote from API
   */
  const fetchQuote = useCallback(async () => {
    // Validate inputs
    if (!tokenIn || !tokenOut || !amountIn || amountIn === '0' || !enabled) {
      setQuote(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Build query parameters
      const params = new URLSearchParams({
        tokenIn,
        tokenOut,
        amount: amountIn,
        slippageBps: slippageBps.toString(),
      });

      if (recipient) {
        params.set('recipient', recipient);
      }

      // Fetch quote
      const response = await fetch(`${QUOTER_API_URL}/quote?${params}`);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      const data: QuoteResponse = await response.json();
      setQuote(data);
      retryCountRef.current = 0; // Reset on success
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to fetch quote';
      setError(message);
      setQuote(null);
      
      // Retry with backoff
      if (retryCountRef.current < MAX_RETRIES) {
        retryCountRef.current++;
        const backoffMs = Math.pow(2, retryCountRef.current) * 500;
        logger.warn('Quote fetch retry', { backoffMs, attempt: retryCountRef.current, maxRetries: MAX_RETRIES });
        setTimeout(fetchQuote, backoffMs);
      }
    } finally {
      setLoading(false);
    }
  }, [tokenIn, tokenOut, amountIn, slippageBps, recipient, enabled]);

  // Debounced fetch on input changes
  useEffect(() => {
    const timer = setTimeout(fetchQuote, QUOTE_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [fetchQuote]);

  return { quote, loading, error, refetch: fetchQuote };
}

// TOKEN REGISTRY HOOK

/**
 * Hook for fetching and caching token metadata
 * 
 * @description
 * Fetches the list of supported tokens from the API and caches them
 * in a lookup table keyed by lowercase address.
 * 
 * @returns Token registry, loading state, error, and refetch function
 * 
 * @example
 * ```tsx
 * const { tokens, loading, error } = useTokenRegistry();
 * 
 * // Look up token by address
 * const usdc = tokens['0xaf88d065e77c8cc2239327c5edb3a432268e5831'];
 * console.log(usdc?.symbol); // "USDC"
 * console.log(usdc?.decimals); // 6
 * ```
 */
export function useTokenRegistry(): UseTokenRegistryResult {
  const [tokens, setTokens] = useState<Record<string, TokenInfo>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * Fetch token list from API
   */
  const fetchTokens = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`${QUOTER_API_URL}/tokens`);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      
      // Build registry keyed by lowercase address
      const registry: Record<string, TokenInfo> = {};
      for (const token of data.tokens || []) {
        registry[token.address.toLowerCase()] = {
          address: token.address,
          symbol: token.symbol,
          name: token.name,
          decimals: token.decimals,
          icon: token.icon,
          color: token.color,
        };
      }
      
      setTokens(registry);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to fetch tokens';
      setError(message);
      
      // Use fallback token list
      setTokens(getDefaultTokens());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTokens();
  }, [fetchTokens]);

  return { tokens, loading, error, refetch: fetchTokens };
}

// QUOTE POLLING HOOK

/**
 * Hook for fetching quotes with automatic polling
 * 
 * @description
 * Extends useSwapQuote with automatic refresh at specified intervals.
 * Useful for keeping quotes fresh during swap preparation.
 * 
 * @param options - Hook configuration including poll interval
 * @returns Quote data with automatic refresh
 * 
 * @example
 * ```tsx
 * const { quote, loading } = useQuotePolling({
 *   tokenIn: USDC,
 *   tokenOut: WETH,
 *   amountIn: '1000000000',
 *   pollInterval: 5000, // Refresh every 5 seconds
 * });
 * ```
 */
export function useQuotePolling({
  pollInterval = QUOTE_POLL_INTERVAL_MS,
  ...quoteOptions
}: UseQuotePollingOptions): UseSwapQuoteResult {
  const result = useSwapQuote(quoteOptions);
  
  // Set up polling
  useEffect(() => {
    if (!quoteOptions.enabled || pollInterval <= 0) return;
    
    const interval = setInterval(() => {
      result.refetch();
    }, pollInterval);
    
    return () => clearInterval(interval);
  }, [result.refetch, pollInterval, quoteOptions.enabled]);
  
  return result;
}

// UTILITIES

/**
 * Get default token list for fallback
 * @internal
 * @returns Default token registry for Arbitrum
 */
function getDefaultTokens(): Record<string, TokenInfo> {
  const defaults: TokenInfo[] = [
    {
      address: '0x82aF49447D8a07e3bd95BD0d56f35241523fBab1',
      symbol: 'WETH',
      name: 'Wrapped Ether',
      decimals: 18,
      icon: 'Ξ',
      color: '#627EEA',
    },
    {
      address: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831',
      symbol: 'USDC',
      name: 'USD Coin',
      decimals: 6,
      icon: '$',
      color: '#2775CA',
    },
    {
      address: '0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9',
      symbol: 'USDT',
      name: 'Tether USD',
      decimals: 6,
      icon: '$',
      color: '#26A17B',
    },
    {
      address: '0x2f2a2543B76A4166549F7aaB2e75Bef0aefC5B0f',
      symbol: 'WBTC',
      name: 'Wrapped Bitcoin',
      decimals: 8,
      icon: '₿',
      color: '#F7931A',
    },
    {
      address: '0x912CE59144191C1204E64559FE8253a0e49E6548',
      symbol: 'ARB',
      name: 'Arbitrum',
      decimals: 18,
      icon: 'A',
      color: '#28A0F0',
    },
    {
      address: '0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1',
      symbol: 'DAI',
      name: 'Dai Stablecoin',
      decimals: 18,
      icon: '◈',
      color: '#F5AC37',
    },
  ];
  
  const registry: Record<string, TokenInfo> = {};
  for (const token of defaults) {
    registry[token.address.toLowerCase()] = token;
  }
  return registry;
}

/**
 * Format token amount for display
 * 
 * @description
 * Converts raw amount to human-readable format using token decimals.
 * 
 * @param amount - Raw amount in smallest units
 * @param decimals - Token decimals
 * @param displayDecimals - Decimal places to show (default: 4)
 * @returns Formatted amount string
 * 
 * @example
 * ```typescript
 * formatTokenAmount('1000000000', 6, 2); // "1000.00"
 * formatTokenAmount('1500000000000000000', 18, 4); // "1.5000"
 * ```
 */
export function formatTokenAmount(
  amount: string,
  decimals: number,
  displayDecimals = 4
): string {
  if (!amount || amount === '0') return '0';
  
  try {
    const num = Number(amount) / Math.pow(10, decimals);
    if (!isFinite(num) || isNaN(num)) return '0';
    
    if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(2)}M`;
    if (num >= 1_000) return `${(num / 1_000).toFixed(2)}K`;
    return num.toFixed(displayDecimals);
  } catch {
    return '0';
  }
}

/**
 * Parse human-readable amount to raw units
 * 
 * @description
 * Converts human-readable amount to raw units using token decimals.
 * 
 * @param amount - Human-readable amount (e.g., "1.5")
 * @param decimals - Token decimals
 * @returns Raw amount in smallest units
 * 
 * @example
 * ```typescript
 * parseTokenAmount('1000', 6); // "1000000000"
 * parseTokenAmount('1.5', 18); // "1500000000000000000"
 * ```
 */
export function parseTokenAmount(
  amount: string,
  decimals: number
): string {
  if (!amount || amount === '0') return '0';
  
  try {
    const num = parseFloat(amount);
    if (!isFinite(num) || isNaN(num)) return '0';
    
    const raw = BigInt(Math.floor(num * Math.pow(10, decimals)));
    return raw.toString();
  } catch {
    return '0';
  }
}

/**
 * Calculate price impact color for UI
 * 
 * @description
 * Returns appropriate color based on price impact severity.
 * 
 * @param impactBps - Price impact in basis points
 * @returns CSS color string
 * 
 * @example
 * ```typescript
 * getPriceImpactColor(10);  // '#22C55E' (green - low impact)
 * getPriceImpactColor(100); // '#F59E0B' (yellow - medium impact)
 * getPriceImpactColor(500); // '#EF4444' (red - high impact)
 * ```
 */
export function getPriceImpactColor(impactBps: number): string {
  if (impactBps < 50) return '#22C55E';  // Green - < 0.5%
  if (impactBps < 100) return '#F59E0B'; // Yellow - < 1%
  if (impactBps < 300) return '#F97316'; // Orange - < 3%
  return '#EF4444'; // Red - >= 3%
}

/**
 * Format price impact for display
 * 
 * @param impactBps - Price impact in basis points
 * @returns Formatted percentage string
 * 
 * @example
 * ```typescript
 * formatPriceImpact(50);  // "0.50%"
 * formatPriceImpact(125); // "1.25%"
 * ```
 */
export function formatPriceImpact(impactBps: number): string {
  return `${(impactBps / 100).toFixed(2)}%`;
}
