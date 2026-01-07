import { logger } from '../utils/logger';
/**
 * @fileoverview Production hook for fetching orderbook depth from PoolDepthReader contract
 * @module useDepth
 * @author Aurelia Protocol Team
 * 
 * @description
 * This module provides React hooks and utilities for fetching orderbook depth data
 * from the PoolDepthReader smart contract. It supports both single pool queries
 * and batch queries for optimal RPC efficiency.
 * 
 * @example
 * ```tsx
 * import { useDepth, DepthReaderService } from './useDepth';
 * 
 * // Using the hook (auto-polling)
 * const { depth, loading, error } = useDepth({
 *   token0: '0xWETH...',
 *   token1: '0xUSDC...',
 *   pollInterval: 15000, // 15 seconds
 * });
 * 
 * // Using the service directly (for batch calls)
 * const service = new DepthReaderService(contractAddress, rpcUrl);
 * const { clSnapshots, binSnapshots } = await service.getBatchDepth(clPoolIds, binPoolIds, 50);
 * ```
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { ethers, Contract } from 'ethers';

// CONFIGURATION

/**
 * PoolDepthReader contract address
 * @description Set via REACT_APP_DEPTH_READER_ADDRESS environment variable
 * @default Zero address (triggers local mock mode)
 */
export const DEPTH_READER_ADDRESS = process.env.REACT_APP_DEPTH_READER_ADDRESS || 
  '0x0000000000000000000000000000000000000000';

/**
 * Default RPC URL for contract calls
 * @description Set via REACT_APP_RPC_URL environment variable
 * @default Arbitrum One public RPC
 */
export const RPC_URL = process.env.REACT_APP_RPC_URL || 
  'https://arb1.arbitrum.io/rpc';

/**
 * Default polling interval in milliseconds
 * @description How often to refresh depth data automatically
 * @default 15000 (15 seconds)
 */
export const DEFAULT_POLL_INTERVAL = 15_000;

/**
 * Maximum depth items allowed per side
 * @description Matches contract MAX_DEPTH_ITEMS constant
 */
export const MAX_DEPTH_ITEMS = 100;

/**
 * Default depth items per side when not specified
 * @description Matches contract DEFAULT_DEPTH_ITEMS constant
 */
export const DEFAULT_DEPTH_ITEMS = 50;

// CONTRACT ABI

/**
 * ABI for PoolDepthReader contract
 * @description Human-readable ABI for ethers.js
 */
