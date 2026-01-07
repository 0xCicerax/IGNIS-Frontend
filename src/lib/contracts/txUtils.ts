/** Transaction utilities */
import { Hash } from 'viem';
import { IgnisError } from './errors';

// ─────────────────────────────────────────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────────────────────────────────────────

/** Default transaction timeout in milliseconds (2 minutes) */
export const TX_TIMEOUT_MS = 120_000;

/** Default gas buffer percentage */
export const GAS_BUFFER_PERCENT = 20;

/** Maximum gas limit */
export const MAX_GAS_LIMIT = BigInt(2_000_000);

/** Minimum gas limit */
export const MIN_GAS_LIMIT = BigInt(100_000);

/** 
 * Simple gas fallback for non-swap operations (wrap/unwrap/stake)
 * Swaps use route-aware fallback in useSwap.ts
 */
export const SIMPLE_GAS_FALLBACK = BigInt(250_000);

// ─────────────────────────────────────────────────────────────────────────────────
// TIMEOUT UTILITIES
// ─────────────────────────────────────────────────────────────────────────────────

/**
 * Create a promise that rejects after a timeout
 * 
 * @param timeoutMs - Timeout in milliseconds
 * @param hash - Transaction hash for error context
 * @returns Promise that rejects with IgnisError after timeout
 */
export function createTimeoutPromise(timeoutMs: number, hash: Hash): Promise<never> {
  return new Promise((_, reject) => {
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
}

/**
 * Wait for a promise with timeout
 * 
 * @param promise - Promise to wait for
 * @param timeoutMs - Timeout in milliseconds
 * @param hash - Transaction hash for error context
 * @returns Result of the promise or throws timeout error
 */
export async function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  hash: Hash
): Promise<T> {
  return Promise.race([
    promise,
    createTimeoutPromise(timeoutMs, hash),
  ]);
}

// ─────────────────────────────────────────────────────────────────────────────────
// GAS UTILITIES
// ─────────────────────────────────────────────────────────────────────────────────

/**
 * Add buffer to gas estimate and clamp to reasonable bounds
 * 
 * @param estimate - Raw gas estimate
 * @param bufferPercent - Buffer percentage to add (default: 20%)
 * @returns Gas estimate with buffer, clamped to min/max
 */
export function addGasBuffer(
  estimate: bigint,
  bufferPercent: number = GAS_BUFFER_PERCENT
): bigint {
  const withBuffer = (estimate * BigInt(100 + bufferPercent)) / BigInt(100);
  
  if (withBuffer < MIN_GAS_LIMIT) return MIN_GAS_LIMIT;
  if (withBuffer > MAX_GAS_LIMIT) return MAX_GAS_LIMIT;
  
  return withBuffer;
}

// ─────────────────────────────────────────────────────────────────────────────────
// TRANSACTION STATUS
// ─────────────────────────────────────────────────────────────────────────────────

/**
 * Check if a transaction status indicates pending
 */
export function isPendingStatus(status: string): boolean {
  return ['awaiting_signature', 'pending', 'confirming', 'approving', 'awaiting_approval'].includes(status);
}

/**
 * Check if a transaction status indicates error
 */
export function isErrorStatus(status: string): boolean {
  return ['failed', 'rejected'].includes(status);
}

/**
 * Check if a transaction status indicates success
 */
export function isSuccessStatus(status: string): boolean {
  return status === 'success';
}
