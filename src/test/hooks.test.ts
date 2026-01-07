/** Module */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  calculateMinAmountOut,
  calculateDeadline,
  formatPriceImpact,
  routeUsesBuffer,
} from '../hooks/contracts/useQuote';
import { RouteAction } from '../lib/contracts/types';

// ─────────────────────────────────────────────────────────────────────────────────
// CALCULATE MIN AMOUNT OUT
// ─────────────────────────────────────────────────────────────────────────────────

describe('calculateMinAmountOut', () => {
  it('calculates minimum output with 0.5% slippage', () => {
    const amountOut = 1000000000000000000n; // 1 ETH
    const slippageBps = 50; // 0.5%
    
    const result = calculateMinAmountOut(amountOut, slippageBps);
    
    // Should be 99.5% of original: 0.995 ETH
    expect(result).toBe(995000000000000000n);
  });

  it('calculates minimum output with 1% slippage', () => {
    const amountOut = 1000000000000000000n;
    const slippageBps = 100; // 1%
    
    const result = calculateMinAmountOut(amountOut, slippageBps);
    
    expect(result).toBe(990000000000000000n);
  });

  it('calculates minimum output with 5% slippage', () => {
    const amountOut = 1000000000n; // 1000 USDC (6 decimals)
    const slippageBps = 500; // 5%
    
    const result = calculateMinAmountOut(amountOut, slippageBps);
    
    expect(result).toBe(950000000n);
  });

  it('handles zero slippage', () => {
    const amountOut = 1000000000000000000n;
    const slippageBps = 0;
    
    const result = calculateMinAmountOut(amountOut, slippageBps);
    
    expect(result).toBe(amountOut);
  });

  it('handles 100% slippage (extreme case)', () => {
    const amountOut = 1000000000000000000n;
    const slippageBps = 10000; // 100%
    
    const result = calculateMinAmountOut(amountOut, slippageBps);
    
    expect(result).toBe(0n);
  });

  it('handles very large amounts', () => {
    const amountOut = 1000000000000000000000000n; // 1M ETH
    const slippageBps = 50;
    
    const result = calculateMinAmountOut(amountOut, slippageBps);
    
    expect(result).toBe(995000000000000000000000n);
  });

  it('handles small amounts without precision loss', () => {
    const amountOut = 1000n; // Very small
    const slippageBps = 50;
    
    const result = calculateMinAmountOut(amountOut, slippageBps);
    
    // 1000 * 9950 / 10000 = 995
    expect(result).toBe(995n);
  });

  it('handles stablecoin trades with typical slippage', () => {
    // 10,000 USDC with 0.1% slippage
    const amountOut = 10000000000n;
    const slippageBps = 10;
    
    const result = calculateMinAmountOut(amountOut, slippageBps);
    
    expect(result).toBe(9990000000n);
  });
});

// ─────────────────────────────────────────────────────────────────────────────────
// CALCULATE DEADLINE
// ─────────────────────────────────────────────────────────────────────────────────

describe('calculateDeadline', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('calculates deadline 20 minutes from now by default', () => {
    const now = 1700000000000; // Fixed timestamp
    vi.setSystemTime(now);
    
    const deadline = calculateDeadline();
    
    // Default is 1200 seconds (20 minutes)
    expect(deadline).toBe(BigInt(Math.floor(now / 1000) + 1200));
  });

  it('calculates deadline with custom duration', () => {
    const now = 1700000000000;
    vi.setSystemTime(now);
    
    const deadline = calculateDeadline(600); // 10 minutes
    
    expect(deadline).toBe(BigInt(Math.floor(now / 1000) + 600));
  });

  it('calculates deadline with 1 hour', () => {
    const now = 1700000000000;
    vi.setSystemTime(now);
    
    const deadline = calculateDeadline(3600);
    
    expect(deadline).toBe(BigInt(Math.floor(now / 1000) + 3600));
  });

  it('calculates deadline with very short duration', () => {
    const now = 1700000000000;
    vi.setSystemTime(now);
    
    const deadline = calculateDeadline(30); // 30 seconds
    
    expect(deadline).toBe(BigInt(Math.floor(now / 1000) + 30));
  });

  it('deadline is always in the future', () => {
    vi.useRealTimers();
    const now = Math.floor(Date.now() / 1000);
    
    const deadline = calculateDeadline();
    
    expect(Number(deadline)).toBeGreaterThan(now);
  });
});

