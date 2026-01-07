/** Swap execution via GatewayRouterV5 */
import { useState, useCallback, useRef } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Address, Hash, encodeFunctionData, parseGwei } from 'viem';
import { useWalletClient, usePublicClient, useAccount, useChainId } from 'wagmi';
import { getContractAddress, isContractConfigured, getTxUrl } from '../../lib/contracts/addresses';
import { ABIS } from '../../lib/contracts/config';
import { ExecuteRouteParams, TransactionStatus, RouteStep } from '../../lib/contracts/types';
import { handleError, IgnisError, logError, isUserRejection } from '../../lib/contracts/errors';
import { assertValidDeadline, assertValidMinAmountOut, assertPositiveAmount } from '../../lib/contracts/validation';
import { invalidateUserQueries, invalidateQuotes, QUERY_KEYS } from '../../lib/queryClient';
import { swapLogger } from '../../utils/logger';

// ─────────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────────

export interface SwapParams {
  encodedRoute: `0x${string}`;
  amountIn: bigint;
  minAmountOut: bigint;
  recipient: Address;
  deadline: bigint;
  tokenIn: Address;
  tokenOut: Address;
  // For ETH swaps
  value?: bigint;
  unwrapToETH?: boolean;
  // Route steps for gas estimation fallback
  route?: RouteStep[];
}

export interface SwapResult {
  hash: Hash;
  amountOut: bigint;
  txUrl: string;
  gasUsed: bigint;
  effectiveGasPrice: bigint;
}

export interface UseSwapResult {
  swap: (params: SwapParams) => Promise<SwapResult>;
  status: TransactionStatus;
  txHash: Hash | null;
  error: IgnisError | null;
  reset: () => void;
  isApproving: boolean;
  isPending: boolean;
  isConfirming: boolean;
  isSuccess: boolean;
  isError: boolean;
}

// ─────────────────────────────────────────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────────────────────────────────────────

const GAS_BUFFER_PERCENT = 20; // Add 20% buffer to gas estimate
const MAX_GAS_LIMIT = BigInt(2_000_000); // 2M gas max
const MIN_GAS_LIMIT = BigInt(100_000); // 100k gas min

/** Transaction timeout in milliseconds (2 minutes) */
const TX_TIMEOUT_MS = 120_000;

// Gas costs per operation type (empirically measured)
const GAS_COSTS = {
  BASE: 80_000n,           // Base transaction cost
  SWAP_CL: 120_000n,       // Concentrated liquidity swap
  SWAP_BIN: 100_000n,      // Bin pool swap
  WRAP: 100_000n,          // ERC4626 deposit
  UNWRAP: 80_000n,         // ERC4626 withdraw
  SAFETY_BUFFER: 50_000n,  // Extra safety margin
} as const;

/**
 * Calculate gas fallback based on route complexity
 * Used when gas estimation fails (RPC error)
 */
function calculateRouteAwareGasFallback(route?: RouteStep[]): bigint {
  if (!route || route.length === 0) {
    // Simple swap fallback
    return GAS_COSTS.BASE + GAS_COSTS.SWAP_CL + GAS_COSTS.SAFETY_BUFFER;
  }

  let gasEstimate = GAS_COSTS.BASE;

  for (const step of route) {
    switch (step.action) {
      case 0: // SWAP_CL
        gasEstimate += GAS_COSTS.SWAP_CL;
        break;
      case 1: // SWAP_BIN
        gasEstimate += GAS_COSTS.SWAP_BIN;
        break;
      case 2: // WRAP
        gasEstimate += GAS_COSTS.WRAP;
        break;
      case 3: // UNWRAP
        gasEstimate += GAS_COSTS.UNWRAP;
        break;
      default:
        // Unknown action, assume CL swap cost
        gasEstimate += GAS_COSTS.SWAP_CL;
    }
  }

  return gasEstimate + GAS_COSTS.SAFETY_BUFFER;
}

// ─────────────────────────────────────────────────────────────────────────────────
// HELPER FUNCTIONS
// ─────────────────────────────────────────────────────────────────────────────────

/**
 * Wait for transaction receipt with timeout
 * P1: Prevents UI from hanging indefinitely on stuck transactions
 */
async function waitForReceiptWithTimeout(
  publicClient: ReturnType<typeof usePublicClient>,
  hash: `0x${string}`,
  timeoutMs: number = TX_TIMEOUT_MS
): Promise<Awaited<ReturnType<typeof publicClient.waitForTransactionReceipt>>> {
  const receiptPromise = publicClient!.waitForTransactionReceipt({
    hash,
    confirmations: 1,
  });

  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => {
      reject(new IgnisError({
        code: 'TX_TIMEOUT',
        message: `Transaction not confirmed within ${timeoutMs / 1000} seconds`,
        userMessage: 'Transaction is taking longer than expected. It may still complete - check your wallet or block explorer.',
        isRetryable: false,
        details: { hash, timeoutMs },
      }));
    }, timeoutMs);
  });

  return Promise.race([receiptPromise, timeoutPromise]);
}

