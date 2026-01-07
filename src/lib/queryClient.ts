/** React Query client */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { isUserRejection, isRetryable } from './contracts/errors';

// ─────────────────────────────────────────────────────────────────────────────────
// CACHE TIMES (in milliseconds)
// ─────────────────────────────────────────────────────────────────────────────────

export const CACHE_TIMES = {
  // Protocol-level data (changes slowly)
  PROTOCOL_STATS: 60 * 1000, // 1 minute stale, rarely changes
  TOKEN_LIST: 5 * 60 * 1000, // 5 minutes, token list is stable
  POOL_LIST: 60 * 1000, // 1 minute, pools don't change often
  VAULT_LIST: 60 * 1000, // 1 minute

  // User-specific data (needs fresher data)
  USER_BALANCE: 15 * 1000, // 15 seconds
  USER_POSITION: 30 * 1000, // 30 seconds
  USER_ALLOWANCE: 30 * 1000, // 30 seconds

  // Real-time data (very fresh)
  QUOTE: 10 * 1000, // 10 seconds, prices move fast
  BUFFER_STATE: 15 * 1000, // 15 seconds
  GAS_PRICE: 12 * 1000, // 12 seconds (new block)

  // Historical data (can be cached longer)
  SWAP_HISTORY: 2 * 60 * 1000, // 2 minutes
  POOL_STATS: 5 * 60 * 1000, // 5 minutes
} as const;

// ─────────────────────────────────────────────────────────────────────────────────
// RETRY CONFIGURATION
// ─────────────────────────────────────────────────────────────────────────────────

export const RETRY_CONFIG = {
  // Number of retries for different query types
  DEFAULT: 3,
  QUOTE: 2, // Quotes are time-sensitive
  BALANCE: 3,
  MUTATION: 0, // Don't auto-retry mutations

  // Delay between retries (exponential backoff)
  BASE_DELAY: 1000,
  MAX_DELAY: 30000,
} as const;

/**
 * Calculate retry delay with exponential backoff
 */
export function getRetryDelay(attemptIndex: number): number {
  const delay = Math.min(
    RETRY_CONFIG.BASE_DELAY * Math.pow(2, attemptIndex),
    RETRY_CONFIG.MAX_DELAY
  );
  // Add jitter to prevent thundering herd
  return delay + Math.random() * 1000;
}

/**
 * Determine if a query should be retried
 */
export function shouldRetry(failureCount: number, error: unknown): boolean {
  // Never retry user rejections
  if (isUserRejection(error)) {
    return false;
  }

  // Check if error is marked as retryable
  if (isRetryable(error)) {
    return failureCount < RETRY_CONFIG.DEFAULT;
  }

  // Default retry logic
  return failureCount < RETRY_CONFIG.DEFAULT;
}

// ─────────────────────────────────────────────────────────────────────────────────
// QUERY CLIENT FACTORY
// ─────────────────────────────────────────────────────────────────────────────────

/**
 * Create a configured QueryClient instance
 */
export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // Default stale time
        staleTime: 30 * 1000, // 30 seconds

        // Cache time (how long to keep in cache after becoming inactive)
        gcTime: 5 * 60 * 1000, // 5 minutes

        // Retry configuration
        retry: (failureCount, error) => shouldRetry(failureCount, error),
        retryDelay: getRetryDelay,

        // Refetch configuration
        refetchOnWindowFocus: true,
        refetchOnReconnect: true,
        refetchOnMount: true,

        // Network mode
        networkMode: 'online',

        // Structural sharing for performance
        structuralSharing: true,
      },
      mutations: {
        // Don't retry mutations by default
        retry: 0,

        // Network mode
        networkMode: 'online',
      },
    },
  });
}

// Singleton query client
let queryClient: QueryClient | null = null;

/**
 * Get or create the query client singleton
 */
export function getQueryClient(): QueryClient {
  if (!queryClient) {
    queryClient = createQueryClient();
  }
  return queryClient;
}

// ─────────────────────────────────────────────────────────────────────────────────
// QUERY KEYS
// ─────────────────────────────────────────────────────────────────────────────────

/**
 * Centralized query keys for cache management
 */