export const POOL_DEPTH_READER_ABI = [
  // Batch functions (RECOMMENDED for production)
  'function getBatchDepth(bytes32[] calldata clPoolIds, bytes32[] calldata binPoolIds, uint16 numItemsPerSide) external view returns (tuple(tuple(bytes32 poolId, int24 currentTick, uint256 currentPrice, uint128 totalLiquidity, tuple(int24 tick, int128 liquidityNet, uint128 liquidityGross, uint256 price)[] bids, tuple(int24 tick, int128 liquidityNet, uint128 liquidityGross, uint256 price)[] asks, uint256 timestamp)[] clSnapshots, tuple(bytes32 poolId, uint24 activeId, uint256 currentPrice, uint128 totalReserveX, uint128 totalReserveY, tuple(uint24 binId, uint128 reserveX, uint128 reserveY, uint256 price)[] bids, tuple(uint24 binId, uint128 reserveX, uint128 reserveY, uint256 price)[] asks, uint256 timestamp)[] binSnapshots, uint256 timestamp, uint256 blockNumber))',
  'function getBatchAggregatedDepth(address[2][] calldata tokenPairs, uint16 numLevels) external view returns (tuple(address token0, address token1, uint256 currentPrice, tuple(uint256 price, uint256 liquidity, uint256 cumulative)[] bids, tuple(uint256 price, uint256 liquidity, uint256 cumulative)[] asks, uint8 poolCount, uint256 timestamp)[] depths, uint256 timestamp)',
  // Single pool functions
  'function getCLPoolDepth(bytes32 poolId, uint16 numTicksEachSide) external view returns (tuple(bytes32 poolId, int24 currentTick, uint256 currentPrice, uint128 totalLiquidity, tuple(int24 tick, int128 liquidityNet, uint128 liquidityGross, uint256 price)[] bids, tuple(int24 tick, int128 liquidityNet, uint128 liquidityGross, uint256 price)[] asks, uint256 timestamp))',
  'function getCLPoolDepthByPair(address token0, address token1, uint16 numTicksEachSide) external view returns (tuple(bytes32 poolId, int24 currentTick, uint256 currentPrice, uint128 totalLiquidity, tuple(int24 tick, int128 liquidityNet, uint128 liquidityGross, uint256 price)[] bids, tuple(int24 tick, int128 liquidityNet, uint128 liquidityGross, uint256 price)[] asks, uint256 timestamp))',
  'function getBinPoolDepth(bytes32 poolId, uint16 numBinsEachSide) external view returns (tuple(bytes32 poolId, uint24 activeId, uint256 currentPrice, uint128 totalReserveX, uint128 totalReserveY, tuple(uint24 binId, uint128 reserveX, uint128 reserveY, uint256 price)[] bids, tuple(uint24 binId, uint128 reserveX, uint128 reserveY, uint256 price)[] asks, uint256 timestamp))',
  'function getBinPoolDepthByPair(address token0, address token1, uint16 numBinsEachSide) external view returns (tuple(bytes32 poolId, uint24 activeId, uint256 currentPrice, uint128 totalReserveX, uint128 totalReserveY, tuple(uint24 binId, uint128 reserveX, uint128 reserveY, uint256 price)[] bids, tuple(uint24 binId, uint128 reserveX, uint128 reserveY, uint256 price)[] asks, uint256 timestamp))',
  'function getAggregatedDepth(address token0, address token1, uint16 numLevels) external view returns (tuple(address token0, address token1, uint256 currentPrice, tuple(uint256 price, uint256 liquidity, uint256 cumulative)[] bids, tuple(uint256 price, uint256 liquidity, uint256 cumulative)[] asks, uint8 poolCount, uint256 timestamp))',
  // Helpers
  'function isMockMode() external view returns (bool)',
  'function maxDepthItems() external view returns (uint16)',
  'function maxBatchSize() external view returns (uint16)',
  'function estimateRpcSavings(uint16 numPools, uint16 refreshIntervalSeconds) external view returns (uint256 individualCallsPerDay, uint256 batchCallsPerDay, uint256 savings)',
];

// TYPES

/**
 * Token metadata for display and calculations
 */
export interface TokenInfo {
  /** Token contract address */
  address: string;
  /** Token symbol (e.g., "WETH") */
  symbol: string;
  /** Token name (e.g., "Wrapped Ether") */
  name: string;
  /** Token decimals (e.g., 18 for ETH, 6 for USDC) */
  decimals: number;
  /** Optional icon character or URL */
  icon?: string;
  /** Optional brand color (hex) */
  color?: string;
}

/**
 * Tick-level liquidity data from CL pools
 */
export interface TickData {
  /** Tick index */
  tick: number;
  /** Net liquidity change when crossing this tick */
  liquidityNet: bigint;
  /** Total liquidity referencing this tick */
  liquidityGross: bigint;
  /** Price at this tick (human-readable, not scaled) */
  price: number;
}

/**
 * Bin-level reserve data from LB pools
 */
export interface BinData {
  /** Bin identifier */
  binId: number;
  /** Token X (base) reserves */
  reserveX: bigint;
  /** Token Y (quote) reserves */
  reserveY: bigint;
  /** Price at this bin (human-readable, not scaled) */
  price: number;
}

/**
 * Single price level in aggregated orderbook
 */
export interface PriceLevel {
  /** Price at this level */
  price: number;
  /** Liquidity at exactly this level (in quote currency) */
  liquidity: number;
  /** Cumulative liquidity from best price to this level */
  cumulative: number;
}

/**
 * Complete depth snapshot for a CL pool
 */
export interface CLDepthSnapshot {
  /** Pool identifier (bytes32 as hex string) */
  poolId: string;
  /** Current tick index */
  currentTick: number;
  /** Current price (human-readable) */
  currentPrice: number;
  /** Total active liquidity */
  totalLiquidity: bigint;
  /** Bid (buy) side tick data */
  bids: TickData[];
  /** Ask (sell) side tick data */
  asks: TickData[];
  /** Timestamp in seconds */
  timestamp: number;
}

/**
 * Complete depth snapshot for a Bin/LB pool
 */