// ─────────────────────────────────────────────────────────────────────────────────
// FORMAT PRICE IMPACT
// ─────────────────────────────────────────────────────────────────────────────────

describe('formatPriceImpact', () => {
  describe('value formatting', () => {
    it('formats zero price impact', () => {
      const result = formatPriceImpact(0);
      
      expect(result.value).toBe('<0.01%');
    });

    it('formats very small price impact', () => {
      const result = formatPriceImpact(0.5); // 0.005%
      
      expect(result.value).toBe('<0.01%');
    });

    it('formats normal price impact', () => {
      const result = formatPriceImpact(50); // 0.5%
      
      expect(result.value).toBe('0.50%');
    });

    it('formats whole number price impact', () => {
      const result = formatPriceImpact(100); // 1%
      
      expect(result.value).toBe('1.00%');
    });

    it('formats high price impact', () => {
      const result = formatPriceImpact(500); // 5%
      
      expect(result.value).toBe('5.00%');
    });

    it('formats very high price impact', () => {
      const result = formatPriceImpact(1500); // 15%
      
      expect(result.value).toBe('15.00%');
    });
  });

  describe('severity classification', () => {
    it('classifies < 1% as low severity', () => {
      expect(formatPriceImpact(0).severity).toBe('low');
      expect(formatPriceImpact(50).severity).toBe('low');
      expect(formatPriceImpact(99).severity).toBe('low');
    });

    it('classifies 1-3% as medium severity', () => {
      expect(formatPriceImpact(100).severity).toBe('medium');
      expect(formatPriceImpact(200).severity).toBe('medium');
      expect(formatPriceImpact(299).severity).toBe('medium');
    });

    it('classifies 3-5% as high severity', () => {
      expect(formatPriceImpact(300).severity).toBe('high');
      expect(formatPriceImpact(400).severity).toBe('high');
      expect(formatPriceImpact(499).severity).toBe('high');
    });

    it('classifies > 5% as very-high severity', () => {
      expect(formatPriceImpact(500).severity).toBe('very-high');
      expect(formatPriceImpact(1000).severity).toBe('very-high');
      expect(formatPriceImpact(5000).severity).toBe('very-high');
    });
  });
});

// ─────────────────────────────────────────────────────────────────────────────────
// ROUTE USES BUFFER
// ─────────────────────────────────────────────────────────────────────────────────

