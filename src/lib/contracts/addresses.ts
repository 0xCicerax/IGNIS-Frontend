/** Contract addresses */
import { Address } from 'viem';

// ─────────────────────────────────────────────────────────────────────────────────
// PLACEHOLDER ADDRESS
// ─────────────────────────────────────────────────────────────────────────────────

const PLACEHOLDER = '0x0000000000000000000000000000000000000000' as Address;

// ─────────────────────────────────────────────────────────────────────────────────
// CONTRACT ADDRESS INTERFACE
// ─────────────────────────────────────────────────────────────────────────────────

export interface ChainContracts {
  // Core Protocol
  gatewayRouter: Address;
  smartQuoter: Address;
  gateway4626Buffer: Address;
  gatewayRegistry: Address;
  tokenRegistry: Address;
  poolRegistry: Address;
  gatewayKeeper: Address;
  
  // Pool Managers (PancakeSwap V4)
  clPoolManager: Address;
  binPoolManager: Address;
  clQuoter: Address;
  binQuoter: Address;
  vault: Address; // PCS V4 singleton vault
  
  // Staking
  bufferStaker: Address;
  
  // Adapters
  vaultAdapter: Address;
  aggregatorAdapter: Address;
  
  // Tokens
  weth: Address;
  
  // Optional - MEV Bot (if deployed)
  backrunner?: Address;
  poolStateLens?: Address;
  profitDistributor?: Address;
}

export interface ChainConfig {
  chainId: number;
  name: string;
  shortName: string;
  rpcUrl: string;
  blockExplorer: string;
  contracts: ChainContracts;
  subgraphUrl: string;
  isTestnet: boolean;
}

// ─────────────────────────────────────────────────────────────────────────────────
// BASE MAINNET (Chain ID: 8453)
// ─────────────────────────────────────────────────────────────────────────────────

export const BASE_MAINNET: ChainConfig = {
  chainId: 8453,
  name: 'Base',
  shortName: 'base',
  rpcUrl: 'https://mainnet.base.org', // UPDATE: Use your own RPC for production
  blockExplorer: 'https://basescan.org',
  subgraphUrl: 'https://api.studio.thegraph.com/query/YOUR_ID/ignis-base/version/latest',
  isTestnet: false,
  contracts: {
    // ═══════════════════════════════════════════════════════════════════════════
    // UPDATE THESE ADDRESSES AFTER DEPLOYMENT
    // ═══════════════════════════════════════════════════════════════════════════
    
    // Core Protocol
    gatewayRouter: PLACEHOLDER,        // GatewayRouterV5
    smartQuoter: PLACEHOLDER,          // AureliaSmartQuoterV5
    gateway4626Buffer: PLACEHOLDER,    // Gateway4626Buffer
    gatewayRegistry: PLACEHOLDER,      // GatewayRegistry
    tokenRegistry: PLACEHOLDER,        // TokenRegistryV2
    poolRegistry: PLACEHOLDER,         // PoolRegistry
    gatewayKeeper: PLACEHOLDER,        // GatewayKeeper
    
    // Pool Managers (PancakeSwap V4 - get from PCS deployment)
    clPoolManager: PLACEHOLDER,
    binPoolManager: PLACEHOLDER,
    clQuoter: PLACEHOLDER,
    binQuoter: PLACEHOLDER,
    vault: PLACEHOLDER,
    
    // Staking
    bufferStaker: PLACEHOLDER,         // BufferStakerV2
    
    // Adapters
    vaultAdapter: PLACEHOLDER,         // AureliaVaultAdapter
    aggregatorAdapter: PLACEHOLDER,    // AureliaAggregatorAdapter
    
    // Tokens
    weth: '0x4200000000000000000000000000000000000006' as Address, // Base WETH
    
    // MEV Bot (optional)
    backrunner: undefined,
    poolStateLens: undefined,
    profitDistributor: undefined,
  },
};

