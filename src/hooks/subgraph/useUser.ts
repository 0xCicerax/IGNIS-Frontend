
import { useState, useEffect, useCallback } from 'react';
import { query, isSubgraphConfigured } from '../../lib/graphql/client';
import { logger } from '../../utils/logger';
import { 
  USER_QUERY, 
  USER_STATS_QUERY, 
  USER_SWAPS_QUERY,
  USER_STAKER_POSITIONS_QUERY 
} from '../../lib/graphql/queries';
import { 
  User, 
  UserResponse, 
  UserStatsResponse,
  Swap,
  SwapsResponse,
  StakerPosition,
  StakerPositionsResponse
} from '../../lib/graphql/types';

// ─────────────────────────────────────────────────────────────────────────────────
// MOCK DATA
// ─────────────────────────────────────────────────────────────────────────────────

const MOCK_USER: User = {
  id: '0x0000000000000000000000000000000000000000',
  totalSwaps: '25',
  totalVolumeUSD: '150000',
  totalGasSaved: '50000000000000000',
  firstInteraction: '1700000000',
  lastInteraction: '1703500000',
};

const MOCK_STAKER_POSITIONS: StakerPosition[] = [
  {
    id: '0x0000000000000000000000000000000000000000-usdc',
    user: MOCK_USER,
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
    stakingPool: {
      id: 'usdc',
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
      totalStaked: '10000000000000',
      rewardRate: '1000000000000000000',
      totalRewardsDistributed: '500000000000000000000000',
      stakerCount: '500',
      createdAt: '1700000000',
      updatedAt: '1703500000',
    },
    depositedAmount: '10000000000',
    pendingRewards: '50000000000000000000',
    totalClaimed: '100000000000000000000',
    lastUpdate: '1703500000',
  },
];

// ─────────────────────────────────────────────────────────────────────────────────
// HOOK: useUser
// ─────────────────────────────────────────────────────────────────────────────────

interface UseUserOptions {
  chainId: number;
  address: string | null;
}