describe('routeUsesBuffer', () => {
  const createRouteStep = (action: number) => ({
    action,
    tokenIn: '0x0000000000000000000000000000000000000001' as `0x${string}`,
    tokenOut: '0x0000000000000000000000000000000000000002' as `0x${string}`,
    amountIn: 1000n,
    amountOut: 1000n,
    poolData: '0x' as `0x${string}`,
  });

  it('returns false for empty route', () => {
    expect(routeUsesBuffer([])).toBe(false);
  });

  it('returns false for CL swap only', () => {
    const route = [createRouteStep(RouteAction.SWAP_CL)];
    
    expect(routeUsesBuffer(route)).toBe(false);
  });

  it('returns false for BIN swap only', () => {
    const route = [createRouteStep(RouteAction.SWAP_BIN)];
    
    expect(routeUsesBuffer(route)).toBe(false);
  });

  it('returns true for route with WRAP', () => {
    const route = [createRouteStep(RouteAction.WRAP)];
    
    expect(routeUsesBuffer(route)).toBe(true);
  });

  it('returns true for route with UNWRAP', () => {
    const route = [createRouteStep(RouteAction.UNWRAP)];
    
    expect(routeUsesBuffer(route)).toBe(true);
  });

  it('returns true for multi-hop route with WRAP', () => {
    const route = [
      createRouteStep(RouteAction.WRAP),
      createRouteStep(RouteAction.SWAP_CL),
    ];
    
    expect(routeUsesBuffer(route)).toBe(true);
  });

  it('returns true for multi-hop route with UNWRAP at end', () => {
    const route = [
      createRouteStep(RouteAction.SWAP_CL),
      createRouteStep(RouteAction.UNWRAP),
    ];
    
    expect(routeUsesBuffer(route)).toBe(true);
  });

  it('returns false for multi-hop swaps without buffer', () => {
    const route = [
      createRouteStep(RouteAction.SWAP_CL),
      createRouteStep(RouteAction.SWAP_BIN),
      createRouteStep(RouteAction.SWAP_CL),
    ];
    
    expect(routeUsesBuffer(route)).toBe(false);
  });

  it('handles complex route with buffer in middle', () => {
    const route = [
      createRouteStep(RouteAction.SWAP_CL),
      createRouteStep(RouteAction.WRAP),
      createRouteStep(RouteAction.SWAP_BIN),
    ];
    
    expect(routeUsesBuffer(route)).toBe(true);
  });
});

// ─────────────────────────────────────────────────────────────────────────────────
// VALIDATION HOOK TESTS (useValidation)
// ─────────────────────────────────────────────────────────────────────────────────

describe('Validation utilities', () => {
  describe('amount validation', () => {
    const isValidAmount = (value: string): boolean => {
      if (!value || value === '') return false;
      const num = parseFloat(value);
      return !isNaN(num) && num > 0 && isFinite(num);
    };

    it('validates positive numbers', () => {
      expect(isValidAmount('1')).toBe(true);
      expect(isValidAmount('100')).toBe(true);
      expect(isValidAmount('0.001')).toBe(true);
    });

    it('rejects zero', () => {
      expect(isValidAmount('0')).toBe(false);
    });

    it('rejects negative numbers', () => {
      expect(isValidAmount('-1')).toBe(false);
      expect(isValidAmount('-100')).toBe(false);
    });

    it('rejects empty string', () => {
      expect(isValidAmount('')).toBe(false);
    });

    it('rejects NaN', () => {
      expect(isValidAmount('abc')).toBe(false);
      expect(isValidAmount('NaN')).toBe(false);
    });

    it('rejects Infinity', () => {
      expect(isValidAmount('Infinity')).toBe(false);
    });

    it('validates decimal values', () => {
      expect(isValidAmount('0.000001')).toBe(true);
      expect(isValidAmount('123.456789')).toBe(true);
    });
  });

  describe('address validation', () => {
    const isValidAddress = (address: string): boolean => {
      return /^0x[a-fA-F0-9]{40}$/.test(address);
    };

    it('validates correct Ethereum addresses', () => {
      expect(isValidAddress('0x0000000000000000000000000000000000000001')).toBe(true);
      expect(isValidAddress('0xabc123def456abc123def456abc123def456abc1')).toBe(true);
      expect(isValidAddress('0xABC123DEF456ABC123DEF456ABC123DEF456ABC1')).toBe(true);
    });

    it('rejects addresses without 0x prefix', () => {
      expect(isValidAddress('0000000000000000000000000000000000000001')).toBe(false);
    });

    it('rejects addresses with wrong length', () => {
      expect(isValidAddress('0x123')).toBe(false);
      expect(isValidAddress('0x0000000000000000000000000000000000000001abc')).toBe(false);
    });

    it('rejects addresses with invalid characters', () => {
      expect(isValidAddress('0xgggggggggggggggggggggggggggggggggggggggg')).toBe(false);
      expect(isValidAddress('0x000000000000000000000000000000000000000!')).toBe(false);
    });
  });

  describe('slippage validation', () => {
    const isValidSlippage = (value: number): boolean => {
      return value >= 0 && value <= 50 && !isNaN(value);
    };

    it('validates typical slippage values', () => {
      expect(isValidSlippage(0.5)).toBe(true);
      expect(isValidSlippage(1)).toBe(true);
      expect(isValidSlippage(5)).toBe(true);
    });

    it('validates zero slippage', () => {
      expect(isValidSlippage(0)).toBe(true);
    });

    it('validates maximum reasonable slippage', () => {
      expect(isValidSlippage(50)).toBe(true);
    });

    it('rejects slippage over 50%', () => {
      expect(isValidSlippage(51)).toBe(false);
      expect(isValidSlippage(100)).toBe(false);
    });

    it('rejects negative slippage', () => {
      expect(isValidSlippage(-1)).toBe(false);
    });
  });
});