// ─────────────────────────────────────────────────────────────────────────────────
// BASE SEPOLIA TESTNET (Chain ID: 84532)
// ─────────────────────────────────────────────────────────────────────────────────

export const BASE_SEPOLIA: ChainConfig = {
  chainId: 84532,
  name: 'Base Sepolia',
  shortName: 'base-sepolia',
  rpcUrl: 'https://sepolia.base.org',
  blockExplorer: 'https://sepolia.basescan.org',
  subgraphUrl: 'https://api.studio.thegraph.com/query/YOUR_ID/ignis-base-sepolia/version/latest',
  isTestnet: true,
  contracts: {
    // ═══════════════════════════════════════════════════════════════════════════
    // UPDATE THESE ADDRESSES AFTER TESTNET DEPLOYMENT
    // ═══════════════════════════════════════════════════════════════════════════
    
    gatewayRouter: PLACEHOLDER,
    smartQuoter: PLACEHOLDER,
    gateway4626Buffer: PLACEHOLDER,
    gatewayRegistry: PLACEHOLDER,
    tokenRegistry: PLACEHOLDER,
    poolRegistry: PLACEHOLDER,
    gatewayKeeper: PLACEHOLDER,
    clPoolManager: PLACEHOLDER,
    binPoolManager: PLACEHOLDER,
    clQuoter: PLACEHOLDER,
    binQuoter: PLACEHOLDER,
    vault: PLACEHOLDER,
    bufferStaker: PLACEHOLDER,
    vaultAdapter: PLACEHOLDER,
    aggregatorAdapter: PLACEHOLDER,
    weth: '0x4200000000000000000000000000000000000006' as Address,
  },
};

// ─────────────────────────────────────────────────────────────────────────────────
// BSC MAINNET (Chain ID: 56)
// ─────────────────────────────────────────────────────────────────────────────────

export const BSC_MAINNET: ChainConfig = {
  chainId: 56,
  name: 'BNB Smart Chain',
  shortName: 'bsc',
  rpcUrl: 'https://bsc-dataseed1.binance.org',
  blockExplorer: 'https://bscscan.com',
  subgraphUrl: 'https://api.studio.thegraph.com/query/YOUR_ID/ignis-bsc/version/latest',
  isTestnet: false,
  contracts: {
    gatewayRouter: PLACEHOLDER,
    smartQuoter: PLACEHOLDER,
    gateway4626Buffer: PLACEHOLDER,
    gatewayRegistry: PLACEHOLDER,
    tokenRegistry: PLACEHOLDER,
    poolRegistry: PLACEHOLDER,
    gatewayKeeper: PLACEHOLDER,
    clPoolManager: PLACEHOLDER,
    binPoolManager: PLACEHOLDER,
    clQuoter: PLACEHOLDER,
    binQuoter: PLACEHOLDER,
    vault: PLACEHOLDER,
    bufferStaker: PLACEHOLDER,
    vaultAdapter: PLACEHOLDER,
    aggregatorAdapter: PLACEHOLDER,
    weth: '0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c' as Address, // WBNB
  },
};

// ─────────────────────────────────────────────────────────────────────────────────
// BSC TESTNET (Chain ID: 97)
// ─────────────────────────────────────────────────────────────────────────────────