interface UseUserResult {
  data: User | null;
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

export function useUser(options: UseUserOptions): UseUserResult {
  const { chainId, address } = options;
  
  const [data, setData] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(!!address);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = useCallback(async () => {
    if (!address) {
      setData(null);
      setIsLoading(false);
      return;
    }

    if (!isSubgraphConfigured(chainId)) {
      setData({ ...MOCK_USER, id: address.toLowerCase() });
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const response = await query<UserResponse>(
        USER_QUERY,
        { id: address.toLowerCase() },
        { chainId }
      );
      setData(response.user);
      setError(null);
    } catch (err: unknown) {
      logger.error('useUser failed', err);
      setError(err instanceof Error ? err : new Error('Failed to fetch user'));
    } finally {
      setIsLoading(false);
    }
  }, [chainId, address]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, isLoading, error, refetch: fetchData };
}

// ─────────────────────────────────────────────────────────────────────────────────
// HOOK: useUserStats (user + positions combined)
// ─────────────────────────────────────────────────────────────────────────────────

interface UseUserStatsResult {
  user: User | null;
  positions: StakerPosition[];
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

export function useUserStats(options: UseUserOptions): UseUserStatsResult {
  const { chainId, address } = options;
  
  const [user, setUser] = useState<User | null>(null);
  const [positions, setPositions] = useState<StakerPosition[]>([]);
  const [isLoading, setIsLoading] = useState(!!address);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = useCallback(async () => {
    if (!address) {
      setUser(null);
      setPositions([]);
      setIsLoading(false);
      return;
    }

    if (!isSubgraphConfigured(chainId)) {
      setUser({ ...MOCK_USER, id: address.toLowerCase() });
      setPositions(MOCK_STAKER_POSITIONS);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const response = await query<UserStatsResponse>(
        USER_STATS_QUERY,
        { userId: address.toLowerCase() },
        { chainId }
      );
      setUser(response.user);
      setPositions(response.stakerPositions);
      setError(null);
    } catch (err: unknown) {
      logger.error('useUserStats failed', err);
      setError(err instanceof Error ? err : new Error('Failed to fetch user stats'));
    } finally {
      setIsLoading(false);
    }
  }, [chainId, address]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { user, positions, isLoading, error, refetch: fetchData };
}

// ─────────────────────────────────────────────────────────────────────────────────
// HOOK: useUserSwaps
// ─────────────────────────────────────────────────────────────────────────────────

interface UseUserSwapsOptions {
  chainId: number;
  address: string | null;
  first?: number;
  skip?: number;
}

interface UseUserSwapsResult {
  data: Swap[];
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

export function useUserSwaps(options: UseUserSwapsOptions): UseUserSwapsResult {
  const { chainId, address, first = 20, skip = 0 } = options;
  
  const [data, setData] = useState<Swap[]>([]);
  const [isLoading, setIsLoading] = useState(!!address);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = useCallback(async () => {
    if (!address) {
      setData([]);
      setIsLoading(false);
      return;
    }

    if (!isSubgraphConfigured(chainId)) {
      // Generate mock swap history
      const mockSwaps: Swap[] = Array.from({ length: 5 }, (_, i) => ({
        id: `swap-${i}`,
        txHash: `0x${Math.random().toString(16).slice(2)}`,
        timestamp: String(Math.floor(Date.now() / 1000) - i * 3600),
        sender: address,
        recipient: address,
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
        amountIn: String(1000 + Math.random() * 9000),
        amountOut: String(0.4 + Math.random() * 3),
        amountUSD: String(1000 + Math.random() * 9000),
        priceImpact: String(Math.random() * 0.5),
        route: 'USDC -> WETH',
        gasUsed: '150000',
        gasSaved: '50000',
        usedBuffer: Math.random() > 0.5,
      }));
      setData(mockSwaps);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const response = await query<SwapsResponse>(
        USER_SWAPS_QUERY,
        { user: address.toLowerCase(), first, skip },
        { chainId }
      );
      setData(response.swaps);
      setError(null);
    } catch (err: unknown) {
      logger.error('useUserSwaps failed', err);
      setError(err instanceof Error ? err : new Error('Failed to fetch user swaps'));
    } finally {
      setIsLoading(false);
    }
  }, [chainId, address, first, skip]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, isLoading, error, refetch: fetchData };
}

// ─────────────────────────────────────────────────────────────────────────────────
// HOOK: useUserStakerPositions
// ─────────────────────────────────────────────────────────────────────────────────

interface UseUserStakerPositionsResult {
  data: StakerPosition[];
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

export function useUserStakerPositions(options: UseUserOptions): UseUserStakerPositionsResult {
  const { chainId, address } = options;
  
  const [data, setData] = useState<StakerPosition[]>([]);
  const [isLoading, setIsLoading] = useState(!!address);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = useCallback(async () => {
    if (!address) {
      setData([]);
      setIsLoading(false);
      return;
    }

    if (!isSubgraphConfigured(chainId)) {
      setData(MOCK_STAKER_POSITIONS);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const response = await query<StakerPositionsResponse>(
        USER_STAKER_POSITIONS_QUERY,
        { user: address.toLowerCase() },
        { chainId }
      );
      setData(response.stakerPositions);
      setError(null);
    } catch (err: unknown) {
      logger.error('useUserStakerPositions failed', err);
      setError(err instanceof Error ? err : new Error('Failed to fetch staker positions'));
    } finally {
      setIsLoading(false);
    }
  }, [chainId, address]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, isLoading, error, refetch: fetchData };
}

// ─────────────────────────────────────────────────────────────────────────────────
// FORMATTING HELPERS
// ─────────────────────────────────────────────────────────────────────────────────

export interface FormattedUserStats {
  totalSwaps: number;
  totalVolumeUSD: number;
  totalGasSavedUSD: number;
  firstInteractionDate: Date;
  lastInteractionDate: Date;
}

export function formatUserStats(user: User | null, ethPrice: number = 2500): FormattedUserStats | null {
  if (!user) return null;

  const gasSavedWei = BigInt(user.totalGasSaved);
  const gasSavedETH = Number(gasSavedWei) / 1e18;
  const gasSavedUSD = gasSavedETH * ethPrice;

  return {
    totalSwaps: parseInt(user.totalSwaps),
    totalVolumeUSD: parseFloat(user.totalVolumeUSD),
    totalGasSavedUSD: gasSavedUSD,
    firstInteractionDate: new Date(parseInt(user.firstInteraction) * 1000),
    lastInteractionDate: new Date(parseInt(user.lastInteraction) * 1000),
  };
}

export interface FormattedStakerPosition {
  underlying: string;
  underlyingSymbol: string;
  depositedAmount: number;
  depositedUSD: number;
  pendingRewards: number;
  pendingRewardsUSD: number;
  rewardTokenSymbol: string;
  apr: number;
}

export function formatStakerPosition(
  position: StakerPosition,
  tokenPrices: Record<string, number> = {}
): FormattedStakerPosition {
  const underlyingDecimals = position.underlying.decimals;
  const rewardDecimals = position.stakingPool.rewardToken.decimals;
  
  const depositedAmount = parseFloat(position.depositedAmount) / Math.pow(10, underlyingDecimals);
  const pendingRewards = parseFloat(position.pendingRewards) / Math.pow(10, rewardDecimals);
  
  const underlyingPrice = tokenPrices[position.underlying.symbol] || 1;
  const rewardPrice = tokenPrices[position.stakingPool.rewardToken.symbol] || 0.1;
  
  // Calculate APR based on reward rate
  const totalStaked = parseFloat(position.stakingPool.totalStaked) / Math.pow(10, underlyingDecimals);
  const rewardRate = parseFloat(position.stakingPool.rewardRate) / Math.pow(10, rewardDecimals);
  const yearlyRewards = rewardRate * 365 * 24 * 3600;
  const apr = totalStaked > 0 ? (yearlyRewards * rewardPrice) / (totalStaked * underlyingPrice) * 100 : 0;

  return {
    underlying: position.underlying.id,
    underlyingSymbol: position.underlying.symbol,
    depositedAmount,
    depositedUSD: depositedAmount * underlyingPrice,
    pendingRewards,
    pendingRewardsUSD: pendingRewards * rewardPrice,
    rewardTokenSymbol: position.stakingPool.rewardToken.symbol,
    apr,
  };
}
