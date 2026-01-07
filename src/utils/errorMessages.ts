interface ErrorMessages {
    [key: string]: string;
}

const ERROR_MESSAGES: ErrorMessages = {
    'user rejected': 'Transaction rejected by user',
    'insufficient funds': 'Insufficient funds for transaction',
    'execution reverted': 'Transaction would fail - check your inputs',
    'nonce too low': 'Transaction nonce error - please try again',
    'replacement underpriced': 'Gas price too low for replacement',
    'gas required exceeds': 'Transaction requires too much gas',
    'exceeds block gas limit': 'Transaction too large',
    'network error': 'Network error - please check your connection',
    'timeout': 'Request timed out - please try again',
};

/**
 * Safely extract error message from unknown error type
 * This is the primary utility for typed catch blocks
 */
export function getErrorMessage(error: unknown): string {
    if (!error) return 'An unknown error occurred';
    
    // Handle Error objects
    if (error instanceof Error) {
        const errorString = error.message.toLowerCase();
        
        for (const [key, message] of Object.entries(ERROR_MESSAGES)) {
            if (errorString.includes(key)) {
                return message;
            }
        }
        
        // If it's a short, readable message, return it
        if (error.message.length < 100) {
            return error.message;
        }
        
        return 'Transaction failed - please try again';
    }
    
    // Handle string errors
    if (typeof error === 'string') {
        const errorString = error.toLowerCase();
        for (const [key, message] of Object.entries(ERROR_MESSAGES)) {
            if (errorString.includes(key)) {
                return message;
            }
        }
        return error.length < 100 ? error : 'Transaction failed - please try again';
    }
    
    // Handle objects with message property
    if (typeof error === 'object' && error !== null && 'message' in error) {
        return getErrorMessage((error as { message: unknown }).message);
    }
    
    return 'An unknown error occurred';
}

/**
 * Type guard to check if error is an Error instance
 */
export function isError(error: unknown): error is Error {
    return error instanceof Error;
}

/**
 * Type guard for errors with a code property (common in web3)
 */
export interface CodedError extends Error {
    code: string | number;
}

export function isCodedError(error: unknown): error is CodedError {
    return error instanceof Error && 'code' in error;
}

/**
 * Safely get error code from unknown error
 */
export function getErrorCode(error: unknown): string | number | undefined {
    if (isCodedError(error)) {
        return error.code;
    }
    if (typeof error === 'object' && error !== null && 'code' in error) {
        return (error as { code: string | number }).code;
    }
    return undefined;
}

// Error info helper
export interface ErrorInfo {
  message: string;
  code?: string | number;
  retry?: boolean;
  originalError?: unknown;
}

export function getErrorInfo(error: unknown): ErrorInfo {
  const code = getErrorCode(error);
  
  if (error instanceof Error) {
    // Check for common wallet errors
    if (error.message.includes('user rejected') || error.message.includes('User denied')) {
      return { message: 'Transaction cancelled', code: code ?? 'USER_REJECTED', retry: true, originalError: error };
    }
    if (error.message.includes('insufficient funds')) {
      return { message: 'Insufficient funds for gas', code: code ?? 'INSUFFICIENT_FUNDS', retry: false, originalError: error };
    }
    if (error.message.includes('nonce')) {
      return { message: 'Transaction nonce error', code: code ?? 'NONCE_ERROR', retry: true, originalError: error };
    }
    return { message: error.message, code, retry: true, originalError: error };
  }
  
  return { message: getErrorMessage(error), code, retry: true, originalError: error };
}

export function isUserRejection(error: unknown): boolean {
  if (error instanceof Error) {
    const msg = error.message.toLowerCase();
    return msg.includes('user rejected') || 
           msg.includes('user denied') || 
           msg.includes('user cancelled') ||
           msg.includes('rejected by user');
  }
  
  // Check for error code 4001 (standard user rejection code)
  const code = getErrorCode(error);
  if (code === 4001 || code === 'ACTION_REJECTED') {
    return true;
  }
  
  return false;
}

/**
 * Helper to safely log errors with proper typing
 */
export function logError(context: string, error: unknown): void {
  const message = getErrorMessage(error);
  const code = getErrorCode(error);
  
  console.error(`[${context}]`, {
    message,
    code,
    originalError: error,
  });
}

/**
 * Wrap async function with error handling
 * Returns [result, error] tuple
 */
export async function tryCatch<T>(
  fn: () => Promise<T>
): Promise<[T, null] | [null, ErrorInfo]> {
  try {
    const result = await fn();
    return [result, null];
  } catch (error: unknown) {
    return [null, getErrorInfo(error)];
  }
}
