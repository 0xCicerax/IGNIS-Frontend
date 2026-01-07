import { logger } from '../utils/logger';
import { withRetry, retryPatterns } from '../utils/retry';
/** Module */

import { getSubgraphUrl, isDeployed } from '../config/contracts';
import { CACHE_CONFIG } from '../config/protocols';

let analyticsCache = {
  data: {},
  timestamp: 0,
};

function getCacheKey(type, params) {
  return `${type}-${JSON.stringify(params)}`;
}

function getFromCache(key) {
  if (Date.now() - analyticsCache.timestamp < CACHE_CONFIG.historicalTTL) {
    return analyticsCache.data[key];
  }
  return null;
}

function setToCache(key, data) {
  analyticsCache.data[key] = data;
  analyticsCache.timestamp = Date.now();
}

async function querySubgraph(chainId, query, variables = {}) {
  const url = getSubgraphUrl(chainId);
  if (!url) return null;
  
  try {
    const data = await withRetry(async () => {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, variables }),
      });
      
      if (!response.ok) throw new Error(`Subgraph error: ${response.status}`);
      
      const result = await response.json();
      return result.data;
    }, retryPatterns.subgraph);
    
    return data;
  } catch (error: unknown) {
    logger.warn('Subgraph query failed', { error: error instanceof Error ? error.message : error });
    return null;
  }
}

/**
 * Get historical TVL data
 * @param {number} days - Number of days of history
 * @param {number} chainId - Chain ID
 * @returns {Promise<Array>} - [{ date, tvl }]
 */
export async function getTVLHistory(days = 30, chainId = 8453) {
  const cacheKey = getCacheKey('tvl', { days, chainId });
  const cached = getFromCache(cacheKey);
  if (cached) return cached;
  
  // Try subgraph first
  if (isDeployed(chainId)) {
    const data = await querySubgraph(chainId, `
      query GetTVLHistory($days: Int!) {
        protocolDailySnapshots(
          first: $days
          orderBy: timestamp
          orderDirection: desc
        ) {
          id
          timestamp
          totalValueLockedUSD
        }
      }
    `, { days });
    
    if (data?.protocolDailySnapshots?.length > 0) {
      const history = data.protocolDailySnapshots
        .map(s => ({
          date: new Date(parseInt(s.timestamp) * 1000).toISOString().split('T')[0],
          timestamp: parseInt(s.timestamp) * 1000,
          tvl: parseFloat(s.totalValueLockedUSD),
        }))
        .reverse();
      
      setToCache(cacheKey, history);
      return history;
    }
  }
  
  // Generate demo data
  const history = generateTVLHistory(days);
  setToCache(cacheKey, history);
  return history;
}

function generateTVLHistory(days) {
  const history = [];
  const now = Date.now();
  const baseTVL = 847500000; // Current TVL
  
  for (let i = days; i >= 0; i--) {
    const timestamp = now - (i * 24 * 60 * 60 * 1000);
    // TVL grows over time with some variation
    const growthFactor = 1 - (i / days) * 0.3; // 30% growth over period
    const variation = 1 + (Math.sin(i / 3) * 0.02); // ±2% daily variation
    
    history.push({
      date: new Date(timestamp).toISOString().split('T')[0],
      timestamp,
      tvl: baseTVL * growthFactor * variation,
    });
  }
  
  return history;
}

/**
 * Get historical volume data
 * @param {number} days - Number of days of history
 * @param {number} chainId - Chain ID
 * @returns {Promise<Array>} - [{ date, volume, swapCount }]
 */
