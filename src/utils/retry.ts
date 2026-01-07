/**
 * Retry utilities with exponential backoff, rate limiting, and circuit breaker
 */

import { logger } from './logger';

// ─────────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────────

export interface RetryOptions {
    /** Maximum number of retry attempts (default: 3) */
    maxRetries?: number;
    /** Initial delay in ms before first retry (default: 1000) */
    initialDelay?: number;
    /** Maximum delay in ms between retries (default: 10000) */
    maxDelay?: number;
    /** Multiplier for exponential backoff (default: 2) */
    backoffMultiplier?: number;
    /** Add random jitter to prevent thundering herd (default: true) */
    jitter?: boolean;
    /** Function to determine if error is retryable (default: all errors) */
    isRetryable?: (error: unknown) => boolean;
    /** Callback on each retry attempt */
    onRetry?: (attempt: number, error: unknown, nextDelay: number) => void;
    /** Abort signal for cancellation */
    signal?: AbortSignal;
}

export interface RateLimitOptions {
    /** Maximum requests per window */
    maxRequests: number;
    /** Window size in ms (default: 60000 = 1 minute) */
    windowMs?: number;
    /** Strategy when limit reached: 'queue' | 'reject' | 'delay' */
    strategy?: 'queue' | 'reject' | 'delay';
}

export interface CircuitBreakerOptions {
    /** Number of failures before opening circuit */
    failureThreshold?: number;
    /** Time in ms before attempting to close circuit */
    resetTimeout?: number;
    /** Number of successes needed to close circuit */
    successThreshold?: number;
}

// ─────────────────────────────────────────────────────────────────────────────────
// RETRY WITH EXPONENTIAL BACKOFF
// ─────────────────────────────────────────────────────────────────────────────────

const DEFAULT_RETRY_OPTIONS: Required<Omit<RetryOptions, 'onRetry' | 'signal' | 'isRetryable'>> = {
    maxRetries: 3,
    initialDelay: 1000,
    maxDelay: 10000,
    backoffMultiplier: 2,
    jitter: true,
};

/**
 * Sleep for specified milliseconds
 */
export function sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Calculate delay with exponential backoff and optional jitter
 */
export function calculateDelay(
    attempt: number,
    initialDelay: number,
    maxDelay: number,
    multiplier: number,
    jitter: boolean
): number {
    // Exponential backoff: delay = initialDelay * multiplier^attempt
    let delay = initialDelay * Math.pow(multiplier, attempt);
    
    // Add jitter (0-25% random variation)
    if (jitter) {
        const jitterFactor = 0.75 + Math.random() * 0.5; // 0.75 to 1.25
        delay *= jitterFactor;
    }
    
    // Cap at maxDelay
    return Math.min(delay, maxDelay);
}

/**
 * Execute a function with automatic retry on failure
 */
export async function withRetry<T>(
    fn: () => Promise<T>,
    options: RetryOptions = {}
): Promise<T> {
    const {
        maxRetries = DEFAULT_RETRY_OPTIONS.maxRetries,
        initialDelay = DEFAULT_RETRY_OPTIONS.initialDelay,
        maxDelay = DEFAULT_RETRY_OPTIONS.maxDelay,
        backoffMultiplier = DEFAULT_RETRY_OPTIONS.backoffMultiplier,
        jitter = DEFAULT_RETRY_OPTIONS.jitter,
        isRetryable = () => true,
        onRetry,
        signal,
    } = options;

    let lastError: unknown;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
            // Check for cancellation
            if (signal?.aborted) {
                throw new Error('Operation cancelled');
            }

            return await fn();
        } catch (error: unknown) {
            lastError = error;

            // Check if we should retry
            const shouldRetry = attempt < maxRetries && isRetryable(error);
            
            if (!shouldRetry) {
                throw error;
            }

            // Calculate delay for next attempt
            const delay = calculateDelay(attempt, initialDelay, maxDelay, backoffMultiplier, jitter);

            // Call retry callback if provided
            if (onRetry) {
                onRetry(attempt + 1, error, delay);
            } else {
                logger.warn(`Retry attempt ${attempt + 1}/${maxRetries}`, {
                    error: error instanceof Error ? error.message : String(error),
                    nextDelayMs: delay,
                });
            }

            // Wait before retrying
            await sleep(delay);
        }
    }

    throw lastError;
}

/**
 * Retry-enabled fetch wrapper
 */
