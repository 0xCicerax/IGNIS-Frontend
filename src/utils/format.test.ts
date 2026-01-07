/** Module */

import { describe, it, expect } from 'vitest';
import {
  formatCurrency,
  formatNumber,
  formatPercent,
  formatAddress,
  formatTokenAmount,
} from './format';

// ─────────────────────────────────────────────────────────────────────────────────
// formatCurrency
// ─────────────────────────────────────────────────────────────────────────────────

describe('formatCurrency', () => {
  describe('basic formatting', () => {
    it('formats small values with $ prefix', () => {
      expect(formatCurrency(0)).toBe('$0.00');
      expect(formatCurrency(1)).toBe('$1.00');
      expect(formatCurrency(99.99)).toBe('$99.99');
      expect(formatCurrency(999)).toBe('$999.00');
    });

    it('formats values with custom decimals', () => {
      expect(formatCurrency(123.456, 0)).toBe('$123');
      expect(formatCurrency(123.456, 1)).toBe('$123.5');
      expect(formatCurrency(123.456, 3)).toBe('$123.456');
      expect(formatCurrency(123.456, 4)).toBe('$123.4560');
    });
  });

  describe('K suffix (thousands)', () => {
    it('formats thousands correctly', () => {
      expect(formatCurrency(1000)).toBe('$1.00K');
      expect(formatCurrency(1500)).toBe('$1.50K');
      expect(formatCurrency(9999)).toBe('$10.00K');
      expect(formatCurrency(99999)).toBe('$100.00K');
      expect(formatCurrency(999999)).toBe('$1000.00K');
    });
  });

  describe('M suffix (millions)', () => {
    it('formats millions correctly', () => {
      expect(formatCurrency(1000000)).toBe('$1.00M');
      expect(formatCurrency(1500000)).toBe('$1.50M');
      expect(formatCurrency(12345678)).toBe('$12.35M');
      expect(formatCurrency(999999999)).toBe('$1000.00M');
    });
  });

  describe('B suffix (billions)', () => {
    it('formats billions correctly', () => {
      expect(formatCurrency(1000000000)).toBe('$1.00B');
      expect(formatCurrency(1500000000)).toBe('$1.50B');
      expect(formatCurrency(123456789012)).toBe('$123.46B');
    });
  });

  describe('edge cases', () => {
    it('handles negative values', () => {
      expect(formatCurrency(-100)).toBe('$-100.00');
      expect(formatCurrency(-1000)).toBe('$-1.00K');
    });

    it('handles very small decimals', () => {
      expect(formatCurrency(0.01)).toBe('$0.01');
      expect(formatCurrency(0.001)).toBe('$0.00');
      expect(formatCurrency(0.001, 3)).toBe('$0.001');
    });
  });
});

// ─────────────────────────────────────────────────────────────────────────────────
// formatNumber
// ─────────────────────────────────────────────────────────────────────────────────

describe('formatNumber', () => {
  describe('basic formatting', () => {
    it('formats small values without prefix', () => {
      expect(formatNumber(0)).toBe('0.00');
      expect(formatNumber(1)).toBe('1.00');
      expect(formatNumber(99.99)).toBe('99.99');
      expect(formatNumber(999.99)).toBe('999.99');
    });

    it('formats with custom decimals', () => {
      expect(formatNumber(123.456, 0)).toBe('123');
      expect(formatNumber(123.456, 1)).toBe('123.5');
      expect(formatNumber(123.456, 4)).toBe('123.4560');
    });
  });

  describe('suffix formatting', () => {
    it('formats with K suffix', () => {
      expect(formatNumber(1000)).toBe('1.00K');
      expect(formatNumber(12345)).toBe('12.35K');
    });

    it('formats with M suffix', () => {
      expect(formatNumber(1000000)).toBe('1.00M');
      expect(formatNumber(12345678)).toBe('12.35M');
    });

    it('formats with B suffix', () => {
      expect(formatNumber(1000000000)).toBe('1.00B');
      expect(formatNumber(5500000000)).toBe('5.50B');
    });
  });
});

// ─────────────────────────────────────────────────────────────────────────────────
// formatPercent
// ─────────────────────────────────────────────────────────────────────────────────

describe('formatPercent', () => {
  it('formats percentages with default decimals', () => {
    expect(formatPercent(0)).toBe('0.00%');
    expect(formatPercent(1)).toBe('1.00%');
    expect(formatPercent(12.345)).toBe('12.35%');
    expect(formatPercent(100)).toBe('100.00%');
  });

  it('formats with custom decimals', () => {
    expect(formatPercent(12.345, 0)).toBe('12%');
    expect(formatPercent(12.345, 1)).toBe('12.3%');
    expect(formatPercent(12.345, 3)).toBe('12.345%');
  });

  it('handles negative percentages', () => {
    expect(formatPercent(-5.5)).toBe('-5.50%');
  });

  it('handles large percentages (APR scenarios)', () => {
    expect(formatPercent(250.75)).toBe('250.75%');
    expect(formatPercent(1000)).toBe('1000.00%');
  });
});

// ─────────────────────────────────────────────────────────────────────────────────
// formatAddress
// ─────────────────────────────────────────────────────────────────────────────────

