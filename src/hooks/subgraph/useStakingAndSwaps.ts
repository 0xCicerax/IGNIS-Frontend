
import { useState, useEffect, useCallback } from 'react';
import { query, isSubgraphConfigured } from '../../lib/graphql/client';
import { logger } from '../../utils/logger';
import { 
  STAKING_POOLS_QUERY, 
  STAKING_POOL_QUERY,
  RECENT_SWAPS_QUERY,
  POOL_SWAPS_QUERY 
} from '../../lib/graphql/queries';
import { 
  StakingPool, 
  StakingPoolsResponse,
  Swap,
  SwapsResponse
} from '../../lib/graphql/types';

// ─────────────────────────────────────────────────────────────────────────────────
// MOCK DATA
// ─────────────────────────────────────────────────────────────────────────────────

const MOCK_STAKING_POOLS: StakingPool[] = [
  {
    id: 'usdc-pool',
    underlying: {
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
    rewardToken: {
      id: '0x0000000000000000000000000000000000001234',
      symbol: 'IGNI',
      name: 'IGNIS Token',
      decimals: 18,
      allowed: true,
      isVaultToken: false,
      underlyingToken: null,
      totalVolume: '0',
      totalVolumeUSD: '0',
      swapCount: '0',
    },
    totalStaked: '50000000000000',
    rewardRate: '1000000000000000000',
    totalRewardsDistributed: '500000000000000000000000',
    stakerCount: '500',
    createdAt: '1700000000',
    updatedAt: '1703500000',
  },
  {
    id: 'weth-pool',
    underlying: {
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
    rewardToken: {
      id: '0x0000000000000000000000000000000000001234',
      symbol: 'IGNI',
      name: 'IGNIS Token',
      decimals: 18,
      allowed: true,
      isVaultToken: false,
      underlyingToken: null,
      totalVolume: '0',
      totalVolumeUSD: '0',
      swapCount: '0',
    },
    totalStaked: '200000000000000000000',
    rewardRate: '500000000000000000',
    totalRewardsDistributed: '250000000000000000000000',
    stakerCount: '300',
    createdAt: '1700000000',
    updatedAt: '1703500000',
  },
];

const MOCK_RECENT_SWAPS: Swap[] = [
  {
    id: 'swap-1',
    txHash: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
    timestamp: String(Math.floor(Date.now() / 1000) - 300),
    sender: '0x1234567890123456789012345678901234567890',
    recipient: '0x1234567890123456789012345678901234567890',
    tokenIn: {
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
    tokenOut: {
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
    amountIn: '5000',
    amountOut: '2.1',
    amountUSD: '5000',
    priceImpact: '0.12',
    route: 'USDC -> WETH',
    gasUsed: '150000',
    gasSaved: '50000',
    usedBuffer: true,
  },
];

// ─────────────────────────────────────────────────────────────────────────────────
// HOOK: useStakingPools
// ─────────────────────────────────────────────────────────────────────────────────

interface UseStakingPoolsOptions {
  chainId: number;
}

interface UseStakingPoolsResult {
  data: StakingPool[];
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

export function useStakingPools(options: UseStakingPoolsOptions): UseStakingPoolsResult {
  const { chainId } = options;
  
  const [data, setData] = useState<StakingPool[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = useCallback(async () => {
    if (!isSubgraphConfigured(chainId)) {
      setData(MOCK_STAKING_POOLS);
      setIsLoading(false);
      return;
    }

    try {
      const response = await query<StakingPoolsResponse>(
        STAKING_POOLS_QUERY,
        {},
        { chainId }
      );
      setData(response.stakingPools);
      setError(null);
    } catch (err: unknown) {
      logger.error('useStakingPools failed', err);
      setError(err instanceof Error ? err : new Error('Failed to fetch staking pools'));
      setData(MOCK_STAKING_POOLS);
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
// HOOK: useStakingPool
// ─────────────────────────────────────────────────────────────────────────────────

interface UseStakingPoolOptions {
  chainId: number;
  poolId: string | null;
}

interface UseStakingPoolResult {
  data: StakingPool | null;
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

export function useStakingPool(options: UseStakingPoolOptions): UseStakingPoolResult {
  const { chainId, poolId } = options;
  
  const [data, setData] = useState<StakingPool | null>(null);
  const [isLoading, setIsLoading] = useState(!!poolId);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = useCallback(async () => {
    if (!poolId) {
      setData(null);
      setIsLoading(false);
      return;
    }

    if (!isSubgraphConfigured(chainId)) {
      const pool = MOCK_STAKING_POOLS.find(p => p.id === poolId);
      setData(pool || null);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const response = await query<{ stakingPool: StakingPool | null }>(
        STAKING_POOL_QUERY,
        { id: poolId },
        { chainId }
      );
      setData(response.stakingPool);
      setError(null);
    } catch (err: unknown) {
      logger.error('useStakingPool failed', err);
      setError(err instanceof Error ? err : new Error('Failed to fetch staking pool'));
    } finally {
      setIsLoading(false);
    }
  }, [chainId, poolId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, isLoading, error, refetch: fetchData };
}

// ─────────────────────────────────────────────────────────────────────────────────
// HOOK: useRecentSwaps
// ─────────────────────────────────────────────────────────────────────────────────

interface UseRecentSwapsOptions {
  chainId: number;
  first?: number;
  skip?: number;
  refetchInterval?: number;
}

interface UseRecentSwapsResult {
  data: Swap[];
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

export function useRecentSwaps(options: UseRecentSwapsOptions): UseRecentSwapsResult {
  const { chainId, first = 20, skip = 0, refetchInterval = 15000 } = options;
  
  const [data, setData] = useState<Swap[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = useCallback(async () => {
    if (!isSubgraphConfigured(chainId)) {
      // Generate fresh mock data
      const now = Math.floor(Date.now() / 1000);
      const mockSwaps = MOCK_RECENT_SWAPS.map((swap, i) => ({
        ...swap,
        id: `swap-${now}-${i}`,
        timestamp: String(now - i * 60),
      }));
      setData(mockSwaps);
      setIsLoading(false);
      return;
    }

    try {
      const response = await query<SwapsResponse>(
        RECENT_SWAPS_QUERY,
        { first, skip },
        { chainId }
      );
      setData(response.swaps);
      setError(null);
    } catch (err: unknown) {
      logger.error('useRecentSwaps failed', err);
      setError(err instanceof Error ? err : new Error('Failed to fetch recent swaps'));
    } finally {
      setIsLoading(false);
    }
  }, [chainId, first, skip]);

  useEffect(() => {
    fetchData();
    
    if (refetchInterval > 0) {
      const interval = setInterval(fetchData, refetchInterval);
      return () => clearInterval(interval);
    }
  }, [fetchData, refetchInterval]);

  return { data, isLoading, error, refetch: fetchData };
}

// ─────────────────────────────────────────────────────────────────────────────────
// HOOK: usePoolSwaps
// ─────────────────────────────────────────────────────────────────────────────────

interface UsePoolSwapsOptions {
  chainId: number;
  poolId: string | null;
  first?: number;
}

interface UsePoolSwapsResult {
  data: Swap[];
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

export function usePoolSwaps(options: UsePoolSwapsOptions): UsePoolSwapsResult {
  const { chainId, poolId, first = 20 } = options;
  
  const [data, setData] = useState<Swap[]>([]);
  const [isLoading, setIsLoading] = useState(!!poolId);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = useCallback(async () => {
    if (!poolId) {
      setData([]);
      setIsLoading(false);
      return;
    }

    if (!isSubgraphConfigured(chainId)) {
      setData(MOCK_RECENT_SWAPS);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const response = await query<SwapsResponse>(
        POOL_SWAPS_QUERY,
        { poolId, first },
        { chainId }
      );
      setData(response.swaps);
      setError(null);
    } catch (err: unknown) {
      logger.error('usePoolSwaps failed', err);
      setError(err instanceof Error ? err : new Error('Failed to fetch pool swaps'));
    } finally {
      setIsLoading(false);
    }
  }, [chainId, poolId, first]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, isLoading, error, refetch: fetchData };
}

// ─────────────────────────────────────────────────────────────────────────────────
// STAKING HELPERS
// ─────────────────────────────────────────────────────────────────────────────────

export interface FormattedStakingPool {
  id: string;
  underlyingSymbol: string;
  underlyingAddress: string;
  rewardTokenSymbol: string;
  totalStakedUSD: number;
  apr: number;
  stakerCount: number;
}

export function formatStakingPool(
  pool: StakingPool,
  tokenPrices: Record<string, number> = {}
): FormattedStakingPool {
  const underlyingDecimals = pool.underlying.decimals;
  const rewardDecimals = pool.rewardToken.decimals;
  
  const totalStaked = parseFloat(pool.totalStaked) / Math.pow(10, underlyingDecimals);
  const rewardRate = parseFloat(pool.rewardRate) / Math.pow(10, rewardDecimals);
  
  const underlyingPrice = tokenPrices[pool.underlying.symbol] || 1;
  const rewardPrice = tokenPrices[pool.rewardToken.symbol] || 0.1;
  
  // Calculate APR
  const yearlyRewards = rewardRate * 365 * 24 * 3600;
  const apr = totalStaked > 0 
    ? (yearlyRewards * rewardPrice) / (totalStaked * underlyingPrice) * 100 
    : 0;

  return {
    id: pool.id,
    underlyingSymbol: pool.underlying.symbol,
    underlyingAddress: pool.underlying.id,
    rewardTokenSymbol: pool.rewardToken.symbol,
    totalStakedUSD: totalStaked * underlyingPrice,
    apr,
    stakerCount: parseInt(pool.stakerCount),
  };
}

// ─────────────────────────────────────────────────────────────────────────────────
// SWAP FORMATTING HELPERS
// ─────────────────────────────────────────────────────────────────────────────────

export interface FormattedSwap {
  id: string;
  txHash: string;
  timestamp: Date;
  sender: string;
  tokenInSymbol: string;
  tokenOutSymbol: string;
  amountIn: number;
  amountOut: number;
  amountUSD: number;
  priceImpact: number;
  usedBuffer: boolean;
  gasSaved: number;
}

export function formatSwap(swap: Swap): FormattedSwap {
  const tokenInDecimals = swap.tokenIn.decimals;
  const tokenOutDecimals = swap.tokenOut.decimals;

  return {
    id: swap.id,
    txHash: swap.txHash,
    timestamp: new Date(parseInt(swap.timestamp) * 1000),
    sender: swap.sender,
    tokenInSymbol: swap.tokenIn.symbol,
    tokenOutSymbol: swap.tokenOut.symbol,
    amountIn: parseFloat(swap.amountIn),
    amountOut: parseFloat(swap.amountOut),
    amountUSD: parseFloat(swap.amountUSD),
    priceImpact: parseFloat(swap.priceImpact) * 100, // Convert to percentage
    usedBuffer: swap.usedBuffer,
    gasSaved: parseInt(swap.gasSaved),
  };
}

export function formatTimeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  
  if (seconds < 60) return `${seconds}s ago`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}
