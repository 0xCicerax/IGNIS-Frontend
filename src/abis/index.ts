/** Module */

// Main entry point for swaps - use this for quotes and executing trades
export { default as VaultAdapterABI } from './AureliaVaultAdapter.json';

// Smart quoter for pathfinding - usually called via VaultAdapter
export { default as QuoterABI } from './AureliaSmartQuoterV5.json';

// Gateway router - handles route execution (internal, called by VaultAdapter)
export { default as RouterABI } from './GatewayRouterV5.json';

// Buffer for gas-efficient wrap/unwrap of vault tokens
export { default as BufferABI } from './Gateway4626Buffer.json';

// Staking contract for IGNI rewards
export { default as StakerABI } from './BufferStakerV2.json';

// Token and vault registration
export { default as TokenRegistryABI } from './TokenRegistryV2.json';

// Pool state caching
export { default as PoolRegistryABI } from './PoolRegistry.json';

// Gateway policies and access control
export { default as GatewayRegistryABI } from './GatewayRegistry.json';

// Keeper bot management
export { default as KeeperABI } from './GatewayKeeper.json';

// Concentrated Liquidity (Uniswap V3 style) pools
export { default as CLPoolManagerABI } from './CLPoolManager.json';

// Bin/Liquidity Book (Trader Joe V2 style) pools
export { default as BinPoolManagerABI } from './BinPoolManager.json';

// Pool Depth Reader - for orderbook/depth visualization
export { default as PoolDepthReaderABI } from './PoolDepthReader.json';

// Standard ERC20 - for approvals, balances, transfers
export { default as ERC20ABI } from './ERC20.json';

// ERC4626 vault standard - for yield-bearing tokens
export { default as ERC4626ABI } from './ERC4626.json';

// Aggregator adapter for 1inch, ODOS, etc.
export { default as AggregatorAdapterABI } from './AureliaAggregatorAdapter.json';

export { default as TokenListABI } from './TokenList.json';
