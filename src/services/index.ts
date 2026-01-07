/** Module */

// Price Service - Token price fetching from DeFiLlama, CoinGecko
export {
  getTokenPrices,
  getTokenPrice,
  getTokenPriceWithMeta,
  getHistoricalPrices,
  tokenToUSD,
  usdToToken,
  clearPriceCache,
  getCachedPrices,
} from './priceService';

// Vault Yield Service - APY from Aave, Morpho, Lido, etc.
export {
  getAllVaultYields,
  getVaultYield,
  getProtocolYield,
  getHistoricalYield,
  getCombinedPoolYield,
  getSupportedProtocols,
  getProtocolInfo,
  clearYieldCache,
} from './vaultYieldService';

// APR Service - Pool APR calculations
export {
  calculateFeeAPR,
  calculateRewardsAPR,
  calculatePoolAPR,
  calculateAllPoolAPRs,
  getProtocolAPRStats,
  generateDemoPoolAPR,
  clearAPRCache,
  formatAPR,
  getAPRTier,
} from './aprService';

// Analytics Service - Historical data and metrics
export {
  getTVLHistory,
  getVolumeHistory,
  getPoolAPRHistory,
  getProtocolMetrics,
  getTopPools,
  getRecentSwaps,
  getMEVStats,
  clearAnalyticsCache,
  formatMetric,
} from './analyticsService';

// Gas Estimator Service - Transaction gas cost estimation
export {
  estimateGas,
  formatGasEstimate,
  formatGasEstimateDetailed,
  getSwapGasEstimate,
  getAddLiquidityGasEstimate,
  getRemoveLiquidityGasEstimate,
  getStakeGasEstimate,
  getClaimGasEstimate,
  fetchGasPrice,
} from './gasEstimator';
export type { GasEstimate, TransactionType } from './gasEstimator';