export interface BinDepthSnapshot {
  /** Pool identifier (bytes32 as hex string) */
  poolId: string;
  /** Current active bin ID */
  activeId: number;
  /** Current price (human-readable) */
  currentPrice: number;
  /** Total X reserves */
  totalReserveX: bigint;
  /** Total Y reserves */
  totalReserveY: bigint;
  /** Bid side bin data */
  bids: BinData[];
  /** Ask side bin data */
  asks: BinData[];
  /** Timestamp in seconds */
  timestamp: number;
}

/**
 * Aggregated depth across multiple pools
 */
export interface AggregatedDepth {
  /** Base token address */
  token0: string;
  /** Quote token address */
  token1: string;
  /** Current weighted average price */
  currentPrice: number;
  /** Aggregated bid levels */
  bids: PriceLevel[];
  /** Aggregated ask levels */
  asks: PriceLevel[];
  /** Number of pools included */
  poolCount: number;
  /** Timestamp in seconds */
  timestamp: number;
}

/**
 * Unified depth data structure for UI components
 */
export interface DepthData {
  /** Bid (buy) side price levels */
  bids: PriceLevel[];
  /** Ask (sell) side price levels */
  asks: PriceLevel[];
  /** Current mid-market price */
  currentPrice: number;
  /** Source pool type */
  poolType: 'CL' | 'BIN' | 'AGGREGATED';
  /** Timestamp in milliseconds */
  timestamp: number;
}

// RAW CONTRACT RESPONSE TYPES (from ethers.js)

/** Raw tick data from contract */
interface RawTickData {
  tick: bigint | number;
  liquidityNet: bigint | { toString(): string };
  liquidityGross: bigint | { toString(): string };
  price: bigint | number;
}

/** Raw bin data from contract */
interface RawBinData {
  binId: bigint | number;
  reserveX: bigint | { toString(): string };
  reserveY: bigint | { toString(): string };
  price: bigint | number;
}

/** Raw price level from contract */
interface RawPriceLevel {
  price: bigint | number;
  liquidity: bigint | number;
  cumulative: bigint | number;
}

/** Raw CL snapshot from contract */
interface RawCLSnapshot {
  poolId: string;
  currentTick: bigint | number;
  currentPrice: bigint | number;
  totalLiquidity: bigint | { toString(): string };
  bids: RawTickData[];
  asks: RawTickData[];
  timestamp: bigint | number;
}

/** Raw Bin snapshot from contract */
interface RawBinSnapshot {
  poolId: string;
  activeId: bigint | number;
  currentPrice: bigint | number;
  totalReserveX: bigint | { toString(): string };
  totalReserveY: bigint | { toString(): string };
  bids: RawBinData[];
  asks: RawBinData[];
  timestamp: bigint | number;
}

/** Raw aggregated depth from contract */
interface RawAggregatedDepth {
  token0: string;
  token1: string;
  currentPrice: bigint | number;
  bids: RawPriceLevel[];
  asks: RawPriceLevel[];
  poolCount: bigint | number;
  timestamp: bigint | number;
}

/** Raw batch depth response from contract */
interface RawBatchDepthResult {
  clSnapshots: RawCLSnapshot[];
  binSnapshots: RawBinSnapshot[];
  timestamp: bigint | number;
  blockNumber: bigint | number;
}

/** Raw batch aggregated response from contract */
interface RawBatchAggregatedResult {
  depths: RawAggregatedDepth[];
  timestamp: bigint | number;
}

// DEPTH READER SERVICE

/**
 * Service class for interacting with PoolDepthReader contract
 * 
 * @description
 * Provides methods to fetch depth data from the smart contract.
 * Handles ABI encoding/decoding and type conversions.
 * 
 * @example
 * ```typescript
 * const service = new DepthReaderService(
 *   '0x1234...', // contract address
 *   'https://arb1.arbitrum.io/rpc'
 * );
 * 
 * // Fetch single pair depth
 * const depth = await service.getAggregatedDepth(WETH, USDC, 20);
 * 
 * // Batch fetch all pools (recommended for production)
 * const batch = await service.getBatchDepth(clPoolIds, binPoolIds, 50);
 * ```
 */
export class DepthReaderService {
  private contract: Contract;
  private provider: ethers.JsonRpcProvider;
  
  /**
   * Create a new DepthReaderService instance
   * @param contractAddress - Address of deployed PoolDepthReader contract
   * @param rpcUrl - RPC endpoint URL
   */
  constructor(
    contractAddress: string = DEPTH_READER_ADDRESS,
    rpcUrl: string = RPC_URL
  ) {
    this.provider = new ethers.JsonRpcProvider(rpcUrl);
    this.contract = new Contract(contractAddress, POOL_DEPTH_READER_ABI, this.provider);
  }
  
