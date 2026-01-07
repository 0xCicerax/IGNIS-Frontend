/** Wagmi configuration */
import { createConfig, http } from 'wagmi';
import { base, baseSepolia, bsc, bscTestnet } from 'wagmi/chains';
import { injected, walletConnect, coinbaseWallet } from 'wagmi/connectors';
import { createPublicClient } from 'viem';
import { CHAINS, DEFAULT_CHAIN_ID } from './contracts/addresses';

// ─────────────────────────────────────────────────────────────────────────────────
// WALLETCONNECT PROJECT ID - UPDATE THIS
// ─────────────────────────────────────────────────────────────────────────────────
// Get your project ID from: https://cloud.walletconnect.com/

const WALLETCONNECT_PROJECT_ID = 'YOUR_WALLETCONNECT_PROJECT_ID';

// ─────────────────────────────────────────────────────────────────────────────────
// RPC URLS - UPDATE FOR PRODUCTION
// ─────────────────────────────────────────────────────────────────────────────────
// For production, use private RPC endpoints (Alchemy, Infura, QuickNode, etc.)

export const RPC_URLS: Record<number, string> = {
  // Base
  8453: 'https://mainnet.base.org',
  84532: 'https://sepolia.base.org',
  
  // BSC
  56: 'https://bsc-dataseed1.binance.org',
  97: 'https://data-seed-prebsc-1-s1.binance.org:8545',
};

// ─────────────────────────────────────────────────────────────────────────────────
// SUPPORTED CHAINS
// ─────────────────────────────────────────────────────────────────────────────────

export const supportedChains = [
  base,
  baseSepolia,
  bsc,
  bscTestnet,
] as const;

// ─────────────────────────────────────────────────────────────────────────────────
// WAGMI CONFIG
// ─────────────────────────────────────────────────────────────────────────────────

export const wagmiConfig = createConfig({
  chains: supportedChains,
  
  connectors: [
    // Injected wallets (MetaMask, Brave, etc.)
    injected({
      shimDisconnect: true,
    }),
    
    // Coinbase Wallet
    coinbaseWallet({
      appName: 'IGNIS',
      appLogoUrl: 'https://ignis.finance/logo.png', // UPDATE: Your logo URL
    }),
    
    // WalletConnect (for mobile wallets)
    ...(WALLETCONNECT_PROJECT_ID !== 'YOUR_WALLETCONNECT_PROJECT_ID' 
      ? [walletConnect({
          projectId: WALLETCONNECT_PROJECT_ID,
          metadata: {
            name: 'IGNIS',
            description: 'Yield-native decentralized exchange',
            url: 'https://ignis.finance', // UPDATE: Your URL
            icons: ['https://ignis.finance/logo.png'], // UPDATE: Your icon
          },
        })]
      : []
    ),
  ],
  
  transports: {
    [base.id]: http(RPC_URLS[base.id]),
    [baseSepolia.id]: http(RPC_URLS[baseSepolia.id]),
    [bsc.id]: http(RPC_URLS[bsc.id]),
    [bscTestnet.id]: http(RPC_URLS[bscTestnet.id]),
  },
});

// ─────────────────────────────────────────────────────────────────────────────────
// PUBLIC CLIENTS (for read operations)
// ─────────────────────────────────────────────────────────────────────────────────

export function getPublicClient(chainId: number) {
  const rpcUrl = RPC_URLS[chainId];
  if (!rpcUrl) {
    throw new Error(`No RPC URL configured for chain ${chainId}`);
  }

  const chain = supportedChains.find(c => c.id === chainId);
  if (!chain) {
    throw new Error(`Chain ${chainId} not supported`);
  }

  return createPublicClient({
    chain,
    transport: http(rpcUrl),
  });
}

// ─────────────────────────────────────────────────────────────────────────────────
// CHAIN HELPERS
// ─────────────────────────────────────────────────────────────────────────────────

/**
 * Get chain by ID
 */
export function getChain(chainId: number) {
  const chain = supportedChains.find(c => c.id === chainId);
  if (!chain) {
    throw new Error(`Chain ${chainId} not supported`);
  }
  return chain;
}

/**
 * Check if chain is supported
 */
export function isChainSupported(chainId: number): boolean {
  return supportedChains.some(c => c.id === chainId);
}

/**
 * Get default chain
 */
export function getDefaultChain() {
  return getChain(DEFAULT_CHAIN_ID);
}

// ─────────────────────────────────────────────────────────────────────────────────
// TYPE EXPORTS
// ─────────────────────────────────────────────────────────────────────────────────

export type SupportedChainId = (typeof supportedChains)[number]['id'];