// ─────────────────────────────────────────────────────────────────────────────────
// GAS ESTIMATION
// ─────────────────────────────────────────────────────────────────────────────────

async function estimateGasWithBuffer(
  publicClient: ReturnType<typeof usePublicClient>,
  params: {
    address: Address;
    abi: readonly unknown[];
    functionName: string;
    args: readonly unknown[];
    value?: bigint;
    account: Address;
  },
  route?: RouteStep[]
): Promise<bigint> {
  try {
    const estimate = await publicClient!.estimateContractGas(params);
    
    // Add buffer
    const withBuffer = (estimate * BigInt(100 + GAS_BUFFER_PERCENT)) / BigInt(100);
    
    // Clamp to reasonable bounds
    if (withBuffer < MIN_GAS_LIMIT) return MIN_GAS_LIMIT;
    if (withBuffer > MAX_GAS_LIMIT) return MAX_GAS_LIMIT;
    
    return withBuffer;
  } catch (error: unknown) {
    logError('estimateGasWithBuffer', error);
    // Use route-aware fallback when estimation fails
    const fallback = calculateRouteAwareGasFallback(route);
    swapLogger.warn('Gas estimation failed, using route-aware fallback', {
      fallbackGas: fallback.toString(),
      routeSteps: route?.length ?? 0,
    });
    return fallback;
  }
}

// ─────────────────────────────────────────────────────────────────────────────────
// APPROVAL CHECK
// ─────────────────────────────────────────────────────────────────────────────────

async function checkAndApprove(
  publicClient: ReturnType<typeof usePublicClient>,
  walletClient: ReturnType<typeof useWalletClient>['data'],
  params: {
    token: Address;
    spender: Address;
    amount: bigint;
    owner: Address;
  },
  onStatusChange: (status: TransactionStatus) => void
): Promise<void> {
  const { token, spender, amount, owner } = params;

  // Check current allowance
  const allowance = await publicClient!.readContract({
    address: token,
    abi: ABIS.ERC20,
    functionName: 'allowance',
    args: [owner, spender],
  }) as bigint;

  if (allowance >= amount) {
    return; // Already approved
  }

  onStatusChange('awaiting_approval');

  // Estimate gas for approval
  const approveGas = await estimateGasWithBuffer(publicClient, {
    address: token,
    abi: ABIS.ERC20 as readonly unknown[],
    functionName: 'approve',
    args: [spender, amount],
    account: owner,
  });

  onStatusChange('approving');

  // Send approval transaction
  const approveHash = await walletClient!.writeContract({
    address: token,
    abi: ABIS.ERC20 as readonly unknown[],
    functionName: 'approve',
    args: [spender, amount],
    gas: approveGas,
  });

  // Wait for confirmation with timeout
  const receipt = await waitForReceiptWithTimeout(publicClient, approveHash);

  if (receipt.status === 'reverted') {
    throw new IgnisError({
      code: 'APPROVAL_FAILED',
      message: 'Approval transaction reverted',
      userMessage: 'Token approval failed',
    });
  }
}

// ─────────────────────────────────────────────────────────────────────────────────
// SWAP EXECUTION
// ─────────────────────────────────────────────────────────────────────────────────