  /**
   * Get depth for a single CL pool by ID
   * @param poolId - Pool identifier (bytes32 hex string)
   * @param numTicksEachSide - Number of ticks per side (default: 50)
   */
  async getCLPoolDepth(
    poolId: string, 
    numTicksEachSide: number = DEFAULT_DEPTH_ITEMS
  ): Promise<CLDepthSnapshot> {
    const result = await this.contract.getCLPoolDepth(poolId, numTicksEachSide);
    return this.parseCLSnapshot(result);
  }
  
  /**
   * Get depth for CL pool by token pair
   * @param token0 - Base token address
   * @param token1 - Quote token address
   * @param numTicksEachSide - Number of ticks per side
   */
  async getCLPoolDepthByPair(
    token0: string, 
    token1: string, 
    numTicksEachSide: number = DEFAULT_DEPTH_ITEMS
  ): Promise<CLDepthSnapshot> {
    const result = await this.contract.getCLPoolDepthByPair(token0, token1, numTicksEachSide);
    return this.parseCLSnapshot(result);
  }
  
  /**
   * Get depth for a single Bin pool by ID
   * @param poolId - Pool identifier (bytes32 hex string)
   * @param numBinsEachSide - Number of bins per side (default: 50)
   */
  async getBinPoolDepth(
    poolId: string, 
    numBinsEachSide: number = DEFAULT_DEPTH_ITEMS
  ): Promise<BinDepthSnapshot> {
    const result = await this.contract.getBinPoolDepth(poolId, numBinsEachSide);
    return this.parseBinSnapshot(result);
  }
  
  /**
   * Get depth for Bin pool by token pair
   * @param token0 - Base token address
   * @param token1 - Quote token address
   * @param numBinsEachSide - Number of bins per side
   */
  async getBinPoolDepthByPair(
    token0: string, 
    token1: string, 
    numBinsEachSide: number = DEFAULT_DEPTH_ITEMS
  ): Promise<BinDepthSnapshot> {
    const result = await this.contract.getBinPoolDepthByPair(token0, token1, numBinsEachSide);
    return this.parseBinSnapshot(result);
  }
  
  /**
   * Get aggregated depth across all pools for a token pair
   * @param token0 - Base token address
   * @param token1 - Quote token address
   * @param numLevels - Number of price levels (default: 20)
   */
  async getAggregatedDepth(
    token0: string, 
    token1: string, 
    numLevels: number = 20
  ): Promise<AggregatedDepth> {
    const result = await this.contract.getAggregatedDepth(token0, token1, numLevels);
    return this.parseAggregatedDepth(result);
  }
  
  /**
   * Check if contract is in mock mode
   * @returns True if using simulated data
   */
  async isMockMode(): Promise<boolean> {
    return await this.contract.isMockMode();
  }
  
  /**
   * Batch fetch depth for multiple pools in ONE RPC call
   * 
   * @description
   * This is the recommended method for production use.
   * Reduces RPC calls by 60x compared to individual queries.
   * 
   * @param clPoolIds - Array of CL pool IDs
   * @param binPoolIds - Array of Bin pool IDs
   * @param numItemsPerSide - Number of ticks/bins per side
   * @returns All pool snapshots in a single response
   * 
   * @example
   * ```typescript
   * // Fetch 60 pools in 1 RPC call instead of 60
   * const { clSnapshots, binSnapshots } = await service.getBatchDepth(
   *   clPoolIds,  // 40 CL pools
   *   binPoolIds, // 20 Bin pools
   *   50          // 50 items per side
   * );
   * ```
   */
  async getBatchDepth(
    clPoolIds: string[],
    binPoolIds: string[],
    numItemsPerSide: number = DEFAULT_DEPTH_ITEMS
  ): Promise<{
    clSnapshots: CLDepthSnapshot[];
    binSnapshots: BinDepthSnapshot[];
    timestamp: number;
    blockNumber: number;
  }> {
    const result = await this.contract.getBatchDepth(clPoolIds, binPoolIds, numItemsPerSide);
    return {
      clSnapshots: result.clSnapshots.map((s: RawCLSnapshot) => this.parseCLSnapshot(s)),
      binSnapshots: result.binSnapshots.map((s: RawBinSnapshot) => this.parseBinSnapshot(s)),
      timestamp: Number(result.timestamp),
      blockNumber: Number(result.blockNumber),
    };
  }
  
