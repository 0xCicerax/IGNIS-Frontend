/** Swap validation utilities */
import { IgnisError } from './errors';
import { contractLogger } from '../../utils/logger';

// ─────────────────────────────────────────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────────────────────────────────────────

/** Minimum deadline: 30 seconds in the future */
export const MIN_DEADLINE_SECONDS = BigInt(30);

/** Maximum deadline: 1 hour in the future */
export const MAX_DEADLINE_SECONDS = BigInt(3600);

/** Maximum allowed slippage: 50% (5000 basis points) */
export const MAX_SLIPPAGE_BPS = 5000;

/** High slippage warning threshold: 10% (1000 basis points) */
export const HIGH_SLIPPAGE_WARNING_BPS = 1000;

// ─────────────────────────────────────────────────────────────────────────────────
// DEADLINE VALIDATION
// ─────────────────────────────────────────────────────────────────────────────────

export interface DeadlineValidationResult {
  isValid: boolean;
  error?: IgnisError;
  secondsFromNow?: bigint;
}

/**
 * Validate that deadline is within acceptable range
 * 
 * @param deadline - Unix timestamp (seconds) for transaction deadline
 * @returns Validation result with error details if invalid
 * 
 * @example
 * const result = validateDeadline(BigInt(Math.floor(Date.now() / 1000) + 300));
 * if (!result.isValid) {
 *   throw result.error;
 * }
 */
export function validateDeadline(deadline: bigint): DeadlineValidationResult {
  const now = BigInt(Math.floor(Date.now() / 1000));
  
  // Check if deadline has already passed
  if (deadline <= now) {
    return {
      isValid: false,
      error: new IgnisError({
        code: 'DEADLINE_EXPIRED',
        message: 'Deadline has already passed',
        userMessage: 'Transaction deadline has expired. Please try again.',
        isRetryable: true,
      }),
    };
  }
  
  const secondsFromNow = deadline - now;
  
  // Check if deadline is too soon
  if (secondsFromNow < MIN_DEADLINE_SECONDS) {
    return {
      isValid: false,
      error: new IgnisError({
        code: 'DEADLINE_TOO_SOON',
        message: `Deadline must be at least ${MIN_DEADLINE_SECONDS} seconds in the future`,
        userMessage: 'Transaction deadline is too short. Please increase the deadline.',
        isRetryable: true,
      }),
      secondsFromNow,
    };
  }
  
  // Check if deadline is too far in the future
  if (secondsFromNow > MAX_DEADLINE_SECONDS) {
    return {
      isValid: false,
      error: new IgnisError({
        code: 'DEADLINE_TOO_FAR',
        message: `Deadline must be within ${MAX_DEADLINE_SECONDS} seconds (1 hour)`,
        userMessage: 'Transaction deadline is too far in the future. Maximum is 1 hour.',
        isRetryable: true,
      }),
      secondsFromNow,
    };
  }
  
  return { isValid: true, secondsFromNow };
}

/**
 * Validate deadline and throw if invalid
 * 
 * @param deadline - Unix timestamp (seconds) for transaction deadline
 * @throws IgnisError if deadline is invalid
 */
export function assertValidDeadline(deadline: bigint): void {
  const result = validateDeadline(deadline);
  if (!result.isValid && result.error) {
    throw result.error;
  }
}

// ─────────────────────────────────────────────────────────────────────────────────
// MIN AMOUNT OUT VALIDATION
// ─────────────────────────────────────────────────────────────────────────────────

export interface MinAmountOutValidationResult {
  isValid: boolean;
  error?: IgnisError;
  warning?: string;
  impliedSlippageBps?: number;
}

/**
 * Validate minAmountOut to protect against excessive slippage
 * 
 * @param amountIn - Input amount in token's smallest unit
 * @param minAmountOut - Minimum acceptable output amount
 * @param tokenInDecimals - Decimals of input token (default: 18)
 * @param tokenOutDecimals - Decimals of output token (default: 18)
 * @returns Validation result with warnings for high slippage
 * 
 * @example
 * const result = validateMinAmountOut(
 *   parseUnits('1', 18),  // 1 ETH in
 *   parseUnits('0.95', 18), // 0.95 ETH min out (5% slippage)
 * );
 */
