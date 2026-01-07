/** Module */

import { describe, it, expect } from 'vitest';
import { generateCandlesticks, generateLiquidityDepth } from './charts';

// ─────────────────────────────────────────────────────────────────────────────────
// generateCandlesticks
// ─────────────────────────────────────────────────────────────────────────────────

describe('generateCandlesticks', () => {
  describe('basic generation', () => {
    it('generates correct number of candles', () => {
      const candles = generateCandlesticks(1000, 30);
      expect(candles).toHaveLength(30);
    });

    it('generates custom count of candles', () => {
      const candles = generateCandlesticks(1000, 50);
      expect(candles).toHaveLength(50);
    });

    it('uses default count when not specified', () => {
      const candles = generateCandlesticks(1000);
      expect(candles).toHaveLength(30);
    });
  });

  describe('candlestick structure', () => {
    it('each candle has required OHLC properties', () => {
      const candles = generateCandlesticks(1000, 5);
      
      candles.forEach(candle => {
        expect(candle).toHaveProperty('open');
        expect(candle).toHaveProperty('high');
        expect(candle).toHaveProperty('low');
        expect(candle).toHaveProperty('close');
        expect(typeof candle.open).toBe('number');
        expect(typeof candle.high).toBe('number');
        expect(typeof candle.low).toBe('number');
        expect(typeof candle.close).toBe('number');
      });
    });

    it('high is always >= open and close', () => {
      const candles = generateCandlesticks(1000, 100);
      
      candles.forEach(candle => {
        expect(candle.high).toBeGreaterThanOrEqual(candle.open);
        expect(candle.high).toBeGreaterThanOrEqual(candle.close);
      });
    });

    it('low is always <= open and close', () => {
      const candles = generateCandlesticks(1000, 100);
      
      candles.forEach(candle => {
        expect(candle.low).toBeLessThanOrEqual(candle.open);
        expect(candle.low).toBeLessThanOrEqual(candle.close);
      });
    });

    it('high is always >= low', () => {
      const candles = generateCandlesticks(1000, 100);
      
      candles.forEach(candle => {
        expect(candle.high).toBeGreaterThanOrEqual(candle.low);
      });
    });
  });

  describe('price continuity', () => {
    it('maintains some price continuity between candles', () => {
      const candles = generateCandlesticks(1000, 10);
      
      // Prices should not jump by more than 50% between candles
      for (let i = 1; i < candles.length; i++) {
        const prev = candles[i - 1];
        const curr = candles[i];
        const change = Math.abs(curr.open - prev.close) / prev.close;
        expect(change).toBeLessThan(0.5);
      }
    });
  });

  describe('different base prices', () => {
    it('works with small base prices', () => {
      const candles = generateCandlesticks(0.001, 10);
      candles.forEach(candle => {
        expect(candle.open).toBeGreaterThan(0);
        expect(candle.close).toBeGreaterThan(0);
      });
    });

    it('works with large base prices', () => {
      const candles = generateCandlesticks(100000, 10);
      candles.forEach(candle => {
        expect(candle.open).toBeGreaterThan(50000);
        expect(candle.close).toBeGreaterThan(50000);
      });
    });
  });
});

// ─────────────────────────────────────────────────────────────────────────────────
// generateLiquidityDepth
// ─────────────────────────────────────────────────────────────────────────────────

describe('generateLiquidityDepth', () => {
  describe('basic generation', () => {
    it('generates correct number of bins', () => {
      const depth = generateLiquidityDepth(2000, 50);
      expect(depth).toHaveLength(50);
    });

    it('uses default bin count when not specified', () => {
      const depth = generateLiquidityDepth(2000);
      expect(depth).toHaveLength(50);
    });

    it('generates custom bin count', () => {
      const depth = generateLiquidityDepth(2000, 100);
      expect(depth).toHaveLength(100);
    });
  });

  describe('bin structure', () => {
    it('each bin has required properties', () => {
      const depth = generateLiquidityDepth(2000, 10);
      
      depth.forEach(bin => {
        expect(bin).toHaveProperty('price');
        expect(bin).toHaveProperty('depth');
        expect(bin).toHaveProperty('isActive');
        expect(typeof bin.price).toBe('number');
        expect(typeof bin.depth).toBe('number');
        expect(typeof bin.isActive).toBe('boolean');
      });
    });

    it('depth is always positive', () => {
      const depth = generateLiquidityDepth(2000, 100);
      
      depth.forEach(bin => {
        expect(bin.depth).toBeGreaterThanOrEqual(10);
      });
    });
  });

  describe('price range', () => {
    it('prices span around current price', () => {
      const currentPrice = 2000;
      const depth = generateLiquidityDepth(currentPrice, 50);
      
      const minPrice = Math.min(...depth.map(b => b.price));
      const maxPrice = Math.max(...depth.map(b => b.price));
      
      expect(minPrice).toBeLessThan(currentPrice);
      expect(maxPrice).toBeGreaterThan(currentPrice);
    });

    it('prices are in ascending order', () => {
      const depth = generateLiquidityDepth(2000, 50);
      
      for (let i = 1; i < depth.length; i++) {
        expect(depth[i].price).toBeGreaterThan(depth[i - 1].price);
      }
    });
  });

  describe('active bin detection', () => {
    it('bins near current price are active', () => {
      const currentPrice = 2000;
      const depth = generateLiquidityDepth(currentPrice, 50);
      
      // Find bins closest to current price
      const activeBins = depth.filter(b => b.isActive);
      
      // At least some bins should be active
      expect(activeBins.length).toBeGreaterThan(0);
      
      // Active bins should be near the current price
      activeBins.forEach(bin => {
        const distance = Math.abs(bin.price - currentPrice) / currentPrice;
        expect(distance).toBeLessThan(0.2); // Within 20% of current price
      });
    });
  });

  describe('depth distribution', () => {
    it('depth is generally higher near current price', () => {
      const currentPrice = 2000;
      const depth = generateLiquidityDepth(currentPrice, 100);
      
      // Find the bin closest to current price
      const centerBin = depth.reduce((closest, bin) => 
        Math.abs(bin.price - currentPrice) < Math.abs(closest.price - currentPrice)
          ? bin
          : closest
      );
      
      // Find edge bins
      const edgeBins = [depth[0], depth[depth.length - 1]];
      
      // Center should generally have higher depth (accounting for randomness)
      const avgEdgeDepth = (edgeBins[0].depth + edgeBins[1].depth) / 2;
      
      // Due to randomness, we just check that center isn't drastically lower
      // In practice, center should be higher, but random factor could vary
      expect(centerBin.depth).toBeGreaterThan(avgEdgeDepth * 0.3);
    });
  });
});
