/** Module */

import { describe, it, expect } from 'vitest';

// ─────────────────────────────────────────────────────────────────────────────────
// TEST UTILITIES - Replicating production calculations
// ─────────────────────────────────────────────────────────────────────────────────

/**
 * Calculate minimum amount out with slippage
 * @param amountOut - Expected output amount
 * @param slippageBps - Slippage in basis points (100 = 1%)
 */
function calculateMinAmountOut(amountOut: bigint, slippageBps: number): bigint {
  // minAmountOut = amountOut * (10000 - slippageBps) / 10000
  return (amountOut * BigInt(10000 - slippageBps)) / BigInt(10000);
}

/**
 * Calculate price impact percentage
 * @param inputAmount - Input token amount
 * @param outputAmount - Output token amount
 * @param spotPrice - Current spot price (output per input)
 */
function calculatePriceImpact(
  inputAmount: number,
  outputAmount: number,
  spotPrice: number
): number {
  const expectedOutput = inputAmount * spotPrice;
  const impact = ((expectedOutput - outputAmount) / expectedOutput) * 100;
  return Math.max(0, impact); // Price impact can't be negative
}

/**
 * Convert APR to APY (compound interest)
 * @param apr - Annual Percentage Rate (as decimal, e.g., 0.12 for 12%)
 * @param compoundingPeriods - Number of compounding periods per year
 */
function aprToApy(apr: number, compoundingPeriods: number = 365): number {
  return Math.pow(1 + apr / compoundingPeriods, compoundingPeriods) - 1;
}

/**
 * Convert APY to APR
 * @param apy - Annual Percentage Yield (as decimal)
 * @param compoundingPeriods - Number of compounding periods per year
 */
function apyToApr(apy: number, compoundingPeriods: number = 365): number {
  return compoundingPeriods * (Math.pow(1 + apy, 1 / compoundingPeriods) - 1);
}

/**
 * Calculate tick from price for concentrated liquidity
 * tick = log(price) / log(1.0001)
 */
function priceToTick(price: number): number {
  return Math.floor(Math.log(price) / Math.log(1.0001));
}

/**
 * Calculate price from tick
 * price = 1.0001^tick
 */
function tickToPrice(tick: number): number {
  return Math.pow(1.0001, tick);
}

/**
 * Calculate liquidity value from position
 */
function calculatePositionValue(
  token0Amount: number,
  token1Amount: number,
  token0Price: number,
  token1Price: number
): number {
  return token0Amount * token0Price + token1Amount * token1Price;
}

/**
 * Calculate fee earnings
 * @param tvl - Total Value Locked
 * @param volume24h - 24h trading volume
 * @param feeTier - Fee tier in basis points (e.g., 3000 = 0.3%)
 */
function calculateDailyFees(tvl: number, volume24h: number, feeTier: number): number {
  const feeRate = feeTier / 1_000_000; // Convert from bps to decimal
  return volume24h * feeRate;
}

/**
 * Calculate APR from daily fees
 */
function calculateAprFromFees(dailyFees: number, tvl: number): number {
  if (tvl === 0) return 0;
  return (dailyFees / tvl) * 365 * 100; // Return as percentage
}

// ─────────────────────────────────────────────────────────────────────────────────
// SLIPPAGE CALCULATION TESTS
// ─────────────────────────────────────────────────────────────────────────────────

