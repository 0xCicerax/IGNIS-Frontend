
import { useState, useEffect, useCallback } from 'react';
import { query, isSubgraphConfigured } from '../../lib/graphql/client';
import { logger } from '../../utils/logger';
import { VAULTS_QUERY, VAULT_QUERY, BUFFER_STATES_QUERY, BUFFER_STATE_QUERY } from '../../lib/graphql/queries';
import { Vault, VaultsResponse, VaultResponse, BufferState, BufferStatesResponse } from '../../lib/graphql/types';

// ─────────────────────────────────────────────────────────────────────────────────
// MOCK DATA
// ─────────────────────────────────────────────────────────────────────────────────

const MOCK_VAULTS: Vault[] = [
  {
    id: '0x0000000000000000000000000000000000000001',
    vaultToken: {
      id: '0x0000000000000000000000000000000000000001',
      symbol: 'aurUSDC',
      name: 'Aurelia USDC Vault',
      decimals: 6,
      allowed: true,
      isVaultToken: true,
      underlyingToken: null,
      totalVolume: '0',
      totalVolumeUSD: '0',
      swapCount: '0',
    },
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
    name: 'Aurelia USDC Vault',
    symbol: 'aurUSDC',
    decimals: 6,
    enabled: true,
    isPrimary: true,
    gateway: '0x0000000000000000000000000000000000000000',
    maxWrapPerTx: '1000000000000', // 1M USDC
    maxUnwrapPerTx: '1000000000000',
    totalAssetsDeposited: '50000000',
    totalSharesMinted: '49000000',
    totalAssetsWithdrawn: '10000000',
    totalSharesBurned: '9800000',
    exchangeRate: '1.020408',
    bufferState: {
      id: '0x0000000000000000000000000000000000000001',
      vault: {} as Vault,
      underlyingBalance: '500000000000',
      sharesBalance: '490000000000',
      targetUnderlying: '1000000000000',
      targetShares: '980000000000',
      totalWraps: '5000',
      totalUnwraps: '4000',
      bufferHitRate: '0.85',
      missRate: '0.15',
      gasSaved: '1000000000',
      lastRebalance: '1703500000',
      updatedAt: '1703500000',
    },
    disabledAt: '0',
    createdAt: '1700000000',
    updatedAt: '1703500000',
  },
];

// ─────────────────────────────────────────────────────────────────────────────────
// HOOK: useVaults
// ─────────────────────────────────────────────────────────────────────────────────

interface UseVaultsOptions {
  chainId: number;
  first?: number;
  skip?: number;
}

interface UseVaultsResult {
  data: Vault[];
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

export function useVaults(options: UseVaultsOptions): UseVaultsResult {
  const { chainId, first = 50, skip = 0 } = options;
  
  const [data, setData] = useState<Vault[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = useCallback(async () => {
    if (!isSubgraphConfigured(chainId)) {
      setData(MOCK_VAULTS);
      setIsLoading(false);
      return;
    }

    try {
      const response = await query<VaultsResponse>(
        VAULTS_QUERY,
        { first, skip },
        { chainId }
      );
      setData(response.vaults);
      setError(null);
    } catch (err: unknown) {
      logger.error('useVaults failed', err);
      setError(err instanceof Error ? err : new Error('Failed to fetch vaults'));
      setData(MOCK_VAULTS);
    } finally {
      setIsLoading(false);
    }
  }, [chainId, first, skip]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, isLoading, error, refetch: fetchData };
}

// ─────────────────────────────────────────────────────────────────────────────────
// HOOK: useVault
// ─────────────────────────────────────────────────────────────────────────────────

interface UseVaultOptions {
  chainId: number;
  address: string | null;
}

interface UseVaultResult {
  data: Vault | null;
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

export function useVault(options: UseVaultOptions): UseVaultResult {
  const { chainId, address } = options;
  
  const [data, setData] = useState<Vault | null>(null);
  const [isLoading, setIsLoading] = useState(!!address);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = useCallback(async () => {
    if (!address) {
      setData(null);
      setIsLoading(false);
      return;
    }

    if (!isSubgraphConfigured(chainId)) {
      const vault = MOCK_VAULTS.find(v => v.id.toLowerCase() === address.toLowerCase());
      setData(vault || null);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const response = await query<VaultResponse>(
        VAULT_QUERY,
        { id: address.toLowerCase() },
        { chainId }
      );
      setData(response.vault);
      setError(null);
    } catch (err: unknown) {
      logger.error('useVault failed', err);
      setError(err instanceof Error ? err : new Error('Failed to fetch vault'));
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
// HOOK: useBufferStates
// ─────────────────────────────────────────────────────────────────────────────────

interface UseBufferStatesResult {
  data: BufferState[];
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

export function useBufferStates(chainId: number): UseBufferStatesResult {
  const [data, setData] = useState<BufferState[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = useCallback(async () => {
    if (!isSubgraphConfigured(chainId)) {
      const mockBufferStates = MOCK_VAULTS
        .filter(v => v.bufferState)
        .map(v => v.bufferState!);
      setData(mockBufferStates);
      setIsLoading(false);
      return;
    }

    try {
      const response = await query<BufferStatesResponse>(
        BUFFER_STATES_QUERY,
        {},
        { chainId }
      );
      setData(response.bufferStates);
      setError(null);
    } catch (err: unknown) {
      logger.error('useBufferStates failed', err);
      setError(err instanceof Error ? err : new Error('Failed to fetch buffer states'));
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
// VAULT HELPERS
// ─────────────────────────────────────────────────────────────────────────────────

/**
 * Calculate vault APY (estimated)
 * In production, this would come from yield protocol APIs
 */
export function estimateVaultAPY(vault: Vault): number {
  // Placeholder - calculate from exchange rate change over time
  const exchangeRate = parseFloat(vault.exchangeRate);
  // Assume ~5% base APY for yield-bearing vaults
  return (exchangeRate - 1) * 100 + 5;
}

/**
 * Calculate buffer health percentage
 */
export function calculateBufferHealth(bufferState: BufferState | null): number {
  if (!bufferState) return 0;
  
  const underlyingBalance = BigInt(bufferState.underlyingBalance);
  const targetUnderlying = BigInt(bufferState.targetUnderlying);
  
  if (targetUnderlying === BigInt(0)) return 100;
  
  const ratio = Number(underlyingBalance * BigInt(100) / targetUnderlying);
  return Math.min(ratio, 100);
}

/**
 * Check if buffer can handle a wrap/unwrap
 */
export function canBufferHandle(
  bufferState: BufferState | null,
  amount: bigint,
  isWrap: boolean
): boolean {
  if (!bufferState) return false;
  
  if (isWrap) {
    // Check if buffer has enough shares
    const sharesBalance = BigInt(bufferState.sharesBalance);
    return sharesBalance >= amount;
  } else {
    // Check if buffer has enough underlying
    const underlyingBalance = BigInt(bufferState.underlyingBalance);
    return underlyingBalance >= amount;
  }
}

/**
 * Find vault for underlying token
 */
export function findVaultForUnderlying(vaults: Vault[], underlyingAddress: string): Vault | null {
  return vaults.find(
    v => v.underlying.id.toLowerCase() === underlyingAddress.toLowerCase() && v.isPrimary
  ) || null;
}

/**
 * Get all vaults for underlying token
 */
export function findVaultsForUnderlying(vaults: Vault[], underlyingAddress: string): Vault[] {
  return vaults.filter(
    v => v.underlying.id.toLowerCase() === underlyingAddress.toLowerCase()
  );
}