async function executeSwap(
  publicClient: ReturnType<typeof usePublicClient>,
  walletClient: ReturnType<typeof useWalletClient>['data'],
  params: SwapParams,
  chainId: number,
  account: Address,
  onStatusChange: (status: TransactionStatus) => void
): Promise<SwapResult> {
  const routerAddress = getContractAddress(chainId, 'gatewayRouter');
  const functionName = params.unwrapToETH ? 'executeRouteUnwrapETH' : 'executeRoute';

  // ─────────────────────────────────────────────────────────────────────────────
  // P0 SECURITY VALIDATIONS
  // ─────────────────────────────────────────────────────────────────────────────
  
  // Validate amountIn is positive
  assertPositiveAmount(params.amountIn, 'Amount in');
  
  // Validate deadline is within acceptable range
  assertValidDeadline(params.deadline);
  
  // Validate minAmountOut to protect against excessive slippage
  assertValidMinAmountOut(params.amountIn, params.minAmountOut);

  // ─────────────────────────────────────────────────────────────────────────────
  // P1 SECURITY VALIDATIONS
  // ─────────────────────────────────────────────────────────────────────────────
  
  // Warn if recipient is not the sender (potential mistake or attack vector)
  if (params.recipient.toLowerCase() !== account.toLowerCase()) {
    swapLogger.warn('Swap recipient differs from sender', {
      sender: account,
      recipient: params.recipient,
      amountIn: params.amountIn.toString(),
      tokenIn: params.tokenIn,
      tokenOut: params.tokenOut,
    });
  }

  // Prepare function args
  const args = [
    params.encodedRoute,
    params.amountIn,
    params.minAmountOut,
    params.recipient,
    params.deadline,
  ] as const;

  // Check and handle approval if needed (skip for ETH)
  if (!params.value || params.value === BigInt(0)) {
    await checkAndApprove(
      publicClient,
      walletClient,
      {
        token: params.tokenIn,
        spender: routerAddress,
        amount: params.amountIn,
        owner: account,
      },
      onStatusChange
    );
  }

  onStatusChange('preparing');

  // Simulate the transaction first
  try {
    await publicClient!.simulateContract({
      address: routerAddress,
      abi: ABIS.GatewayRouterV5 as readonly unknown[],
      functionName,
      args,
      value: params.value || BigInt(0),
      account,
    });
  } catch (error: unknown) {
    // Simulation failed - transaction would revert
    throw handleError(error);
  }

  // Estimate gas (with route-aware fallback)
  const gasLimit = await estimateGasWithBuffer(publicClient, {
    address: routerAddress,
    abi: ABIS.GatewayRouterV5 as readonly unknown[],
    functionName,
    args,
    value: params.value || BigInt(0),
    account,
  }, params.route);

  onStatusChange('awaiting_signature');

  // Send the transaction
  const hash = await walletClient!.writeContract({
    address: routerAddress,
    abi: ABIS.GatewayRouterV5 as readonly unknown[],
    functionName,
    args,
    value: params.value || BigInt(0),
    gas: gasLimit,
  });

  onStatusChange('pending');

  // Wait for confirmation with timeout
  onStatusChange('confirming');
  
  const receipt = await waitForReceiptWithTimeout(publicClient, hash);

  if (receipt.status === 'reverted') {
    throw new IgnisError({
      code: 'SWAP_REVERTED',
      message: 'Swap transaction reverted',
      userMessage: 'Swap failed - transaction reverted',
      details: { hash, blockNumber: receipt.blockNumber.toString() },
    });
  }

  // Parse output amount from logs (RouteExecuted event)
  let amountOut = params.minAmountOut;
  try {
    // TODO: Parse RouteExecuted event to get actual amountOut
    // For now, use minAmountOut as a conservative estimate
  } catch {
    // Use minAmountOut as fallback
  }

  return {
    hash,
    amountOut,
    txUrl: getTxUrl(chainId, hash),
    gasUsed: receipt.gasUsed,
    effectiveGasPrice: receipt.effectiveGasPrice,
  };
}

// ─────────────────────────────────────────────────────────────────────────────────
// MAIN HOOK
// ─────────────────────────────────────────────────────────────────────────────────

export function useSwap(): UseSwapResult {
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

  const swap = useCallback(async (params: SwapParams): Promise<SwapResult> => {
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

    if (!account) {
      throw new IgnisError({
        code: 'NO_ACCOUNT',
        message: 'No account connected',
        userMessage: 'Please connect your wallet',
      });
    }

    if (!isContractConfigured(chainId, 'gatewayRouter')) {
      throw new IgnisError({
        code: 'NOT_CONFIGURED',
        message: 'Router contract not configured',
        userMessage: 'Router not deployed on this network',
      });
    }

    try {
      reset();
      
      const result = await executeSwap(
        publicClient,
        walletClient,
        params,
        chainId,
        account,
        setStatus
      );

      setStatus('success');
      setTxHash(result.hash);

      // Invalidate relevant caches
      invalidateUserQueries(queryClient, chainId, account);
      invalidateQuotes(queryClient);

      return result;
    } catch (err: unknown) {
      const ignisError = handleError(err);
      setError(ignisError);
      
      if (isUserRejection(err)) {
        setStatus('rejected');
      } else {
        setStatus('failed');
      }
      
      logError('useSwap', err, {
        tokenIn: params.tokenIn,
        tokenOut: params.tokenOut,
        amountIn: params.amountIn.toString(),
      });
      
      throw ignisError;
    }
  }, [walletClient, publicClient, account, chainId, queryClient, reset]);

  return {
    swap,
    status,
    txHash,
    error,
    reset,
    isApproving: status === 'approving' || status === 'awaiting_approval',
    isPending: status === 'pending' || status === 'awaiting_signature',
    isConfirming: status === 'confirming',
    isSuccess: status === 'success',
    isError: status === 'failed' || status === 'rejected',
  };
}

// ─────────────────────────────────────────────────────────────────────────────────
// SWAP WITH APPROVAL HOOK (convenience wrapper)
// ─────────────────────────────────────────────────────────────────────────────────

export interface UseSwapWithQuoteOptions {
  onSuccess?: (result: SwapResult) => void;
  onError?: (error: IgnisError) => void;
}

export function useSwapWithQuote(options: UseSwapWithQuoteOptions = {}) {
  const swapHook = useSwap();
  const { onSuccess, onError } = options;

  const executeWithQuote = useCallback(async (
    params: SwapParams
  ): Promise<SwapResult> => {
    try {
      const result = await swapHook.swap(params);
      onSuccess?.(result);
      return result;
    } catch (error: unknown) {
      const ignisError = error instanceof IgnisError ? error : handleError(error);
      onError?.(ignisError);
      throw ignisError;
    }
  }, [swapHook, onSuccess, onError]);

  return {
    ...swapHook,
    executeWithQuote,
  };
}
