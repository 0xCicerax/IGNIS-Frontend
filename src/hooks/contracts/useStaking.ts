/** Staking operations via BufferStaker */
import { useState, useCallback, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Address, Hash, formatUnits } from 'viem';
import { useWalletClient, usePublicClient, useAccount, useChainId } from 'wagmi';
import { getPublicClient } from '../../lib/wagmi';
import { getContractAddress, isContractConfigured } from '../../lib/contracts/addresses';
import { ABIS } from '../../lib/contracts/config';
import { StakingPoolInfo, TransactionStatus } from '../../lib/contracts/types';
import { handleError, IgnisError, logError, isUserRejection } from '../../lib/contracts/errors';
import { assertPositiveAmount, assertSufficientBalance } from '../../lib/contracts/validation';
import { TX_TIMEOUT_MS, withTimeout } from '../../lib/contracts/txUtils';
import { invalidateUserQueries, QUERY_KEYS, CACHE_TIMES } from '../../lib/queryClient';

// ─────────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────────

export interface StakingPosition {
  underlying: Address;
  stakedAmount: bigint;
  stakedFormatted: string;
  pendingRewards: bigint;
  pendingRewardsFormatted: string;
  underlyingDecimals: number;
  rewardDecimals: number;
}

export interface StakingPoolData {
  underlying: Address;
  totalStaked: bigint;
  totalStakedFormatted: string;
  rewardRate: bigint;
  apr: number;
  decimals: number;
}

export interface StakingResult {
  hash: Hash;
  amount: bigint;
}

// ─────────────────────────────────────────────────────────────────────────────────
// STAKING POSITION HOOK
// ─────────────────────────────────────────────────────────────────────────────────

interface UseStakingPositionOptions {
  underlying: Address | null;
  account: Address | null;
  chainId: number;
}

interface UseStakingPositionResult {
  position: StakingPosition | null;
  isLoading: boolean;
  isError: boolean;
  error: IgnisError | null;
  refetch: () => Promise<void>;
}

