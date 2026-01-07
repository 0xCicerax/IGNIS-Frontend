/**
 * @fileoverview Production Orderbook Page with PoolDepthReader Integration
 * @module MarketDepthPage
 * @author Aurelia Protocol Team
 * 
 * @description
 * Complete orderbook visualization component that integrates with the
 * PoolDepthReader smart contract. Features include:
 * - HyperLiquid-style orderbook table with depth bars
 * - Cumulative depth chart visualization
 * - Configurable polling intervals (default: 15 seconds)
 * - Token pair selection with proper decimal handling
 * - Mock mode indicator
 * 
 * @example
 * ```tsx
 * import { MarketDepthPage } from './MarketDepthPage';
 * 
 * function App() {
 *   return (
 *     <MarketDepthPage
 *       contractAddress="0x1234..."
 *       rpcUrl="https://arb1.arbitrum.io/rpc"
 *     />
 *   );
 * }
 * ```
 */

import React, { useState, useMemo, useCallback } from 'react';
import { useDepth, PriceLevel, calculatePollingCosts, TokenInfo } from '../hooks/useDepth';
import '../styles/MarketDepthPage.css';

// CONSTANTS

/**
 * Default token configurations for common pairs
 * @description Includes proper decimals for accurate calculations
 */
const DEFAULT_TOKENS: Record<string, TokenInfo> = {
  weth: {
    address: '0x82aF49447D8a07e3bd95BD0d56f35241523fBab1',
    symbol: 'WETH',
    name: 'Wrapped Ether',
    decimals: 18,
    icon: 'Ξ',
    color: '#627EEA',
  },
  usdc: {
    address: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831',
    symbol: 'USDC',
    name: 'USD Coin',
    decimals: 6,
    icon: '$',
    color: '#2775CA',
  },
  usdt: {
    address: '0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9',
    symbol: 'USDT',
    name: 'Tether USD',
    decimals: 6,
    icon: '$',
    color: '#26A17B',
  },
  arb: {
    address: '0x912CE59144191C1204E64559FE8253a0e49E6548',
    symbol: 'ARB',
    name: 'Arbitrum',
    decimals: 18,
    icon: 'A',
    color: '#28A0F0',
  },
  wbtc: {
    address: '0x2f2a2543B76A4166549F7aaB2e75Bef0aefC5B0f',
    symbol: 'WBTC',
    name: 'Wrapped Bitcoin',
    decimals: 8,
    icon: '₿',
    color: '#F7931A',
  },
};

/**
 * Available polling interval options
 */
const POLL_INTERVALS = [
  { label: '15s', value: 15000 },
  { label: '30s', value: 30000 },
  { label: '1m', value: 60000 },
  { label: '5m', value: 300000 },
] as const;

// UTILITY FUNCTIONS

/**
 * Format large numbers with K/M suffixes
 * @param num - Number to format
 * @param decimals - Decimal places to show
 * @returns Formatted string (e.g., "1.5M", "250K", "42.00")
 */
