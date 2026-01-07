/** Module */

import { IS_TESTNET } from './contracts';

export const TESTNET_TOKENS = {
  // Native & Wrapped Native
  ETH: {
    address: '0x0000000000000000000000000000000000000000', // Native ETH (use zero address)
    symbol: 'ETH',
    name: 'Ethereum',
    decimals: 18,
    icon: 'Ξ',
    color: '#627EEA',
    isNative: true,
  },
  WETH: {
    address: '0x4200000000000000000000000000000000000006', // Base Sepolia WETH
    symbol: 'WETH',
    name: 'Wrapped Ether',
    decimals: 18,
    icon: 'Ξ',
    color: '#627EEA',
  },

        USDC: {
    address: '0x0000000000000000000000000000000000000000', // PATCH: Deploy MockUSDC
    symbol: 'USDC',
    name: 'USD Coin',
    decimals: 6,
    icon: '$',
    color: '#2775CA',
  },
  USDT: {
    address: '0x0000000000000000000000000000000000000000', // PATCH: Deploy MockUSDT
    symbol: 'USDT',
    name: 'Tether',
    decimals: 6,
    icon: '₮',
    color: '#26A17B',
  },
  DAI: {
    address: '0x0000000000000000000000000000000000000000', // PATCH: Deploy MockDAI
    symbol: 'DAI',
    name: 'Dai',
    decimals: 18,
    icon: '◈',
    color: '#F5AC37',
  },

        aUSDC: {
    address: '0x0000000000000000000000000000000000000000', // PATCH: Deploy mock aUSDC vault
    symbol: 'aUSDC',
    name: 'Aave USDC',
    decimals: 6,
    icon: '$',
    color: '#B6509E',
    isVault: true,
    underlying: 'USDC',
    protocol: 'Aave',
  },
  stETH: {
    address: '0x0000000000000000000000000000000000000000', // PATCH: Deploy mock stETH vault
    symbol: 'stETH',
    name: 'Lido Staked ETH',
    decimals: 18,
    icon: 'Ξ',
    color: '#00A3FF',
    isVault: true,
    underlying: 'WETH',
    protocol: 'Lido',
  },
  sDAI: {
    address: '0x0000000000000000000000000000000000000000', // PATCH: Deploy mock sDAI vault
    symbol: 'sDAI',
    name: 'Spark DAI',
    decimals: 18,
    icon: '◈',
    color: '#F5AC37',
    isVault: true,
    underlying: 'DAI',
    protocol: 'Spark',
  },

        IGNI: {
    address: '0x0000000000000000000000000000000000000000', // PATCH: Deploy IGNI token
    symbol: 'IGNI',
    name: 'IGNIS Token',
    decimals: 18,
    icon: '🔥',
    color: '#F5B041',
    isProtocolToken: true,
  },
};

export const MAINNET_TOKENS = {
  // Native & Wrapped Native
  ETH: {
    address: '0x0000000000000000000000000000000000000000',
    symbol: 'ETH',
    name: 'Ethereum',
    decimals: 18,
    icon: 'Ξ',
    color: '#627EEA',
    isNative: true,
  },
  WETH: {
    address: '0x4200000000000000000000000000000000000006',
    symbol: 'WETH',
    name: 'Wrapped Ether',
    decimals: 18,
    icon: 'Ξ',
    color: '#627EEA',
  },

  // Stablecoins (Real Base mainnet addresses)
  USDC: {
    address: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
    symbol: 'USDC',
    name: 'USD Coin',
    decimals: 6,
    icon: '$',
    color: '#2775CA',
  },
  USDbC: {
    address: '0xd9aAEc86B65D86f6A7B5B1b0c42FFA531710b6CA',
    symbol: 'USDbC',
    name: 'USD Base Coin',
    decimals: 6,
    icon: '$',
    color: '#2775CA',
  },
  DAI: {
    address: '0x50c5725949A6F0c72E6C4a641F24049A917DB0Cb',
    symbol: 'DAI',
    name: 'Dai',
    decimals: 18,
    icon: '◈',
    color: '#F5AC37',
  },

  // Yield-bearing tokens (Real addresses)
  cbETH: {
    address: '0x2Ae3F1Ec7F1F5012CFEab0185bfc7aa3cf0DEc22',
    symbol: 'cbETH',
    name: 'Coinbase Staked ETH',
    decimals: 18,
    icon: 'Ξ',
    color: '#0052FF',
    isVault: true,
    underlying: 'WETH',
    protocol: 'Coinbase',
  },
  wstETH: {
    address: '0xc1CBa3fCea344f92D9239c08C0568f6F2F0ee452',
    symbol: 'wstETH',
    name: 'Wrapped stETH',
    decimals: 18,
    icon: 'Ξ',
    color: '#00A3FF',
    isVault: true,
    underlying: 'WETH',
    protocol: 'Lido',
  },

        IGNI: {
    address: '0x0000000000000000000000000000000000000000', // PATCH: Mainnet IGNI
    symbol: 'IGNI',
    name: 'IGNIS Token',
    decimals: 18,
    icon: '🔥',
    color: '#F5B041',
    isProtocolToken: true,
  },
};