export function validateMinAmountOut(
  amountIn: bigint,
  minAmountOut: bigint,
  tokenInDecimals: number = 18,
  tokenOutDecimals: number = 18
): MinAmountOutValidationResult {
  // Check for zero minAmountOut - this is always an error
  if (minAmountOut === BigInt(0)) {
    return {
      isValid: false,
      error: new IgnisError({
        code: 'ZERO_MIN_OUTPUT',
        message: 'Minimum output amount cannot be zero',
        userMessage: 'Invalid slippage: minimum output cannot be zero. This would expose you to unlimited losses.',
        isRetryable: true,
      }),
    };
  }

  // Check for zero amountIn
  if (amountIn === BigInt(0)) {
    return {
      isValid: false,
      error: new IgnisError({
        code: 'ZERO_AMOUNT_IN',
        message: 'Input amount cannot be zero',
        userMessage: 'Please enter an amount to swap.',
        isRetryable: true,
      }),
    };
  }

  // Normalize amounts to same decimals for comparison (use 18 decimals as base)
  const normalizedAmountIn = normalizeToDecimals(amountIn, tokenInDecimals, 18);
  const normalizedMinOut = normalizeToDecimals(minAmountOut, tokenOutDecimals, 18);

  // Calculate implied slippage
  // Note: This comparison is only meaningful for similar-value tokens
  // For different-value tokens (e.g., ETH -> USDC), this is just a heuristic
  let warning: string | undefined;
  let impliedSlippageBps: number | undefined;

  if (normalizedAmountIn > BigInt(0) && normalizedMinOut > BigInt(0)) {
    // Check if minAmountOut is less than 50% of amountIn
    const minReasonable = normalizedAmountIn / BigInt(2);
    
    if (normalizedMinOut < minReasonable) {
      // This could be legitimate for different-priced tokens
      // but we should warn about it
      warning = 'High slippage detected: minimum output is less than 50% of input amount. ' +
                'This may be expected for tokens with different values, but please verify.';
      
      // Calculate approximate slippage for logging
      if (normalizedMinOut < normalizedAmountIn) {
        const slippage = ((normalizedAmountIn - normalizedMinOut) * BigInt(10000)) / normalizedAmountIn;
        impliedSlippageBps = Number(slippage);
      }
    }
  }

  return {
    isValid: true,
    warning,
    impliedSlippageBps,
  };
}

/**
 * Validate minAmountOut and throw if invalid
 * 
 * @param amountIn - Input amount
 * @param minAmountOut - Minimum output amount
 * @param tokenInDecimals - Input token decimals
 * @param tokenOutDecimals - Output token decimals
 * @throws IgnisError if validation fails
 */
export function assertValidMinAmountOut(
  amountIn: bigint,
  minAmountOut: bigint,
  tokenInDecimals: number = 18,
  tokenOutDecimals: number = 18
): void {
  const result = validateMinAmountOut(amountIn, minAmountOut, tokenInDecimals, tokenOutDecimals);
  
  if (!result.isValid && result.error) {
    throw result.error;
  }
  
  // Log warning if present (but don't throw)
  if (result.warning) {
    contractLogger.warn('High slippage detected in minAmountOut validation', {
      warning: result.warning,
      amountIn: amountIn.toString(),
      minAmountOut: minAmountOut.toString(),
      impliedSlippageBps: result.impliedSlippageBps,
    });
  }
}

// ─────────────────────────────────────────────────────────────────────────────────
// AMOUNT VALIDATION
// ─────────────────────────────────────────────────────────────────────────────────

/**
 * Validate that an amount is positive
 * 
 * @param amount - Amount to validate
 * @param fieldName - Name of the field for error messages
 * @throws IgnisError if amount is not positive
 */