export async function getVolumeHistory(days = 30, chainId = 8453) {
  const cacheKey = getCacheKey('volume', { days, chainId });
  const cached = getFromCache(cacheKey);
  if (cached) return cached;
  
  // Try subgraph
  if (isDeployed(chainId)) {
    const data = await querySubgraph(chainId, `
      query GetVolumeHistory($days: Int!) {
        dailyVolumes(
          first: $days
          orderBy: date
          orderDirection: desc
        ) {
          id
          date
          volumeUSD
          swapCount
          uniqueUsers
        }
      }
    `, { days });
    
    if (data?.dailyVolumes?.length > 0) {
      const history = data.dailyVolumes
        .map(d => ({
          date: new Date(parseInt(d.date) * 1000).toISOString().split('T')[0],
          timestamp: parseInt(d.date) * 1000,
          volume: parseFloat(d.volumeUSD),
          swapCount: parseInt(d.swapCount),
          uniqueUsers: parseInt(d.uniqueUsers || 0),
        }))
        .reverse();
      
      setToCache(cacheKey, history);
      return history;
    }
  }
  
  // Generate demo data
  const history = generateVolumeHistory(days);
  setToCache(cacheKey, history);
  return history;
}

function generateVolumeHistory(days) {
  const history = [];
  const now = Date.now();
  const baseVolume = 45000000; // Base daily volume
  
  for (let i = days; i >= 0; i--) {
    const timestamp = now - (i * 24 * 60 * 60 * 1000);
    const dayOfWeek = new Date(timestamp).getDay();
    
    // Volume varies by day of week (lower on weekends)
    const weekendFactor = (dayOfWeek === 0 || dayOfWeek === 6) ? 0.7 : 1;
    // Random variation
    const variation = 0.7 + Math.random() * 0.6; // 70%-130% of base
    
    const volume = baseVolume * weekendFactor * variation;
    const swapCount = Math.floor(volume / 5000); // Avg $5k per swap
    
    history.push({
      date: new Date(timestamp).toISOString().split('T')[0],
      timestamp,
      volume,
      swapCount,
      uniqueUsers: Math.floor(swapCount * 0.4), // ~40% unique users
    });
  }
  
  return history;
}

/**
 * Get historical APR data for a pool
 * @param {string} poolId - Pool ID
 * @param {number} days - Number of days
 * @param {number} chainId - Chain ID
 * @returns {Promise<Array>} - [{ date, apr, feeAPR, vaultAPR, rewardsAPR }]
 */
export async function getPoolAPRHistory(poolId, days = 30, chainId = 8453) {
  const cacheKey = getCacheKey('poolAPR', { poolId, days, chainId });
  const cached = getFromCache(cacheKey);
  if (cached) return cached;
  
  // APR history typically needs to be calculated from volume/TVL history
  // For now, generate realistic demo data
  const history = generateAPRHistory(days);
  setToCache(cacheKey, history);
  return history;
}

function generateAPRHistory(days, baseAPR = 12) {
  const history = [];
  const now = Date.now();
  
  for (let i = days; i >= 0; i--) {
    const timestamp = now - (i * 24 * 60 * 60 * 1000);
    
    // APR varies over time
    const variation = 1 + (Math.sin(i / 7) * 0.15); // ±15% weekly cycle
    const apr = baseAPR * variation;
    
    // Breakdown varies too
    const feeAPR = apr * (0.35 + Math.random() * 0.1);
    const vaultAPR = apr * (0.4 + Math.random() * 0.1);
    const rewardsAPR = apr - feeAPR - vaultAPR;
    
    history.push({
      date: new Date(timestamp).toISOString().split('T')[0],
      timestamp,
      apr,
      feeAPR,
      vaultAPR,
      rewardsAPR: Math.max(0, rewardsAPR),
    });
  }
  
  return history;
}

/**
 * Get protocol overview metrics
 * @param {number} chainId - Chain ID
 * @returns {Promise<Object>} - Protocol metrics
 */