describe('Slippage Calculations', () => {
  describe('calculateMinAmountOut', () => {
    it('calculates correctly for 0.5% slippage', () => {
      const amountOut = BigInt(1000000); // 1 USDC (6 decimals)
      const slippageBps = 50; // 0.5%
      
      const minOut = calculateMinAmountOut(amountOut, slippageBps);
      expect(minOut).toBe(BigInt(995000)); // 99.5% of original
    });

    it('calculates correctly for 1% slippage', () => {
      const amountOut = BigInt(1000000);
      const slippageBps = 100; // 1%
      
      const minOut = calculateMinAmountOut(amountOut, slippageBps);
      expect(minOut).toBe(BigInt(990000)); // 99% of original
    });

    it('calculates correctly for 5% slippage', () => {
      const amountOut = BigInt(1000000);
      const slippageBps = 500; // 5%
      
      const minOut = calculateMinAmountOut(amountOut, slippageBps);
      expect(minOut).toBe(BigInt(950000)); // 95% of original
    });

    it('handles zero slippage', () => {
      const amountOut = BigInt(1000000);
      const minOut = calculateMinAmountOut(amountOut, 0);
      expect(minOut).toBe(amountOut);
    });

    it('handles large amounts (18 decimals)', () => {
      const amountOut = BigInt('1000000000000000000'); // 1e18
      const slippageBps = 50; // 0.5%
      
      const minOut = calculateMinAmountOut(amountOut, slippageBps);
      expect(minOut).toBe(BigInt('995000000000000000')); // 0.995e18
    });

    it('handles very large slippage', () => {
      const amountOut = BigInt(1000000);
      const slippageBps = 5000; // 50%
      
      const minOut = calculateMinAmountOut(amountOut, slippageBps);
      expect(minOut).toBe(BigInt(500000)); // 50% of original
    });
  });
});

// ─────────────────────────────────────────────────────────────────────────────────
// PRICE IMPACT TESTS
// ─────────────────────────────────────────────────────────────────────────────────

describe('Price Impact Calculations', () => {
  describe('calculatePriceImpact', () => {
    it('calculates zero impact for expected price', () => {
      const impact = calculatePriceImpact(1, 2000, 2000);
      expect(impact).toBeCloseTo(0, 2);
    });

    it('calculates positive impact when receiving less', () => {
      // Spot price says 1 ETH = 2000 USDC
      // But we only get 1900 USDC (5% worse)
      const impact = calculatePriceImpact(1, 1900, 2000);
      expect(impact).toBeCloseTo(5, 1);
    });

    it('calculates larger impact for larger trades', () => {
      // Simulating AMM behavior - larger trades have more impact
      const smallImpact = calculatePriceImpact(1, 1990, 2000); // ~0.5%
      const largeImpact = calculatePriceImpact(100, 190000, 2000); // ~5%
      
      expect(largeImpact).toBeGreaterThan(smallImpact);
    });

    it('returns 0 for better-than-expected output', () => {
      // Getting more than expected shouldn't show negative impact
      const impact = calculatePriceImpact(1, 2100, 2000);
      expect(impact).toBe(0);
    });

    it('handles stablecoin swaps (low impact)', () => {
      // USDC -> USDT should have minimal impact
      const impact = calculatePriceImpact(1000, 999.5, 1);
      expect(impact).toBeLessThan(0.1);
    });
  });
});

// ─────────────────────────────────────────────────────────────────────────────────
// APR/APY CONVERSION TESTS
// ─────────────────────────────────────────────────────────────────────────────────

describe('APR/APY Conversions', () => {
  describe('aprToApy', () => {
    it('converts 10% APR to ~10.52% APY (daily compounding)', () => {
      const apy = aprToApy(0.10, 365);
      expect(apy).toBeCloseTo(0.1052, 3);
    });

    it('converts 50% APR to ~64.87% APY (daily compounding)', () => {
      const apy = aprToApy(0.50, 365);
      expect(apy).toBeCloseTo(0.6487, 3);
    });

    it('converts 100% APR to ~171.83% APY (daily compounding)', () => {
      const apy = aprToApy(1.00, 365);
      expect(apy).toBeCloseTo(1.7183, 2);
    });

    it('handles monthly compounding', () => {
      const apy = aprToApy(0.12, 12); // 12% APR, monthly
      expect(apy).toBeCloseTo(0.1268, 3);
    });

    it('handles zero APR', () => {
      const apy = aprToApy(0, 365);
      expect(apy).toBe(0);
    });
  });

  describe('apyToApr', () => {
    it('converts 10.52% APY back to ~10% APR', () => {
      const apr = apyToApr(0.1052, 365);
      expect(apr).toBeCloseTo(0.10, 2);
    });

    it('is inverse of aprToApy', () => {
      const originalApr = 0.25;
      const apy = aprToApy(originalApr, 365);
      const backToApr = apyToApr(apy, 365);
      expect(backToApr).toBeCloseTo(originalApr, 4);
    });
  });
});