const formatNumber = (num: number, decimals = 2): string => {
  if (!isFinite(num) || isNaN(num)) return '0.00';
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(decimals)}M`;
  if (num >= 1_000) return `${(num / 1_000).toFixed(decimals)}K`;
  return num.toFixed(decimals);
};

/**
 * Format price with appropriate precision based on magnitude
 * @param price - Price to format
 * @returns Formatted price string
 */
const formatPrice = (price: number): string => {
  if (!isFinite(price) || isNaN(price)) return '0.00';
  if (price >= 10000) return price.toFixed(0);
  if (price >= 1000) return price.toFixed(2);
  if (price >= 1) return price.toFixed(4);
  if (price >= 0.0001) return price.toFixed(6);
  return price.toExponential(2);
};

/**
 * Calculate size (base token amount) from liquidity and price
 * @param liquidity - Liquidity in quote currency
 * @param price - Price per base token
 * @returns Size in base token units
 */
const calculateSize = (liquidity: number, price: number): number => {
  if (!price || price === 0) return 0;
  return liquidity / price;
};

// ORDERBOOK TABLE COMPONENT

interface OrderBookTableProps {
  /** Bid (buy) side price levels */
  bids: PriceLevel[];
  /** Ask (sell) side price levels */
  asks: PriceLevel[];
  /** Current mid-market price */
  currentPrice: number;
  /** Base token symbol (e.g., "ETH") */
  baseSymbol: string;
  /** Quote token symbol (e.g., "USDC") */
  quoteSymbol: string;
  /** Maximum rows to display per side */
  maxRows?: number;
}

/**
 * HyperLiquid-style orderbook table with depth visualization
 * 
 * @description
 * Displays bids and asks with:
 * - Price, size, and cumulative total columns
 * - Background depth bars showing relative liquidity
 * - Spread indicator between best bid/ask
 */
const OrderBookTable: React.FC<OrderBookTableProps> = ({
  bids,
  asks,
  currentPrice,
  baseSymbol,
  quoteSymbol,
  maxRows = 15,
}) => {
  // Calculate max cumulative for depth bar scaling
  const maxBidCum = bids.length > 0 ? bids[Math.min(maxRows - 1, bids.length - 1)]?.cumulative || 0 : 0;
  const maxAskCum = asks.length > 0 ? asks[Math.min(maxRows - 1, asks.length - 1)]?.cumulative || 0 : 0;
  const maxCum = Math.max(maxBidCum, maxAskCum) || 1;

  const displayBids = bids.slice(0, maxRows);
  const displayAsks = asks.slice(0, maxRows);

  // Calculate spread
  const bestBid = displayBids[0]?.price || 0;
  const bestAsk = displayAsks[0]?.price || 0;
  const spreadPercent = bestBid && bestAsk 
    ? ((bestAsk - bestBid) / currentPrice * 100).toFixed(3)
    : '0.000';

  return (
    <div className="ob-table-container">
      {/* Header */}
      <div className="ob-header">
        <span className="ob-header-cell">Price ({quoteSymbol})</span>
        <span className="ob-header-cell ob-header-cell--right">Size ({baseSymbol})</span>
        <span className="ob-header-cell ob-header-cell--right">Total ({quoteSymbol})</span>
      </div>

      {/* Asks (reversed so lowest price is at bottom, closest to spread) */}
      <div className="ob-asks">
        {[...displayAsks].reverse().map((level, idx) => {
          const size = calculateSize(level.liquidity, level.price);
          return (
            <div key={`ask-${idx}`} className="ob-row ob-row--ask">
              <div
                className="ob-depth-bar ob-depth-bar--ask"
                style={{ width: `${Math.min((level.cumulative / maxCum) * 100, 100)}%` }}
              />
              <span className="ob-cell ob-cell--price ob-cell--ask">
                {formatPrice(level.price)}
              </span>
              <span className="ob-cell ob-cell--right">
                {formatNumber(size, 4)}
              </span>
              <span className="ob-cell ob-cell--right">
                {formatNumber(level.cumulative)}
              </span>
            </div>
          );
        })}
      </div>

      {/* Spread / Current Price indicator */}
      <div className="ob-spread">
        <div className="ob-spread-price">
          <span className="ob-spread-label">Mid Price</span>
          <span className="ob-spread-value">{formatPrice(currentPrice)}</span>
        </div>
        <div className="ob-spread-info">
          <span>Spread: </span>
          <span className="ob-spread-pct">{spreadPercent}%</span>
        </div>
      </div>

      {/* Bids */}
      <div className="ob-bids">
        {displayBids.map((level, idx) => {
          const size = calculateSize(level.liquidity, level.price);
          return (
            <div key={`bid-${idx}`} className="ob-row ob-row--bid">
              <div
                className="ob-depth-bar ob-depth-bar--bid"
                style={{ width: `${Math.min((level.cumulative / maxCum) * 100, 100)}%` }}
              />
              <span className="ob-cell ob-cell--price ob-cell--bid">
                {formatPrice(level.price)}
              </span>
              <span className="ob-cell ob-cell--right">
                {formatNumber(size, 4)}
              </span>
              <span className="ob-cell ob-cell--right">
                {formatNumber(level.cumulative)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// DEPTH CHART COMPONENT

interface DepthChartProps {
  /** Bid price levels */
  bids: PriceLevel[];
  /** Ask price levels */
  asks: PriceLevel[];
  /** Current price for center line */
  currentPrice: number;
  /** Chart height in pixels */
  height?: number;
}

/**
 * SVG depth chart showing cumulative liquidity
 * 
 * @description
 * Renders a mountain-style depth chart with:
 * - Green fill for bid side (left of center)
 * - Red fill for ask side (right of center)
 * - Y-axis labels for cumulative liquidity
 */
const DepthChart: React.FC<DepthChartProps> = ({
  bids,
  asks,
  currentPrice,
  height = 200,
}) => {
  const chartData = useMemo(() => {
    if (bids.length === 0 && asks.length === 0) {
      return { bidPoints: [], askPoints: [], maxCum: 1, minPrice: 0, maxPrice: 0 };
    }

    const maxBidCum = bids.length > 0 ? bids[bids.length - 1]?.cumulative || 0 : 0;
    const maxAskCum = asks.length > 0 ? asks[asks.length - 1]?.cumulative || 0 : 0;
    const maxCum = Math.max(maxBidCum, maxAskCum) || 1;

    const minPrice = bids.length > 0 ? bids[bids.length - 1]?.price || currentPrice * 0.9 : currentPrice * 0.9;
    const maxPrice = asks.length > 0 ? asks[asks.length - 1]?.price || currentPrice * 1.1 : currentPrice * 1.1;

    // Calculate bid points (price decreasing from current)
    const bidPoints = bids.map(b => ({
      x: ((b.price - minPrice) / (currentPrice - minPrice || 1)) * 50,
      y: (1 - b.cumulative / maxCum) * height,
    }));

    // Calculate ask points (price increasing from current)
    const askPoints = asks.map(a => ({
      x: 50 + ((a.price - currentPrice) / (maxPrice - currentPrice || 1)) * 50,
      y: (1 - a.cumulative / maxCum) * height,
    }));

    return { bidPoints, askPoints, maxCum, minPrice, maxPrice };
  }, [bids, asks, currentPrice, height]);

  const { bidPoints, askPoints, maxCum } = chartData;

  // Build SVG paths
  const bidPath = bidPoints.length > 0
    ? `M ${bidPoints[0].x} ${height} ` +
      bidPoints.map(p => `L ${p.x} ${p.y}`).join(' ') +
      ` L ${bidPoints[bidPoints.length - 1].x} ${height} Z`
    : '';

  const askPath = askPoints.length > 0
    ? `M 50 ${height} ` +
      askPoints.map(p => `L ${p.x} ${p.y}`).join(' ') +
      ` L ${askPoints[askPoints.length - 1].x} ${height} Z`
    : '';

  return (
    <div className="depth-chart">
      <svg 
        width="100%" 
        height={height} 
        viewBox={`0 0 100 ${height}`} 
        preserveAspectRatio="none"
        role="img"
        aria-label="Depth chart showing cumulative liquidity"
      >
        {/* Center line at current price */}
        <line 
          x1="50" y1="0" 
          x2="50" y2={height} 
          stroke="rgba(255,255,255,0.1)" 
          strokeDasharray="2,2" 
        />
        
        {/* Bid area (green) */}
        {bidPath && (
          <path 
            d={bidPath} 
            fill="rgba(34, 197, 94, 0.3)" 
            stroke="#22C55E" 
            strokeWidth="1.5" 
          />
        )}
        
        {/* Ask area (red) */}
        {askPath && (
          <path 
            d={askPath} 
            fill="rgba(239, 68, 68, 0.3)" 
            stroke="#EF4444" 
            strokeWidth="1.5" 
          />
        )}
      </svg>

      {/* Y-axis labels */}
      <div className="depth-chart-labels">
        <span>{formatNumber(maxCum)}</span>
        <span>{formatNumber(maxCum / 2)}</span>
        <span>0</span>
      </div>
    </div>
  );
};

// MAIN PAGE COMPONENT

/**
 * Props for MarketDepthPage component
 */
export interface MarketDepthPageProps {
  /** PoolDepthReader contract address */
  contractAddress?: string;
  /** RPC endpoint URL */
  rpcUrl?: string;
  /** Additional CSS class names */
  className?: string;
  /** Initial base token key from DEFAULT_TOKENS */
  initialBaseToken?: keyof typeof DEFAULT_TOKENS;
  /** Initial quote token key from DEFAULT_TOKENS */
  initialQuoteToken?: keyof typeof DEFAULT_TOKENS;
}

/**
 * Complete market depth page with orderbook and depth chart
 * 
 * @description
 * Full-featured orderbook visualization including:
 * - Token pair selector with swap button
 * - Configurable refresh intervals (15s default)
 * - Settings panel for depth levels
 * - RPC cost estimation display
 * - Mock mode indicator
 * - Error handling with retry
 * 
 * @example
 * ```tsx
 * <MarketDepthPage 
 *   contractAddress={process.env.REACT_APP_DEPTH_READER_ADDRESS}
 *   rpcUrl={process.env.REACT_APP_RPC_URL}
 *   initialBaseToken="weth"
 *   initialQuoteToken="usdc"
 * />
 * ```
 */
export const MarketDepthPage: React.FC<MarketDepthPageProps> = ({
  contractAddress,
  rpcUrl,
  className,
  initialBaseToken = 'weth',
  initialQuoteToken = 'usdc',
}) => {
  // State
  const [baseToken, setBaseToken] = useState<TokenInfo>(DEFAULT_TOKENS[initialBaseToken]);
  const [quoteToken, setQuoteToken] = useState<TokenInfo>(DEFAULT_TOKENS[initialQuoteToken]);
  const [pollInterval, setPollInterval] = useState(15000); // 15 seconds default
  const [numLevels, setNumLevels] = useState(20);
  const [showSettings, setShowSettings] = useState(false);

  // Fetch depth data with proper token info for decimal handling
  const { depth, loading, error, lastUpdated, refetch, isMockMode } = useDepth({
    token0: baseToken.address,
    token1: quoteToken.address,
    poolType: 'AGGREGATED',
    numLevels,
    pollInterval,
    enabled: true,
    contractAddress,
    rpcUrl,
    baseToken,
    quoteToken,
  });

  // Calculate polling costs for info display
  const pollingCosts = useMemo(
    () => calculatePollingCosts(numLevels, pollInterval / 1000),
    [numLevels, pollInterval]
  );

  // Token swap handler
  const handleSwapTokens = useCallback(() => {
    setBaseToken(quoteToken);
    setQuoteToken(baseToken);
  }, [baseToken, quoteToken]);

  // Format last updated time
  const lastUpdatedStr = lastUpdated 
    ? new Date(lastUpdated).toLocaleTimeString() 
    : '--:--:--';

  return (
    <div className={`market-depth-page ${className || ''}`}>
      {/* Header */}
      <div className="mdp-header">
        <div className="mdp-title-section">
          <h1 className="mdp-title">Market Depth</h1>
          <div className="mdp-pair-selector">
            <button 
              className="mdp-token-btn" 
              title={`${baseToken.name} (${baseToken.decimals} decimals)`}
            >
              <span className="mdp-token-icon" style={{ color: baseToken.color }}>
                {baseToken.icon}
              </span>
              {baseToken.symbol}
            </button>
            <button 
              className="mdp-swap-btn" 
              onClick={handleSwapTokens} 
              title="Swap tokens"
              aria-label="Swap base and quote tokens"
            >
              ⇄
            </button>
            <button 
              className="mdp-token-btn" 
              title={`${quoteToken.name} (${quoteToken.decimals} decimals)`}
            >
              <span className="mdp-token-icon" style={{ color: quoteToken.color }}>
                {quoteToken.icon}
              </span>
              {quoteToken.symbol}
            </button>
          </div>
        </div>

        <div className="mdp-controls">
          {isMockMode && (
            <span 
              className="mdp-mock-badge" 
              title="Using mock data - deploy PoolDepthReader for live data"
            >
              MOCK
            </span>
          )}
          <button
            className="mdp-refresh-btn"
            onClick={refetch}
            disabled={loading}
            title="Refresh depth data"
            aria-label={loading ? 'Loading...' : 'Refresh'}
          >
            {loading ? '↻' : '↺'}
          </button>
          <button
            className={`mdp-settings-btn ${showSettings ? 'mdp-settings-btn--active' : ''}`}
            onClick={() => setShowSettings(!showSettings)}
            title="Settings"
            aria-label="Toggle settings panel"
            aria-expanded={showSettings}
          >
            ⚙
          </button>
        </div>
      </div>

      {/* Settings Panel */}
      {showSettings && (
        <div className="mdp-settings" role="region" aria-label="Depth settings">
          <div className="mdp-settings-row">
            <label htmlFor="poll-interval">Refresh Interval:</label>
            <div className="mdp-interval-btns" role="radiogroup" aria-label="Refresh interval">
              {POLL_INTERVALS.map(({ label, value }) => (
                <button
                  key={value}
                  className={`mdp-interval-btn ${pollInterval === value ? 'mdp-interval-btn--active' : ''}`}
                  onClick={() => setPollInterval(value)}
                  role="radio"
                  aria-checked={pollInterval === value}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
          <div className="mdp-settings-row">
            <label htmlFor="depth-levels">Depth Levels: {numLevels}</label>
            <input
              id="depth-levels"
              type="range"
              min="10"
              max="50"
              value={numLevels}
              onChange={(e) => setNumLevels(parseInt(e.target.value))}
              aria-valuemin={10}
              aria-valuemax={50}
              aria-valuenow={numLevels}
            />
          </div>
          <div className="mdp-settings-info">
            <span>Calls/day: {pollingCosts.callsPerDay.toLocaleString()}</span>
            <span>•</span>
            <span title={pollingCosts.note}>VIEW calls = FREE</span>
          </div>
        </div>
      )}

      {/* Error display */}
      {error && (
        <div className="mdp-error" role="alert">
          <span>⚠️ {error}</span>
          <button onClick={refetch}>Retry</button>
        </div>
      )}

      {/* Main content */}
      <div className="mdp-content">
        {/* Depth Chart */}
        <div className="mdp-chart-section">
          <div className="mdp-section-header">
            <h2>Aggregated Depth</h2>
            <span className="mdp-last-updated">
              Updated: {lastUpdatedStr}
            </span>
          </div>
          {depth ? (
            <DepthChart
              bids={depth.bids}
              asks={depth.asks}
              currentPrice={depth.currentPrice}
              height={200}
            />
          ) : (
            <div className="mdp-loading-chart" aria-busy="true">
              Loading depth chart...
            </div>
          )}
        </div>

        {/* Orderbook */}
        <div className="mdp-orderbook-section">
          <div className="mdp-section-header">
            <h2>Order Book</h2>
            {depth && (
              <span className="mdp-current-price">
                {formatPrice(depth.currentPrice)} {quoteToken.symbol}
              </span>
            )}
          </div>
          {depth ? (
            <OrderBookTable
              bids={depth.bids}
              asks={depth.asks}
              currentPrice={depth.currentPrice}
              baseSymbol={baseToken.symbol}
              quoteSymbol={quoteToken.symbol}
              maxRows={15}
            />
          ) : (
            <div className="mdp-loading" aria-busy="true">
              Loading orderbook...
            </div>
          )}
        </div>
      </div>

      {/* Stats footer */}
      {depth && (
        <div className="mdp-stats">
          <div className="mdp-stat">
            <span className="mdp-stat-label">Total Bid Liquidity</span>
            <span className="mdp-stat-value mdp-stat-value--bid">
              ${formatNumber(depth.bids[depth.bids.length - 1]?.cumulative || 0)}
            </span>
          </div>
          <div className="mdp-stat">
            <span className="mdp-stat-label">Total Ask Liquidity</span>
            <span className="mdp-stat-value mdp-stat-value--ask">
              ${formatNumber(depth.asks[depth.asks.length - 1]?.cumulative || 0)}
            </span>
          </div>
          <div className="mdp-stat">
            <span className="mdp-stat-label">Data Source</span>
            <span className="mdp-stat-value">
              {isMockMode ? 'Mock Data' : 'PoolDepthReader'}
            </span>
          </div>
          <div className="mdp-stat">
            <span className="mdp-stat-label">Token Decimals</span>
            <span className="mdp-stat-value">
              {baseToken.symbol}:{baseToken.decimals} / {quoteToken.symbol}:{quoteToken.decimals}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default MarketDepthPage;
