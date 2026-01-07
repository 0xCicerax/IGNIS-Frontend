/** Contract error handling */
import { BaseError, ContractFunctionRevertedError, UserRejectedRequestError } from 'viem';
import { CONTRACT_ERRORS, ERROR_MESSAGES, ContractErrorName } from './types';
import { contractLogger } from '../../utils/logger';

// ─────────────────────────────────────────────────────────────────────────────────
// ERROR TYPES
// ─────────────────────────────────────────────────────────────────────────────────

export class IgnisError extends Error {
  public readonly code: string;
  public readonly userMessage: string;
  public readonly isUserRejection: boolean;
  public readonly isRetryable: boolean;
  public readonly details?: Record<string, unknown>;

  constructor(options: {
    code: string;
    message: string;
    userMessage: string;
    isUserRejection?: boolean;
    isRetryable?: boolean;
    details?: Record<string, unknown>;
    cause?: Error;
  }) {
    super(options.message, { cause: options.cause });
    this.name = 'IgnisError';
    this.code = options.code;
    this.userMessage = options.userMessage;
    this.isUserRejection = options.isUserRejection ?? false;
    this.isRetryable = options.isRetryable ?? false;
    this.details = options.details;
  }
}

// ─────────────────────────────────────────────────────────────────────────────────
// ERROR SELECTORS
// ─────────────────────────────────────────────────────────────────────────────────

// Pre-computed error selectors (keccak256 of error signature, first 4 bytes)
const ERROR_SELECTORS: Record<string, ContractErrorName> = {
  '0x5863f789': 'AmountTooLarge',
  '0x1ab7da6b': 'DeadlineExpired',
  '0x95c44e8e': 'ETHMismatch',
  '0xd93c0665': 'EnforcedPause',
  '0x8dfc7eb9': 'InconsistentInputToken',
  '0x3d7a3d0c': 'InconsistentOutputToken',
  '0x42301c23': 'InsufficientOutput',
  '0xe6c4247b': 'InvalidAddress',
  '0x1cf99b26': 'InvalidRoute',
  '0xa0c6d3a2': 'InvalidSplitEncoding',
  '0x6b7c5b85': 'InvalidStep',
  '0x1c9a7918': 'RouteTooLong',
  '0x90b8ec18': 'TransferFailed',
  '0x82b42900': 'Unauthorized',
  '0x8fb8f6e7': 'WETHMismatch',
  '0x1f2a2005': 'ZeroAmount',
  '0x3b36d5e0': 'NoRouteFound',
  '0xc1ab6dc1': 'InvalidToken',
  '0x4e23d035': 'MaxRoutingTokensReached',
  '0xaf9e5c4e': 'TokenNotFound',
  '0x2bb9747f': 'AllocationMismatch',
  '0x0e7eb5f1': 'GatewayAlreadyExists',
  '0x1b31b7c9': 'GatewayNotFound',
  '0x5a052b32': 'InsufficientBuffer',
  '0x70a0823c': 'InvalidAllocation',
  '0x3ed3039b': 'InvalidBufferTarget',
  '0x3bc5de30': 'NothingToPush',
  '0x61e7825f': 'NothingToRefill',
  '0x8e4a23d6': 'PoolAlreadyExists',
  '0x7504f1b0': 'PoolNotFound',
  '0xd92e233d': 'ZeroAddress',
};

// ─────────────────────────────────────────────────────────────────────────────────
// ERROR PARSING
// ─────────────────────────────────────────────────────────────────────────────────

/**
 * Parse a contract error and return a user-friendly IgnisError
 */
export function parseContractError(error: unknown): IgnisError {
  // Handle user rejection
  if (error instanceof UserRejectedRequestError) {
    return new IgnisError({
      code: 'USER_REJECTED',
      message: 'User rejected the request',
      userMessage: 'Transaction cancelled',
      isUserRejection: true,
      isRetryable: true,
    });
  }

  // Handle viem BaseError
  if (error instanceof BaseError) {
    // Check for ContractFunctionRevertedError
    const revertError = error.walk((e) => e instanceof ContractFunctionRevertedError);
    
    if (revertError instanceof ContractFunctionRevertedError) {
      const errorName = revertError.data?.errorName;
      
      if (errorName && errorName in ERROR_MESSAGES) {
        const name = errorName as ContractErrorName;
        return new IgnisError({
          code: name,
          message: `Contract reverted: ${errorName}`,
          userMessage: ERROR_MESSAGES[name],
          isRetryable: isRetryableError(name),
          details: revertError.data?.args ? { args: revertError.data.args } : undefined,
          cause: error,
        });
      }
    }

    // Try to parse from error data
    const parsedError = parseErrorData(error);
    if (parsedError) {
      return parsedError;
    }

    // Generic viem error
    return new IgnisError({
      code: 'CONTRACT_ERROR',
      message: error.message,
      userMessage: simplifyErrorMessage(error.message),
      isRetryable: false,
      cause: error,
    });
  }

  // Handle standard errors
  if (error instanceof Error) {
    // Check for common patterns
    const message = error.message.toLowerCase();
    
    if (message.includes('user rejected') || message.includes('user denied')) {
      return new IgnisError({
        code: 'USER_REJECTED',
        message: error.message,
        userMessage: 'Transaction cancelled',
        isUserRejection: true,
        isRetryable: true,
        cause: error,
      });
    }

    if (message.includes('insufficient funds')) {
      return new IgnisError({
        code: 'INSUFFICIENT_FUNDS',
        message: error.message,
        userMessage: 'Insufficient funds for transaction',
        isRetryable: false,
        cause: error,
      });
    }

    if (message.includes('nonce too low')) {
      return new IgnisError({
        code: 'NONCE_ERROR',
        message: error.message,
        userMessage: 'Transaction nonce error. Please try again.',
        isRetryable: true,
        cause: error,
      });
    }

    if (message.includes('replacement fee too low') || message.includes('underpriced')) {
      return new IgnisError({
        code: 'GAS_PRICE_ERROR',
        message: error.message,
        userMessage: 'Gas price too low. Please increase gas.',
        isRetryable: true,
        cause: error,
      });
    }

    if (message.includes('network') || message.includes('timeout') || message.includes('connection')) {
      return new IgnisError({
        code: 'NETWORK_ERROR',
        message: error.message,
        userMessage: 'Network error. Please check your connection.',
        isRetryable: true,
        cause: error,
      });
    }

    return new IgnisError({
      code: 'UNKNOWN_ERROR',
      message: error.message,
      userMessage: simplifyErrorMessage(error.message),
      isRetryable: false,
      cause: error,
    });
  }

  // Unknown error type
  return new IgnisError({
    code: 'UNKNOWN_ERROR',
    message: String(error),
    userMessage: 'An unexpected error occurred',
    isRetryable: false,
  });
}

