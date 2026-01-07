import { logger } from '../utils/logger';
import { withRetry, retryPatterns } from '../utils/retry';
/** Module */

import { getTokenPrice, getTokenPrices } from './priceService';
import { getVaultYield, getCombinedPoolYield } from './vaultYieldService';
import { CACHE_CONFIG, FALLBACK_PRICES } from '../config/protocols';
import { IS_TESTNET, getSubgraphUrl, getContract, isDeployed } from '../config/contracts';

let aprCache = {
  pools: {},
  global: null,
  timestamp: 0,
};

function isCacheValid() {
  return Date.now() - aprCache.timestamp < CACHE_CONFIG.aprTTL;
}

function saveToCache(key, data) {
  if (key === 'global') {
    aprCache.global = data;
  } else {
    aprCache.pools[key] = data;
  }
  aprCache.timestamp = Date.now();
  
  try {
    localStorage.setItem(CACHE_CONFIG.keys.apr, JSON.stringify(aprCache));
  } catch (e) {
    logger.warn('APR cache save failed', { error: e });
  }
}

function loadFromCache() {
  try {
    const cached = localStorage.getItem(CACHE_CONFIG.keys.apr);
    if (cached) {
      aprCache = JSON.parse(cached);
    }
  } catch (e) {
    logger.warn('APR cache load failed', { error: e });
  }
}

/**
 * Fetch pool data from subgraph with retry
 */
async function fetchPoolsFromSubgraph(chainId) {
  const subgraphUrl = getSubgraphUrl(chainId);
  if (!subgraphUrl) {
    return null;
  }
  
  try {
    const data = await withRetry(async () => {
      const response = await fetch(subgraphUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: `
            query GetPoolsWithVolume {
              clpools(first: 100, where: { isRegistered: true }) {
                id
                token0 { id symbol decimals }
                token1 { id symbol decimals }
                fee
                liquidity
                sqrtPriceX96
              }
              binPools(first: 100, where: { isRegistered: true }) {
                id
                token0 { id symbol decimals }
                token1 { id symbol decimals }
                binStep
                reserveX
                reserveY
              }
              dailyVolumes(first: 7, orderBy: date, orderDirection: desc) {
                id
                date
                volumeUSD
                swapCount
              }
              protocol(id: "aurelia") {
                totalVolumeUSD
                totalSwaps
                totalStaked
                totalRewardsDistributed
              }
            }
          `
        }),
      });
      
      if (!response.ok) {
        throw new Error(`Subgraph error: ${response.status}`);
      }
      
      return (await response.json()).data;
    }, retryPatterns.subgraph);
    
    return data;
  } catch (error: unknown) {
    logger.warn('Subgraph fetch failed', { error: error instanceof Error ? error.message : error });
    return null;
  }
}

/**
 * Fetch 24h volume for a specific pool from subgraph
 */
async function fetchPool24hVolume(poolId, chainId) {
  const subgraphUrl = getSubgraphUrl(chainId);
  if (!subgraphUrl) return 0;
  
  try {
    const oneDayAgo = Math.floor(Date.now() / 1000) - 86400;
    
    const response = await fetch(subgraphUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: `
          query GetPoolVolume($poolId: ID!, $since: BigInt!) {
            swaps(
              where: { 
                pool: $poolId,
                timestamp_gte: $since
              }
            ) {
              volumeUSD
            }
          }
        `,
        variables: { poolId, since: oneDayAgo.toString() },
      }),
    });
    
    const data = await response.json();
    const swaps = data.data?.swaps || [];
    
    return swaps.reduce((sum, s) => sum + parseFloat(s.volumeUSD || 0), 0);
  } catch (error: unknown) {
    return 0;
  }
}

/**
 * Calculate trading fee APR
 * Formula: (24h Volume × Fee Rate × 365) / TVL × 100
 * 
 * @param {number} volume24h - 24 hour trading volume in USD
 * @param {number} tvl - Total value locked in USD
 * @param {number} feeRate - Fee rate as decimal (e.g., 0.003 for 0.3%)
 * @returns {number} - APR as percentage
 */
export function calculateFeeAPR(volume24h, tvl, feeRate) {
  if (tvl <= 0) return 0;
  
  const dailyFees = volume24h * feeRate;
  const annualFees = dailyFees * 365;
  const apr = (annualFees / tvl) * 100;
  
  return Math.min(apr, 1000); // Cap at 1000% to avoid display issues
}

/**
 * Calculate IGNI rewards APR
 * Formula: (Daily IGNI Emissions × IGNI Price × 365) / TVL × 100
 * 
 * @param {number} dailyIgniEmissions - Daily IGNI distributed to pool
 * @param {number} igniPrice - IGNI price in USD
 * @param {number} tvl - Pool TVL in USD
 * @returns {number} - APR as percentage
 */
export function calculateRewardsAPR(dailyIgniEmissions, igniPrice, tvl) {
  if (tvl <= 0) return 0;
  
  const dailyRewardsUSD = dailyIgniEmissions * igniPrice;
  const annualRewardsUSD = dailyRewardsUSD * 365;
  const apr = (annualRewardsUSD / tvl) * 100;
  
  return Math.min(apr, 500); // Cap rewards APR at 500%
}

