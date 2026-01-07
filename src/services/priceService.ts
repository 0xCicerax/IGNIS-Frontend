import { logger } from '../utils/logger';
import { withRetry, retryPatterns, createRateLimiter, rateLimitPatterns } from '../utils/retry';
/** Module */

import { 
  PRICE_SOURCES, 
  COINGECKO_IDS, 
  DEFILLAMA_IDS,
  CACHE_CONFIG,
  FALLBACK_PRICES 
} from '../config/protocols';
import { IS_TESTNET } from '../config/contracts';

// Rate limiters for external APIs
const defiLlamaLimiter = createRateLimiter('defillama', rateLimitPatterns.priceApi);
const coinGeckoLimiter = createRateLimiter('coingecko', rateLimitPatterns.priceApi);

let priceCache = {
  data: {},
  timestamp: 0,
};

/**
 * Load cache from localStorage
 */
function loadCache() {
  try {
    const cached = localStorage.getItem(CACHE_CONFIG.keys.prices);
    if (cached) {
      const parsed = JSON.parse(cached);
      if (Date.now() - parsed.timestamp < CACHE_CONFIG.pricesTTL) {
        priceCache = parsed;
        return true;
      }
    }
  } catch (e) {
    logger.warn('Price cache load failed', { error: e });
  }
  return false;
}

/**
 * Save cache to localStorage
 */
function saveCache() {
  try {
    localStorage.setItem(CACHE_CONFIG.keys.prices, JSON.stringify(priceCache));
  } catch (e) {
    logger.warn('Price cache save failed', { error: e });
  }
}

/**
 * Check if cache is valid
 */
function isCacheValid() {
  return Date.now() - priceCache.timestamp < CACHE_CONFIG.pricesTTL;
}

/**
 * Fetch prices from DeFiLlama with retry and rate limiting
 * @param {string[]} tokens - Array of token symbols
 * @returns {Promise<Object>} - { symbol: priceUSD }
 */
async function fetchFromDeFiLlama(tokens) {
  try {
    // Build coin IDs for DeFiLlama
    const chain = IS_TESTNET ? 'ethereum' : 'base'; // Use ethereum prices for testnet
    const coinIds = tokens
      .map(symbol => DEFILLAMA_IDS[chain]?.[symbol] || DEFILLAMA_IDS.ethereum?.[symbol])
      .filter(Boolean);
    
    if (coinIds.length === 0) {
      return {};
    }
    
    const url = `${PRICE_SOURCES.defiLlama.baseUrl}/prices/current/${coinIds.join(',')}`;
    
    // Apply rate limiting and retry
    const data = await defiLlamaLimiter(() => 
      withRetry(async () => {
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error(`DeFiLlama API error: ${response.status}`);
        }
        return response.json();
      }, retryPatterns.external)
    );
    
    // Map back to symbols
    const prices = {};
    for (const symbol of tokens) {
      const coinId = DEFILLAMA_IDS[chain]?.[symbol] || DEFILLAMA_IDS.ethereum?.[symbol];
      if (coinId && data.coins?.[coinId]) {
        prices[symbol] = data.coins[coinId].price;
      }
    }
    
    return prices;
  } catch (error: unknown) {
    logger.warn('DeFiLlama price fetch failed', { error: error instanceof Error ? error.message : error });
    return {};
  }
}

/**
 * Fetch prices from CoinGecko with retry and rate limiting
 * @param {string[]} tokens - Array of token symbols
 * @returns {Promise<Object>} - { symbol: priceUSD }
 */
async function fetchFromCoinGecko(tokens) {
  try {
    const ids = tokens
      .map(symbol => COINGECKO_IDS[symbol])
      .filter(Boolean)
      .join(',');
    
    if (!ids) {
      return {};
    }
    
    const url = `${PRICE_SOURCES.coinGecko.baseUrl}/simple/price?ids=${ids}&vs_currencies=usd`;
    
    // Apply rate limiting and retry
    const data = await coinGeckoLimiter(() =>
      withRetry(async () => {
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error(`CoinGecko API error: ${response.status}`);
        }
        return response.json();
      }, retryPatterns.external)
    );
    
    // Map back to symbols
    const prices = {};
    for (const symbol of tokens) {
      const id = COINGECKO_IDS[symbol];
      if (id && data[id]?.usd) {
        prices[symbol] = data[id].usd;
      }
    }
    
    return prices;
  } catch (error: unknown) {
    logger.warn('CoinGecko price fetch failed', { error: error instanceof Error ? error.message : error });
    return {};
  }
}

/**
 * Get prices for multiple tokens
 * @param {string[]} symbols - Array of token symbols
 * @param {boolean} forceRefresh - Force refresh cache
 * @returns {Promise<Object>} - { symbol: { price, source, timestamp } }
 */