export async function getProtocolMetrics(chainId = 8453) {
  const cacheKey = getCacheKey('protocol', { chainId });
  const cached = getFromCache(cacheKey);
  if (cached) return cached;
  
  // Try subgraph
  if (isDeployed(chainId)) {
    const data = await querySubgraph(chainId, `
      query GetProtocolMetrics {
        protocol(id: "aurelia") {
          totalVolumeUSD
          totalSwaps
          totalWraps
          totalUnwraps
          totalUsers
          totalVaults
          totalGasSaved
          totalStaked
          totalRewardsDistributed
        }
      }
    `);
    
    if (data?.protocol) {
      const metrics = {
        totalVolume: parseFloat(data.protocol.totalVolumeUSD || 0),
        totalSwaps: parseInt(data.protocol.totalSwaps || 0),
        totalUsers: parseInt(data.protocol.totalUsers || 0),
        totalVaults: parseInt(data.protocol.totalVaults || 0),
        totalWraps: parseInt(data.protocol.totalWraps || 0),
        totalUnwraps: parseInt(data.protocol.totalUnwraps || 0),
        totalGasSaved: parseInt(data.protocol.totalGasSaved || 0),
        totalStaked: parseFloat(data.protocol.totalStaked || 0),
        totalRewardsDistributed: parseFloat(data.protocol.totalRewardsDistributed || 0),
        timestamp: Date.now(),
      };
      
      setToCache(cacheKey, metrics);
      return metrics;
    }
  }
  
  // Demo data
  const metrics = {
    totalVolume: 2450000000,
    totalSwaps: 485000,
    totalUsers: 12500,
    totalVaults: 24,
    totalWraps: 125000,
    totalUnwraps: 98000,
    totalGasSaved: 15000000000, // 15B gas units
    totalStaked: 45000000,
    totalRewardsDistributed: 2500000,
    timestamp: Date.now(),
  };
  
  setToCache(cacheKey, metrics);
  return metrics;
}

/**
 * Get top pools by various metrics
 * @param {string} sortBy - 'tvl', 'volume', 'apr'
 * @param {number} limit - Number of pools
 * @param {number} chainId - Chain ID
 */
export async function getTopPools(sortBy = 'tvl', limit = 10, chainId = 8453) {
  const cacheKey = getCacheKey('topPools', { sortBy, limit, chainId });
  const cached = getFromCache(cacheKey);
  if (cached) return cached;
  
  // For demo, return from existing pools data
  const { POOLS } = await import('../data/pools');
  
  let sorted;
  switch (sortBy) {
    case 'volume':
      sorted = [...POOLS].sort((a, b) => (b.volume24h || 0) - (a.volume24h || 0));
      break;
    case 'apr':
      sorted = [...POOLS].sort((a, b) => (b.apr || 0) - (a.apr || 0));
      break;
    case 'tvl':
    default:
      sorted = [...POOLS].sort((a, b) => (b.tvl || 0) - (a.tvl || 0));
  }
  
  const result = sorted.slice(0, limit);
  setToCache(cacheKey, result);
  return result;
}

/**
 * Get recent swaps
 * @param {number} limit - Number of swaps
 * @param {number} chainId - Chain ID
 */
export async function getRecentSwaps(limit = 20, chainId = 8453) {
  // Try subgraph
  if (isDeployed(chainId)) {
    const data = await querySubgraph(chainId, `
      query GetRecentSwaps($limit: Int!) {
        swaps(
          first: $limit
          orderBy: timestamp
          orderDirection: desc
        ) {
          id
          txHash
          timestamp
          user { id }
          tokenIn { symbol }
          tokenOut { symbol }
          amountIn
          amountOut
          volumeUSD
        }
      }
    `, { limit });
    
    if (data?.swaps) {
      return data.swaps.map(s => ({
        id: s.id,
        txHash: s.txHash,
        timestamp: parseInt(s.timestamp) * 1000,
        user: s.user?.id,
        tokenIn: s.tokenIn?.symbol,
        tokenOut: s.tokenOut?.symbol,
        amountIn: parseFloat(s.amountIn),
        amountOut: parseFloat(s.amountOut),
        volumeUSD: parseFloat(s.volumeUSD),
      }));
    }
  }
  
  // Generate demo swaps
  return generateDemoSwaps(limit);
}