/**
 * Calculate complete APR for a pool
 * 
 * @param {Object} pool - Pool data
 * @param {number} chainId - Chain ID
 * @returns {Promise<Object>} - Complete APR breakdown
 */
export async function calculatePoolAPR(pool, chainId = 8453) {
  try {
    // Check cache first
    const cacheKey = `${pool.id}-${chainId}`;
    if (isCacheValid() && aprCache.pools[cacheKey]) {
      return aprCache.pools[cacheKey];
    }
    
    // Get token symbols
    const token0Symbol = pool.token0?.symbol || pool.token0Symbol || 'UNKNOWN';
    const token1Symbol = pool.token1?.symbol || pool.token1Symbol || 'UNKNOWN';
    
    // Get pool parameters
    const feeRate = (pool.fee || pool.feeRate || 3000) / 1000000; // Convert from bps
    const tvl = pool.tvl || pool.tvlUSD || 0;
    
    // 1. Calculate Trading Fee APR
    let volume24h = pool.volume24h || 0;
    if (!volume24h && isDeployed(chainId)) {
      volume24h = await fetchPool24hVolume(pool.id, chainId);
    }
    const feeAPR = calculateFeeAPR(volume24h, tvl, feeRate);
    
    // 2. Calculate Vault Yield APR (with fallback to pool data)
    let vaultAPR = pool.aprYield || 0;
    if (pool.isYieldBearing && vaultAPR === 0) {
      try {
        const vaultYield = await getCombinedPoolYield(token0Symbol, token1Symbol, 0.5);
        vaultAPR = vaultYield.combinedApy || 0;
      } catch (e) {
        logger.warn('Vault yield fetch failed, using pool data');
      }
    }
    
    // 3. Calculate IGNI Rewards APR (use pool data if available)
    const rewardsAPR = pool.aprEmissions || 0;
    
    // 4. Calculate Total APR
    const totalAPR = feeAPR + vaultAPR + rewardsAPR;
    
    const result = {
      poolId: pool.id,
      totalAPR,
      breakdown: {
        feeAPR,
        vaultAPR,
        rewardsAPR,
      },
      details: {
        volume24h,
        tvl,
        feeRate,
        token0: { symbol: token0Symbol },
        token1: { symbol: token1Symbol },
      },
      timestamp: Date.now(),
    };
    
    // Save to cache
    saveToCache(cacheKey, result);
    
    return result;
  } catch (error: unknown) {
    logger.warn('APR calculation failed', { error });
    // Return fallback based on pool data
    return {
      poolId: pool.id,
      totalAPR: (pool.aprFees || pool.apr || 0) + (pool.aprEmissions || 0) + (pool.aprYield || 0),
      breakdown: {
        feeAPR: pool.aprFees || pool.apr || 0,
        vaultAPR: pool.aprYield || 0,
        rewardsAPR: pool.aprEmissions || 0,
      },
      timestamp: Date.now(),
    };
  }
}

/**
 * Estimate IGNI emissions for a pool based on TVL
 * In production, this should come from the BufferStaker contract
 */
function estimatePoolEmissions(tvl) {
  // Assume 1M IGNI distributed daily across all pools
  // Each pool gets proportional share based on TVL
  const totalDailyEmissions = 1000000;
  const estimatedTotalTVL = 500000000; // $500M estimated protocol TVL
  
  const poolShare = tvl / estimatedTotalTVL;
  return totalDailyEmissions * poolShare;
}

/**
 * Calculate APRs for multiple pools
 * 
 * @param {Array} pools - Array of pool objects
 * @param {number} chainId - Chain ID
 * @returns {Promise<Object>} - { poolId: aprData }
 */
export async function calculateAllPoolAPRs(pools, chainId = 8453) {
  // Load cache
  loadFromCache();
  
  // Get all unique tokens for price fetching
  const allTokens = new Set();
  pools.forEach(pool => {
    const t0 = pool.token0?.symbol || pool.token0Symbol;
    const t1 = pool.token1?.symbol || pool.token1Symbol;
    if (t0) allTokens.add(t0);
    if (t1) allTokens.add(t1);
  });
  allTokens.add('IGNI');
  
  // Prefetch all prices
  await getTokenPrices([...allTokens]);
  
  // Calculate APRs in parallel (with concurrency limit)
  const results = {};
  const batchSize = 5;
  
  for (let i = 0; i < pools.length; i += batchSize) {
    const batch = pools.slice(i, i + batchSize);
    const batchResults = await Promise.all(
      batch.map(pool => calculatePoolAPR(pool, chainId))
    );
    
    batchResults.forEach((apr, idx) => {
      results[batch[idx].id] = apr;
    });
  }
  
  return results;
}

/**
 * Get protocol-wide APR statistics
 */
