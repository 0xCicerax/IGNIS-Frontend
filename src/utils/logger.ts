/**
 * Logger Utility
 * 
 * Production-safe logging utility that:
 * - Suppresses debug/info logs in production
 * - Always allows warn/error (important for monitoring)
 * - Provides structured logging with context
 * - Integrates with Sentry for error tracking
 * 
 * Usage:
 *   import { logger } from '@/utils/logger';
 *   logger.debug('Swap details', { fromToken, toToken, amount });
 *   logger.error('Swap failed', error);
 */

import { captureError, captureMessage, addBreadcrumb, isSentryInitialized } from '../lib/sentry';

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogContext {
  [key: string]: unknown;
}

interface LoggerConfig {
  enabled: boolean;
  minLevel: LogLevel;
  prefix: string;
}

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

// ─────────────────────────────────────────────────────────────────────────────
// Configuration
// ─────────────────────────────────────────────────────────────────────────────

const isDev = import.meta.env.DEV;
const isProd = import.meta.env.PROD;

const defaultConfig: LoggerConfig = {
  enabled: true,
  minLevel: isDev ? 'debug' : 'warn', // Only warn+ in production
  prefix: '[IGNIS]',
};

// ─────────────────────────────────────────────────────────────────────────────
// Logger Implementation
// ─────────────────────────────────────────────────────────────────────────────

class Logger {
  private config: LoggerConfig;

  constructor(config: Partial<LoggerConfig> = {}) {
    this.config = { ...defaultConfig, ...config };
  }

  private shouldLog(level: LogLevel): boolean {
    if (!this.config.enabled) return false;
    return LOG_LEVELS[level] >= LOG_LEVELS[this.config.minLevel];
  }

  private formatMessage(level: LogLevel, message: string): string {
    const timestamp = new Date().toISOString();
    return `${this.config.prefix} [${level.toUpperCase()}] ${timestamp} - ${message}`;
  }

  private formatContext(context?: LogContext): string {
    if (!context || Object.keys(context).length === 0) return '';
    try {
      return '\n' + JSON.stringify(context, null, 2);
    } catch {
      return '\n[Unserializable context]';
    }
  }

  /**
   * Debug level - development only
   * Use for detailed debugging information
   */
  debug(message: string, context?: LogContext): void {
    if (!this.shouldLog('debug')) return;
    console.log(
      this.formatMessage('debug', message) + this.formatContext(context)
    );
    
    // Add breadcrumb for debugging trail
    this.addDebugBreadcrumb(message, context);
  }

  /**
   * Info level - development only by default
   * Use for general operational information
   */
  info(message: string, context?: LogContext): void {
    if (!this.shouldLog('info')) return;
    console.info(
      this.formatMessage('info', message) + this.formatContext(context)
    );
    
    // Add breadcrumb for debugging trail
    this.addDebugBreadcrumb(message, context);
  }

  /**
   * Warn level - always logged
   * Use for potentially harmful situations
   */
  warn(message: string, context?: LogContext): void {
    if (!this.shouldLog('warn')) return;
    console.warn(
      this.formatMessage('warn', message) + this.formatContext(context)
    );
    
    // Send warning to Sentry in production
    if (isProd && isSentryInitialized) {
      captureMessage(message, 'warning', context);
    }
  }

  /**
   * Error level - always logged
   * Use for error events that might still allow the app to continue
   */
  error(message: string, error?: Error | unknown, context?: LogContext): void {
    if (!this.shouldLog('error')) return;
    
    const errorInfo = error instanceof Error 
      ? { name: error.name, message: error.message, stack: error.stack }
      : { error };

    console.error(
      this.formatMessage('error', message),
      errorInfo,
      context ? this.formatContext(context) : ''
    );

    // Send error to Sentry
    if (isSentryInitialized) {
      captureError(error || new Error(message), {
        ...context,
        loggerPrefix: this.config.prefix,
      });
    }
  }

  /**
   * Group related logs together
   */
  group(label: string, fn: () => void): void {
    if (!this.shouldLog('debug')) {
      fn();
      return;
    }
    console.group(this.formatMessage('debug', label));
    fn();
    console.groupEnd();
  }

  /**
   * Time a function execution
   */
  time<T>(label: string, fn: () => T): T {
    if (!this.shouldLog('debug')) return fn();
    
    const start = performance.now();
    const result = fn();
    const duration = performance.now() - start;
    
    this.debug(`${label} completed`, { durationMs: duration.toFixed(2) });
    return result;
  }

  /**
   * Time an async function execution
   */
  async timeAsync<T>(label: string, fn: () => Promise<T>): Promise<T> {
    if (!this.shouldLog('debug')) return fn();
    
    const start = performance.now();
    const result = await fn();
    const duration = performance.now() - start;
    
    this.debug(`${label} completed`, { durationMs: duration.toFixed(2) });
    return result;
  }

  /**
   * Create a child logger with additional context
   */
  child(prefix: string): Logger {
    return new Logger({
      ...this.config,
      prefix: `${this.config.prefix}[${prefix}]`,
    });
  }

  /**
   * Add breadcrumb for Sentry debugging trail
   */
  private addDebugBreadcrumb(message: string, context?: LogContext): void {
    if (!isSentryInitialized) return;
    
    // Determine category from prefix
    const prefix = this.config.prefix.toLowerCase();
    let category: 'swap' | 'liquidity' | 'stake' | 'wallet' | 'navigation' | 'ui' | 'contract' = 'ui';
    
    if (prefix.includes('swap')) category = 'swap';
    else if (prefix.includes('pool') || prefix.includes('liquidity')) category = 'liquidity';
    else if (prefix.includes('stake')) category = 'stake';
    else if (prefix.includes('wallet')) category = 'wallet';
    else if (prefix.includes('contract')) category = 'contract';
    
    addBreadcrumb(message, category, context as Record<string, unknown>);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Export singleton instance
// ─────────────────────────────────────────────────────────────────────────────

export const logger = new Logger();

// Child loggers for different modules
export const swapLogger = logger.child('Swap');
export const poolLogger = logger.child('Pool');
export const walletLogger = logger.child('Wallet');
export const contractLogger = logger.child('Contract');
export const apiLogger = logger.child('API');
export const stakingLogger = logger.child('Staking');

export default logger;
