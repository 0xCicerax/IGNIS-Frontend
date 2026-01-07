/** Token approval and balance hooks */
import { useState, useCallback, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Address, Hash, formatUnits, parseUnits, maxUint256 } from 'viem';
import { useWalletClient, usePublicClient, useAccount, useChainId } from 'wagmi';
import { getPublicClient } from '../../lib/wagmi';
import { ABIS, MAX_UINT256 } from '../../lib/contracts/config';
import { TransactionStatus } from '../../lib/contracts/types';
import { handleError, IgnisError, logError, isUserRejection } from '../../lib/contracts/errors';
import { TX_TIMEOUT_MS, withTimeout } from '../../lib/contracts/txUtils';
import { QUERY_KEYS, CACHE_TIMES } from '../../lib/queryClient';

// ─────────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────────

export interface TokenBalance {
  raw: bigint;
  formatted: string;
  decimals: number;
}

export interface TokenInfo {
  address: Address;
  symbol: string;
  name: string;
  decimals: number;
  totalSupply: bigint;
}

export interface TokenAllowance {
  raw: bigint;
  isApproved: (amount: bigint) => boolean;
  isUnlimited: boolean;
}

// ─────────────────────────────────────────────────────────────────────────────────
// BALANCE HOOK
// ─────────────────────────────────────────────────────────────────────────────────

interface UseTokenBalanceOptions {
  token: Address | null;
  account: Address | null;
  chainId: number;
  watch?: boolean;
  refetchInterval?: number;
}

interface UseTokenBalanceResult {
  balance: TokenBalance | null;
  isLoading: boolean;
  isError: boolean;
  error: IgnisError | null;
  refetch: () => Promise<void>;
}