export const DEMO_TOKENS = [
  { symbol: 'ETH', name: 'Ethereum', icon: 'Ξ', color: '#627EEA', balance: 2.458, price: 3850 },
  { symbol: 'USDC', name: 'USD Coin', icon: '$', color: '#2775CA', balance: 5420.50, price: 1 },
  { symbol: 'USDT', name: 'Tether', icon: '₮', color: '#26A17B', balance: 3200, price: 1 },
  { symbol: 'WBTC', name: 'Wrapped Bitcoin', icon: '₿', color: '#F7931A', balance: 0.0842, price: 105000 },
  { symbol: 'ARB', name: 'Arbitrum', icon: 'A', color: '#28A0F0', balance: 1250, price: 1.85 },
  { symbol: 'DAI', name: 'Dai', icon: '◈', color: '#F5AC37', balance: 2800, price: 1 },
  { symbol: 'aUSDC', name: 'Aave USDC', icon: '$', color: '#B6509E', balance: 10000, price: 1.02, protocol: 'Aave', underlying: 'USDC' },
  { symbol: 'fETH', name: 'Fluid ETH', icon: 'Ξ', color: '#00D395', balance: 1.5, price: 3890, protocol: 'Fluid', underlying: 'ETH' },
  { symbol: 'stETH', name: 'Lido Staked ETH', icon: 'Ξ', color: '#00A3FF', balance: 0.8, price: 3845, protocol: 'Lido', underlying: 'ETH' },
  { symbol: 'sDAI', name: 'Spark DAI', icon: '◈', color: '#F5AC37', balance: 5000, price: 1.05, protocol: 'Spark', underlying: 'DAI' },
  { symbol: 'mUSDC', name: 'Morpho USDC', icon: '$', color: '#2470FF', balance: 8000, price: 1.01, protocol: 'Morpho', underlying: 'USDC' },
  { symbol: 'eETH', name: 'Euler ETH', icon: 'Ξ', color: '#E4761B', balance: 1.2, price: 3860, protocol: 'Euler', underlying: 'ETH' },
  { symbol: 'yoETH', name: 'Yo ETH', icon: 'Ξ', color: '#9945FF', balance: 0.5, price: 3870, protocol: 'Yo', underlying: 'ETH' },
  { symbol: 'cUSDT', name: 'Compound USDT', icon: '₮', color: '#00D395', balance: 4000, price: 1.01, protocol: 'Compound', underlying: 'USDT' },
  { symbol: 'rETH', name: 'Rocket Pool ETH', icon: 'Ξ', color: '#FF6E4A', balance: 0.65, price: 4120, protocol: 'Rocket Pool', underlying: 'ETH' },
  { symbol: 'cbETH', name: 'Coinbase Staked ETH', icon: 'Ξ', color: '#0052FF', balance: 0.42, price: 4050, protocol: 'Coinbase', underlying: 'ETH' },
  { symbol: 'wstETH', name: 'Wrapped stETH', icon: 'Ξ', color: '#00A3FF', balance: 0.35, price: 4480, protocol: 'Lido', underlying: 'stETH' },
  { symbol: 'weETH', name: 'Wrapped eETH', icon: 'Ξ', color: '#7C3AED', balance: 0.28, price: 4020, protocol: 'EtherFi', underlying: 'ETH' },
  { symbol: 'apxETH', name: 'Pirex ETH', icon: 'Ξ', color: '#DC2626', balance: 0.15, price: 3980, protocol: 'Dinero', underlying: 'ETH' },
];

/**
 * Get tokens for current network mode
 */
export function getTokens() {
  return IS_TESTNET ? TESTNET_TOKENS : MAINNET_TOKENS;
}

/**
 * Get token by symbol
 */
export function getToken(symbol) {
  const tokens = getTokens();
  return tokens[symbol] || null;
}

/**
 * Get token by address
 */
export function getTokenByAddress(address) {
  const tokens = getTokens();
  const normalizedAddress = address.toLowerCase();
  
  for (const token of Object.values(tokens)) {
    if (token.address.toLowerCase() === normalizedAddress) {
      return token;
    }
  }
  return null;
}

/**
 * Check if a token address is deployed (not placeholder)
 */
export function isTokenDeployed(symbol) {
  const token = getToken(symbol);
  if (!token) return false;
  if (token.isNative) return true; // Native ETH is always "deployed"
  return token.address !== '0x0000000000000000000000000000000000000000';
}

/**
 * Get all vault tokens
 */
export function getVaultTokens() {
  const tokens = getTokens();
  return Object.values(tokens).filter(t => t.isVault);
}

/**
 * Get all base tokens (non-vault)
 */
export function getBaseTokens() {
  const tokens = getTokens();
  return Object.values(tokens).filter(t => !t.isVault && !t.isProtocolToken);
}
