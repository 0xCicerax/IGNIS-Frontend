import { logger } from '../utils/logger';
/** Module */

import {
  YIELD_PROTOCOLS,
  DEFILLAMA_YIELDS,
  VAULT_PROTOCOLS,
  CACHE_CONFIG,
  FALLBACK_YIELDS,
} from '../config/protocols';

let yieldCache = {
  data: {},
  timestamp: 0,
};

function loadCache() {
  try {
    const cached = localStorage.getItem(CACHE_CONFIG.keys.yields);
    if (cached) {
      const parsed = JSON.parse(cached);
      if (Date.now() - parsed.timestamp < CACHE_CONFIG.yieldsTTL) {
        yieldCache = parsed;
        return true;
      }
    }
  } catch (e) {
    logger.warn('Yield cache load failed', { error: e });
  }
  return false;
}

function saveCache() {
  try {
    localStorage.setItem(CACHE_CONFIG.keys.yields, JSON.stringify(yieldCache));
  } catch (e) {
    logger.warn('Yield cache save failed', { error: e });
  }
}

function isCacheValid() {
  return Date.now() - yieldCache.timestamp < CACHE_CONFIG.yieldsTTL;
}

/**
 * Fetch all yields from DeFiLlama
 * @returns {Promise<Object>} - Yield data by protocol
 */
async function fetchFromDeFiLlama() {
  try {
    const response = await fetch(`${DEFILLAMA_YIELDS.baseUrl}/pools`);
    
    if (!response.ok) {
      throw new Error(`DeFiLlama Yields API error: ${response.status}`);
    }
    
    const data = await response.json();
    
    // Filter and organize by protocol
    const yields = {};
    
    for (const pool of data.data || []) {
      // Match pools we care about
      const protocolKey = matchProtocol(pool.project, pool.symbol);
      if (protocolKey) {
        if (!yields[protocolKey]) {
          yields[protocolKey] = {};
        }
        
        // Extract the base asset symbol
        const baseSymbol = extractBaseSymbol(pool.symbol);
        if (baseSymbol) {
          yields[protocolKey][baseSymbol] = {
            apy: pool.apy || 0,
            apyBase: pool.apyBase || 0,
            apyReward: pool.apyReward || 0,
            tvlUsd: pool.tvlUsd || 0,
            pool: pool.pool,
            chain: pool.chain,
            project: pool.project,
            symbol: pool.symbol,
          };
        }
      }
    }
    
    return yields;
  } catch (error: unknown) {
    logger.warn('DeFiLlama yields fetch failed', { error });
    return {};
  }
}

/**
 * Match DeFiLlama pool to our protocol keys
 */
function matchProtocol(project, symbol) {
  const projectLower = project?.toLowerCase() || '';
  
  if (projectLower.includes('aave')) return 'aave';
  if (projectLower.includes('morpho')) return 'morpho';
  if (projectLower.includes('compound')) return 'compound';
  if (projectLower.includes('lido')) return 'lido';
  if (projectLower.includes('rocket-pool') || projectLower.includes('rocketpool')) return 'rocketPool';
  if (projectLower.includes('coinbase') || symbol?.includes('cbETH')) return 'coinbase';
  if (projectLower.includes('spark') || symbol?.includes('sDAI')) return 'spark';
  if (projectLower.includes('yearn')) return 'yearn';
  if (projectLower.includes('ether.fi') || projectLower.includes('etherfi')) return 'etherfi';
  if (projectLower.includes('dinero') || projectLower.includes('pirex')) return 'dinero';
  if (projectLower.includes('euler')) return 'euler';
  if (projectLower.includes('fluid')) return 'fluid';
  
  return null;
}

/**
 * Extract base symbol from pool symbol
 * e.g., "USDC-WETH" -> "USDC", "stETH" -> "ETH"
 */
