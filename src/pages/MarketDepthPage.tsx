/**
 * Market Depth / Order Book Page
 * Shows full order book without depth chart
 */

import React, { useState, useMemo, useCallback } from 'react';
import { useDepth, PriceLevel, calculatePollingCosts, TokenInfo } from '../hooks/useDepth';
import '../styles/MarketDepthPage.css';

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

const POLL_INTERVALS = [
  { label: '15s', value: 15000 },
  { label: '30s', value: 30000 },
  { label: '1m', value: 60000 },
  { label: '5m', value: 300000 },
] as const;

const formatNumber = (num: number, decimals = 2): string => {
  if (!isFinite(num) || isNaN(num)) return '0.00';
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(decimals)}M`;
  if (num >= 1_000) return `${(num / 1_000).toFixed(decimals)}K`;
  return num.toFixed(decimals);
};

const formatPrice = (price: number): string => {
  if (!isFinite(price) || isNaN(price)) return '0.00';
  if (price >= 10000) return price.toFixed(0);
  if (price >= 1000) return price.toFixed(2);
  if (price >= 1) return price.toFixed(4);
  if (price >= 0.0001) return price.toFixed(6);
  return price.toExponential(2);
};

const calculateSize = (liquidity: number, price: number): number => {
  if (!price || price === 0) return 0;
  return liquidity / price;
};

interface OrderBookTableProps {
  bids: PriceLevel[];
  asks: PriceLevel[];
  currentPrice: number;
  baseSymbol: string;
  quoteSymbol: string;
  maxRows?: number;
}

const OrderBookTable: React.FC<OrderBookTableProps> = ({
  bids,
  asks,
  currentPrice,
  baseSymbol,
  quoteSymbol,
  maxRows = 20,
}) => {
  const maxBidCum = bids.length > 0 ? bids[Math.min(maxRows - 1, bids.length - 1)]?.cumulative || 0 : 0;
  const maxAskCum = asks.length > 0 ? asks[Math.min(maxRows - 1, asks.length - 1)]?.cumulative || 0 : 0;
  const maxCum = Math.max(maxBidCum, maxAskCum) || 1;

  const displayBids = bids.slice(0, maxRows);
  const displayAsks = asks.slice(0, maxRows);

  const bestBid = displayBids[0]?.price || 0;
  const bestAsk = displayAsks[0]?.price || 0;
  const spreadPercent = bestBid && bestAsk 
    ? ((bestAsk - bestBid) / currentPrice * 100).toFixed(3)
    : '0.000';

  return (
    <div className="ob-table-container">
      <div className="ob-header">
        <span className="ob-header-cell">Price ({quoteSymbol})</span>
        <span className="ob-header-cell ob-header-cell--right">Size ({baseSymbol})</span>
        <span className="ob-header-cell ob-header-cell--right">Total ({quoteSymbol})</span>
      </div>

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

export interface MarketDepthPageProps {
  contractAddress?: string;
  rpcUrl?: string;
  className?: string;
  initialBaseToken?: keyof typeof DEFAULT_TOKENS;
  initialQuoteToken?: keyof typeof DEFAULT_TOKENS;
}

export const MarketDepthPage: React.FC<MarketDepthPageProps> = ({
  contractAddress,
  rpcUrl,
  className,
  initialBaseToken = 'weth',
  initialQuoteToken = 'usdc',
}) => {
  const [baseToken, setBaseToken] = useState<TokenInfo>(DEFAULT_TOKENS[initialBaseToken]);
  const [quoteToken, setQuoteToken] = useState<TokenInfo>(DEFAULT_TOKENS[initialQuoteToken]);
  const [pollInterval, setPollInterval] = useState(15000);
  const [numLevels, setNumLevels] = useState(25);
  const [showSettings, setShowSettings] = useState(false);

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

  const pollingCosts = useMemo(
    () => calculatePollingCosts(numLevels, pollInterval / 1000),
    [numLevels, pollInterval]
  );

  const handleSwapTokens = useCallback(() => {
    setBaseToken(quoteToken);
    setQuoteToken(baseToken);
  }, [baseToken, quoteToken]);

  const tokenOptions = Object.entries(DEFAULT_TOKENS);

  const lastUpdatedStr = lastUpdated 
    ? new Date(lastUpdated).toLocaleTimeString() 
    : '--:--:--';

  return (
    <div className={`market-depth-page ${className || ''}`}>
      <div className="mdp-header">
        <div className="mdp-title-section">
          <h1 className="mdp-title">Order Book</h1>
          <div className="mdp-pair-selector">
            <select 
              className="mdp-token-select"
              value={Object.keys(DEFAULT_TOKENS).find(k => DEFAULT_TOKENS[k].symbol === baseToken.symbol)}
              onChange={(e) => setBaseToken(DEFAULT_TOKENS[e.target.value])}
              title="Select base token"
            >
              {tokenOptions.map(([key, token]) => (
                <option key={key} value={key} disabled={token.symbol === quoteToken.symbol}>
                  {token.icon} {token.symbol}
                </option>
              ))}
            </select>
            <button 
              className="mdp-swap-btn" 
              onClick={handleSwapTokens} 
              title="Swap tokens"
            >
              ⇄
            </button>
            <select 
              className="mdp-token-select"
              value={Object.keys(DEFAULT_TOKENS).find(k => DEFAULT_TOKENS[k].symbol === quoteToken.symbol)}
              onChange={(e) => setQuoteToken(DEFAULT_TOKENS[e.target.value])}
              title="Select quote token"
            >
              {tokenOptions.map(([key, token]) => (
                <option key={key} value={key} disabled={token.symbol === baseToken.symbol}>
                  {token.icon} {token.symbol}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="mdp-controls">
          {isMockMode && (
            <span className="mdp-mock-badge" title="Demo mode">
              DEMO
            </span>
          )}
          <span className="mdp-last-updated">
            Updated: {lastUpdatedStr}
          </span>
          <button
            className="mdp-refresh-btn"
            onClick={refetch}
            disabled={loading}
            title="Refresh"
          >
            {loading ? '↻' : '↺'}
          </button>
          <button
            className={`mdp-settings-btn ${showSettings ? 'mdp-settings-btn--active' : ''}`}
            onClick={() => setShowSettings(!showSettings)}
            title="Settings"
          >
            ⚙
          </button>
        </div>
      </div>

      {showSettings && (
        <div className="mdp-settings">
          <div className="mdp-settings-row">
            <label>Refresh Interval:</label>
            <div className="mdp-interval-btns">
              {POLL_INTERVALS.map(({ label, value }) => (
                <button
                  key={value}
                  className={`mdp-interval-btn ${pollInterval === value ? 'mdp-interval-btn--active' : ''}`}
                  onClick={() => setPollInterval(value)}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
          <div className="mdp-settings-row">
            <label>Depth Levels: {numLevels}</label>
            <input
              type="range"
              min="10"
              max="50"
              value={numLevels}
              onChange={(e) => setNumLevels(parseInt(e.target.value))}
            />
          </div>
          <div className="mdp-settings-info">
            <span>Calls/day: {pollingCosts.callsPerDay.toLocaleString()}</span>
            <span>•</span>
            <span>VIEW calls = FREE</span>
          </div>
        </div>
      )}

      {error && (
        <div className="mdp-error">
          <span>⚠️ {error}</span>
          <button onClick={refetch}>Retry</button>
        </div>
      )}

      <div className="mdp-content mdp-content--full">
        <div className="mdp-orderbook-section mdp-orderbook-section--full">
          <div className="mdp-section-header">
            <h2>{baseToken.symbol} / {quoteToken.symbol}</h2>
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
              maxRows={numLevels}
            />
          ) : (
            <div className="mdp-loading">
              Loading orderbook...
            </div>
          )}
        </div>
      </div>

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
            <span className="mdp-stat-label">Bid/Ask Ratio</span>
            <span className="mdp-stat-value">
              {((depth.bids[depth.bids.length - 1]?.cumulative || 0) / 
                (depth.asks[depth.asks.length - 1]?.cumulative || 1)).toFixed(2)}
            </span>
          </div>
          <div className="mdp-stat">
            <span className="mdp-stat-label">Best Spread</span>
            <span className="mdp-stat-value">
              {depth.bids[0] && depth.asks[0] 
                ? ((depth.asks[0].price - depth.bids[0].price) / depth.currentPrice * 100).toFixed(3) + '%'
                : '--'}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default MarketDepthPage;
