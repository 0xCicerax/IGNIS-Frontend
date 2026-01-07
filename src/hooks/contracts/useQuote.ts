/** Quote fetching via SmartQuoter */
import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Address, formatUnits } from 'viem';
import { getPublicClient } from '../../lib/wagmi';
import { getContractAddress, isContractConfigured } from '../../lib/contracts/addresses';
import { ABIS } from '../../lib/contracts/config';
import { QuoteResult, RouteStep, RouteAction } from '../../lib/contracts/types';
import { handleError, IgnisError, logError } from '../../lib/contracts/errors';
import { QUERY_KEYS, CACHE_TIMES } from '../../lib/queryClient';
import { swapLogger } from '../../utils/logger';

// ─────────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────────

export interface QuoteParams {
  tokenIn: Address;
  tokenOut: Address;
  amountIn: bigint;
  chainId: number;
}

export interface ParsedQuote {
  // Core quote data
  amountOut: bigint;
  amountOutFormatted: string;
  gasEstimate: bigint;
  priceImpactBps: number;
  priceImpactPercent: number;
  
  // Route data
  route: RouteStep[];
  encodedRoute: `0x${string}`;
  routeDescription: string;
  hopCount: number;
  
  // Split routing
  isSplit: boolean;
  splitCount: number;
  
  // Buffer info
  bufferFee: bigint;
  bufferFeeBps: number;
  isDirectBuffer: boolean;
  
  // Freshness
  quotedAt: bigint;
  quotedBlock: bigint;
  isStale: boolean;
  
  // Computed
  effectivePrice: number;
  minimumReceived: (slippageBps: number) => bigint;
}

export interface UseQuoteOptions {
  params: QuoteParams | null;
  enabled?: boolean;
  debounceMs?: number;
  staleTimeMs?: number;
  tokenOutDecimals?: number;
}

export interface UseQuoteResult {
  quote: ParsedQuote | null;
  isLoading: boolean;
  isFetching: boolean;
  isError: boolean;
  error: IgnisError | null;
  refetch: () => Promise<void>;
  dataUpdatedAt: number;
}

// ─────────────────────────────────────────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────────────────────────────────────────

const QUOTE_STALE_BLOCKS = 3;
const DEFAULT_DEBOUNCE_MS = 300;

// ─────────────────────────────────────────────────────────────────────────────────
// RAW QUOTE TYPE (matches contract return)
// ─────────────────────────────────────────────────────────────────────────────────

interface RawQuoteResult {
  amountOut: bigint;
  gasEstimate: bigint;
  priceImpactBps: bigint;
  quotedAt: bigint;
  quotedBlock: bigint;
  route: readonly {
    action: number;
    tokenIn: Address;
    tokenOut: Address;
    amountIn: bigint;
    amountOut: bigint;
    poolData: `0x${string}`;
  }[];
  encodedRoute: `0x${string}`;
  isSplit: boolean;
  splitCount: number;
  bufferFee: bigint;
  isDirectBuffer: boolean;
}

// ─────────────────────────────────────────────────────────────────────────────────
// QUOTE FETCHER
// ─────────────────────────────────────────────────────────────────────────────────

async function fetchQuote(params: QuoteParams): Promise<RawQuoteResult> {
  const { tokenIn, tokenOut, amountIn, chainId } = params;

  if (amountIn === BigInt(0)) {
    throw new IgnisError({
      code: 'ZeroAmount',
      message: 'Amount cannot be zero',
      userMessage: 'Enter an amount',
    });
  }

  const publicClient = getPublicClient(chainId);
  const quoterAddress = getContractAddress(chainId, 'smartQuoter');

  try {
    // Call the quoter's quote function
    const result = await publicClient.readContract({
      address: quoterAddress,
      abi: ABIS.AureliaSmartQuoterV5,
      functionName: 'quote',
      args: [tokenIn, tokenOut, amountIn],
    }) as RawQuoteResult;

    return result;
  } catch (error: unknown) {
    logError('fetchQuote', error, { tokenIn, tokenOut, amountIn: amountIn.toString() });
    throw handleError(error);
  }
}