/**
 * Try to parse error from raw error data
 */
function parseErrorData(error: BaseError): IgnisError | null {
  // Try to extract selector from error
  const errorString = error.message || '';
  
  // Look for hex selector in message
  const selectorMatch = errorString.match(/0x[a-fA-F0-9]{8}/);
  if (selectorMatch) {
    const selector = selectorMatch[0].toLowerCase();
    const errorName = ERROR_SELECTORS[selector];
    
    if (errorName) {
      return new IgnisError({
        code: errorName,
        message: `Contract reverted: ${errorName}`,
        userMessage: ERROR_MESSAGES[errorName],
        isRetryable: isRetryableError(errorName),
        cause: error,
      });
    }
  }

  // Look for error name in message
  for (const [name, message] of Object.entries(ERROR_MESSAGES)) {
    if (errorString.includes(name)) {
      return new IgnisError({
        code: name,
        message: `Contract reverted: ${name}`,
        userMessage: message,
        isRetryable: isRetryableError(name as ContractErrorName),
        cause: error,
      });
    }
  }

  return null;
}

/**
 * Check if an error is retryable
 */
function isRetryableError(errorName: ContractErrorName): boolean {
  // These errors might resolve with a retry
  const retryableErrors: ContractErrorName[] = [
    'DeadlineExpired',
    'InsufficientOutput',
    'InsufficientBuffer',
  ];
  return retryableErrors.includes(errorName);
}

/**
 * Simplify technical error messages for users
 */
function simplifyErrorMessage(message: string): string {
  const lower = message.toLowerCase();

  if (lower.includes('execution reverted')) {
    // Try to extract reason
    const reasonMatch = message.match(/reason="([^"]+)"/);
    if (reasonMatch) {
      return reasonMatch[1];
    }
    return 'Transaction failed. Please try again.';
  }

  if (lower.includes('gas required exceeds')) {
    return 'Transaction would fail. Check your input amounts.';
  }

  if (lower.includes('insufficient allowance')) {
    return 'Token approval needed';
  }

  // Truncate long messages
  if (message.length > 100) {
    return 'Transaction failed. Please try again.';
  }

  return message;
}

// ─────────────────────────────────────────────────────────────────────────────────
// ERROR HANDLING HELPERS
// ─────────────────────────────────────────────────────────────────────────────────

/**
 * Safe error handler that always returns an IgnisError
 */
export function handleError(error: unknown): IgnisError {
  if (error instanceof IgnisError) {
    return error;
  }
  return parseContractError(error);
}

/**
 * Log error with context
 * P1: Uses production-safe logger instead of console.error
 */
export function logError(
  context: string,
  error: unknown,
  additionalInfo?: Record<string, unknown>
): void {
  const ignisError = handleError(error);
  
  contractLogger.error(`[${context}] ${ignisError.code}: ${ignisError.message}`, ignisError, {
    userMessage: ignisError.userMessage,
    isRetryable: ignisError.isRetryable,
    details: ignisError.details,
    ...additionalInfo,
  });
}

/**
 * Check if error is due to user rejection
 */
export function isUserRejection(error: unknown): boolean {
  if (error instanceof IgnisError) {
    return error.isUserRejection;
  }
  
  if (error instanceof UserRejectedRequestError) {
    return true;
  }

  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    return message.includes('user rejected') || 
           message.includes('user denied') ||
           message.includes('user cancelled');
  }

  return false;
}

/**
 * Check if error is retryable
 */
export function isRetryable(error: unknown): boolean {
  if (error instanceof IgnisError) {
    return error.isRetryable;
  }
  return false;
}

/**
 * Get user-friendly message from any error
 */
export function getUserMessage(error: unknown): string {
  if (error instanceof IgnisError) {
    return error.userMessage;
  }
  return parseContractError(error).userMessage;
}