// ─────────────────────────────────────────────────────────────────────────────────
// TICK/PRICE MATH TESTS (Concentrated Liquidity)
// ─────────────────────────────────────────────────────────────────────────────────

describe('Tick/Price Math', () => {
  describe('priceToTick', () => {
    it('converts price 1 to tick 0', () => {
      const tick = priceToTick(1);
      expect(tick).toBe(0);
    });

    it('converts ETH/USDC price correctly', () => {
      // ETH at $2000
      const tick = priceToTick(2000);
      // tick = ln(2000) / ln(1.0001) ≈ 75952
      expect(tick).toBeCloseTo(75952, -1); // Allow some rounding
    });

    it('converts low prices correctly', () => {
      const tick = priceToTick(0.001);
      expect(tick).toBeLessThan(0); // Negative tick for price < 1
    });

    it('handles stablecoin prices near 1', () => {
      const tick = priceToTick(1.0001);
      expect(tick).toBe(1);
    });
  });

  describe('tickToPrice', () => {
    it('converts tick 0 to price 1', () => {
      const price = tickToPrice(0);
      expect(price).toBe(1);
    });

    it('is inverse of priceToTick', () => {
      const originalPrice = 2000;
      const tick = priceToTick(originalPrice);
      const backToPrice = tickToPrice(tick);
      // Within 0.01% due to rounding
      expect(backToPrice).toBeCloseTo(originalPrice, 0);
    });

    it('handles negative ticks', () => {
      const price = tickToPrice(-100);
      expect(price).toBeLessThan(1);
      expect(price).toBeGreaterThan(0);
    });
  });

  describe('tick spacing constraints', () => {
    it('rounds to valid tick spacing', () => {
      const tickSpacing = 60; // 0.3% fee tier
      const price = 2000;
      const tick = priceToTick(price);
      const validTick = Math.floor(tick / tickSpacing) * tickSpacing;
      
      expect(validTick % tickSpacing).toBe(0);
    });
  });
});

// ─────────────────────────────────────────────────────────────────────────────────
// POSITION VALUE TESTS
// ─────────────────────────────────────────────────────────────────────────────────

describe('Position Value Calculations', () => {
  describe('calculatePositionValue', () => {
    it('calculates ETH/USDC position value', () => {
      const value = calculatePositionValue(
        1,      // 1 ETH
        2000,   // 2000 USDC
        2000,   // ETH price
        1       // USDC price
      );
      expect(value).toBe(4000); // $2000 + $2000
    });

    it('handles zero amounts', () => {
      const value = calculatePositionValue(0, 0, 2000, 1);
      expect(value).toBe(0);
    });

    it('handles single-sided positions', () => {
      // Position only in ETH (out of range)
      const value = calculatePositionValue(2, 0, 2000, 1);
      expect(value).toBe(4000);
    });

    it('handles decimal amounts', () => {
      const value = calculatePositionValue(0.5, 1000, 2000, 1);
      expect(value).toBe(2000); // $1000 + $1000
    });
  });
});

// ─────────────────────────────────────────────────────────────────────────────────
// FEE/APR CALCULATION TESTS
// ─────────────────────────────────────────────────────────────────────────────────

describe('Fee/APR Calculations', () => {
  describe('calculateDailyFees', () => {
    it('calculates fees for 0.3% pool', () => {
      const fees = calculateDailyFees(
        1000000,  // $1M TVL
        500000,   // $500k volume
        3000      // 0.3% fee tier
      );
      expect(fees).toBe(1500); // $500k * 0.003 = $1500
    });

    it('calculates fees for 0.05% pool', () => {
      const fees = calculateDailyFees(
        1000000,  // $1M TVL
        2000000,  // $2M volume (higher for low fee pools)
        500       // 0.05% fee tier
      );
      expect(fees).toBe(1000); // $2M * 0.0005 = $1000
    });

    it('calculates fees for 1% pool', () => {
      const fees = calculateDailyFees(
        500000,   // $500k TVL
        100000,   // $100k volume (lower for high fee pools)
        10000     // 1% fee tier
      );
      expect(fees).toBe(1000); // $100k * 0.01 = $1000
    });
  });

  describe('calculateAprFromFees', () => {
    it('calculates APR from daily fees', () => {
      const apr = calculateAprFromFees(
        1000,     // $1000 daily fees
        1000000   // $1M TVL
      );
      // ($1000 / $1M) * 365 * 100 = 36.5%
      expect(apr).toBeCloseTo(36.5, 1);
    });

    it('handles zero TVL', () => {
      const apr = calculateAprFromFees(1000, 0);
      expect(apr).toBe(0);
    });

    it('calculates realistic pool APRs', () => {
      // High volume pool
      const highVolumeApr = calculateAprFromFees(
        calculateDailyFees(10000000, 5000000, 3000), // $10M TVL, $5M volume
        10000000
      );
      expect(highVolumeApr).toBeGreaterThan(5);
      expect(highVolumeApr).toBeLessThan(100);
    });
  });
});