export async function fetchWithRetry(
    url: string,
    init?: RequestInit,
    retryOptions?: RetryOptions
): Promise<Response> {
    return withRetry(async () => {
        const response = await fetch(url, init);
        
        // Retry on 5xx errors and rate limits (429)
        if (response.status >= 500 || response.status === 429) {
            throw new RetryableError(`HTTP ${response.status}: ${response.statusText}`, response.status);
        }
        
        return response;
    }, {
        ...retryOptions,
        isRetryable: (error) => {
            // Retry on network errors
            if (error instanceof TypeError && error.message.includes('fetch')) {
                return true;
            }
            // Retry on retryable HTTP errors
            if (error instanceof RetryableError) {
                return true;
            }
            // Custom isRetryable check
            return retryOptions?.isRetryable?.(error) ?? false;
        },
    });
}

/**
 * Error class for retryable errors
 */
export class RetryableError extends Error {
    public readonly statusCode?: number;
    
    constructor(message: string, statusCode?: number) {
        super(message);
        this.name = 'RetryableError';
        this.statusCode = statusCode;
    }
}

// ─────────────────────────────────────────────────────────────────────────────────
// RATE LIMITER
// ─────────────────────────────────────────────────────────────────────────────────

interface RateLimitState {
    requests: number[];
    queue: Array<{
        resolve: () => void;
        reject: (error: Error) => void;
    }>;
}

const rateLimiters = new Map<string, RateLimitState>();

/**
 * Create a rate limiter for a specific key
 */
export function createRateLimiter(key: string, options: RateLimitOptions) {
    const { maxRequests, windowMs = 60000, strategy = 'delay' } = options;

    if (!rateLimiters.has(key)) {
        rateLimiters.set(key, { requests: [], queue: [] });
    }

    return async function rateLimitedCall<T>(fn: () => Promise<T>): Promise<T> {
        const state = rateLimiters.get(key)!;
        const now = Date.now();

        // Clean up old requests outside the window
        state.requests = state.requests.filter(time => now - time < windowMs);

        // Check if we're at the limit
        if (state.requests.length >= maxRequests) {
            if (strategy === 'reject') {
                throw new Error(`Rate limit exceeded for ${key}`);
            }

            if (strategy === 'delay' || strategy === 'queue') {
                // Calculate wait time until oldest request expires
                const oldestRequest = state.requests[0];
                const waitTime = oldestRequest + windowMs - now;

                logger.debug(`Rate limit reached, waiting ${waitTime}ms`, { key });
                await sleep(waitTime);

                // Recursively call to recheck
                return rateLimitedCall(fn);
            }
        }

        // Record this request
        state.requests.push(now);

        return fn();
    };
}

/**
 * Decorator-style rate limiter
 */
export function withRateLimit<T extends (...args: unknown[]) => Promise<unknown>>(
    fn: T,
    key: string,
    options: RateLimitOptions
): T {
    const rateLimitedCall = createRateLimiter(key, options);
    
    return (async (...args: Parameters<T>) => {
        return rateLimitedCall(() => fn(...args));
    }) as T;
}

// ─────────────────────────────────────────────────────────────────────────────────
// CIRCUIT BREAKER
// ─────────────────────────────────────────────────────────────────────────────────

type CircuitState = 'closed' | 'open' | 'half-open';

interface CircuitBreakerState {
    state: CircuitState;
    failures: number;
    successes: number;
    lastFailureTime: number | null;
    nextAttemptTime: number | null;
}

const circuitBreakers = new Map<string, CircuitBreakerState>();

const DEFAULT_CIRCUIT_OPTIONS: Required<CircuitBreakerOptions> = {
    failureThreshold: 5,
    resetTimeout: 30000,
    successThreshold: 2,
};

/**
 * Create a circuit breaker for a specific key
 */
