/** Buffer wrapping/unwrapping operations */
import { useState, useCallback, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Address, Hash, formatUnits } from 'viem';
import { useWalletClient, usePublicClient, useAccount, useChainId } from 'wagmi';
import { getPublicClient } from '../../lib/wagmi';
import { getContractAddress, isContractConfigured, getTxUrl } from '../../lib/contracts/addresses';
import { ABIS } from '../../lib/contracts/config';
import { BufferState, TransactionStatus } from '../../lib/contracts/types';
import { handleError, IgnisError, logError, isUserRejection } from '../../lib/contracts/errors';
import { assertPositiveAmount, assertSufficientBalance } from '../../lib/contracts/validation';
import { TX_TIMEOUT_MS, withTimeout } from '../../lib/contracts/txUtils';
import { invalidateUserQueries, invalidateBufferState, QUERY_KEYS, CACHE_TIMES } from '../../lib/queryClient';

// ─────────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────────

export interface BufferStatus {
  vault: Address;
  underlyingBalance: bigint;
  sharesBalance: bigint;
  targetUnderlying: bigint;
  targetShares: bigint;
  // Calculated
  underlyingRatio: number;
  sharesRatio: number;
  health: 'excellent' | 'good' | 'fair' | 'poor' | 'critical';
  healthPercent: number;
  canWrap: (amount: bigint) => boolean;
  canUnwrap: (amount: bigint) => boolean;
}

export interface WrapUnwrapResult {
  hash: Hash;
  amountIn: bigint;
  amountOut: bigint;
  usedBuffer: boolean;
  txUrl: string;
}

// ─────────────────────────────────────────────────────────────────────────────────
// BUFFER STATE HOOK
// ─────────────────────────────────────────────────────────────────────────────────

interface UseBufferStatusOptions {
  vault: Address | null;
  chainId: number;
  refetchInterval?: number;
}

interface UseBufferStatusResult {
  buffer: BufferStatus | null;
  isLoading: boolean;
  isError: boolean;
  error: IgnisError | null;
  refetch: () => Promise<void>;
}

export function useBufferStatus(options: UseBufferStatusOptions): UseBufferStatusResult {
  const { vault, chainId, refetchInterval = CACHE_TIMES.BUFFER_STATE } = options;
  const queryClient = useQueryClient();

  const isConfigured = useMemo(() => {
    return isContractConfigured(chainId, 'gateway4626Buffer');
  }, [chainId]);

  const queryKey = useMemo(() => {
    if (!vault) return null;
    return QUERY_KEYS.bufferState(chainId, vault);
  }, [chainId, vault]);

  const query = useQuery({
    queryKey: queryKey ?? ['buffer', 'disabled'],
    queryFn: async (): Promise<BufferStatus> => {
      if (!vault) throw new Error('No vault');

      if (!isConfigured) {
        throw new IgnisError({
          code: 'NOT_CONFIGURED',
          message: 'Buffer contract not configured',
          userMessage: 'Buffer not available on this network',
        });
      }

      const publicClient = getPublicClient(chainId);
      const bufferAddress = getContractAddress(chainId, 'gateway4626Buffer');

      // Fetch buffer state
      const state = await publicClient.readContract({
        address: bufferAddress,
        abi: ABIS.Gateway4626Buffer,
        functionName: 'getBufferState',
        args: [vault],
      }) as BufferState;

      // Calculate ratios
      const underlyingRatio = state.targetUnderlying > BigInt(0)
        ? Number((state.underlyingBalance * BigInt(10000)) / state.targetUnderlying) / 10000
        : 1;

      const sharesRatio = state.targetShares > BigInt(0)
        ? Number((state.sharesBalance * BigInt(10000)) / state.targetShares) / 10000
        : 1;

      // Calculate health
      const avgRatio = (underlyingRatio + sharesRatio) / 2;
      const healthPercent = Math.min(avgRatio * 100, 100);
      
      let health: BufferStatus['health'];
      if (avgRatio >= 0.8) health = 'excellent';
      else if (avgRatio >= 0.6) health = 'good';
      else if (avgRatio >= 0.4) health = 'fair';
      else if (avgRatio >= 0.2) health = 'poor';
      else health = 'critical';

      return {
        vault,
        underlyingBalance: state.underlyingBalance,
        sharesBalance: state.sharesBalance,
        targetUnderlying: state.targetUnderlying,
        targetShares: state.targetShares,
        underlyingRatio,
        sharesRatio,
        health,
        healthPercent,
        canWrap: (amount: bigint) => state.sharesBalance >= amount,
        canUnwrap: (amount: bigint) => state.underlyingBalance >= amount,
      };
    },
    enabled: !!vault && isConfigured,
    staleTime: CACHE_TIMES.BUFFER_STATE,
    gcTime: CACHE_TIMES.BUFFER_STATE * 2,
    refetchInterval,
    retry: 2,
  });

  const refetch = useCallback(async () => {
    if (queryKey) {
      await queryClient.invalidateQueries({ queryKey });
    }
  }, [queryClient, queryKey]);

  const error = useMemo(() => {
    if (!query.error) return null;
    return handleError(query.error);
  }, [query.error]);

  return {
    buffer: query.data ?? null,
    isLoading: query.isLoading,
    isError: query.isError,
    error,
    refetch,
  };
}