// ─────────────────────────────────────────────────────────────────────────────────
// TOKEN DECIMAL CONVERSION TESTS
// ─────────────────────────────────────────────────────────────────────────────────

describe('Token Decimal Conversions', () => {
  /**
   * Convert from human readable to raw amount
   */
  function toRawAmount(amount: number, decimals: number): bigint {
    return BigInt(Math.floor(amount * Math.pow(10, decimals)));
  }

  /**
   * Convert from raw to human readable
   */
  function fromRawAmount(rawAmount: bigint, decimals: number): number {
    return Number(rawAmount) / Math.pow(10, decimals);
  }

  describe('toRawAmount', () => {
    it('converts ETH (18 decimals)', () => {
      const raw = toRawAmount(1.5, 18);
      expect(raw).toBe(BigInt('1500000000000000000'));
    });

    it('converts USDC (6 decimals)', () => {
      const raw = toRawAmount(1000, 6);
      expect(raw).toBe(BigInt('1000000000'));
    });

    it('converts WBTC (8 decimals)', () => {
      const raw = toRawAmount(0.5, 8);
      expect(raw).toBe(BigInt('50000000'));
    });

    it('handles small amounts', () => {
      const raw = toRawAmount(0.000001, 18);
      expect(raw).toBe(BigInt('1000000000000'));
    });
  });

  describe('fromRawAmount', () => {
    it('converts raw ETH to readable', () => {
      const readable = fromRawAmount(BigInt('1500000000000000000'), 18);
      expect(readable).toBe(1.5);
    });

    it('converts raw USDC to readable', () => {
      const readable = fromRawAmount(BigInt('1000000000'), 6);
      expect(readable).toBe(1000);
    });

    it('handles precision correctly', () => {
      const readable = fromRawAmount(BigInt('123456789012345678'), 18);
      expect(readable).toBeCloseTo(0.123456789, 6);
    });
  });

  describe('roundtrip conversion', () => {
    it('preserves value through conversion', () => {
      const original = 123.456789;
      const decimals = 18;
      const raw = toRawAmount(original, decimals);
      const back = fromRawAmount(raw, decimals);
      expect(back).toBeCloseTo(original, 6);
    });
  });
});

// ─────────────────────────────────────────────────────────────────────────────────
// DEADLINE CALCULATION TESTS
// ─────────────────────────────────────────────────────────────────────────────────

describe('Deadline Calculations', () => {
  function calculateDeadline(minutesFromNow: number): bigint {
    return BigInt(Math.floor(Date.now() / 1000) + minutesFromNow * 60);
  }

  function isDeadlineExpired(deadline: bigint): boolean {
    return deadline < BigInt(Math.floor(Date.now() / 1000));
  }

  it('calculates deadline 20 minutes from now', () => {
    const deadline = calculateDeadline(20);
    const now = BigInt(Math.floor(Date.now() / 1000));
    
    // Should be ~20 minutes (1200 seconds) in the future
    expect(Number(deadline - now)).toBeCloseTo(1200, -1);
  });

  it('deadline is not expired immediately', () => {
    const deadline = calculateDeadline(20);
    expect(isDeadlineExpired(deadline)).toBe(false);
  });

  it('past deadline is expired', () => {
    const pastDeadline = BigInt(Math.floor(Date.now() / 1000) - 100);
    expect(isDeadlineExpired(pastDeadline)).toBe(true);
  });
});