function extractBaseSymbol(symbol) {
  if (!symbol) return null;
  
  // Common patterns
  const patterns = [
    /^(USDC|USDT|DAI|WETH|ETH|WBTC)/i,
    /^a(USDC|USDT|DAI|WETH)/i,  // Aave tokens
    /^c(USDC|USDT|DAI|ETH)/i,   // Compound tokens
    /^(stETH|wstETH|rETH|cbETH|sDAI|weETH|apxETH)/i,
  ];
  
  for (const pattern of patterns) {
    const match = symbol.match(pattern);
    if (match) {
      // Normalize to base asset
      let base = match[1] || match[0];
      base = base.toUpperCase();
      if (base === 'WETH') base = 'ETH';
      return base;
    }
  }
  
  return symbol.split('-')[0]?.toUpperCase();
}

/**
 * Fetch Lido APR directly
 */
async function fetchLidoAPR() {
  try {
    const response = await fetch(`${YIELD_PROTOCOLS.lido.baseUrl}/v1/protocol/steth/apr/sma`);
    if (!response.ok) throw new Error('Lido API error');
    const data = await response.json();
    return {
      stETH: { apy: data.data?.smaApr || 3.4 },
      wstETH: { apy: data.data?.smaApr || 3.4 },
    };
  } catch (error: unknown) {
    return FALLBACK_YIELDS.lido;
  }
}

/**
 * Fetch Rocket Pool APR directly
 */
async function fetchRocketPoolAPR() {
  try {
    const response = await fetch(`${YIELD_PROTOCOLS.rocketPool.baseUrl}/api/mainnet/payload`);
    if (!response.ok) throw new Error('Rocket Pool API error');
    const data = await response.json();
    return {
      rETH: { apy: (data.rethAPR || 3.1) },
    };
  } catch (error: unknown) {
    return { rETH: { apy: FALLBACK_YIELDS.rocketPool.rETH } };
  }
}

/**
 * Get all vault yields
 * @param {boolean} forceRefresh - Force refresh cache
 * @returns {Promise<Object>} - { protocol: { asset: { apy, ... } } }
 */
export async function getAllVaultYields(forceRefresh = false) {
  // Check cache
  if (!forceRefresh && isCacheValid() && Object.keys(yieldCache.data).length > 0) {
    return yieldCache.data;
  }
  
  // Load from localStorage
  if (Object.keys(yieldCache.data).length === 0) {
    loadCache();
    if (isCacheValid()) {
      return yieldCache.data;
    }
  }
  
  // Fetch from DeFiLlama
  let yields = await fetchFromDeFiLlama();
  
  // Fill in missing protocols with direct API calls
  if (!yields.lido || Object.keys(yields.lido).length === 0) {
    yields.lido = await fetchLidoAPR();
  }
  
  if (!yields.rocketPool || Object.keys(yields.rocketPool).length === 0) {
    yields.rocketPool = await fetchRocketPoolAPR();
  }
  
  // Fill remaining gaps with fallbacks
  for (const [protocol, assets] of Object.entries(FALLBACK_YIELDS)) {
    if (!yields[protocol]) {
      yields[protocol] = {};
    }
    for (const [asset, apy] of Object.entries(assets)) {
      if (!yields[protocol][asset]) {
        yields[protocol][asset] = { apy, source: 'fallback' };
      }
    }
  }
  
  // Update cache
  yieldCache.data = yields;
  yieldCache.timestamp = Date.now();
  saveCache();
  
  return yields;
}

/**
 * Get yield for a specific vault token
 * @param {string} vaultSymbol - Vault token symbol (e.g., 'aUSDC', 'stETH')
 * @returns {Promise<Object>} - { apy, protocol, source }
 */
export async function getVaultYield(vaultSymbol) {
  const protocol = VAULT_PROTOCOLS[vaultSymbol];
  if (!protocol) {
    return { apy: 0, protocol: 'unknown', source: 'none' };
  }
  
  const yields = await getAllVaultYields();
  const protocolYields = yields[protocol] || {};
  
  // Try to find matching asset
  const baseAsset = getBaseAsset(vaultSymbol);
  const yieldData = protocolYields[baseAsset] || protocolYields[vaultSymbol];
  
  if (yieldData) {
    return {
      apy: yieldData.apy || yieldData,
      apyBase: yieldData.apyBase,
      apyReward: yieldData.apyReward,
      tvlUsd: yieldData.tvlUsd,
      protocol,
      source: yieldData.source || 'api',
    };
  }
  
  // Use fallback
  const fallback = FALLBACK_YIELDS[protocol]?.[baseAsset];
  return {
    apy: fallback || 0,
    protocol,
    source: 'fallback',
  };
}

