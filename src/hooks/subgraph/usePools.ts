
import { useState, useEffect, useCallback, useMemo } from 'react';
import { query, isSubgraphConfigured } from '../../lib/graphql/client';
import { logger } from '../../utils/logger';
import { ALL_POOLS_QUERY, CL_POOLS_QUERY, BIN_POOLS_QUERY, POOL_REGISTRY_STATS_QUERY } from '../../lib/graphql/queries';
import { 
  CLPool, 
  BinPool, 
  Pool,
  AllPoolsResponse, 
  CLPoolsResponse, 
  BinPoolsResponse,
  PoolRegistryStats,
  PoolRegistryStatsResponse 
} from '../../lib/graphql/types';

// ─────────────────────────────────────────────────────────────────────────────────
// MOCK DATA
// ─────────────────────────────────────────────────────────────────────────────────

const MOCK_CL_POOLS: CLPool[] = [
  {
    id: '0x0000000000000000000000000000000000000001',
    token0: {
      id: '0x4200000000000000000000000000000000000006',
      symbol: 'WETH',
      name: 'Wrapped Ether',
      decimals: 18,
      allowed: true,
      isVaultToken: false,
      underlyingToken: null,
      totalVolume: '0',
      totalVolumeUSD: '0',
      swapCount: '0',
    },
    token1: {
      id: '0x833589fcd6edb6e08f4c7c32d4f71b54bda02913',
      symbol: 'USDC',
      name: 'USD Coin',
      decimals: 6,
      allowed: true,
      isVaultToken: false,
      underlyingToken: null,
      totalVolume: '0',
      totalVolumeUSD: '0',
      swapCount: '0',
    },
    fee: 3000,
    tickSpacing: 60,
    hooks: '0x0000000000000000000000000000000000000000',
    sqrtPriceX96: '1234567890123456789012345678',
    tick: 100000,
    liquidity: '10000000000000000000000',
    isRegistered: true,
    registeredAt: '1700000000',
    lastRegistryUpdate: '1703500000',
    createdAtBlock: '1000000',
    createdAt: '1700000000',
  },
];

const MOCK_BIN_POOLS: BinPool[] = [
  {
    id: '0x0000000000000000000000000000000000000002',
    token0: {
      id: '0x4200000000000000000000000000000000000006',
      symbol: 'WETH',
      name: 'Wrapped Ether',
      decimals: 18,
      allowed: true,
      isVaultToken: false,
      underlyingToken: null,
      totalVolume: '0',
      totalVolumeUSD: '0',
      swapCount: '0',
    },
    token1: {
      id: '0x833589fcd6edb6e08f4c7c32d4f71b54bda02913',
      symbol: 'USDC',
      name: 'USD Coin',
      decimals: 6,
      allowed: true,
      isVaultToken: false,
      underlyingToken: null,
      totalVolume: '0',
      totalVolumeUSD: '0',
      swapCount: '0',
    },
    binStep: 10,
    hooks: '0x0000000000000000000000000000000000000000',
    activeId: 8388608,
    reserveX: '5000000000000000000000',
    reserveY: '12500000000000',
    isRegistered: true,
    registeredAt: '1700000000',
    lastRegistryUpdate: '1703500000',
    createdAtBlock: '1000000',
    createdAt: '1700000000',
  },
];

// ─────────────────────────────────────────────────────────────────────────────────
// HOOK: usePools (unified CL + BIN pools)
// ─────────────────────────────────────────────────────────────────────────────────

interface UsePoolsOptions {
  chainId: number;
  first?: number;
  registeredOnly?: boolean;
}