export function assertPositiveAmount(amount: bigint, fieldName: string = 'Amount'): void {
  if (amount <= BigInt(0)) {
    throw new IgnisError({
      code: 'INVALID_AMOUNT',
      message: `${fieldName} must be greater than zero`,
      userMessage: 'Please enter a valid amount.',
      isRetryable: true,
    });
  }
}

/**
 * Validate that amount doesn't exceed balance
 * 
 * @param amount - Amount to validate
 * @param balance - User's balance
 * @param tokenSymbol - Token symbol for error messages
 * @throws IgnisError if amount exceeds balance
 */
export function assertSufficientBalance(
  amount: bigint,
  balance: bigint,
  tokenSymbol: string = 'tokens'
): void {
  if (amount > balance) {
    throw new IgnisError({
      code: 'INSUFFICIENT_BALANCE',
      message: `Insufficient ${tokenSymbol} balance`,
      userMessage: `Insufficient ${tokenSymbol} balance. You have less than the requested amount.`,
      isRetryable: false,
      details: {
        requested: amount.toString(),
        available: balance.toString(),
      },
    });
  }
}

// ─────────────────────────────────────────────────────────────────────────────────
// SLIPPAGE VALIDATION
// ─────────────────────────────────────────────────────────────────────────────────

export interface SlippageValidationResult {
  isValid: boolean;
  error?: IgnisError;
  warning?: string;
}

/**
 * Validate slippage settings
 * 
 * @param slippageBps - Slippage tolerance in basis points (1% = 100 bps)
 * @returns Validation result with warnings for high slippage
 */
export function validateSlippage(slippageBps: number): SlippageValidationResult {
  if (slippageBps < 0) {
    return {
      isValid: false,
      error: new IgnisError({
        code: 'INVALID_SLIPPAGE',
        message: 'Slippage cannot be negative',
        userMessage: 'Slippage tolerance cannot be negative.',
        isRetryable: true,
      }),
    };
  }

  if (slippageBps > MAX_SLIPPAGE_BPS) {
    return {
      isValid: false,
      error: new IgnisError({
        code: 'SLIPPAGE_TOO_HIGH',
        message: `Slippage cannot exceed ${MAX_SLIPPAGE_BPS / 100}%`,
        userMessage: `Slippage tolerance cannot exceed ${MAX_SLIPPAGE_BPS / 100}%. This would expose you to excessive losses.`,
        isRetryable: true,
      }),
    };
  }

  // Warn about high slippage
  if (slippageBps >= HIGH_SLIPPAGE_WARNING_BPS) {
    return {
      isValid: true,
      warning: `High slippage tolerance (${slippageBps / 100}%). Your transaction may be frontrun.`,
    };
  }

  return { isValid: true };
}

/**
 * Validate slippage and throw if invalid
 */
export function assertValidSlippage(slippageBps: number): void {
  const result = validateSlippage(slippageBps);
  if (!result.isValid && result.error) {
    throw result.error;
  }
}

// ─────────────────────────────────────────────────────────────────────────────────
// HELPER FUNCTIONS
// ─────────────────────────────────────────────────────────────────────────────────

/**
 * Normalize an amount to a target decimal precision
 */
function normalizeToDecimals(amount: bigint, fromDecimals: number, toDecimals: number): bigint {
  if (fromDecimals === toDecimals) {
    return amount;
  }
  
  if (fromDecimals < toDecimals) {
    return amount * BigInt(10 ** (toDecimals - fromDecimals));
  }
  
  return amount / BigInt(10 ** (fromDecimals - toDecimals));
}

/**
 * Calculate deadline from current time
 * 
 * @param durationSeconds - Duration in seconds from now
 * @returns Unix timestamp for deadline
 */
export function createDeadline(durationSeconds: number): bigint {
  const now = Math.floor(Date.now() / 1000);
  return BigInt(now + durationSeconds);
}

/**
 * Check if a deadline is still valid (not expired)
 */
export function isDeadlineValid(deadline: bigint): boolean {
  const now = BigInt(Math.floor(Date.now() / 1000));
  return deadline > now;
}