function generateDemoSwaps(count) {
  const tokens = ['ETH', 'USDC', 'USDT', 'DAI', 'WBTC', 'stETH', 'aUSDC', 'rETH'];
  const swaps = [];
  const now = Date.now();
  
  for (let i = 0; i < count; i++) {
    const tokenIn = tokens[Math.floor(Math.random() * tokens.length)];
    let tokenOut = tokens[Math.floor(Math.random() * tokens.length)];
    while (tokenOut === tokenIn) {
      tokenOut = tokens[Math.floor(Math.random() * tokens.length)];
    }
    
    const volumeUSD = 1000 + Math.random() * 50000;
    
    swaps.push({
      id: `swap-${i}`,
      txHash: `0x${Math.random().toString(16).slice(2, 66)}`,
      timestamp: now - (i * 60000 * Math.random() * 10), // Last ~10 mins
      user: `0x${Math.random().toString(16).slice(2, 42)}`,
      tokenIn,
      tokenOut,
      amountIn: volumeUSD / (tokenIn === 'ETH' ? 3850 : 1),
      amountOut: volumeUSD / (tokenOut === 'ETH' ? 3850 : 1),
      volumeUSD,
    });
  }
  
  return swaps.sort((a, b) => b.timestamp - a.timestamp);
}

/**
 * Get MEV capture statistics
 * @param {number} days - Number of days
 * @param {number} chainId - Chain ID
 */
export async function getMEVStats(days = 30, chainId = 8453) {
  const cacheKey = getCacheKey('mev', { days, chainId });
  const cached = getFromCache(cacheKey);
  if (cached) return cached;
  
  // Demo MEV stats
  const stats = {
    totalCaptured: 125000 + Math.random() * 10000,
    capturedToday: 4200 + Math.random() * 1000,
    avgPerSwap: 0.85 + Math.random() * 0.3,
    backrunSuccess: 0.78 + Math.random() * 0.1,
    topOpportunities: [
      { pair: 'ETH/USDC', captured: 45000, count: 1250 },
      { pair: 'stETH/ETH', captured: 32000, count: 890 },
      { pair: 'WBTC/USDC', captured: 28000, count: 650 },
    ],
    history: generateMEVHistory(days),
  };
  
  setToCache(cacheKey, stats);
  return stats;
}

function generateMEVHistory(days) {
  const history = [];
  const now = Date.now();
  
  for (let i = days; i >= 0; i--) {
    const timestamp = now - (i * 24 * 60 * 60 * 1000);
    history.push({
      date: new Date(timestamp).toISOString().split('T')[0],
      timestamp,
      captured: 3000 + Math.random() * 3000,
      opportunities: 100 + Math.floor(Math.random() * 100),
      successRate: 0.7 + Math.random() * 0.2,
    });
  }
  
  return history;
}

/**
 * Clear analytics cache
 */
export function clearAnalyticsCache() {
  analyticsCache = { data: {}, timestamp: 0 };
}

/**
 * Format large numbers for display
 */
export function formatMetric(value, type = 'number') {
  if (type === 'currency') {
    if (value >= 1e9) return `$${(value / 1e9).toFixed(2)}B`;
    if (value >= 1e6) return `$${(value / 1e6).toFixed(2)}M`;
    if (value >= 1e3) return `$${(value / 1e3).toFixed(2)}K`;
    return `$${value.toFixed(2)}`;
  }
  
  if (value >= 1e9) return `${(value / 1e9).toFixed(2)}B`;
  if (value >= 1e6) return `${(value / 1e6).toFixed(2)}M`;
  if (value >= 1e3) return `${(value / 1e3).toFixed(2)}K`;
  return value.toLocaleString();
}