// ─────────────────────────────────────────────────────────────────────────────────
// VAULT EXCHANGE RATE HOOK
// ─────────────────────────────────────────────────────────────────────────────────

interface UseExchangeRateResult {
  rate: bigint;
  rateFormatted: number;
  isLoading: boolean;
  isError: boolean;
  error: IgnisError | null;
  refetch: () => Promise<void>;
}

export function useVaultExchangeRate(
  vault: Address | null,
  chainId: number
): UseExchangeRateResult {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: vault ? ['vault', 'rate', chainId, vault] : ['vault', 'rate', 'disabled'],
    queryFn: async (): Promise<{ rate: bigint; formatted: number }> => {
      if (!vault) throw new Error('No vault');

      const publicClient = getPublicClient(chainId);

      // Get assets per share (1e18 shares)
      const assetsPerShare = await publicClient.readContract({
        address: vault,
        abi: ABIS.ERC4626,
        functionName: 'convertToAssets',
        args: [BigInt('1000000000000000000')], // 1 share with 18 decimals
      }) as bigint;

      return {
        rate: assetsPerShare,
        formatted: Number(formatUnits(assetsPerShare, 18)),
      };
    },
    enabled: !!vault,
    staleTime: CACHE_TIMES.BUFFER_STATE,
    gcTime: CACHE_TIMES.BUFFER_STATE * 2,
    retry: 2,
  });

  const refetch = useCallback(async () => {
    if (vault) {
      await queryClient.invalidateQueries({
        queryKey: ['vault', 'rate', chainId, vault],
      });
    }
  }, [queryClient, chainId, vault]);

  const error = useMemo(() => {
    if (!query.error) return null;
    return handleError(query.error);
  }, [query.error]);

  return {
    rate: query.data?.rate ?? BigInt('1000000000000000000'),
    rateFormatted: query.data?.formatted ?? 1,
    isLoading: query.isLoading,
    isError: query.isError,
    error,
    refetch,
  };
}

// ─────────────────────────────────────────────────────────────────────────────────
// CONVERT TO SHARES HOOK
// ─────────────────────────────────────────────────────────────────────────────────

export function useConvertToShares(
  vault: Address | null,
  assets: bigint,
  chainId: number
): { shares: bigint; isLoading: boolean } {
  const query = useQuery({
    queryKey: vault && assets > BigInt(0)
      ? ['vault', 'toShares', chainId, vault, assets.toString()]
      : ['vault', 'toShares', 'disabled'],
    queryFn: async (): Promise<bigint> => {
      if (!vault || assets === BigInt(0)) return BigInt(0);

      const publicClient = getPublicClient(chainId);

      return await publicClient.readContract({
        address: vault,
        abi: ABIS.ERC4626,
        functionName: 'convertToShares',
        args: [assets],
      }) as bigint;
    },
    enabled: !!vault && assets > BigInt(0),
    staleTime: 5000, // 5 seconds - conversions should be fresh
    gcTime: 10000,
  });

  return {
    shares: query.data ?? BigInt(0),
    isLoading: query.isLoading,
  };
}