// ─────────────────────────────────────────────────────────────────────────────────
// QUOTE PARSING
// ─────────────────────────────────────────────────────────────────────────────────

function parseQuoteResult(
  raw: RawQuoteResult,
  params: QuoteParams,
  currentBlock: bigint,
  tokenOutDecimals: number
): ParsedQuote {
  // Parse route steps
  const route: RouteStep[] = raw.route.map(step => ({
    action: step.action,
    tokenIn: step.tokenIn,
    tokenOut: step.tokenOut,
    amountIn: step.amountIn,
    amountOut: step.amountOut,
    poolData: step.poolData,
  }));

  const routeDescription = buildRouteDescription(route);
  const priceImpactBps = Number(raw.priceImpactBps);
  const priceImpactPercent = priceImpactBps / 100;
  const bufferFeeBps = Number(raw.bufferFee);

  // Check if quote is stale
  const blocksSinceQuote = currentBlock - raw.quotedBlock;
  const isStale = blocksSinceQuote > BigInt(QUOTE_STALE_BLOCKS);

  // Calculate effective price (simplified)
  const amountOutFloat = Number(formatUnits(raw.amountOut, tokenOutDecimals));
  const effectivePrice = amountOutFloat;

  return {
    amountOut: raw.amountOut,
    amountOutFormatted: formatUnits(raw.amountOut, tokenOutDecimals),
    gasEstimate: raw.gasEstimate,
    priceImpactBps,
    priceImpactPercent,
    route,
    encodedRoute: raw.encodedRoute,
    routeDescription,
    hopCount: route.length,
    isSplit: raw.isSplit,
    splitCount: raw.splitCount,
    bufferFee: raw.bufferFee,
    bufferFeeBps,
    isDirectBuffer: raw.isDirectBuffer,
    quotedAt: raw.quotedAt,
    quotedBlock: raw.quotedBlock,
    isStale,
    effectivePrice,
    minimumReceived: (slippageBps: number) => {
      const slippageMultiplier = BigInt(10000 - slippageBps);
      return (raw.amountOut * slippageMultiplier) / BigInt(10000);
    },
  };
}

function buildRouteDescription(route: RouteStep[]): string {
  if (route.length === 0) return 'No route';
  
  const actionNames: Record<number, string> = {
    [RouteAction.SWAP_CL]: 'CL Swap',
    [RouteAction.SWAP_BIN]: 'Bin Swap',
    [RouteAction.WRAP]: 'Wrap',
    [RouteAction.UNWRAP]: 'Unwrap',
  };

  const steps = route.map(step => actionNames[step.action] || `Action(${step.action})`);

  if (steps.length === 1) {
    return steps[0];
  }

  return `${steps.length} hops: ${steps.join(' → ')}`;
}

// ─────────────────────────────────────────────────────────────────────────────────
// DEBOUNCE HOOK
// ─────────────────────────────────────────────────────────────────────────────────

function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}

// ─────────────────────────────────────────────────────────────────────────────────
// MAIN HOOK
// ─────────────────────────────────────────────────────────────────────────────────