  /**
   * Batch fetch aggregated depth for multiple token pairs
   * @param tokenPairs - Array of [token0, token1] pairs
   * @param numLevels - Number of price levels per pair
   */
  async getBatchAggregatedDepth(
    tokenPairs: [string, string][],
    numLevels: number = 20
  ): Promise<{
    depths: AggregatedDepth[];
    timestamp: number;
  }> {
    const result = await this.contract.getBatchAggregatedDepth(tokenPairs, numLevels);
    return {
      depths: result.depths.map((d: RawAggregatedDepth) => this.parseAggregatedDepth(d)),
      timestamp: Number(result.timestamp),
    };
  }
  
  /**
   * Estimate RPC savings from using batch calls
   * @param numPools - Number of pools to query
   * @param refreshIntervalSeconds - Refresh interval in seconds
   * @returns Comparison of individual vs batch call counts
   */
  async estimateRpcSavings(
    numPools: number,
    refreshIntervalSeconds: number
  ): Promise<{
    individualCallsPerDay: number;
    batchCallsPerDay: number;
    savings: number;
  }> {
    const result = await this.contract.estimateRpcSavings(numPools, refreshIntervalSeconds);
    return {
      individualCallsPerDay: Number(result.individualCallsPerDay),
      batchCallsPerDay: Number(result.batchCallsPerDay),
      savings: Number(result.savings),
    };
  }
  
  /**
   * Parse raw CL snapshot from contract
   * @internal
   */
  private parseCLSnapshot(result: RawCLSnapshot): CLDepthSnapshot {
    return {
      poolId: result.poolId,
      currentTick: Number(result.currentTick),
      currentPrice: Number(result.currentPrice) / 1e18,
      totalLiquidity: BigInt(result.totalLiquidity.toString()),
      bids: result.bids.map((t: RawTickData) => ({
        tick: Number(t.tick),
        liquidityNet: BigInt(t.liquidityNet.toString()),
        liquidityGross: BigInt(t.liquidityGross.toString()),
        price: Number(t.price) / 1e18,
      })),
      asks: result.asks.map((t: RawTickData) => ({
        tick: Number(t.tick),
        liquidityNet: BigInt(t.liquidityNet.toString()),
        liquidityGross: BigInt(t.liquidityGross.toString()),
        price: Number(t.price) / 1e18,
      })),
      timestamp: Number(result.timestamp),
    };
  }
  
  /**
   * Parse raw Bin snapshot from contract
   * @internal
   */
  private parseBinSnapshot(result: RawBinSnapshot): BinDepthSnapshot {
    return {
      poolId: result.poolId,
      activeId: Number(result.activeId),
      currentPrice: Number(result.currentPrice) / 1e18,
      totalReserveX: BigInt(result.totalReserveX.toString()),
      totalReserveY: BigInt(result.totalReserveY.toString()),
      bids: result.bids.map((b: RawBinData) => ({
        binId: Number(b.binId),
        reserveX: BigInt(b.reserveX.toString()),
        reserveY: BigInt(b.reserveY.toString()),
        price: Number(b.price) / 1e18,
      })),
      asks: result.asks.map((b: RawBinData) => ({
        binId: Number(b.binId),
        reserveX: BigInt(b.reserveX.toString()),
        reserveY: BigInt(b.reserveY.toString()),
        price: Number(b.price) / 1e18,
      })),
      timestamp: Number(result.timestamp),
    };
  }
  
  /**
   * Parse raw aggregated depth from contract
   * @internal
   */
  private parseAggregatedDepth(result: RawAggregatedDepth): AggregatedDepth {
    return {
      token0: result.token0,
      token1: result.token1,
      currentPrice: Number(result.currentPrice) / 1e18,
      bids: result.bids.map((l: RawPriceLevel) => ({
        price: Number(l.price) / 1e18,
        liquidity: Number(l.liquidity) / 1e18,
        cumulative: Number(l.cumulative) / 1e18,
      })),
      asks: result.asks.map((l: RawPriceLevel) => ({
        price: Number(l.price) / 1e18,
        liquidity: Number(l.liquidity) / 1e18,
        cumulative: Number(l.cumulative) / 1e18,
      })),
      poolCount: Number(result.poolCount),
      timestamp: Number(result.timestamp),
    };
  }
}