export const QUERY_KEYS = {
  // Subgraph queries
  protocolStats: (chainId: number) => ['protocol', 'stats', chainId] as const,
  tokens: (chainId: number) => ['tokens', chainId] as const,
  token: (chainId: number, address: string) => ['token', chainId, address] as const,
  pools: (chainId: number) => ['pools', chainId] as const,
  pool: (chainId: number, poolId: string) => ['pool', chainId, poolId] as const,
  vaults: (chainId: number) => ['vaults', chainId] as const,
  vault: (chainId: number, address: string) => ['vault', chainId, address] as const,
  stakingPools: (chainId: number) => ['staking', 'pools', chainId] as const,
  recentSwaps: (chainId: number) => ['swaps', 'recent', chainId] as const,

  // User-specific queries
  userStats: (chainId: number, address: string) => ['user', 'stats', chainId, address] as const,
  userSwaps: (chainId: number, address: string) => ['user', 'swaps', chainId, address] as const,
  userPositions: (chainId: number, address: string) => ['user', 'positions', chainId, address] as const,

  // Contract reads
  quote: (chainId: number, tokenIn: string, tokenOut: string, amountIn: string) => 
    ['quote', chainId, tokenIn, tokenOut, amountIn] as const,
  balance: (chainId: number, token: string, account: string) => 
    ['balance', chainId, token, account] as const,
  allowance: (chainId: number, token: string, owner: string, spender: string) => 
    ['allowance', chainId, token, owner, spender] as const,
  bufferState: (chainId: number, vault: string) => 
    ['buffer', 'state', chainId, vault] as const,
  stakingPosition: (chainId: number, underlying: string, account: string) => 
    ['staking', 'position', chainId, underlying, account] as const,
  gasPrice: (chainId: number) => ['gas', 'price', chainId] as const,

  // Aggregated keys for invalidation
  all: ['ignis'] as const,
  allSubgraph: ['ignis', 'subgraph'] as const,
  allUser: (address: string) => ['ignis', 'user', address] as const,
  allBalances: (account: string) => ['balance', account] as const,
} as const;

// ─────────────────────────────────────────────────────────────────────────────────
// CACHE INVALIDATION HELPERS
// ─────────────────────────────────────────────────────────────────────────────────

/**
 * Invalidate all user-related queries after a transaction
 */
export function invalidateUserQueries(
  queryClient: QueryClient,
  chainId: number,
  userAddress: string
): void {
  // Invalidate balances
  queryClient.invalidateQueries({
    predicate: (query) => 
      query.queryKey[0] === 'balance' && 
      query.queryKey[3] === userAddress.toLowerCase(),
  });

  // Invalidate allowances
  queryClient.invalidateQueries({
    predicate: (query) => 
      query.queryKey[0] === 'allowance' && 
      query.queryKey[3] === userAddress.toLowerCase(),
  });

  // Invalidate user positions
  queryClient.invalidateQueries({
    queryKey: QUERY_KEYS.userPositions(chainId, userAddress),
  });

  // Invalidate user stats
  queryClient.invalidateQueries({
    queryKey: QUERY_KEYS.userStats(chainId, userAddress),
  });
}

/**
 * Invalidate quotes (force refetch after swap)
 */
export function invalidateQuotes(queryClient: QueryClient): void {
  queryClient.invalidateQueries({
    predicate: (query) => query.queryKey[0] === 'quote',
  });
}

/**
 * Invalidate pool data after liquidity changes
 */
export function invalidatePoolData(
  queryClient: QueryClient,
  chainId: number,
  poolId?: string
): void {
  if (poolId) {
    queryClient.invalidateQueries({
      queryKey: QUERY_KEYS.pool(chainId, poolId),
    });
  } else {
    queryClient.invalidateQueries({
      queryKey: QUERY_KEYS.pools(chainId),
    });
  }
}

/**
 * Invalidate buffer state after wrap/unwrap
 */
export function invalidateBufferState(
  queryClient: QueryClient,
  chainId: number,
  vault?: string
): void {
  if (vault) {
    queryClient.invalidateQueries({
      queryKey: QUERY_KEYS.bufferState(chainId, vault),
    });
  } else {
    queryClient.invalidateQueries({
      predicate: (query) => 
        query.queryKey[0] === 'buffer' && 
        query.queryKey[1] === 'state',
    });
  }
}

// ─────────────────────────────────────────────────────────────────────────────────
// PREFETCH HELPERS
// ─────────────────────────────────────────────────────────────────────────────────

/**
 * Prefetch common data for a chain
 */
export async function prefetchChainData(
  queryClient: QueryClient,
  chainId: number,
  fetchFns: {
    fetchTokens: () => Promise<unknown>;
    fetchPools: () => Promise<unknown>;
    fetchProtocolStats: () => Promise<unknown>;
  }
): Promise<void> {
  await Promise.allSettled([
    queryClient.prefetchQuery({
      queryKey: QUERY_KEYS.tokens(chainId),
      queryFn: fetchFns.fetchTokens,
      staleTime: CACHE_TIMES.TOKEN_LIST,
    }),
    queryClient.prefetchQuery({
      queryKey: QUERY_KEYS.pools(chainId),
      queryFn: fetchFns.fetchPools,
      staleTime: CACHE_TIMES.POOL_LIST,
    }),
    queryClient.prefetchQuery({
      queryKey: QUERY_KEYS.protocolStats(chainId),
      queryFn: fetchFns.fetchProtocolStats,
      staleTime: CACHE_TIMES.PROTOCOL_STATS,
    }),
  ]);
}

// Re-export QueryClientProvider for convenience
export { QueryClientProvider };