export function createCircuitBreaker(key: string, options: CircuitBreakerOptions = {}) {
    const {
        failureThreshold = DEFAULT_CIRCUIT_OPTIONS.failureThreshold,
        resetTimeout = DEFAULT_CIRCUIT_OPTIONS.resetTimeout,
        successThreshold = DEFAULT_CIRCUIT_OPTIONS.successThreshold,
    } = options;

    if (!circuitBreakers.has(key)) {
        circuitBreakers.set(key, {
            state: 'closed',
            failures: 0,
            successes: 0,
            lastFailureTime: null,
            nextAttemptTime: null,
        });
    }

    return async function circuitBreakerCall<T>(fn: () => Promise<T>): Promise<T> {
        const state = circuitBreakers.get(key)!;
        const now = Date.now();

        // If circuit is open, check if we should try half-open
        if (state.state === 'open') {
            if (state.nextAttemptTime && now >= state.nextAttemptTime) {
                state.state = 'half-open';
                state.successes = 0;
                logger.info(`Circuit breaker ${key} moving to half-open`);
            } else {
                throw new CircuitOpenError(`Circuit breaker ${key} is open`);
            }
        }

        try {
            const result = await fn();

            // Success
            if (state.state === 'half-open') {
                state.successes++;
                if (state.successes >= successThreshold) {
                    state.state = 'closed';
                    state.failures = 0;
                    logger.info(`Circuit breaker ${key} closed`);
                }
            } else {
                // Reset failure count on success in closed state
                state.failures = 0;
            }

            return result;
        } catch (error: unknown) {
            // Failure
            state.failures++;
            state.lastFailureTime = now;

            if (state.failures >= failureThreshold) {
                state.state = 'open';
                state.nextAttemptTime = now + resetTimeout;
                logger.warn(`Circuit breaker ${key} opened after ${state.failures} failures`);
            }

            throw error;
        }
    };
}

/**
 * Error thrown when circuit is open
 */
export class CircuitOpenError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'CircuitOpenError';
    }
}

/**
 * Get current circuit breaker state
 */
export function getCircuitState(key: string): CircuitState | null {
    return circuitBreakers.get(key)?.state ?? null;
}

/**
 * Reset a circuit breaker
 */
export function resetCircuit(key: string): void {
    const state = circuitBreakers.get(key);
    if (state) {
        state.state = 'closed';
        state.failures = 0;
        state.successes = 0;
        state.lastFailureTime = null;
        state.nextAttemptTime = null;
    }
}

// ─────────────────────────────────────────────────────────────────────────────────
// COMBINED UTILITIES
// ─────────────────────────────────────────────────────────────────────────────────

export interface ResilientFetchOptions {
    retry?: RetryOptions;
    rateLimit?: RateLimitOptions & { key: string };
    circuitBreaker?: CircuitBreakerOptions & { key: string };
}

/**
 * Fetch with retry, rate limiting, and circuit breaker
 */
export async function resilientFetch(
    url: string,
    init?: RequestInit,
    options: ResilientFetchOptions = {}
): Promise<Response> {
    let fetchFn = () => fetchWithRetry(url, init, options.retry);

    // Apply circuit breaker if configured
    if (options.circuitBreaker?.key) {
        const circuitBreaker = createCircuitBreaker(
            options.circuitBreaker.key,
            options.circuitBreaker
        );
        const originalFetchFn = fetchFn;
        fetchFn = () => circuitBreaker(originalFetchFn);
    }

    // Apply rate limiter if configured
    if (options.rateLimit?.key) {
        const rateLimiter = createRateLimiter(
            options.rateLimit.key,
            options.rateLimit
        );
        const originalFetchFn = fetchFn;
        fetchFn = () => rateLimiter(originalFetchFn);
    }

    return fetchFn();
}

/**
 * Common retry patterns for different API types
 */
export const retryPatterns = {
    /** RPC calls - fast retry, few attempts */
    rpc: {
        maxRetries: 2,
        initialDelay: 500,
        maxDelay: 2000,
        backoffMultiplier: 2,
    } satisfies RetryOptions,

    /** Subgraph queries - moderate retry */
    subgraph: {
        maxRetries: 3,
        initialDelay: 1000,
        maxDelay: 5000,
        backoffMultiplier: 2,
    } satisfies RetryOptions,

    /** External APIs - longer retry */
    external: {
        maxRetries: 3,
        initialDelay: 2000,
        maxDelay: 10000,
        backoffMultiplier: 2,
    } satisfies RetryOptions,

    /** Critical operations - more attempts */
    critical: {
        maxRetries: 5,
        initialDelay: 1000,
        maxDelay: 30000,
        backoffMultiplier: 2,
    } satisfies RetryOptions,
};

/**
 * Common rate limit patterns
 */
export const rateLimitPatterns = {
    /** Public RPC - conservative */
    publicRpc: {
        maxRequests: 10,
        windowMs: 1000,
        strategy: 'delay' as const,
    },

    /** Subgraph - moderate */
    subgraph: {
        maxRequests: 30,
        windowMs: 60000,
        strategy: 'delay' as const,
    },

    /** Price APIs - strict */
    priceApi: {
        maxRequests: 5,
        windowMs: 1000,
        strategy: 'delay' as const,
    },
};