// ─────────────────────────────────────────────────────────────────────────────────
// CONVERT TO ASSETS HOOK
// ─────────────────────────────────────────────────────────────────────────────────

export function useConvertToAssets(
  vault: Address | null,
  shares: bigint,
  chainId: number
): { assets: bigint; isLoading: boolean } {
  const query = useQuery({
    queryKey: vault && shares > BigInt(0)
      ? ['vault', 'toAssets', chainId, vault, shares.toString()]
      : ['vault', 'toAssets', 'disabled'],
    queryFn: async (): Promise<bigint> => {
      if (!vault || shares === BigInt(0)) return BigInt(0);

      const publicClient = getPublicClient(chainId);

      return await publicClient.readContract({
        address: vault,
        abi: ABIS.ERC4626,
        functionName: 'convertToAssets',
        args: [shares],
      }) as bigint;
    },
    enabled: !!vault && shares > BigInt(0),
    staleTime: 5000,
    gcTime: 10000,
  });

  return {
    assets: query.data ?? BigInt(0),
    isLoading: query.isLoading,
  };
}

// ─────────────────────────────────────────────────────────────────────────────────
// WRAP HOOK
// ─────────────────────────────────────────────────────────────────────────────────

interface UseWrapResult {
  wrap: (vault: Address, amount: bigint, recipient: Address) => Promise<WrapUnwrapResult>;
  status: TransactionStatus;
  txHash: Hash | null;
  error: IgnisError | null;
  reset: () => void;
  isPending: boolean;
  isSuccess: boolean;
  isError: boolean;
}

interface UseUnwrapResult {
  unwrap: (vault: Address, shares: bigint, recipient: Address) => Promise<WrapUnwrapResult>;
  status: TransactionStatus;
  txHash: Hash | null;
  error: IgnisError | null;
  reset: () => void;
  isPending: boolean;
  isSuccess: boolean;
  isError: boolean;
}