export const BSC_TESTNET: ChainConfig = {
  chainId: 97,
  name: 'BSC Testnet',
  shortName: 'bsc-testnet',
  rpcUrl: 'https://data-seed-prebsc-1-s1.binance.org:8545',
  blockExplorer: 'https://testnet.bscscan.com',
  subgraphUrl: 'https://api.studio.thegraph.com/query/YOUR_ID/ignis-bsc-testnet/version/latest',
  isTestnet: true,
  contracts: {
    gatewayRouter: PLACEHOLDER,
    smartQuoter: PLACEHOLDER,
    gateway4626Buffer: PLACEHOLDER,
    gatewayRegistry: PLACEHOLDER,
    tokenRegistry: PLACEHOLDER,
    poolRegistry: PLACEHOLDER,
    gatewayKeeper: PLACEHOLDER,
    clPoolManager: PLACEHOLDER,
    binPoolManager: PLACEHOLDER,
    clQuoter: PLACEHOLDER,
    binQuoter: PLACEHOLDER,
    vault: PLACEHOLDER,
    bufferStaker: PLACEHOLDER,
    vaultAdapter: PLACEHOLDER,
    aggregatorAdapter: PLACEHOLDER,
    weth: '0xae13d989daC2f0dEbFf460aC112a837C89BAa7cd' as Address, // WBNB testnet
  },
};

// ─────────────────────────────────────────────────────────────────────────────────
// CHAIN REGISTRY
// ─────────────────────────────────────────────────────────────────────────────────

export const CHAINS: Record<number, ChainConfig> = {
  [BASE_MAINNET.chainId]: BASE_MAINNET,
  [BASE_SEPOLIA.chainId]: BASE_SEPOLIA,
  [BSC_MAINNET.chainId]: BSC_MAINNET,
  [BSC_TESTNET.chainId]: BSC_TESTNET,
};

// ─────────────────────────────────────────────────────────────────────────────────
// SUPPORTED CHAINS
// ─────────────────────────────────────────────────────────────────────────────────

export const SUPPORTED_CHAIN_IDS = Object.keys(CHAINS).map(Number);

export const MAINNET_CHAIN_IDS = Object.values(CHAINS)
  .filter(c => !c.isTestnet)
  .map(c => c.chainId);

export const TESTNET_CHAIN_IDS = Object.values(CHAINS)
  .filter(c => c.isTestnet)
  .map(c => c.chainId);

// Default chain for development
export const DEFAULT_CHAIN_ID = BASE_SEPOLIA.chainId;

// ─────────────────────────────────────────────────────────────────────────────────
// HELPER FUNCTIONS
// ─────────────────────────────────────────────────────────────────────────────────

/**
 * Get chain config by chain ID
 */
export function getChainConfig(chainId: number): ChainConfig {
  const config = CHAINS[chainId];
  if (!config) {
    throw new Error(`Unsupported chain ID: ${chainId}`);
  }
  return config;
}

/**
 * Get contract address for a chain
 */
export function getContractAddress(
  chainId: number,
  contract: keyof ChainContracts
): Address {
  const config = getChainConfig(chainId);
  const address = config.contracts[contract];
  if (!address) {
    throw new Error(`Contract ${contract} not found for chain ${chainId}`);
  }
  return address;
}

/**
 * Check if contracts are configured (not placeholder addresses)
 */
export function isChainConfigured(chainId: number): boolean {
  try {
    const config = getChainConfig(chainId);
    return config.contracts.gatewayRouter !== PLACEHOLDER;
  } catch {
    return false;
  }
}

/**
 * Check if a specific contract is configured
 */
export function isContractConfigured(
  chainId: number,
  contract: keyof ChainContracts
): boolean {
  try {
    const address = getContractAddress(chainId, contract);
    return address !== PLACEHOLDER;
  } catch {
    return false;
  }
}

/**
 * Get block explorer URL for a transaction
 */
export function getTxUrl(chainId: number, txHash: string): string {
  const config = getChainConfig(chainId);
  return `${config.blockExplorer}/tx/${txHash}`;
}

/**
 * Get block explorer URL for an address
 */
export function getAddressUrl(chainId: number, address: string): string {
  const config = getChainConfig(chainId);
  return `${config.blockExplorer}/address/${address}`;
}

/**
 * Get block explorer URL for a token
 */
export function getTokenUrl(chainId: number, address: string): string {
  const config = getChainConfig(chainId);
  return `${config.blockExplorer}/token/${address}`;
}