// ─────────────────────────────────────────────────────────────────────────────────
// SETTINGS HOOK TESTS (useSettings)
// ─────────────────────────────────────────────────────────────────────────────────

describe('Settings utilities', () => {
  describe('slippage BPS conversion', () => {
    const percentToBps = (percent: number): number => Math.round(percent * 100);
    const bpsToPercent = (bps: number): number => bps / 100;

    it('converts percent to BPS correctly', () => {
      expect(percentToBps(0.5)).toBe(50);
      expect(percentToBps(1)).toBe(100);
      expect(percentToBps(5)).toBe(500);
    });

    it('converts BPS to percent correctly', () => {
      expect(bpsToPercent(50)).toBe(0.5);
      expect(bpsToPercent(100)).toBe(1);
      expect(bpsToPercent(500)).toBe(5);
    });

    it('round-trips correctly', () => {
      const original = 2.5;
      const bps = percentToBps(original);
      const roundTripped = bpsToPercent(bps);
      
      expect(roundTripped).toBe(original);
    });
  });

  describe('deadline conversion', () => {
    const minutesToSeconds = (minutes: number): number => minutes * 60;

    it('converts minutes to seconds', () => {
      expect(minutesToSeconds(20)).toBe(1200);
      expect(minutesToSeconds(5)).toBe(300);
      expect(minutesToSeconds(60)).toBe(3600);
    });
  });
});

// ─────────────────────────────────────────────────────────────────────────────────
// TOKEN UTILITIES
// ─────────────────────────────────────────────────────────────────────────────────

describe('Token utilities', () => {
  describe('parseUnits equivalent', () => {
    const toRawAmount = (amount: string, decimals: number): bigint => {
      const [whole, fraction = ''] = amount.split('.');
      const paddedFraction = fraction.padEnd(decimals, '0').slice(0, decimals);
      return BigInt(whole + paddedFraction);
    };

    it('converts whole numbers', () => {
      expect(toRawAmount('1', 18)).toBe(1000000000000000000n);
      expect(toRawAmount('100', 18)).toBe(100000000000000000000n);
    });

    it('converts decimal amounts', () => {
      expect(toRawAmount('1.5', 18)).toBe(1500000000000000000n);
      expect(toRawAmount('0.5', 18)).toBe(500000000000000000n);
    });

    it('handles 6 decimals (USDC)', () => {
      expect(toRawAmount('1', 6)).toBe(1000000n);
      expect(toRawAmount('100', 6)).toBe(100000000n);
      expect(toRawAmount('1.5', 6)).toBe(1500000n);
    });

    it('handles 8 decimals (WBTC)', () => {
      expect(toRawAmount('1', 8)).toBe(100000000n);
      expect(toRawAmount('0.001', 8)).toBe(100000n);
    });
  });

  describe('formatUnits equivalent', () => {
    const fromRawAmount = (raw: bigint, decimals: number): string => {
      const str = raw.toString().padStart(decimals + 1, '0');
      const wholeLen = str.length - decimals;
      const whole = str.slice(0, wholeLen) || '0';
      const fraction = str.slice(wholeLen);
      return `${whole}.${fraction}`;
    };

    it('formats 18 decimal tokens', () => {
      expect(fromRawAmount(1000000000000000000n, 18)).toBe('1.000000000000000000');
      expect(fromRawAmount(1500000000000000000n, 18)).toBe('1.500000000000000000');
    });

    it('formats 6 decimal tokens', () => {
      expect(fromRawAmount(1000000n, 6)).toBe('1.000000');
      expect(fromRawAmount(100000000n, 6)).toBe('100.000000');
    });

    it('formats small amounts', () => {
      expect(fromRawAmount(1n, 18)).toBe('0.000000000000000001');
      expect(fromRawAmount(1n, 6)).toBe('0.000001');
    });
  });
});