export function useWrap(): UseWrapResult {
  const { data: walletClient } = useWalletClient();
  const publicClient = usePublicClient();
  const { address: account } = useAccount();
  const chainId = useChainId();
  const queryClient = useQueryClient();

  const [status, setStatus] = useState<TransactionStatus>('idle');
  const [txHash, setTxHash] = useState<Hash | null>(null);
  const [error, setError] = useState<IgnisError | null>(null);

  const reset = useCallback(() => {
    setStatus('idle');
    setTxHash(null);
    setError(null);
  }, []);

  const wrap = useCallback(async (
    vault: Address,
    amount: bigint,
    recipient: Address
  ): Promise<WrapUnwrapResult> => {
    if (!walletClient || !publicClient || !account) {
      throw new IgnisError({
        code: 'NO_WALLET',
        message: 'Wallet not connected',
        userMessage: 'Please connect your wallet',
      });
    }

    if (!isContractConfigured(chainId, 'gateway4626Buffer')) {
      throw new IgnisError({
        code: 'NOT_CONFIGURED',
        message: 'Buffer not configured',
        userMessage: 'Buffer not available',
      });
    }

    // ─────────────────────────────────────────────────────────────────────────────
    // P1 SECURITY VALIDATIONS
    // ─────────────────────────────────────────────────────────────────────────────
    
    // Validate amount is positive
    assertPositiveAmount(amount, 'Wrap amount');

    try {
      reset();
      const bufferAddress = getContractAddress(chainId, 'gateway4626Buffer');

      // Get underlying token
      const underlying = await publicClient.readContract({
        address: vault,
        abi: ABIS.ERC4626,
        functionName: 'asset',
      }) as Address;

      // P1: Check user has sufficient balance before proceeding
      const balance = await publicClient.readContract({
        address: underlying,
        abi: ABIS.ERC20,
        functionName: 'balanceOf',
        args: [account],
      }) as bigint;

      const symbol = await publicClient.readContract({
        address: underlying,
        abi: ABIS.ERC20,
        functionName: 'symbol',
      }) as string;

      assertSufficientBalance(amount, balance, symbol);

      // Check and approve underlying
      const allowance = await publicClient.readContract({
        address: underlying,
        abi: ABIS.ERC20,
        functionName: 'allowance',
        args: [account, bufferAddress],
      }) as bigint;

      if (allowance < amount) {
        setStatus('approving');
        const approveHash = await walletClient.writeContract({
          address: underlying,
          abi: ABIS.ERC20 as readonly unknown[],
          functionName: 'approve',
          args: [bufferAddress, amount],
        });
        await withTimeout(
          publicClient.waitForTransactionReceipt({ hash: approveHash }),
          TX_TIMEOUT_MS,
          approveHash
        );
      }

      // Wrap
      setStatus('awaiting_signature');

      const gas = await publicClient.estimateContractGas({
        address: bufferAddress,
        abi: ABIS.Gateway4626Buffer as readonly unknown[],
        functionName: 'wrap',
        args: [vault, amount, recipient],
        account,
      });

      const hash = await walletClient.writeContract({
        address: bufferAddress,
        abi: ABIS.Gateway4626Buffer as readonly unknown[],
        functionName: 'wrap',
        args: [vault, amount, recipient],
        gas: (gas * BigInt(120)) / BigInt(100),
      });

      setTxHash(hash);
      setStatus('confirming');

      const receipt = await withTimeout(
        publicClient.waitForTransactionReceipt({ hash }),
        TX_TIMEOUT_MS,
        hash
      );

      if (receipt.status === 'reverted') {
        throw new IgnisError({
          code: 'WRAP_REVERTED',
          message: 'Wrap transaction reverted',
          userMessage: 'Wrap failed',
        });
      }

      setStatus('success');
      invalidateUserQueries(queryClient, chainId, account);
      invalidateBufferState(queryClient, chainId, vault);

      // TODO: Parse Wrapped event for actual amountOut
      return {
        hash,
        amountIn: amount,
        amountOut: amount, // Placeholder
        usedBuffer: true, // TODO: Parse from event
        txUrl: getTxUrl(chainId, hash),
      };
    } catch (err: unknown) {
      const ignisError = handleError(err);
      setError(ignisError);
      setStatus(isUserRejection(err) ? 'rejected' : 'failed');
      logError('useWrap', err);
      throw ignisError;
    }
  }, [walletClient, publicClient, account, chainId, queryClient, reset]);

  return {
    wrap,
    status,
    txHash,
    error,
    reset,
    isPending: ['awaiting_signature', 'pending', 'confirming', 'approving'].includes(status),
    isSuccess: status === 'success',
    isError: status === 'failed' || status === 'rejected',
  };
}

// ─────────────────────────────────────────────────────────────────────────────────
// UNWRAP HOOK
// ─────────────────────────────────────────────────────────────────────────────────