export async function getProtocolAPRStats(chainId = 8453) {
  // Check cache
  if (isCacheValid() && aprCache.global) {
    return aprCache.global;
  }
  
  // Try to fetch from subgraph
  const subgraphData = await fetchPoolsFromSubgraph(chainId);
  
  let stats;
  
  if (subgraphData) {
    // Calculate from real data
    const dailyVolumes = subgraphData.dailyVolumes || [];
    const avgDailyVolume = dailyVolumes.length > 0
      ? dailyVolumes.reduce((sum, d) => sum + parseFloat(d.volumeUSD), 0) / dailyVolumes.length
      : 0;
    
    const protocol = subgraphData.protocol || {};
    const totalTVL = calculateTotalTVL(subgraphData);
    
    // Weighted average APR across all pools
    const avgFeeAPR = totalTVL > 0 
      ? calculateFeeAPR(avgDailyVolume, totalTVL, 0.003) 
      : 0;
    
    stats = {
      avgAPR: avgFeeAPR + 5, // Add estimated avg vault yield
      avgFeeAPR,
      avgVaultAPR: 5, // Estimated average
      avgRewardsAPR: 2, // Estimated average
      totalTVL,
      totalVolume24h: dailyVolumes[0]?.volumeUSD || 0,
      totalVolume7d: dailyVolumes.reduce((sum, d) => sum + parseFloat(d.volumeUSD), 0),
      poolCount: (subgraphData.clpools?.length || 0) + (subgraphData.binPools?.length || 0),
      timestamp: Date.now(),
    };
  } else {
    // Use demo data
    stats = {
      avgAPR: 12.5,
      avgFeeAPR: 5.2,
      avgVaultAPR: 5.3,
      avgRewardsAPR: 2.0,
      totalTVL: 847500000,
      totalVolume24h: 45200000,
      totalVolume7d: 312000000,
      poolCount: 17,
      timestamp: Date.now(),
    };
  }
  
  saveToCache('global', stats);
  return stats;
}

/**
 * Calculate total TVL from subgraph data
 */
function calculateTotalTVL(data) {
  let tvl = 0;
  
  // CL pools
  for (const pool of data.clpools || []) {
    // Simplified TVL calculation - in production use proper sqrtPrice conversion
    tvl += parseFloat(pool.liquidity || 0) / 1e18 * 2000; // Rough estimate
  }
  
  // Bin pools
  for (const pool of data.binPools || []) {
    tvl += parseFloat(pool.reserveX || 0) / 1e18 * 2000;
    tvl += parseFloat(pool.reserveY || 0) / 1e18 * 2000;
  }
  
  return tvl;
}

/**
 * Generate realistic demo APR data for a pool
 */
export function generateDemoPoolAPR(pool) {
  const token0 = pool.token0?.symbol || pool.token0Symbol || '';
  const token1 = pool.token1?.symbol || pool.token1Symbol || '';
  
  // Base fee APR on pool type and TVL
  const tvl = pool.tvl || 10000000;
  const volume24h = tvl * (0.05 + Math.random() * 0.1); // 5-15% daily turnover
  const feeRate = (pool.fee || 3000) / 1000000;
  const feeAPR = calculateFeeAPR(volume24h, tvl, feeRate);
  
  // Vault yields based on token types
  const vaultYields = {
    aUSDC: 4.2, mUSDC: 5.5, cUSDC: 3.5, yUSDC: 6.0, fUSDC: 5.0,
    aUSDT: 4.0, cUSDT: 3.3,
    aDAI: 3.8, mDAI: 5.2, sDAI: 5.0, yDAI: 5.8,
    stETH: 3.4, wstETH: 3.4, rETH: 3.1, cbETH: 3.0, weETH: 3.5, apxETH: 4.0,
    fETH: 3.0, eETH: 2.5,
  };
  
  const yield0 = vaultYields[token0] || 0;
  const yield1 = vaultYields[token1] || 0;
  const vaultAPR = (yield0 + yield1) / 2;
  
  // IGNI rewards APR (decreases with TVL)
  const rewardsAPR = Math.max(0.5, 5 - (tvl / 100000000));
  
  return {
    poolId: pool.id,
    totalAPR: feeAPR + vaultAPR + rewardsAPR,
    breakdown: {
      feeAPR,
      vaultAPR,
      rewardsAPR,
    },
    details: {
      volume24h,
      tvl,
      feeRate,
      token0: { symbol: token0, yield: yield0 },
      token1: { symbol: token1, yield: yield1 },
    },
    timestamp: Date.now(),
  };
}

/**
 * Clear APR cache
 */
export function clearAPRCache() {
  aprCache = { pools: {}, global: null, timestamp: 0 };
  localStorage.removeItem(CACHE_CONFIG.keys.apr);
}

/**
 * Format APR for display
 */
export function formatAPR(apr) {
  if (apr >= 100) {
    return `${apr.toFixed(0)}%`;
  } else if (apr >= 10) {
    return `${apr.toFixed(1)}%`;
  } else {
    return `${apr.toFixed(2)}%`;
  }
}

/**
 * Get APR tier/level for styling
 */
export function getAPRTier(apr) {
  if (apr >= 20) return 'exceptional';
  if (apr >= 10) return 'high';
  if (apr >= 5) return 'medium';
  return 'low';
}