// ─────────────────────────────────────────────────────────────────────────────────
// PENDING TRANSACTION UTILITIES
// ─────────────────────────────────────────────────────────────────────────────────

describe('Transaction utilities', () => {
  describe('transaction status', () => {
    type TxStatus = 'pending' | 'confirmed' | 'failed';
    
    interface PendingTx {
      hash: string;
      type: string;
      status: TxStatus;
      timestamp: number;
    }

    const isTransactionExpired = (tx: PendingTx, timeoutMs: number = 300000): boolean => {
      return Date.now() - tx.timestamp > timeoutMs;
    };

    const filterActiveTxs = (txs: PendingTx[]): PendingTx[] => {
      return txs.filter(tx => tx.status === 'pending' && !isTransactionExpired(tx));
    };

    it('identifies expired transactions', () => {
      const tx: PendingTx = {
        hash: '0x123',
        type: 'swap',
        status: 'pending',
        timestamp: Date.now() - 400000, // 6+ minutes ago
      };

      expect(isTransactionExpired(tx)).toBe(true);
    });

    it('identifies active transactions', () => {
      const tx: PendingTx = {
        hash: '0x123',
        type: 'swap',
        status: 'pending',
        timestamp: Date.now() - 60000, // 1 minute ago
      };

      expect(isTransactionExpired(tx)).toBe(false);
    });

    it('filters active transactions', () => {
      const txs: PendingTx[] = [
        { hash: '0x1', type: 'swap', status: 'pending', timestamp: Date.now() - 60000 },
        { hash: '0x2', type: 'swap', status: 'confirmed', timestamp: Date.now() - 60000 },
        { hash: '0x3', type: 'swap', status: 'pending', timestamp: Date.now() - 400000 },
      ];

      const active = filterActiveTxs(txs);

      expect(active).toHaveLength(1);
      expect(active[0].hash).toBe('0x1');
    });
  });
});

// ─────────────────────────────────────────────────────────────────────────────────
// P0 SECURITY VALIDATIONS
// ─────────────────────────────────────────────────────────────────────────────────

import {
  validateDeadline,
  assertValidDeadline,
  validateMinAmountOut,
  assertValidMinAmountOut,
  validateSlippage,
  assertPositiveAmount,
  assertSufficientBalance,
  createDeadline,
  isDeadlineValid,
  MIN_DEADLINE_SECONDS,
  MAX_DEADLINE_SECONDS,
  MAX_SLIPPAGE_BPS,
} from '../lib/contracts/validation';
import { IgnisError } from '../lib/contracts/errors';