export function useTokenBalance(options: UseTokenBalanceOptions): UseTokenBalanceResult {
  const { token, account, chainId, watch = false, refetchInterval = CACHE_TIMES.USER_BALANCE } = options;
  const queryClient = useQueryClient();

  const queryKey = useMemo(() => {
    if (!token || !account) return null;
    return QUERY_KEYS.balance(chainId, token, account);
  }, [chainId, token, account]);

  const query = useQuery({
    queryKey: queryKey ?? ['balance', 'disabled'],
    queryFn: async (): Promise<TokenBalance> => {
      if (!token || !account) {
        throw new Error('Token or account not provided');
      }

      const publicClient = getPublicClient(chainId);

      // Fetch decimals and balance in parallel
      const [decimals, balance] = await Promise.all([
        publicClient.readContract({
          address: token,
          abi: ABIS.ERC20,
          functionName: 'decimals',
        }) as Promise<number>,
        publicClient.readContract({
          address: token,
          abi: ABIS.ERC20,
          functionName: 'balanceOf',
          args: [account],
        }) as Promise<bigint>,
      ]);

      return {
        raw: balance,
        formatted: formatUnits(balance, decimals),
        decimals,
      };
    },
    enabled: !!token && !!account,
    staleTime: CACHE_TIMES.USER_BALANCE,
    gcTime: CACHE_TIMES.USER_BALANCE * 2,
    refetchInterval: watch ? refetchInterval : undefined,
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
    balance: query.data ?? null,
    isLoading: query.isLoading,
    isError: query.isError,
    error,
    refetch,
  };
}

// ─────────────────────────────────────────────────────────────────────────────────
// ALLOWANCE HOOK
// ─────────────────────────────────────────────────────────────────────────────────

interface UseTokenAllowanceOptions {
  token: Address | null;
  owner: Address | null;
  spender: Address | null;
  chainId: number;
  watch?: boolean;
}

interface UseTokenAllowanceResult {
  allowance: TokenAllowance | null;
  isLoading: boolean;
  isError: boolean;
  error: IgnisError | null;
  refetch: () => Promise<void>;
}

export function useTokenAllowance(options: UseTokenAllowanceOptions): UseTokenAllowanceResult {
  const { token, owner, spender, chainId, watch = false } = options;
  const queryClient = useQueryClient();

  const queryKey = useMemo(() => {
    if (!token || !owner || !spender) return null;
    return QUERY_KEYS.allowance(chainId, token, owner, spender);
  }, [chainId, token, owner, spender]);

  const query = useQuery({
    queryKey: queryKey ?? ['allowance', 'disabled'],
    queryFn: async (): Promise<TokenAllowance> => {
      if (!token || !owner || !spender) {
        throw new Error('Token, owner, or spender not provided');
      }

      const publicClient = getPublicClient(chainId);

      const allowance = await publicClient.readContract({
        address: token,
        abi: ABIS.ERC20,
        functionName: 'allowance',
        args: [owner, spender],
      }) as bigint;

      // Check if it's an "unlimited" approval (> 2^200)
      const UNLIMITED_THRESHOLD = BigInt(2) ** BigInt(200);
      const isUnlimited = allowance >= UNLIMITED_THRESHOLD;

      return {
        raw: allowance,
        isApproved: (amount: bigint) => allowance >= amount,
        isUnlimited,
      };
    },
    enabled: !!token && !!owner && !!spender,
    staleTime: CACHE_TIMES.USER_ALLOWANCE,
    gcTime: CACHE_TIMES.USER_ALLOWANCE * 2,
    refetchInterval: watch ? CACHE_TIMES.USER_ALLOWANCE : undefined,
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
    allowance: query.data ?? null,
    isLoading: query.isLoading,
    isError: query.isError,
    error,
    refetch,
  };
}

// ─────────────────────────────────────────────────────────────────────────────────
// APPROVE HOOK
// ─────────────────────────────────────────────────────────────────────────────────

interface UseApproveResult {
  approve: (token: Address, spender: Address, amount?: bigint) => Promise<Hash>;
  status: TransactionStatus;
  txHash: Hash | null;
  error: IgnisError | null;
  reset: () => void;
  isPending: boolean;
  isSuccess: boolean;
  isError: boolean;
}

export function useApprove(): UseApproveResult {
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

  const approve = useCallback(async (
    token: Address,
    spender: Address,
    amount: bigint = maxUint256
  ): Promise<Hash> => {
    if (!walletClient) {
      throw new IgnisError({
        code: 'NO_WALLET',
        message: 'Wallet not connected',
        userMessage: 'Please connect your wallet',
      });
    }

    if (!publicClient) {
      throw new IgnisError({
        code: 'NO_CLIENT',
        message: 'Public client not available',
        userMessage: 'Network connection error',
      });
    }

    try {
      reset();
      setStatus('awaiting_signature');

      // Estimate gas
      const gas = await publicClient.estimateContractGas({
        address: token,
        abi: ABIS.ERC20 as readonly unknown[],
        functionName: 'approve',
        args: [spender, amount],
        account: walletClient.account,
      });

      // Add 20% buffer
      const gasWithBuffer = (gas * BigInt(120)) / BigInt(100);

      // Send transaction
      const hash = await walletClient.writeContract({
        address: token,
        abi: ABIS.ERC20 as readonly unknown[],
        functionName: 'approve',
        args: [spender, amount],
        gas: gasWithBuffer,
      });

      setTxHash(hash);
      setStatus('pending');

      // Wait for confirmation with timeout
      setStatus('confirming');
      const receipt = await withTimeout(
        publicClient.waitForTransactionReceipt({ hash, confirmations: 1 }),
        TX_TIMEOUT_MS,
        hash
      );

      if (receipt.status === 'reverted') {
        throw new IgnisError({
          code: 'APPROVAL_REVERTED',
          message: 'Approval transaction reverted',
          userMessage: 'Approval failed',
        });
      }

      setStatus('success');

      // Invalidate allowance cache
      if (account) {
        queryClient.invalidateQueries({
          predicate: (query) =>
            query.queryKey[0] === 'allowance' &&
            query.queryKey[2] === token.toLowerCase(),
        });
      }

      return hash;
    } catch (err: unknown) {
      const ignisError = handleError(err);
      setError(ignisError);

      if (isUserRejection(err)) {
        setStatus('rejected');
      } else {
        setStatus('failed');
      }

      logError('useApprove', err, { token, spender, amount: amount.toString() });
      throw ignisError;
    }
  }, [walletClient, publicClient, account, queryClient, reset]);

  return {
    approve,
    status,
    txHash,
    error,
    reset,
    isPending: status === 'pending' || status === 'awaiting_signature' || status === 'confirming',
    isSuccess: status === 'success',
    isError: status === 'failed' || status === 'rejected',
  };
}

// ─────────────────────────────────────────────────────────────────────────────────
// TOKEN INFO HOOK
// ─────────────────────────────────────────────────────────────────────────────────

interface UseTokenInfoResult {
  info: TokenInfo | null;
  isLoading: boolean;
  isError: boolean;
  error: IgnisError | null;
}

export function useTokenInfo(token: Address | null, chainId: number): UseTokenInfoResult {
  const query = useQuery({
    queryKey: token ? QUERY_KEYS.token(chainId, token) : ['token', 'disabled'],
    queryFn: async (): Promise<TokenInfo> => {
      if (!token) throw new Error('No token');

      const publicClient = getPublicClient(chainId);

      const [symbol, name, decimals, totalSupply] = await Promise.all([
        publicClient.readContract({
          address: token,
          abi: ABIS.ERC20,
          functionName: 'symbol',
        }) as Promise<string>,
        publicClient.readContract({
          address: token,
          abi: ABIS.ERC20,
          functionName: 'name',
        }) as Promise<string>,
        publicClient.readContract({
          address: token,
          abi: ABIS.ERC20,
          functionName: 'decimals',
        }) as Promise<number>,
        publicClient.readContract({
          address: token,
          abi: ABIS.ERC20,
          functionName: 'totalSupply',
        }) as Promise<bigint>,
      ]);

      return {
        address: token,
        symbol,
        name,
        decimals,
        totalSupply,
      };
    },
    enabled: !!token,
    staleTime: CACHE_TIMES.TOKEN_LIST, // Token info is stable
    gcTime: CACHE_TIMES.TOKEN_LIST * 2,
    retry: 2,
  });

  const error = useMemo(() => {
    if (!query.error) return null;
    return handleError(query.error);
  }, [query.error]);

  return {
    info: query.data ?? null,
    isLoading: query.isLoading,
    isError: query.isError,
    error,
  };
}

// ─────────────────────────────────────────────────────────────────────────────────
// MULTI-TOKEN BALANCE HOOK
// ─────────────────────────────────────────────────────────────────────────────────

interface TokenBalanceItem {
  token: Address;
  balance: bigint;
  decimals: number;
  formatted: string;
}

interface UseMultipleTokenBalancesResult {
  balances: TokenBalanceItem[];
  isLoading: boolean;
  isError: boolean;
  error: IgnisError | null;
  refetch: () => Promise<void>;
}

export function useMultipleTokenBalances(
  tokens: Address[],
  account: Address | null,
  chainId: number
): UseMultipleTokenBalancesResult {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: account ? ['balances', chainId, account, tokens.join(',')] : ['balances', 'disabled'],
    queryFn: async (): Promise<TokenBalanceItem[]> => {
      if (!account || tokens.length === 0) {
        return [];
      }

      const publicClient = getPublicClient(chainId);

      const results = await Promise.all(
        tokens.map(async (token) => {
          try {
            const [balance, decimals] = await Promise.all([
              publicClient.readContract({
                address: token,
                abi: ABIS.ERC20,
                functionName: 'balanceOf',
                args: [account],
              }) as Promise<bigint>,
              publicClient.readContract({
                address: token,
                abi: ABIS.ERC20,
                functionName: 'decimals',
              }) as Promise<number>,
            ]);

            return {
              token,
              balance,
              decimals,
              formatted: formatUnits(balance, decimals),
            };
          } catch {
            return {
              token,
              balance: BigInt(0),
              decimals: 18,
              formatted: '0',
            };
          }
        })
      );

      return results;
    },
    enabled: !!account && tokens.length > 0,
    staleTime: CACHE_TIMES.USER_BALANCE,
    gcTime: CACHE_TIMES.USER_BALANCE * 2,
    retry: 2,
  });

  const refetch = useCallback(async () => {
    await queryClient.invalidateQueries({
      predicate: (q) => q.queryKey[0] === 'balances',
    });
  }, [queryClient]);

  const error = useMemo(() => {
    if (!query.error) return null;
    return handleError(query.error);
  }, [query.error]);

  return {
    balances: query.data ?? [],
    isLoading: query.isLoading,
    isError: query.isError,
    error,
    refetch,
  };
}

// ─────────────────────────────────────────────────────────────────────────────────
// HELPER FUNCTIONS
// ─────────────────────────────────────────────────────────────────────────────────

/**
 * Format balance for display
 */
export function formatBalance(balance: bigint, decimals: number, precision: number = 4): string {
  const formatted = formatUnits(balance, decimals);
  const num = parseFloat(formatted);
  
  if (num === 0) return '0';
  if (num < 0.0001) return '<0.0001';
  
  return num.toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: precision,
  });
}

/**
 * Parse user input to bigint
 */
export function parseTokenAmount(amount: string, decimals: number): bigint {
  try {
    // Handle empty or invalid input
    if (!amount || amount === '' || amount === '.') {
      return BigInt(0);
    }
    
    // Remove trailing zeros after decimal
    const cleaned = amount.replace(/\.?0+$/, '') || '0';
    
    return parseUnits(cleaned, decimals);
  } catch {
    return BigInt(0);
  }
}