// LOCAL MOCK DATA GENERATOR

/**
 * Generate local mock depth data when contract is not deployed
 * @internal
 * @param currentPrice - Base price for mock data
 * @param poolType - Type of pool to simulate
 * @returns Mock depth data
 */
function generateLocalMockDepth(
  currentPrice: number,
  poolType: 'CL' | 'BIN' | 'AGGREGATED'
): DepthData {
  const bids: PriceLevel[] = [];
  const asks: PriceLevel[] = [];
  const numLevels = 20;
  const totalLiquidity = 100_000_000; // $100M
  
  let bidCum = 0;
  let askCum = 0;
  
  // Seeded pseudo-random for consistent mock data
  const seedRandom = (seed: number): number => {
    const x = Math.sin(seed) * 10000;
    return x - Math.floor(x);
  };
  
  for (let i = 0; i < numLevels; i++) {
    const spread = (i + 1) * 0.005; // 0.5% per level
    
    // Exponential decay with pseudo-random jitter
    const decayFactor = Math.exp(-i * 0.12);
    const baseLiq = totalLiquidity * 0.08 * decayFactor;
    const jitterBid = 0.7 + seedRandom(i * 17) * 0.6;
    const jitterAsk = 0.7 + seedRandom(i * 31) * 0.6;
    
    const bidLiq = baseLiq * jitterBid;
    const askLiq = baseLiq * jitterAsk;
    
    bidCum += bidLiq;
    bids.push({
      price: currentPrice * (1 - spread),
      liquidity: bidLiq,
      cumulative: bidCum,
    });
    
    askCum += askLiq;
    asks.push({
      price: currentPrice * (1 + spread),
      liquidity: askLiq,
      cumulative: askCum,
    });
  }
  
  return {
    bids,
    asks,
    currentPrice,
    poolType,
    timestamp: Date.now(),
  };
}

// REACT HOOKS

/**
 * Options for useDepth hook
 */
interface UseDepthOptions {
  /** Base token address */
  token0: string | null;
  /** Quote token address */
  token1: string | null;
  /** Pool type to query */
  poolType?: 'CL' | 'BIN' | 'AGGREGATED';
  /** Number of price levels */
  numLevels?: number;
  /** Polling interval in ms (0 to disable) */
  pollInterval?: number;
  /** Enable/disable fetching */
  enabled?: boolean;
  /** Contract address override */
  contractAddress?: string;
  /** RPC URL override */
  rpcUrl?: string;
  /** Base token info for proper decimal handling */
  baseToken?: TokenInfo;
  /** Quote token info for proper decimal handling */
  quoteToken?: TokenInfo;
}

/**
 * Return type for useDepth hook
 */
interface UseDepthResult {
  /** Current depth data (null if loading or error) */
  depth: DepthData | null;
  /** True while fetching */
  loading: boolean;
  /** Error message if fetch failed */
  error: string | null;
  /** Timestamp of last successful update (ms) */
  lastUpdated: number | null;
  /** Manually trigger a refresh */
  refetch: () => Promise<void>;
  /** True if using mock data */
  isMockMode: boolean;
}

/**
 * React hook for fetching and auto-refreshing depth data
 * 
 * @description
 * Provides automatic polling of depth data from PoolDepthReader contract.
 * Falls back to local mock data if contract is not deployed.
 * 
 * @param options - Hook configuration options
 * @returns Depth data, loading state, and utilities
 * 
 * @example
 * ```tsx
 * function OrderBook() {
 *   const { depth, loading, error, refetch, isMockMode } = useDepth({
 *     token0: WETH_ADDRESS,
 *     token1: USDC_ADDRESS,
 *     pollInterval: 15000, // 15 seconds
 *     baseToken: { symbol: 'WETH', decimals: 18, ... },
 *     quoteToken: { symbol: 'USDC', decimals: 6, ... },
 *   });
 * 
 *   if (loading) return <Spinner />;
 *   if (error) return <Error message={error} onRetry={refetch} />;
 *   if (!depth) return null;
 * 
 *   return (
 *     <div>
 *       {isMockMode && <Badge>Mock Data</Badge>}
 *       <BidTable data={depth.bids} />
 *       <AskTable data={depth.asks} />
 *     </div>
 *   );
 * }
 * ```
 */