export function useUnwrap(): UseUnwrapResult {
  const { data: walletClient } = useWalletClient();
  const publicClient = usePublicClient();
  const { address: account } = useAccount();
  const chainId = useChainId();
  const queryClient = useQueryClient();

  const [status, setStatus] = useState<TransactionStatus>('idle');
  const [txHash, setTxHash] = useState<Hash | null>(null);
  const [error, setError] = useState<IgnisError | null>(null);

  const reset = useCallback(() => {
    setStatus('idle');
    setTxHash(null);
    setError(null);
  }, []);

  const unwrap = useCallback(async (
    vault: Address,
    shares: bigint,
    recipient: Address
  ): Promise<WrapUnwrapResult> => {
    if (!walletClient || !publicClient || !account) {
      throw new IgnisError({
        code: 'NO_WALLET',
        message: 'Wallet not connected',
        userMessage: 'Please connect your wallet',
      });
    }

    if (!isContractConfigured(chainId, 'gateway4626Buffer')) {
      throw new IgnisError({
        code: 'NOT_CONFIGURED',
        message: 'Buffer not configured',
        userMessage: 'Buffer not available',
      });
    }

    // ─────────────────────────────────────────────────────────────────────────────
    // P1 SECURITY VALIDATIONS
    // ─────────────────────────────────────────────────────────────────────────────
    
    // Validate shares amount is positive
    assertPositiveAmount(shares, 'Unwrap shares');

    try {
      reset();
      const bufferAddress = getContractAddress(chainId, 'gateway4626Buffer');

      // P1: Check user has sufficient vault shares before proceeding
      const shareBalance = await publicClient.readContract({
        address: vault,
        abi: ABIS.ERC20,
        functionName: 'balanceOf',
        args: [account],
      }) as bigint;

      const vaultSymbol = await publicClient.readContract({
        address: vault,
        abi: ABIS.ERC20,
        functionName: 'symbol',
      }) as string;

      assertSufficientBalance(shares, shareBalance, vaultSymbol);

      // Check and approve vault shares
      const allowance = await publicClient.readContract({
        address: vault,
        abi: ABIS.ERC20,
        functionName: 'allowance',
        args: [account, bufferAddress],
      }) as bigint;

      if (allowance < shares) {
        setStatus('approving');
        const approveHash = await walletClient.writeContract({
          address: vault,
          abi: ABIS.ERC20 as readonly unknown[],
          functionName: 'approve',
          args: [bufferAddress, shares],
        });
        await withTimeout(
          publicClient.waitForTransactionReceipt({ hash: approveHash }),
          TX_TIMEOUT_MS,
          approveHash
        );
      }

      // Unwrap
      setStatus('awaiting_signature');

      const gas = await publicClient.estimateContractGas({
        address: bufferAddress,
        abi: ABIS.Gateway4626Buffer as readonly unknown[],
        functionName: 'unwrap',
        args: [vault, shares, recipient],
        account,
      });

      const hash = await walletClient.writeContract({
        address: bufferAddress,
        abi: ABIS.Gateway4626Buffer as readonly unknown[],
        functionName: 'unwrap',
        args: [vault, shares, recipient],
        gas: (gas * BigInt(120)) / BigInt(100),
      });

      setTxHash(hash);
      setStatus('confirming');

      const receipt = await withTimeout(
        publicClient.waitForTransactionReceipt({ hash }),
        TX_TIMEOUT_MS,
        hash
      );

      if (receipt.status === 'reverted') {
        throw new IgnisError({
          code: 'UNWRAP_REVERTED',
          message: 'Unwrap transaction reverted',
          userMessage: 'Unwrap failed',
        });
      }

      setStatus('success');
      invalidateUserQueries(queryClient, chainId, account);
      invalidateBufferState(queryClient, chainId, vault);

      return {
        hash,
        amountIn: shares,
        amountOut: shares, // Placeholder
        usedBuffer: true,
        txUrl: getTxUrl(chainId, hash),
      };
    } catch (err: unknown) {
      const ignisError = handleError(err);
      setError(ignisError);
      setStatus(isUserRejection(err) ? 'rejected' : 'failed');
      logError('useUnwrap', err);
      throw ignisError;
    }
  }, [walletClient, publicClient, account, chainId, queryClient, reset]);

  return {
    unwrap,
    status,
    txHash,
    error,
    reset,
    isPending: ['awaiting_signature', 'pending', 'confirming', 'approving'].includes(status),
    isSuccess: status === 'success',
    isError: status === 'failed' || status === 'rejected',
  };
}

// ─────────────────────────────────────────────────────────────────────────────────
// HELPER FUNCTIONS
// ─────────────────────────────────────────────────────────────────────────────────

/**
 * Get color for buffer health status
 */
export function getBufferHealthColor(health: BufferStatus['health']): string {
  switch (health) {
    case 'excellent': return '#22c55e'; // green
    case 'good': return '#84cc16'; // lime
    case 'fair': return '#eab308'; // yellow
    case 'poor': return '#f97316'; // orange
    case 'critical': return '#ef4444'; // red
  }
}

/**
 * Format buffer health as percentage string
 */
export function formatBufferHealth(percent: number): string {
  return `${percent.toFixed(0)}%`;
}
