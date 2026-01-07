import { logger } from '../utils/logger';
/** Module */

export const IS_TESTNET = true; // Set to false for mainnet deployment

export const CHAINS = {
  // ═══════════════════════════════════════════════════════════════════════════
  // BASE SEPOLIA TESTNET
  // ═══════════════════════════════════════════════════════════════════════════
  // Deploy here first for testing. Get testnet ETH from: https://sepoliafaucet.com
  // 
  baseSepolia: {
    chainId: 84532,
    name: 'Base Sepolia',
    network: 'base-sepolia',
    rpcUrl: 'https://sepolia.base.org',
    blockExplorer: 'https://sepolia.basescan.org',
    
                contracts: {
      // Core Protocol (from deploy scripts 09-18)
      vaultAdapter:     '0x0000000000000000000000000000000000000000', // Script 11
      quoter:           '0x0000000000000000000000000000000000000000', // Script 15
      router:           '0x0000000000000000000000000000000000000000', // Script 13
      buffer:           '0x0000000000000000000000000000000000000000', // Script 12
      staker:           '0x0000000000000000000000000000000000000000', // Script 17
      
      // Registries (from deploy scripts 09-12b)
      tokenRegistry:    '0x0000000000000000000000000000000000000000', // Script 09
      poolRegistry:     '0x0000000000000000000000000000000000000000', // Script 12b
      gatewayRegistry:  '0x0000000000000000000000000000000000000000', // Script 10
      
      // Infrastructure
      keeper:           '0x0000000000000000000000000000000000000000', // Script 18
      aggregatorAdapter:'0x0000000000000000000000000000000000000000', // Script 16
      
      // PancakeSwap V4 (from deploy scripts 01-07)
      vault:            '0x0000000000000000000000000000000000000000', // Script 01
      clPoolManager:    '0x0000000000000000000000000000000000000000', // Script 02
      binPoolManager:   '0x0000000000000000000000000000000000000000', // Script 03
      clQuoter:         '0x0000000000000000000000000000000000000000', // Script 04
      binQuoter:        '0x0000000000000000000000000000000000000000', // Script 05
      clPositionManager:'0x0000000000000000000000000000000000000000', // Script 06
      binPositionManager:'0x0000000000000000000000000000000000000000',// Script 07
      
      // Depth Reader (for orderbook visualization)
      poolDepthReader:  '0x0000000000000000000000000000000000000000', // Script 19
      
      // Native token wrapper
      weth:             '0x4200000000000000000000000000000000000006', // Base WETH (same on testnet)
    },
    
                subgraph: {
      // Option A: The Graph Studio (recommended)
      // url: 'https://api.studio.thegraph.com/query/YOUR_ID/ignis-sepolia/version/latest',
      
      // Option B: Self-hosted
      // url: 'http://localhost:8000/subgraphs/name/ignis-sepolia',
      
      // Placeholder - replace with actual endpoint
      url: null,
    },
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // BASE MAINNET
  // ═══════════════════════════════════════════════════════════════════════════
  // Deploy here after testnet is stable and audited
  //
  base: {
    chainId: 8453,
    name: 'Base',
    network: 'base',
    rpcUrl: 'https://mainnet.base.org',
    blockExplorer: 'https://basescan.org',
    
                contracts: {
      // Core Protocol
      vaultAdapter:     '0x0000000000000000000000000000000000000000',
      quoter:           '0x0000000000000000000000000000000000000000',
      router:           '0x0000000000000000000000000000000000000000',
      buffer:           '0x0000000000000000000000000000000000000000',
      staker:           '0x0000000000000000000000000000000000000000',
      
      // Registries
      tokenRegistry:    '0x0000000000000000000000000000000000000000',
      poolRegistry:     '0x0000000000000000000000000000000000000000',
      gatewayRegistry:  '0x0000000000000000000000000000000000000000',
      
      // Infrastructure
      keeper:           '0x0000000000000000000000000000000000000000',
      aggregatorAdapter:'0x0000000000000000000000000000000000000000',
      
      // PancakeSwap V4
      vault:            '0x0000000000000000000000000000000000000000',
      clPoolManager:    '0x0000000000000000000000000000000000000000',
      binPoolManager:   '0x0000000000000000000000000000000000000000',
      clQuoter:         '0x0000000000000000000000000000000000000000',
      binQuoter:        '0x0000000000000000000000000000000000000000',
      clPositionManager:'0x0000000000000000000000000000000000000000',
      binPositionManager:'0x0000000000000000000000000000000000000000',
      
      // Depth Reader (for orderbook visualization)
      poolDepthReader:  '0x0000000000000000000000000000000000000000',
      
      // Native token wrapper
      weth:             '0x4200000000000000000000000000000000000006',
    },
    
    subgraph: {
      url: null, // Replace after mainnet subgraph deployment
    },
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // BNB SMART CHAIN (Optional - for multi-chain)
  // ═══════════════════════════════════════════════════════════════════════════
  bsc: {
    chainId: 56,
    name: 'BNB Smart Chain',
    network: 'bsc',
    rpcUrl: 'https://bsc-dataseed1.binance.org/',
    blockExplorer: 'https://bscscan.com',
    
    contracts: {
      vaultAdapter:     '0x0000000000000000000000000000000000000000',
      quoter:           '0x0000000000000000000000000000000000000000',
      router:           '0x0000000000000000000000000000000000000000',
      buffer:           '0x0000000000000000000000000000000000000000',
      staker:           '0x0000000000000000000000000000000000000000',
      tokenRegistry:    '0x0000000000000000000000000000000000000000',
      poolRegistry:     '0x0000000000000000000000000000000000000000',
      gatewayRegistry:  '0x0000000000000000000000000000000000000000',
      keeper:           '0x0000000000000000000000000000000000000000',
      aggregatorAdapter:'0x0000000000000000000000000000000000000000',
      vault:            '0x0000000000000000000000000000000000000000',
      clPoolManager:    '0x0000000000000000000000000000000000000000',
      binPoolManager:   '0x0000000000000000000000000000000000000000',
      clQuoter:         '0x0000000000000000000000000000000000000000',
      binQuoter:        '0x0000000000000000000000000000000000000000',
      clPositionManager:'0x0000000000000000000000000000000000000000',
      binPositionManager:'0x0000000000000000000000000000000000000000',
      weth:             '0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c', // WBNB
    },
    
    subgraph: {
      url: null,
    },
  },
};

/**
 * Get the active chain config based on IS_TESTNET flag
 */
export function getActiveChain() {
  return IS_TESTNET ? CHAINS.baseSepolia : CHAINS.base;
}

/**
 * Get chain config by chainId
 */
export function getChainById(chainId) {
  return Object.values(CHAINS).find(chain => chain.chainId === chainId);
}

/**
 * Check if contracts are deployed (not placeholder addresses)
 */
export function isDeployed(chainId) {
  const chain = getChainById(chainId);
  if (!chain) return false;
  
  // Check if vaultAdapter is not the placeholder
  return chain.contracts.vaultAdapter !== '0x0000000000000000000000000000000000000000';
}

/**
 * Get contract address with validation
 */
export function getContract(chainId, contractName) {
  const chain = getChainById(chainId);
  if (!chain) {
    throw new Error(`Unsupported chain: ${chainId}`);
  }
  
  const address = chain.contracts[contractName];
  if (!address) {
    throw new Error(`Unknown contract: ${contractName}`);
  }
  
  if (address === '0x0000000000000000000000000000000000000000') {
    logger.warn('Contract not deployed', { contractName, chainId });
  }
  
  return address;
}

/**
 * Get subgraph URL for chain
 */
export function getSubgraphUrl(chainId) {
  const chain = getChainById(chainId);
  return chain?.subgraph?.url || null;
}

export const SUPPORTED_CHAIN_IDS = IS_TESTNET 
  ? [84532]        // Only Base Sepolia in testnet mode
  : [8453, 56];    // Base + BSC in mainnet mode

export const DEFAULT_CHAIN_ID = IS_TESTNET ? 84532 : 8453;