export function useDepth({
  token0,
  token1,
  poolType = 'AGGREGATED',
  numLevels = 20,
  pollInterval = DEFAULT_POLL_INTERVAL,
  enabled = true,
  contractAddress = DEPTH_READER_ADDRESS,
  rpcUrl = RPC_URL,
  baseToken,
  quoteToken,
}: UseDepthOptions): UseDepthResult {
  const [depth, setDepth] = useState<DepthData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<number | null>(null);
  const [isMockMode, setIsMockMode] = useState(true);
  
  const serviceRef = useRef<DepthReaderService | null>(null);
  const retryCountRef = useRef(0);
  const maxRetries = 3;
  
  // Initialize service when contract address changes
  useEffect(() => {
    if (contractAddress && contractAddress !== '0x0000000000000000000000000000000000000000') {
      try {
        serviceRef.current = new DepthReaderService(contractAddress, rpcUrl);
        serviceRef.current.isMockMode()
          .then(setIsMockMode)
          .catch(() => setIsMockMode(true));
      } catch (err: unknown) {
        logger.error('DepthReaderService init failed', err);
        serviceRef.current = null;
      }
    } else {
      serviceRef.current = null;
      setIsMockMode(true);
    }
  }, [contractAddress, rpcUrl]);
  
  const fetchDepth = useCallback(async () => {
    if (!token0 || !token1 || !enabled) {
      setDepth(null);
      return;
    }
    
    // If no contract deployed, use local mock
    if (!serviceRef.current || contractAddress === '0x0000000000000000000000000000000000000000') {
      setDepth(generateLocalMockDepth(3400, poolType));
      setLastUpdated(Date.now());
      setIsMockMode(true);
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      let result: DepthData;
      
      if (poolType === 'AGGREGATED') {
        const aggDepth = await serviceRef.current.getAggregatedDepth(token0, token1, numLevels);
        result = {
          bids: aggDepth.bids,
          asks: aggDepth.asks,
          currentPrice: aggDepth.currentPrice,
          poolType: 'AGGREGATED',
          timestamp: aggDepth.timestamp * 1000,
        };
      } else if (poolType === 'CL') {
        const clDepth = await serviceRef.current.getCLPoolDepthByPair(token0, token1, numLevels);
        result = convertCLToDepthData(clDepth, baseToken, quoteToken);
      } else {
        const binDepth = await serviceRef.current.getBinPoolDepthByPair(token0, token1, numLevels);
        result = convertBinToDepthData(binDepth, baseToken, quoteToken);
      }
      
      setDepth(result);
      setLastUpdated(Date.now());
      retryCountRef.current = 0; // Reset retry count on success
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to fetch depth';
      setError(message);
      
      // Retry with exponential backoff
      if (retryCountRef.current < maxRetries) {
        retryCountRef.current++;
        const backoffMs = Math.pow(2, retryCountRef.current) * 1000;
        logger.warn('Depth fetch retry', { backoffMs, attempt: retryCountRef.current, maxRetries });
        setTimeout(fetchDepth, backoffMs);
      } else {
        // Fallback to local mock after max retries
        logger.warn('Depth fetch max retries, using mock data');
        setDepth(generateLocalMockDepth(3400, poolType));
        setLastUpdated(Date.now());
        retryCountRef.current = 0;
      }
    } finally {
      setLoading(false);
    }
  }, [token0, token1, poolType, numLevels, enabled, contractAddress, baseToken, quoteToken]);
  
  // Initial fetch
  useEffect(() => {
    fetchDepth();
  }, [fetchDepth]);
  
  // Polling
  useEffect(() => {
    if (pollInterval <= 0 || !enabled) return;
    
    const interval = setInterval(fetchDepth, pollInterval);
    return () => clearInterval(interval);
  }, [fetchDepth, pollInterval, enabled]);
  
  return { depth, loading, error, lastUpdated, refetch: fetchDepth, isMockMode };
}

// CONVERTERS

/**
 * Convert CL pool snapshot to unified DepthData format
 * @param snapshot - Raw CL depth snapshot
 * @param baseToken - Base token info for decimals
 * @param quoteToken - Quote token info for decimals
 * @returns Unified depth data
 */