export function useQuote(options: UseQuoteOptions): UseQuoteResult {
  const {
    params,
    enabled = true,
    debounceMs = DEFAULT_DEBOUNCE_MS,
    staleTimeMs = CACHE_TIMES.QUOTE,
    tokenOutDecimals = 18,
  } = options;

  const queryClient = useQueryClient();
  const currentBlockRef = useRef<bigint>(BigInt(0));

  // Debounce the amount input
  const debouncedParams = useDebounce(params, debounceMs);

  // Build query key
  const queryKey = useMemo(() => {
    if (!debouncedParams) return null;
    return QUERY_KEYS.quote(
      debouncedParams.chainId,
      debouncedParams.tokenIn,
      debouncedParams.tokenOut,
      debouncedParams.amountIn.toString()
    );
  }, [debouncedParams]);

  // Check if quoter is configured
  const isConfigured = useMemo(() => {
    if (!debouncedParams) return false;
    return isContractConfigured(debouncedParams.chainId, 'smartQuoter');
  }, [debouncedParams]);

  // Fetch current block for freshness check
  useEffect(() => {
    if (!debouncedParams) return;

    const fetchBlock = async () => {
      try {
        const publicClient = getPublicClient(debouncedParams.chainId);
        const block = await publicClient.getBlockNumber();
        currentBlockRef.current = block;
      } catch (error: unknown) {
        swapLogger.warn('Failed to fetch block number', { error });
      }
    };

    fetchBlock();
    const interval = setInterval(fetchBlock, 12000);

    return () => clearInterval(interval);
  }, [debouncedParams?.chainId]);

  // Main query
  const query = useQuery({
    queryKey: queryKey ?? ['quote', 'disabled'],
    queryFn: async () => {
      if (!debouncedParams) {
        throw new Error('No params');
      }

      if (!isConfigured) {
        throw new IgnisError({
          code: 'NOT_CONFIGURED',
          message: 'Quoter contract not configured',
          userMessage: 'Quoter not deployed on this network',
        });
      }

      const raw = await fetchQuote(debouncedParams);
      return parseQuoteResult(
        raw,
        debouncedParams,
        currentBlockRef.current,
        tokenOutDecimals
      );
    },
    enabled: enabled && !!debouncedParams && debouncedParams.amountIn > BigInt(0),
    staleTime: staleTimeMs,
    gcTime: staleTimeMs * 2,
    retry: (failureCount, error) => {
      if (error instanceof IgnisError) {
        if (['NoRouteFound', 'InvalidToken', 'ZeroAmount'].includes(error.code)) {
          return false;
        }
      }
      return failureCount < 2;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * Math.pow(2, attemptIndex), 5000),
  });

  const refetch = useCallback(async () => {
    if (queryKey) {
      await queryClient.invalidateQueries({ queryKey });
    }
  }, [queryClient, queryKey]);

  const error = useMemo(() => {
    if (!query.error) return null;
    return query.error instanceof IgnisError
      ? query.error
      : handleError(query.error);
  }, [query.error]);

  return {
    quote: query.data ?? null,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    isError: query.isError,
    error,
    refetch,
    dataUpdatedAt: query.dataUpdatedAt,
  };
}

// ─────────────────────────────────────────────────────────────────────────────────
// HELPER FUNCTIONS
// ─────────────────────────────────────────────────────────────────────────────────

export function calculateMinAmountOut(amountOut: bigint, slippageBps: number): bigint {
  const slippageMultiplier = BigInt(10000 - slippageBps);
  return (amountOut * slippageMultiplier) / BigInt(10000);
}

export function calculateDeadline(secondsFromNow: number = 1200): bigint {
  return BigInt(Math.floor(Date.now() / 1000) + secondsFromNow);
}

export function formatPriceImpact(bps: number): {
  value: string;
  severity: 'low' | 'medium' | 'high' | 'very-high';
} {
  const percent = bps / 100;
  const value = percent < 0.01 ? '<0.01%' : `${percent.toFixed(2)}%`;
  
  let severity: 'low' | 'medium' | 'high' | 'very-high';
  if (bps < 100) severity = 'low';
  else if (bps < 300) severity = 'medium';
  else if (bps < 500) severity = 'high';
  else severity = 'very-high';

  return { value, severity };
}

export function routeUsesBuffer(route: RouteStep[]): boolean {
  return route.some(
    step => step.action === RouteAction.WRAP || step.action === RouteAction.UNWRAP
  );
}