export async function getTokenPrices(symbols, forceRefresh = false) {
  // Check cache first
  if (!forceRefresh && isCacheValid()) {
    const cached = {};
    let allCached = true;
    
    for (const symbol of symbols) {
      if (priceCache.data[symbol]) {
        cached[symbol] = priceCache.data[symbol];
      } else {
        allCached = false;
      }
    }
    
    if (allCached) {
      return cached;
    }
  }
  
  // Load from localStorage if memory cache is empty
  if (Object.keys(priceCache.data).length === 0) {
    loadCache();
    if (isCacheValid()) {
      const cached = {};
      for (const symbol of symbols) {
        if (priceCache.data[symbol]) {
          cached[symbol] = priceCache.data[symbol];
        }
      }
      if (Object.keys(cached).length === symbols.length) {
        return cached;
      }
    }
  }
  
  const result = {};
  const missingSymbols = symbols.filter(s => !result[s]);
  
  // Try DeFiLlama first
  if (missingSymbols.length > 0) {
    const llamaPrices = await fetchFromDeFiLlama(missingSymbols);
    for (const [symbol, price] of Object.entries(llamaPrices)) {
      result[symbol] = {
        price,
        source: 'defillama',
        timestamp: Date.now(),
      };
    }
  }
  
  // Try CoinGecko for missing
  const stillMissing = symbols.filter(s => !result[s]);
  if (stillMissing.length > 0) {
    const cgPrices = await fetchFromCoinGecko(stillMissing);
    for (const [symbol, price] of Object.entries(cgPrices)) {
      result[symbol] = {
        price,
        source: 'coingecko',
        timestamp: Date.now(),
      };
    }
  }
  
  // Use fallbacks for any still missing
  for (const symbol of symbols) {
    if (!result[symbol] && FALLBACK_PRICES[symbol]) {
      result[symbol] = {
        price: FALLBACK_PRICES[symbol],
        source: 'fallback',
        timestamp: Date.now(),
      };
    }
  }
  
  // Update cache
  priceCache.data = { ...priceCache.data, ...result };
  priceCache.timestamp = Date.now();
  saveCache();
  
  return result;
}

/**
 * Get single token price
 * @param {string} symbol - Token symbol
 * @returns {Promise<number>} - Price in USD
 */
export async function getTokenPrice(symbol) {
  const prices = await getTokenPrices([symbol]);
  return prices[symbol]?.price || FALLBACK_PRICES[symbol] || 0;
}

/**
 * Get price with full metadata
 * @param {string} symbol - Token symbol
 * @returns {Promise<Object>} - { price, source, timestamp, change24h }
 */
export async function getTokenPriceWithMeta(symbol) {
  const prices = await getTokenPrices([symbol]);
  return prices[symbol] || {
    price: FALLBACK_PRICES[symbol] || 0,
    source: 'fallback',
    timestamp: Date.now(),
  };
}

/**
 * Get historical prices for a token
 * @param {string} symbol - Token symbol
 * @param {number} days - Number of days of history
 * @returns {Promise<Array>} - [{ timestamp, price }]
 */
export async function getHistoricalPrices(symbol, days = 30) {
  try {
    const id = COINGECKO_IDS[symbol];
    if (!id) {
      return generateMockHistoricalPrices(symbol, days);
    }
    
    const url = `${PRICE_SOURCES.coinGecko.baseUrl}/coins/${id}/market_chart?vs_currency=usd&days=${days}`;
    const response = await fetch(url);
    
    if (!response.ok) {
      return generateMockHistoricalPrices(symbol, days);
    }
    
    const data = await response.json();
    
    return data.prices.map(([timestamp, price]) => ({
      timestamp,
      price,
      date: new Date(timestamp).toISOString().split('T')[0],
    }));
  } catch (error: unknown) {
    logger.warn('Historical prices fetch failed', { error });
    return generateMockHistoricalPrices(symbol, days);
  }
}

/**
 * Generate mock historical prices for demo
 */
function generateMockHistoricalPrices(symbol, days) {
  const basePrice = FALLBACK_PRICES[symbol] || 1;
  const prices = [];
  const now = Date.now();
  
  for (let i = days; i >= 0; i--) {
    const timestamp = now - (i * 24 * 60 * 60 * 1000);
    // Add some random variation (-5% to +5%)
    const variation = 1 + (Math.random() - 0.5) * 0.1;
    prices.push({
      timestamp,
      price: basePrice * variation,
      date: new Date(timestamp).toISOString().split('T')[0],
    });
  }
  
  return prices;
}

/**
 * Convert token amount to USD
 * @param {string} symbol - Token symbol
 * @param {number} amount - Token amount
 * @returns {Promise<number>} - USD value
 */
export async function tokenToUSD(symbol, amount) {
  const price = await getTokenPrice(symbol);
  return amount * price;
}

/**
 * Convert USD to token amount
 * @param {string} symbol - Token symbol
 * @param {number} usdAmount - USD amount
 * @returns {Promise<number>} - Token amount
 */
export async function usdToToken(symbol, usdAmount) {
  const price = await getTokenPrice(symbol);
  return price > 0 ? usdAmount / price : 0;
}

/**
 * Clear price cache
 */
export function clearPriceCache() {
  priceCache = { data: {}, timestamp: 0 };
  localStorage.removeItem(CACHE_CONFIG.keys.prices);
}

/**
 * Get all cached prices
 */
export function getCachedPrices() {
  return { ...priceCache.data };
}
