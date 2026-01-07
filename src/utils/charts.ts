interface Candlestick {
    open: number;
    high: number;
    low: number;
    close: number;
}

interface LiquidityBin {
    price: number;
    depth: number;
    isActive: boolean;
}

/**
 * Generate mock candlestick data
 */
export function generateCandlesticks(basePrice: number, count: number = 30): Candlestick[] {
    const candles: Candlestick[] = [];
    let price = basePrice * 0.9;
    
    for (let i = 0; i < count; i++) {
        const volatility = 0.02 + Math.random() * 0.03;
        const direction = Math.random() > 0.45 ? 1 : -1;
        
        const open = price;
        const change = price * volatility * direction;
        const close = price + change;
        const high = Math.max(open, close) * (1 + Math.random() * 0.01);
        const low = Math.min(open, close) * (1 - Math.random() * 0.01);
        
        candles.push({ open, high, low, close });
        price = close;
    }
    
    return candles;
}

/**
 * Generate mock liquidity depth data
 */
export function generateLiquidityDepth(currentPrice: number, bins: number = 50): LiquidityBin[] {
    const depth: LiquidityBin[] = [];
    const priceRange = currentPrice * 0.3;
    const minPrice = currentPrice - priceRange;
    const binWidth = (priceRange * 2) / bins;
    
    for (let i = 0; i < bins; i++) {
        const price = minPrice + i * binWidth;
        const distanceFromCenter = Math.abs(price - currentPrice) / priceRange;
        const baseDepth = 100 * (1 - distanceFromCenter * 0.7);
        const randomFactor = 0.7 + Math.random() * 0.6;
        
        depth.push({
            price,
            depth: Math.max(10, baseDepth * randomFactor),
            isActive: Math.abs(price - currentPrice) < priceRange * 0.5,
        });
    }
    
    return depth;
}