describe('formatAddress', () => {
  const testAddress = '0x1234567890abcdef1234567890abcdef12345678';

  it('formats with default char count (4)', () => {
    expect(formatAddress(testAddress)).toBe('0x1234...5678');
  });

  it('formats with custom char count', () => {
    expect(formatAddress(testAddress, 6)).toBe('0x123456...345678');
    expect(formatAddress(testAddress, 2)).toBe('0x12...78');
    expect(formatAddress(testAddress, 8)).toBe('0x12345678...ef123456');
  });

  it('handles empty address', () => {
    expect(formatAddress('')).toBe('');
  });

  it('handles undefined/null safely', () => {
    // @ts-expect-error - Testing null handling
    expect(formatAddress(null)).toBe('');
    // @ts-expect-error - Testing undefined handling
    expect(formatAddress(undefined)).toBe('');
  });

  it('preserves checksum case', () => {
    const checksumAddress = '0xABCDef1234567890ABCDef1234567890AbCdEf12';
    expect(formatAddress(checksumAddress)).toBe('0xABCD...Ef12');
  });
});

// ─────────────────────────────────────────────────────────────────────────────────
// formatTokenAmount
// ─────────────────────────────────────────────────────────────────────────────────

describe('formatTokenAmount', () => {
  describe('bigint handling', () => {
    it('converts bigint with 18 decimals (ETH-like)', () => {
      // 1 ETH = 1e18 wei
      const oneEth = BigInt('1000000000000000000');
      expect(formatTokenAmount(oneEth, 18)).toBe('1');

      // 1.5 ETH
      const onePointFiveEth = BigInt('1500000000000000000');
      expect(formatTokenAmount(onePointFiveEth, 18)).toBe('1.5');

      // 0.001 ETH
      const smallAmount = BigInt('1000000000000000');
      expect(formatTokenAmount(smallAmount, 18)).toBe('0.001');
    });

    it('converts bigint with 6 decimals (USDC-like)', () => {
      // 1 USDC = 1e6
      const oneUsdc = BigInt('1000000');
      expect(formatTokenAmount(oneUsdc, 6)).toBe('1');

      // 1000 USDC
      const thousandUsdc = BigInt('1000000000');
      expect(formatTokenAmount(thousandUsdc, 6)).toBe('1,000');
    });

    it('converts bigint with 8 decimals (WBTC-like)', () => {
      // 1 WBTC = 1e8
      const oneBtc = BigInt('100000000');
      expect(formatTokenAmount(oneBtc, 8)).toBe('1');

      // 0.05 WBTC
      const smallBtc = BigInt('5000000');
      expect(formatTokenAmount(smallBtc, 8)).toBe('0.05');
    });
  });

  describe('string handling', () => {
    it('parses string amounts', () => {
      expect(formatTokenAmount('1.5', 0)).toBe('1.5');
      expect(formatTokenAmount('1000.50', 0)).toBe('1,000.5');
    });
  });

  describe('number handling', () => {
    it('formats number amounts', () => {
      expect(formatTokenAmount(1.5, 0)).toBe('1.5');
      expect(formatTokenAmount(1000.5, 0)).toBe('1,000.5');
    });
  });

  describe('display decimals', () => {
    it('respects displayDecimals parameter', () => {
      const amount = BigInt('1234567890123456789'); // ~1.23 ETH
      expect(formatTokenAmount(amount, 18, 2)).toBe('1.23');
      expect(formatTokenAmount(amount, 18, 4)).toBe('1.2346');
      expect(formatTokenAmount(amount, 18, 0)).toBe('1');
    });
  });

  describe('edge cases', () => {
    it('handles zero', () => {
      expect(formatTokenAmount(BigInt(0), 18)).toBe('0');
      expect(formatTokenAmount(0, 18)).toBe('0');
      expect(formatTokenAmount('0', 18)).toBe('0');
    });

    it('handles very large amounts', () => {
      // 1 billion tokens
      const billion = BigInt('1000000000000000000000000000');
      expect(formatTokenAmount(billion, 18)).toBe('1,000,000,000');
    });

    it('handles very small amounts', () => {
      // 1 wei
      const oneWei = BigInt(1);
      const result = formatTokenAmount(oneWei, 18, 18);
      expect(result).toBe('0.000000000000000001');
    });
  });
});

// ─────────────────────────────────────────────────────────────────────────────────
// PRECISION TESTS (Critical for DeFi)
// ─────────────────────────────────────────────────────────────────────────────────

describe('Precision Edge Cases', () => {
  it('handles floating point precision correctly', () => {
    // 0.1 + 0.2 !== 0.3 in JavaScript
    const result = formatCurrency(0.1 + 0.2);
    expect(result).toBe('$0.30');
  });

  it('rounds correctly at boundaries', () => {
    expect(formatCurrency(999.999)).toBe('$1.00K');
    expect(formatCurrency(999999.999)).toBe('$1.00M');
    expect(formatCurrency(999999999.999)).toBe('$1.00B');
  });

  it('handles MAX_SAFE_INTEGER', () => {
    const maxSafe = Number.MAX_SAFE_INTEGER;
    // Should not throw
    expect(() => formatNumber(maxSafe)).not.toThrow();
  });
});