export function useStakingPosition(options: UseStakingPositionOptions): UseStakingPositionResult {
  const { underlying, account, chainId } = options;
  const queryClient = useQueryClient();

  const queryKey = useMemo(() => {
    if (!underlying || !account) return null;
    return QUERY_KEYS.stakingPosition(chainId, underlying, account);
  }, [chainId, underlying, account]);

  const isConfigured = useMemo(() => {
    return isContractConfigured(chainId, 'bufferStaker');
  }, [chainId]);

  const query = useQuery({
    queryKey: queryKey ?? ['staking', 'position', 'disabled'],
    queryFn: async (): Promise<StakingPosition> => {
      if (!underlying || !account) {
        throw new Error('Missing params');
      }

      if (!isConfigured) {
        throw new IgnisError({
          code: 'NOT_CONFIGURED',
          message: 'Staker contract not configured',
          userMessage: 'Staking not available on this network',
        });
      }

      const publicClient = getPublicClient(chainId);
      const stakerAddress = getContractAddress(chainId, 'bufferStaker');

      // Fetch earned rewards
      const earned = await publicClient.readContract({
        address: stakerAddress,
        abi: ABIS.BufferStakerV2,
        functionName: 'earned',
        args: [underlying, account],
      }) as bigint;

      // Get token decimals
      const decimals = await publicClient.readContract({
        address: underlying,
        abi: ABIS.ERC20,
        functionName: 'decimals',
      }) as number;

      // Note: Getting staked amount would require reading user position from contract
      // This is a simplified implementation
      // TODO: Add proper staked amount fetch from contract

      return {
        underlying,
        stakedAmount: BigInt(0), // TODO: Fetch from contract
        stakedFormatted: '0',
        pendingRewards: earned,
        pendingRewardsFormatted: formatUnits(earned, 18), // Assume 18 for reward token
        underlyingDecimals: decimals,
        rewardDecimals: 18,
      };
    },
    enabled: !!underlying && !!account && isConfigured,
    staleTime: CACHE_TIMES.USER_POSITION,
    gcTime: CACHE_TIMES.USER_POSITION * 2,
    refetchInterval: 30000, // Refresh every 30 seconds for rewards
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
    position: query.data ?? null,
    isLoading: query.isLoading,
    isError: query.isError,
    error,
    refetch,
  };
}

// ─────────────────────────────────────────────────────────────────────────────────
// STAKING POOL INFO HOOK
// ─────────────────────────────────────────────────────────────────────────────────

interface UseStakingPoolResult {
  pool: StakingPoolData | null;
  isLoading: boolean;
  isError: boolean;
  error: IgnisError | null;
  refetch: () => Promise<void>;
}

export function useStakingPool(underlying: Address | null, chainId: number): UseStakingPoolResult {
  const queryClient = useQueryClient();

  const isConfigured = useMemo(() => {
    return isContractConfigured(chainId, 'bufferStaker');
  }, [chainId]);

  const query = useQuery({
    queryKey: underlying ? ['staking', 'pool', chainId, underlying] : ['staking', 'pool', 'disabled'],
    queryFn: async (): Promise<StakingPoolData> => {
      if (!underlying) throw new Error('No underlying');

      if (!isConfigured) {
        throw new IgnisError({
          code: 'NOT_CONFIGURED',
          message: 'Staker contract not configured',
          userMessage: 'Staking not available on this network',
        });
      }

      const publicClient = getPublicClient(chainId);
      const stakerAddress = getContractAddress(chainId, 'bufferStaker');

      // Get pool info
      const poolInfo = await publicClient.readContract({
        address: stakerAddress,
        abi: ABIS.BufferStakerV2,
        functionName: 'getPool',
        args: [underlying],
      }) as StakingPoolInfo;

      // Get underlying decimals
      const decimals = await publicClient.readContract({
        address: underlying,
        abi: ABIS.ERC20,
        functionName: 'decimals',
      }) as number;

      // Calculate APR
      // APR = (rewardRate * secondsPerYear) / totalStaked * 100
      const SECONDS_PER_YEAR = BigInt(365 * 24 * 60 * 60);
      let apr = 0;
      
      if (poolInfo.totalStaked > BigInt(0)) {
        const yearlyRewards = poolInfo.rewardRate * SECONDS_PER_YEAR;
        // Simplified APR calculation (assumes 1:1 token value)
        apr = Number((yearlyRewards * BigInt(10000)) / poolInfo.totalStaked) / 100;
      }

      return {
        underlying,
        totalStaked: poolInfo.totalStaked,
        totalStakedFormatted: formatUnits(poolInfo.totalStaked, decimals),
        rewardRate: poolInfo.rewardRate,
        apr: Math.min(apr, 1000), // Cap at 1000%
        decimals,
      };
    },
    enabled: !!underlying && isConfigured,
    staleTime: CACHE_TIMES.POOL_STATS,
    gcTime: CACHE_TIMES.POOL_STATS * 2,
    retry: 2,
  });

  const refetch = useCallback(async () => {
    if (underlying) {
      await queryClient.invalidateQueries({
        queryKey: ['staking', 'pool', chainId, underlying],
      });
    }
  }, [queryClient, chainId, underlying]);

  const error = useMemo(() => {
    if (!query.error) return null;
    return handleError(query.error);
  }, [query.error]);

  return {
    pool: query.data ?? null,
    isLoading: query.isLoading,
    isError: query.isError,
    error,
    refetch,
  };
}

// ─────────────────────────────────────────────────────────────────────────────────
// STAKE HOOK
// ─────────────────────────────────────────────────────────────────────────────────

interface UseStakeResult {
  stake: (underlying: Address, amount: bigint) => Promise<StakingResult>;
  status: TransactionStatus;
  txHash: Hash | null;
  error: IgnisError | null;
  reset: () => void;
  isPending: boolean;
  isSuccess: boolean;
  isError: boolean;
}

interface UseUnstakeResult {
  unstake: (underlying: Address, amount: bigint) => Promise<StakingResult>;
  status: TransactionStatus;
  txHash: Hash | null;
  error: IgnisError | null;
  reset: () => void;
  isPending: boolean;
  isSuccess: boolean;
  isError: boolean;
}

export function useStake(): UseStakeResult {
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

  const stake = useCallback(async (
    underlying: Address,
    amount: bigint
  ): Promise<StakingResult> => {
    if (!walletClient || !publicClient || !account) {
      throw new IgnisError({
        code: 'NO_WALLET',
        message: 'Wallet not connected',
        userMessage: 'Please connect your wallet',
      });
    }

    if (!isContractConfigured(chainId, 'bufferStaker')) {
      throw new IgnisError({
        code: 'NOT_CONFIGURED',
        message: 'Staker not configured',
        userMessage: 'Staking not available',
      });
    }

    // ─────────────────────────────────────────────────────────────────────────────
    // P1 SECURITY VALIDATIONS
    // ─────────────────────────────────────────────────────────────────────────────
    
    // Validate amount is positive
    assertPositiveAmount(amount, 'Stake amount');

    try {
      reset();
      const stakerAddress = getContractAddress(chainId, 'bufferStaker');

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

      // Check and approve
      const allowance = await publicClient.readContract({
        address: underlying,
        abi: ABIS.ERC20,
        functionName: 'allowance',
        args: [account, stakerAddress],
      }) as bigint;

      if (allowance < amount) {
        setStatus('approving');
        const approveHash = await walletClient.writeContract({
          address: underlying,
          abi: ABIS.ERC20 as readonly unknown[],
          functionName: 'approve',
          args: [stakerAddress, amount],
        });
        await withTimeout(
          publicClient.waitForTransactionReceipt({ hash: approveHash }),
          TX_TIMEOUT_MS,
          approveHash
        );
      }

      // Stake
      setStatus('awaiting_signature');
      
      const gas = await publicClient.estimateContractGas({
        address: stakerAddress,
        abi: ABIS.BufferStakerV2 as readonly unknown[],
        functionName: 'deposit',
        args: [underlying, amount],
        account,
      });

      const hash = await walletClient.writeContract({
        address: stakerAddress,
        abi: ABIS.BufferStakerV2 as readonly unknown[],
        functionName: 'deposit',
        args: [underlying, amount],
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
          code: 'STAKE_REVERTED',
          message: 'Stake transaction reverted',
          userMessage: 'Staking failed',
        });
      }

      setStatus('success');
      invalidateUserQueries(queryClient, chainId, account);

      return { hash, amount };
    } catch (err: unknown) {
      const ignisError = handleError(err);
      setError(ignisError);
      setStatus(isUserRejection(err) ? 'rejected' : 'failed');
      logError('useStake', err);
      throw ignisError;
    }
  }, [walletClient, publicClient, account, chainId, queryClient, reset]);

  return {
    stake,
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
// UNSTAKE HOOK
// ─────────────────────────────────────────────────────────────────────────────────

export function useUnstake(): UseUnstakeResult {
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

  const unstake = useCallback(async (
    underlying: Address,
    amount: bigint
  ): Promise<StakingResult> => {
    if (!walletClient || !publicClient || !account) {
      throw new IgnisError({
        code: 'NO_WALLET',
        message: 'Wallet not connected',
        userMessage: 'Please connect your wallet',
      });
    }

    if (!isContractConfigured(chainId, 'bufferStaker')) {
      throw new IgnisError({
        code: 'NOT_CONFIGURED',
        message: 'Staker not configured',
        userMessage: 'Staking not available',
      });
    }

    // ─────────────────────────────────────────────────────────────────────────────
    // P1 SECURITY VALIDATIONS
    // ─────────────────────────────────────────────────────────────────────────────
    
    // Validate amount is positive
    assertPositiveAmount(amount, 'Unstake amount');

    try {
      reset();
      const stakerAddress = getContractAddress(chainId, 'bufferStaker');

      // P1: Check user has sufficient staked balance
      // Note: This requires the contract to expose user staked balance
      // If not available, the contract will revert with a clear error

      setStatus('awaiting_signature');

      const gas = await publicClient.estimateContractGas({
        address: stakerAddress,
        abi: ABIS.BufferStakerV2 as readonly unknown[],
        functionName: 'withdraw',
        args: [underlying, amount],
        account,
      });

      const hash = await walletClient.writeContract({
        address: stakerAddress,
        abi: ABIS.BufferStakerV2 as readonly unknown[],
        functionName: 'withdraw',
        args: [underlying, amount],
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
          code: 'UNSTAKE_REVERTED',
          message: 'Unstake transaction reverted',
          userMessage: 'Unstaking failed',
        });
      }

      setStatus('success');
      invalidateUserQueries(queryClient, chainId, account);

      return { hash, amount };
    } catch (err: unknown) {
      const ignisError = handleError(err);
      setError(ignisError);
      setStatus(isUserRejection(err) ? 'rejected' : 'failed');
      logError('useUnstake', err);
      throw ignisError;
    }
  }, [walletClient, publicClient, account, chainId, queryClient, reset]);

  return {
    unstake,
    status,
    txHash,
    error,
    reset,
    isPending: ['awaiting_signature', 'pending', 'confirming'].includes(status),
    isSuccess: status === 'success',
    isError: status === 'failed' || status === 'rejected',
  };
}

// ─────────────────────────────────────────────────────────────────────────────────
// CLAIM REWARDS HOOK
// ─────────────────────────────────────────────────────────────────────────────────

interface UseClaimResult {
  claim: (underlying: Address) => Promise<Hash>;
  status: TransactionStatus;
  txHash: Hash | null;
  error: IgnisError | null;
  reset: () => void;
  isPending: boolean;
  isSuccess: boolean;
  isError: boolean;
}

export function useClaim(): UseClaimResult {
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

  const claim = useCallback(async (underlying: Address): Promise<Hash> => {
    if (!walletClient || !publicClient || !account) {
      throw new IgnisError({
        code: 'NO_WALLET',
        message: 'Wallet not connected',
        userMessage: 'Please connect your wallet',
      });
    }

    if (!isContractConfigured(chainId, 'bufferStaker')) {
      throw new IgnisError({
        code: 'NOT_CONFIGURED',
        message: 'Staker not configured',
        userMessage: 'Staking not available',
      });
    }

    try {
      reset();
      const stakerAddress = getContractAddress(chainId, 'bufferStaker');

      setStatus('awaiting_signature');

      const gas = await publicClient.estimateContractGas({
        address: stakerAddress,
        abi: ABIS.BufferStakerV2 as readonly unknown[],
        functionName: 'claimRewards',
        args: [underlying],
        account,
      });

      const hash = await walletClient.writeContract({
        address: stakerAddress,
        abi: ABIS.BufferStakerV2 as readonly unknown[],
        functionName: 'claimRewards',
        args: [underlying],
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
          code: 'CLAIM_REVERTED',
          message: 'Claim transaction reverted',
          userMessage: 'Claiming rewards failed',
        });
      }

      setStatus('success');
      invalidateUserQueries(queryClient, chainId, account);

      return hash;
    } catch (err: unknown) {
      const ignisError = handleError(err);
      setError(ignisError);
      setStatus(isUserRejection(err) ? 'rejected' : 'failed');
      logError('useClaim', err);
      throw ignisError;
    }
  }, [walletClient, publicClient, account, chainId, queryClient, reset]);

  return {
    claim,
    status,
    txHash,
    error,
    reset,
    isPending: ['awaiting_signature', 'pending', 'confirming'].includes(status),
    isSuccess: status === 'success',
    isError: status === 'failed' || status === 'rejected',
  };
}