interface UsePoolsResult {
  data: Pool[];
  clPools: CLPool[];
  binPools: BinPool[];
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

export function usePools(options: UsePoolsOptions): UsePoolsResult {
  const { chainId, first = 50, registeredOnly = true } = options;
  
  const [clPools, setClPools] = useState<CLPool[]>([]);
  const [binPools, setBinPools] = useState<BinPool[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = useCallback(async () => {
    if (!isSubgraphConfigured(chainId)) {
      setClPools(MOCK_CL_POOLS);
      setBinPools(MOCK_BIN_POOLS);
      setIsLoading(false);
      return;
    }

    try {
      const response = await query<AllPoolsResponse>(
        ALL_POOLS_QUERY,
        { first, registered: registeredOnly },
        { chainId }
      );
      setClPools(response.clpools);
      setBinPools(response.binpools);
      setError(null);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch pools';
      logger.error('usePools failed', { error: err, message: errorMessage });
      setError(new Error(errorMessage));
      setClPools(MOCK_CL_POOLS);
      setBinPools(MOCK_BIN_POOLS);
    } finally {
      setIsLoading(false);
    }
  }, [chainId, first, registeredOnly]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Combine and normalize pools
  const data = useMemo(() => {
    const unified: Pool[] = [];
    
    for (const pool of clPools) {
      unified.push({
        id: pool.id,
        type: 'CL',
        token0: pool.token0,
        token1: pool.token1,
        fee: pool.fee,
        liquidity: pool.liquidity,
        isRegistered: pool.isRegistered,
        createdAt: pool.createdAt,
        tickSpacing: pool.tickSpacing,
        sqrtPriceX96: pool.sqrtPriceX96,
        tick: pool.tick,
      });
    }
    
    for (const pool of binPools) {
      unified.push({
        id: pool.id,
        type: 'BIN',
        token0: pool.token0,
        token1: pool.token1,
        fee: pool.binStep, // Use binStep as fee equivalent
        liquidity: pool.reserveX, // Use reserveX as liquidity proxy
        isRegistered: pool.isRegistered,
        createdAt: pool.createdAt,
        binStep: pool.binStep,
        activeId: pool.activeId,
        reserveX: pool.reserveX,
        reserveY: pool.reserveY,
      });
    }
    
    // Sort by liquidity (descending)
    unified.sort((a, b) => {
      const liquidityA = BigInt(a.liquidity);
      const liquidityB = BigInt(b.liquidity);
      return liquidityB > liquidityA ? 1 : liquidityB < liquidityA ? -1 : 0;
    });
    
    return unified;
  }, [clPools, binPools]);

  return { data, clPools, binPools, isLoading, error, refetch: fetchData };
}

// ─────────────────────────────────────────────────────────────────────────────────
// HOOK: useCLPools
// ─────────────────────────────────────────────────────────────────────────────────

interface UseCLPoolsResult {
  data: CLPool[];
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

export function useCLPools(options: UsePoolsOptions): UseCLPoolsResult {
  const { chainId, first = 50, registeredOnly = true } = options;
  
  const [data, setData] = useState<CLPool[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = useCallback(async () => {
    if (!isSubgraphConfigured(chainId)) {
      setData(MOCK_CL_POOLS);
      setIsLoading(false);
      return;
    }

    try {
      const response = await query<CLPoolsResponse>(
        CL_POOLS_QUERY,
        { first, skip: 0, registered: registeredOnly },
        { chainId }
      );
      setData(response.clpools);
      setError(null);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch CL pools';
      logger.error('useCLPools failed', { error: err, message: errorMessage });
      setError(new Error(errorMessage));
      setData(MOCK_CL_POOLS);
    } finally {
      setIsLoading(false);
    }
  }, [chainId, first, registeredOnly]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, isLoading, error, refetch: fetchData };
}

// ─────────────────────────────────────────────────────────────────────────────────
// HOOK: useBinPools
// ─────────────────────────────────────────────────────────────────────────────────

interface UseBinPoolsResult {
  data: BinPool[];
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

export function useBinPools(options: UsePoolsOptions): UseBinPoolsResult {
  const { chainId, first = 50, registeredOnly = true } = options;
  
  const [data, setData] = useState<BinPool[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = useCallback(async () => {
    if (!isSubgraphConfigured(chainId)) {
      setData(MOCK_BIN_POOLS);
      setIsLoading(false);
      return;
    }

    try {
      const response = await query<BinPoolsResponse>(
        BIN_POOLS_QUERY,
        { first, skip: 0, registered: registeredOnly },
        { chainId }
      );
      setData(response.binPools);
      setError(null);
    } catch (err: unknown) {
      logger.error('useBinPools failed', err);
      setError(err instanceof Error ? err : new Error('Failed to fetch Bin pools'));
      setData(MOCK_BIN_POOLS);
    } finally {
      setIsLoading(false);
    }
  }, [chainId, first, registeredOnly]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, isLoading, error, refetch: fetchData };
}

// ─────────────────────────────────────────────────────────────────────────────────
// HOOK: usePoolRegistryStats
// ─────────────────────────────────────────────────────────────────────────────────

interface UsePoolRegistryStatsResult {
  data: PoolRegistryStats | null;
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

export function usePoolRegistryStats(chainId: number): UsePoolRegistryStatsResult {
  const [data, setData] = useState<PoolRegistryStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = useCallback(async () => {
    if (!isSubgraphConfigured(chainId)) {
      setData({
        id: 'pool-registry',
        totalCLPoolsRegistered: '15',
        totalBinPoolsRegistered: '8',
        lastSyncAt: String(Math.floor(Date.now() / 1000)),
      });
      setIsLoading(false);
      return;
    }

    try {
      const response = await query<PoolRegistryStatsResponse>(
        POOL_REGISTRY_STATS_QUERY,
        {},
        { chainId }
      );
      setData(response.poolRegistryStats);
      setError(null);
    } catch (err: unknown) {
      logger.error('usePoolRegistryStats failed', err);
      setError(err instanceof Error ? err : new Error('Failed to fetch pool registry stats'));
    } finally {
      setIsLoading(false);
    }
  }, [chainId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, isLoading, error, refetch: fetchData };
}

// ─────────────────────────────────────────────────────────────────────────────────
// POOL HELPERS
// ─────────────────────────────────────────────────────────────────────────────────

/**
 * Calculate price from sqrtPriceX96 (for CL pools)
 */
export function sqrtPriceX96ToPrice(
  sqrtPriceX96: string,
  token0Decimals: number,
  token1Decimals: number
): number {
  const sqrtPrice = BigInt(sqrtPriceX96);
  const Q96 = BigInt(2) ** BigInt(96);
  
  // price = (sqrtPrice / 2^96)^2 * 10^(token0Decimals - token1Decimals)
  const priceX192 = (sqrtPrice * sqrtPrice) / (Q96 * Q96);
  const decimalAdjustment = 10 ** (token0Decimals - token1Decimals);
  
  return Number(priceX192) * decimalAdjustment;
}

/**
 * Calculate price from activeId (for BIN pools)
 */
export function activeIdToPrice(activeId: number, binStep: number): number {
  const PRICE_ONE_ID = 8388608; // 2^23
  return Math.pow(1 + binStep / 10000, activeId - PRICE_ONE_ID);
}

/**
 * Get fee as percentage
 */
export function feeToPercent(fee: number): string {
  return (fee / 10000).toFixed(2) + '%';
}

/**
 * Find pools for a token pair
 */
export function findPoolsForPair(
  pools: Pool[],
  tokenA: string,
  tokenB: string
): Pool[] {
  const a = tokenA.toLowerCase();
  const b = tokenB.toLowerCase();
  
  return pools.filter(pool => {
    const t0 = pool.token0.id.toLowerCase();
    const t1 = pool.token1.id.toLowerCase();
    return (t0 === a && t1 === b) || (t0 === b && t1 === a);
  });
}

/**
 * Check if pool contains vault tokens
 */
export function isYieldBearingPool(pool: Pool): boolean {
  return pool.token0.isVaultToken || pool.token1.isVaultToken;
}
