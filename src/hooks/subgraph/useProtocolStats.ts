
import { useState, useEffect, useCallback } from 'react';
import { query, isSubgraphConfigured } from '../../lib/graphql/client';
import { logger } from '../../utils/logger';
import { PROTOCOL_STATS_QUERY, PROTOCOL_DAY_DATA_QUERY } from '../../lib/graphql/queries';
import { Protocol, ProtocolStatsResponse, ProtocolDayData, ProtocolDayDataResponse } from '../../lib/graphql/types';

// ─────────────────────────────────────────────────────────────────────────────────
// MOCK DATA (used when subgraph is not configured)
// ─────────────────────────────────────────────────────────────────────────────────

const MOCK_PROTOCOL_STATS: Protocol = {
  id: 'aurelia',
  totalVolumeUSD: '125000000',
  totalSwaps: '50000',
  totalWraps: '15000',
  totalUnwraps: '12000',
  totalUsers: '3500',
  totalVaults: '12',
  totalGasSaved: '5000000000',
  totalStaked: '10000000000000000000000000',
  totalRewardsDistributed: '500000000000000000000000',
  createdAt: '1700000000',
  updatedAt: '1703500000',
};

// ─────────────────────────────────────────────────────────────────────────────────
// HOOK: useProtocolStats
// ─────────────────────────────────────────────────────────────────────────────────

interface UseProtocolStatsOptions {
  chainId: number;
  refetchInterval?: number;
}

interface UseProtocolStatsResult {
  data: Protocol | null;
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

export function useProtocolStats(options: UseProtocolStatsOptions): UseProtocolStatsResult {
  const { chainId, refetchInterval = 30000 } = options;
  
  const [data, setData] = useState<Protocol | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = useCallback(async () => {
    // Use mock data if subgraph not configured
    if (!isSubgraphConfigured(chainId)) {
      setData(MOCK_PROTOCOL_STATS);
      setIsLoading(false);
      return;
    }

    try {
      const response = await query<ProtocolStatsResponse>(
        PROTOCOL_STATS_QUERY,
        {},
        { chainId }
      );
      setData(response.protocol);
      setError(null);
    } catch (err: unknown) {
      logger.error('useProtocolStats failed', err);
      setError(err instanceof Error ? err : new Error('Failed to fetch protocol stats'));
      // Fall back to mock data on error
      setData(MOCK_PROTOCOL_STATS);
    } finally {
      setIsLoading(false);
    }
  }, [chainId]);

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
// HOOK: useProtocolDayData
// ─────────────────────────────────────────────────────────────────────────────────

interface UseProtocolDayDataOptions {
  chainId: number;
  days?: number;
}

interface UseProtocolDayDataResult {
  data: ProtocolDayData[];
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

export function useProtocolDayData(options: UseProtocolDayDataOptions): UseProtocolDayDataResult {
  const { chainId, days = 30 } = options;
  
  const [data, setData] = useState<ProtocolDayData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = useCallback(async () => {
    // Generate mock data if subgraph not configured
    if (!isSubgraphConfigured(chainId)) {
      const mockData: ProtocolDayData[] = [];
      const now = Math.floor(Date.now() / 1000);
      const daySeconds = 86400;
      
      for (let i = 0; i < days; i++) {
        const date = now - (i * daySeconds);
        mockData.push({
          id: `${Math.floor(date / daySeconds)}`,
          date: Math.floor(date / daySeconds) * daySeconds,
          volumeUSD: String(Math.random() * 5000000 + 1000000),
          tvlUSD: String(Math.random() * 50000000 + 100000000),
          feesUSD: String(Math.random() * 15000 + 5000),
          txCount: String(Math.floor(Math.random() * 2000 + 500)),
          uniqueUsers: String(Math.floor(Math.random() * 200 + 50)),
        });
      }
      
      setData(mockData);
      setIsLoading(false);
      return;
    }

    try {
      const response = await query<ProtocolDayDataResponse>(
        PROTOCOL_DAY_DATA_QUERY,
        { first: days },
        { chainId }
      );
      setData(response.protocolDayDatas);
      setError(null);
    } catch (err: unknown) {
      logger.error('useProtocolDayData failed', err);
      setError(err instanceof Error ? err : new Error('Failed to fetch protocol day data'));
    } finally {
      setIsLoading(false);
    }
  }, [chainId, days]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, isLoading, error, refetch: fetchData };
}

// ─────────────────────────────────────────────────────────────────────────────────
// FORMATTED STATS HELPER
// ─────────────────────────────────────────────────────────────────────────────────

export interface FormattedProtocolStats {
  totalVolumeUSD: number;
  totalSwaps: number;
  totalUsers: number;
  totalVaults: number;
  totalGasSavedETH: number;
  totalStakedUSD: number;
  totalRewardsUSD: number;
}

export function formatProtocolStats(protocol: Protocol | null): FormattedProtocolStats | null {
  if (!protocol) return null;

  return {
    totalVolumeUSD: parseFloat(protocol.totalVolumeUSD),
    totalSwaps: parseInt(protocol.totalSwaps),
    totalUsers: parseInt(protocol.totalUsers),
    totalVaults: parseInt(protocol.totalVaults),
    totalGasSavedETH: parseInt(protocol.totalGasSaved) / 1e18,
    totalStakedUSD: parseFloat(protocol.totalStaked) / 1e18, // Assuming 18 decimals
    totalRewardsUSD: parseFloat(protocol.totalRewardsDistributed) / 1e18,
  };
}