function convertCLToDepthData(
  snapshot: CLDepthSnapshot,
  baseToken?: TokenInfo,
  quoteToken?: TokenInfo
): DepthData {
  let bidCum = 0;
  let askCum = 0;
  
  // Use token decimals if provided, otherwise assume 18
  const baseDecimals = baseToken?.decimals ?? 18;
  const quoteDecimals = quoteToken?.decimals ?? 18;
  
  // For CL pools, liquidityGross is in sqrt(token0 * token1) units
  // We convert to quote currency value for display
  const liquidityToValue = (liqGross: bigint, price: number): number => {
    // Simplified: assume liquidity represents value at this price
    // In production, would need proper L -> token amount conversion
    const rawLiq = Number(liqGross) / Math.pow(10, (baseDecimals + quoteDecimals) / 2);
    return rawLiq * Math.sqrt(price);
  };
  
  return {
    bids: snapshot.bids.map(t => {
      const liq = liquidityToValue(t.liquidityGross, t.price);
      bidCum += liq;
      return { price: t.price, liquidity: liq, cumulative: bidCum };
    }),
    asks: snapshot.asks.map(t => {
      const liq = liquidityToValue(t.liquidityGross, t.price);
      askCum += liq;
      return { price: t.price, liquidity: liq, cumulative: askCum };
    }),
    currentPrice: snapshot.currentPrice,
    poolType: 'CL',
    timestamp: snapshot.timestamp * 1000,
  };
}

/**
 * Convert Bin pool snapshot to unified DepthData format
 * @param snapshot - Raw Bin depth snapshot
 * @param baseToken - Base token info for decimals
 * @param quoteToken - Quote token info for decimals
 * @returns Unified depth data
 */
function convertBinToDepthData(
  snapshot: BinDepthSnapshot,
  baseToken?: TokenInfo,
  quoteToken?: TokenInfo
): DepthData {
  let bidCum = 0;
  let askCum = 0;
  
  // Use token decimals if provided, otherwise use common defaults
  const baseDecimals = baseToken?.decimals ?? 18;
  const quoteDecimals = quoteToken?.decimals ?? 6; // USDC default
  
  return {
    bids: snapshot.bids.map(b => {
      // Bids have Y reserves (quote token)
      const liq = Number(b.reserveY) / Math.pow(10, quoteDecimals);
      bidCum += liq;
      return { price: b.price, liquidity: liq, cumulative: bidCum };
    }),
    asks: snapshot.asks.map(b => {
      // Asks have X reserves (base token) - convert to quote value
      const baseAmount = Number(b.reserveX) / Math.pow(10, baseDecimals);
      const liq = baseAmount * snapshot.currentPrice;
      askCum += liq;
      return { price: b.price, liquidity: liq, cumulative: askCum };
    }),
    currentPrice: snapshot.currentPrice,
    poolType: 'BIN',
    timestamp: snapshot.timestamp * 1000,
  };
}

// UTILITIES

/**
 * Calculate polling costs for depth updates
 * 
 * @description
 * VIEW calls are FREE (no gas cost), but this helps estimate RPC rate limits.
 * 
 * @param numLevels - Number of depth levels per query
 * @param intervalSeconds - Refresh interval in seconds
 * @returns Estimated call counts and costs
 * 
 * @example
 * ```typescript
 * const costs = calculatePollingCosts(20, 15);
 * console.log(costs.callsPerDay); // 5,760
 * console.log(costs.note); // "VIEW calls are FREE..."
 * ```
 */
export function calculatePollingCosts(
  numLevels: number,
  intervalSeconds: number
): {
  callsPerDay: number;
  gasPerCall: number;
  totalGasPerDay: number;
  rpcUnitsPerDay: number;
  note: string;
} {
  const secondsPerDay = 86400;
  const callsPerDay = Math.ceil(secondsPerDay / intervalSeconds);
  
  // Estimated gas for reference (VIEW calls don't actually cost gas)
  const baseGas = 21000;
  const perLevelGas = 2100;
  const gasPerCall = baseGas + (numLevels * 2 * perLevelGas);
  const totalGasPerDay = callsPerDay * gasPerCall;
  
  // Rough RPC unit estimate (varies by provider)
  const rpcUnitsPerDay = callsPerDay * 100;
  
  return {
    callsPerDay,
    gasPerCall,
    totalGasPerDay,
    rpcUnitsPerDay,
    note: 'VIEW calls are FREE - gas shown for reference only. RPC rate limits apply.',
  };
}
