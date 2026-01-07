import type { Token } from '../types';

export const TOKENS: Token[] = [
    { symbol: 'ETH', name: 'Ethereum', decimals: 18, price: 2450.00, balance: 2.5, icon: 'Ξ', color: '#627EEA', isNative: true },
    { symbol: 'WETH', name: 'Wrapped Ethereum', decimals: 18, price: 2450.00, balance: 1.2, icon: 'W', color: '#627EEA' },
    { symbol: 'USDC', name: 'USD Coin', decimals: 6, price: 1.00, balance: 5000, icon: '$', color: '#2775CA' },
    { symbol: 'USDT', name: 'Tether USD', decimals: 6, price: 1.00, balance: 2500, icon: '₮', color: '#26A17B' },
    { symbol: 'DAI', name: 'Dai Stablecoin', decimals: 18, price: 1.00, balance: 1500, icon: '◈', color: '#F5AC37' },
    { symbol: 'IGNIS', name: 'Ignis Token', decimals: 18, price: 0.85, balance: 10000, icon: '🔥', color: '#F5B041' },
    
    // Yield-bearing tokens
    { symbol: 'aETH', name: 'Aave ETH', decimals: 18, price: 2475.00, balance: 0.8, icon: 'a', color: '#B6509E', isYieldBearing: true, protocol: 'Aave', underlyingToken: 'ETH', apy: 2.8 },
    { symbol: 'aUSDC', name: 'Aave USDC', decimals: 6, price: 1.00, balance: 3000, icon: 'a', color: '#B6509E', isYieldBearing: true, protocol: 'Aave', underlyingToken: 'USDC', apy: 4.2 },
    { symbol: 'cETH', name: 'Compound ETH', decimals: 8, price: 49.50, balance: 45, icon: 'c', color: '#00D395', isYieldBearing: true, protocol: 'Compound', underlyingToken: 'ETH', apy: 2.1 },
    { symbol: 'stETH', name: 'Lido Staked ETH', decimals: 18, price: 2445.00, balance: 1.5, icon: 'L', color: '#00A3FF', isYieldBearing: true, protocol: 'Lido', underlyingToken: 'ETH', apy: 3.8 },
    { symbol: 'rETH', name: 'Rocket Pool ETH', decimals: 18, price: 2520.00, balance: 0.5, icon: 'R', color: '#F58B00', isYieldBearing: true, protocol: 'Rocket Pool', underlyingToken: 'ETH', apy: 3.2 },
    { symbol: 'sDAI', name: 'Savings DAI', decimals: 18, price: 1.05, balance: 2000, icon: 's', color: '#F5AC37', isYieldBearing: true, protocol: 'Spark', underlyingToken: 'DAI', apy: 5.0 },
    { symbol: 'yvUSDC', name: 'Yearn USDC', decimals: 6, price: 1.02, balance: 1500, icon: 'y', color: '#0657F9', isYieldBearing: true, protocol: 'Yearn', underlyingToken: 'USDC', apy: 6.5 },
    { symbol: 'cbETH', name: 'Coinbase Staked ETH', decimals: 18, price: 2460.00, balance: 0.3, icon: 'C', color: '#0052FF', isYieldBearing: true, protocol: 'Coinbase', underlyingToken: 'ETH', apy: 3.5 },
];

export const getTokenBySymbol = (symbol: string): Token | undefined => {
    return TOKENS.find(t => t.symbol === symbol);
};

export const getYieldBearingTokens = (): Token[] => {
    return TOKENS.filter(t => t.isYieldBearing);
};

export const getBaseTokens = (): Token[] => {
    return TOKENS.filter(t => !t.isYieldBearing);
};