describe('P0 Security Validations', () => {
  // ─────────────────────────────────────────────────────────────────────────────
  // DEADLINE VALIDATION
  // ─────────────────────────────────────────────────────────────────────────────

  describe('validateDeadline', () => {
    it('accepts deadline 5 minutes in the future', () => {
      const deadline = createDeadline(300); // 5 minutes
      const result = validateDeadline(deadline);
      
      expect(result.isValid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('accepts deadline exactly 30 seconds in the future', () => {
      const deadline = createDeadline(30);
      const result = validateDeadline(deadline);
      
      expect(result.isValid).toBe(true);
    });

    it('accepts deadline exactly 1 hour in the future', () => {
      const deadline = createDeadline(3600);
      const result = validateDeadline(deadline);
      
      expect(result.isValid).toBe(true);
    });

    it('rejects expired deadline', () => {
      const now = BigInt(Math.floor(Date.now() / 1000));
      const deadline = now - BigInt(60); // 1 minute ago
      
      const result = validateDeadline(deadline);
      
      expect(result.isValid).toBe(false);
      expect(result.error?.code).toBe('DEADLINE_EXPIRED');
    });

    it('rejects deadline that is current time', () => {
      const now = BigInt(Math.floor(Date.now() / 1000));
      
      const result = validateDeadline(now);
      
      expect(result.isValid).toBe(false);
      expect(result.error?.code).toBe('DEADLINE_EXPIRED');
    });

    it('rejects deadline too soon (< 30 seconds)', () => {
      const deadline = createDeadline(15); // 15 seconds
      
      const result = validateDeadline(deadline);
      
      expect(result.isValid).toBe(false);
      expect(result.error?.code).toBe('DEADLINE_TOO_SOON');
    });

    it('rejects deadline too far (> 1 hour)', () => {
      const deadline = createDeadline(7200); // 2 hours
      
      const result = validateDeadline(deadline);
      
      expect(result.isValid).toBe(false);
      expect(result.error?.code).toBe('DEADLINE_TOO_FAR');
    });

    it('returns secondsFromNow for valid deadline', () => {
      const deadline = createDeadline(600); // 10 minutes
      const result = validateDeadline(deadline);
      
      expect(result.isValid).toBe(true);
      expect(result.secondsFromNow).toBeDefined();
      expect(Number(result.secondsFromNow)).toBeGreaterThanOrEqual(599);
      expect(Number(result.secondsFromNow)).toBeLessThanOrEqual(601);
    });
  });

  describe('assertValidDeadline', () => {
    it('does not throw for valid deadline', () => {
      const deadline = createDeadline(300);
      
      expect(() => assertValidDeadline(deadline)).not.toThrow();
    });

    it('throws IgnisError for expired deadline', () => {
      const now = BigInt(Math.floor(Date.now() / 1000));
      const deadline = now - BigInt(60);
      
      expect(() => assertValidDeadline(deadline)).toThrow(IgnisError);
      
      try {
        assertValidDeadline(deadline);
      } catch (e) {
        expect(e).toBeInstanceOf(IgnisError);
        expect((e as IgnisError).code).toBe('DEADLINE_EXPIRED');
        expect((e as IgnisError).isRetryable).toBe(true);
      }
    });
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // MIN AMOUNT OUT VALIDATION
  // ─────────────────────────────────────────────────────────────────────────────

  describe('validateMinAmountOut', () => {
    it('accepts valid minAmountOut (5% slippage)', () => {
      const amountIn = 1000000000000000000n; // 1 ETH
      const minAmountOut = 950000000000000000n; // 0.95 ETH (5% slippage)
      
      const result = validateMinAmountOut(amountIn, minAmountOut);
      
      expect(result.isValid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('accepts valid minAmountOut (1% slippage)', () => {
      const amountIn = 1000000000000000000n;
      const minAmountOut = 990000000000000000n; // 0.99 ETH
      
      const result = validateMinAmountOut(amountIn, minAmountOut);
      
      expect(result.isValid).toBe(true);
    });

    it('rejects zero minAmountOut', () => {
      const amountIn = 1000000000000000000n;
      const minAmountOut = 0n;
      
      const result = validateMinAmountOut(amountIn, minAmountOut);
      
      expect(result.isValid).toBe(false);
      expect(result.error?.code).toBe('ZERO_MIN_OUTPUT');
    });

    it('rejects zero amountIn', () => {
      const amountIn = 0n;
      const minAmountOut = 1000000000000000000n;
      
      const result = validateMinAmountOut(amountIn, minAmountOut);
      
      expect(result.isValid).toBe(false);
      expect(result.error?.code).toBe('ZERO_AMOUNT_IN');
    });

    it('warns for high slippage (> 50%)', () => {
      const amountIn = 1000000000000000000n; // 1 ETH
      const minAmountOut = 400000000000000000n; // 0.4 ETH (60% slippage)
      
      const result = validateMinAmountOut(amountIn, minAmountOut);
      
      expect(result.isValid).toBe(true); // Still valid, but with warning
      expect(result.warning).toBeDefined();
      expect(result.warning).toContain('High slippage');
    });

    it('calculates implied slippage for high slippage swaps', () => {
      const amountIn = 1000000000000000000n;
      const minAmountOut = 300000000000000000n; // 0.3 ETH (70% slippage)
      
      const result = validateMinAmountOut(amountIn, minAmountOut);
      
      expect(result.isValid).toBe(true);
      expect(result.impliedSlippageBps).toBeDefined();
      expect(result.impliedSlippageBps).toBe(7000); // 70%
    });

    it('handles different decimal tokens (USDC with 6 decimals)', () => {
      const amountIn = 1000000000000000000n; // 1 ETH (18 decimals)
      const minAmountOut = 950000000n; // 950 USDC (6 decimals)
      
      // This is valid because they're different-value tokens
      const result = validateMinAmountOut(amountIn, minAmountOut, 18, 6);
      
      expect(result.isValid).toBe(true);
    });

    it('handles 8 decimal tokens (WBTC)', () => {
      const amountIn = 100000000n; // 1 WBTC (8 decimals)
      const minAmountOut = 95000000n; // 0.95 WBTC
      
      const result = validateMinAmountOut(amountIn, minAmountOut, 8, 8);
      
      expect(result.isValid).toBe(true);
    });
  });

  describe('assertValidMinAmountOut', () => {
    it('does not throw for valid amounts', () => {
      const amountIn = 1000000000000000000n;
      const minAmountOut = 950000000000000000n;
      
      expect(() => assertValidMinAmountOut(amountIn, minAmountOut)).not.toThrow();
    });

    it('throws IgnisError for zero minAmountOut', () => {
      const amountIn = 1000000000000000000n;
      const minAmountOut = 0n;
      
      expect(() => assertValidMinAmountOut(amountIn, minAmountOut)).toThrow(IgnisError);
    });
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // SLIPPAGE VALIDATION
  // ─────────────────────────────────────────────────────────────────────────────

  describe('validateSlippage', () => {
    it('accepts 0.5% slippage (50 bps)', () => {
      const result = validateSlippage(50);
      
      expect(result.isValid).toBe(true);
      expect(result.warning).toBeUndefined();
    });

    it('accepts 1% slippage (100 bps)', () => {
      const result = validateSlippage(100);
      
      expect(result.isValid).toBe(true);
    });

    it('accepts 5% slippage (500 bps)', () => {
      const result = validateSlippage(500);
      
      expect(result.isValid).toBe(true);
    });

    it('warns for 10% slippage (1000 bps)', () => {
      const result = validateSlippage(1000);
      
      expect(result.isValid).toBe(true);
      expect(result.warning).toBeDefined();
      expect(result.warning).toContain('High slippage');
    });

    it('rejects negative slippage', () => {
      const result = validateSlippage(-50);
      
      expect(result.isValid).toBe(false);
      expect(result.error?.code).toBe('INVALID_SLIPPAGE');
    });

    it('rejects slippage over 50% (5000 bps)', () => {
      const result = validateSlippage(5001);
      
      expect(result.isValid).toBe(false);
      expect(result.error?.code).toBe('SLIPPAGE_TOO_HIGH');
    });

    it('accepts exactly 50% slippage (max allowed)', () => {
      const result = validateSlippage(5000);
      
      expect(result.isValid).toBe(true);
    });
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // AMOUNT VALIDATION
  // ─────────────────────────────────────────────────────────────────────────────

  describe('assertPositiveAmount', () => {
    it('does not throw for positive amount', () => {
      expect(() => assertPositiveAmount(1000n, 'Test amount')).not.toThrow();
    });

    it('throws for zero amount', () => {
      expect(() => assertPositiveAmount(0n, 'Test amount')).toThrow(IgnisError);
    });

    it('throws for negative amount', () => {
      expect(() => assertPositiveAmount(-100n, 'Test amount')).toThrow(IgnisError);
    });

    it('includes field name in error', () => {
      try {
        assertPositiveAmount(0n, 'Stake amount');
      } catch (e) {
        expect((e as IgnisError).message).toContain('Stake amount');
      }
    });
  });

  describe('assertSufficientBalance', () => {
    it('does not throw when balance is sufficient', () => {
      expect(() => assertSufficientBalance(100n, 1000n, 'ETH')).not.toThrow();
    });

    it('does not throw when balance exactly matches', () => {
      expect(() => assertSufficientBalance(1000n, 1000n, 'ETH')).not.toThrow();
    });

    it('throws when balance is insufficient', () => {
      expect(() => assertSufficientBalance(1000n, 500n, 'ETH')).toThrow(IgnisError);
    });

    it('includes token symbol in error', () => {
      try {
        assertSufficientBalance(1000n, 500n, 'USDC');
      } catch (e) {
        expect((e as IgnisError).userMessage).toContain('USDC');
      }
    });

    it('includes details with amounts', () => {
      try {
        assertSufficientBalance(1000n, 500n, 'ETH');
      } catch (e) {
        expect((e as IgnisError).details).toBeDefined();
        expect((e as IgnisError).details?.requested).toBe('1000');
        expect((e as IgnisError).details?.available).toBe('500');
      }
    });
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // HELPER FUNCTIONS
  // ─────────────────────────────────────────────────────────────────────────────

  describe('createDeadline', () => {
    it('creates deadline N seconds in the future', () => {
      const now = Math.floor(Date.now() / 1000);
      const deadline = createDeadline(300);
      
      expect(Number(deadline)).toBeGreaterThanOrEqual(now + 299);
      expect(Number(deadline)).toBeLessThanOrEqual(now + 301);
    });

    it('creates deadline for 20 minutes (default)', () => {
      const now = Math.floor(Date.now() / 1000);
      const deadline = createDeadline(1200);
      
      expect(Number(deadline)).toBeGreaterThanOrEqual(now + 1199);
    });
  });

  describe('isDeadlineValid', () => {
    it('returns true for future deadline', () => {
      const deadline = createDeadline(300);
      expect(isDeadlineValid(deadline)).toBe(true);
    });

    it('returns false for past deadline', () => {
      const now = BigInt(Math.floor(Date.now() / 1000));
      const deadline = now - BigInt(60);
      expect(isDeadlineValid(deadline)).toBe(false);
    });

    it('returns false for current time', () => {
      const now = BigInt(Math.floor(Date.now() / 1000));
      expect(isDeadlineValid(now)).toBe(false);
    });
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // CONSTANTS EXPORTED CORRECTLY
  // ─────────────────────────────────────────────────────────────────────────────

  describe('validation constants', () => {
    it('exports MIN_DEADLINE_SECONDS as 30', () => {
      expect(MIN_DEADLINE_SECONDS).toBe(BigInt(30));
    });

    it('exports MAX_DEADLINE_SECONDS as 3600 (1 hour)', () => {
      expect(MAX_DEADLINE_SECONDS).toBe(BigInt(3600));
    });

    it('exports MAX_SLIPPAGE_BPS as 5000 (50%)', () => {
      expect(MAX_SLIPPAGE_BPS).toBe(5000);
    });
  });
});