/**
 * Get yield for a protocol/asset combination
 * @param {string} protocol - Protocol key (e.g., 'aave', 'lido')
 * @param {string} asset - Asset symbol (e.g., 'USDC', 'ETH')
 * @returns {Promise<number>} - APY as percentage
 */
export async function getProtocolYield(protocol, asset) {
  const yields = await getAllVaultYields();
  const protocolYields = yields[protocol] || {};
  
  const yieldData = protocolYields[asset] || protocolYields[asset.toUpperCase()];
  if (yieldData) {
    return typeof yieldData === 'number' ? yieldData : yieldData.apy || 0;
  }
  
  return FALLBACK_YIELDS[protocol]?.[asset] || 0;
}

/**
 * Get base asset from vault symbol
 * e.g., 'aUSDC' -> 'USDC', 'stETH' -> 'ETH'
 */
function getBaseAsset(vaultSymbol) {
  const mappings = {
    aUSDC: 'USDC', aUSDT: 'USDT', aDAI: 'DAI', aWETH: 'ETH',
    mUSDC: 'USDC', mDAI: 'DAI', mWETH: 'ETH',
    cUSDC: 'USDC', cUSDT: 'USDT', cDAI: 'DAI', cETH: 'ETH',
    stETH: 'ETH', wstETH: 'ETH', rETH: 'ETH', cbETH: 'ETH',
    sDAI: 'DAI',
    yUSDC: 'USDC', yDAI: 'DAI',
    weETH: 'ETH', apxETH: 'ETH', eETH: 'ETH', fETH: 'ETH',
    eUSDC: 'USDC', fUSDC: 'USDC',
  };
  
  return mappings[vaultSymbol] || vaultSymbol;
}

/**
 * Get historical APY for a vault
 * @param {string} vaultSymbol - Vault token symbol
 * @param {number} days - Days of history
 * @returns {Promise<Array>} - [{ date, apy }]
 */
export async function getHistoricalYield(vaultSymbol, days = 30) {
  // DeFiLlama historical yields require pool ID
  // For now, generate mock historical data
  const currentYield = await getVaultYield(vaultSymbol);
  const baseApy = currentYield.apy || 3;
  
  const history = [];
  const now = Date.now();
  
  for (let i = days; i >= 0; i--) {
    const timestamp = now - (i * 24 * 60 * 60 * 1000);
    // APY varies ±20% over time
    const variation = 1 + (Math.sin(i / 5) * 0.2);
    history.push({
      date: new Date(timestamp).toISOString().split('T')[0],
      timestamp,
      apy: baseApy * variation,
    });
  }
  
  return history;
}

/**
 * Get all supported protocols
 */
export function getSupportedProtocols() {
  return Object.keys(YIELD_PROTOCOLS);
}

/**
 * Get protocol metadata
 */
export function getProtocolInfo(protocol) {
  return YIELD_PROTOCOLS[protocol] || null;
}

/**
 * Clear yield cache
 */
export function clearYieldCache() {
  yieldCache = { data: {}, timestamp: 0 };
  localStorage.removeItem(CACHE_CONFIG.keys.yields);
}

/**
 * Get combined yield for a pool with two vault tokens
 * @param {string} token0Symbol - First token symbol
 * @param {string} token1Symbol - Second token symbol
 * @param {number} weight0 - Weight of first token (0-1)
 * @returns {Promise<Object>} - Combined yield info
 */
export async function getCombinedPoolYield(token0Symbol, token1Symbol, weight0 = 0.5) {
  const [yield0, yield1] = await Promise.all([
    getVaultYield(token0Symbol),
    getVaultYield(token1Symbol),
  ]);
  
  const weight1 = 1 - weight0;
  const combinedApy = (yield0.apy * weight0) + (yield1.apy * weight1);
  
  return {
    combinedApy,
    token0: {
      symbol: token0Symbol,
      apy: yield0.apy,
      protocol: yield0.protocol,
      weight: weight0,
    },
    token1: {
      symbol: token1Symbol,
      apy: yield1.apy,
      protocol: yield1.protocol,
      weight: weight1,
    },
  };
}
